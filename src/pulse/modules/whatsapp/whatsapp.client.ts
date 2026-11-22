import { getEnv } from "@/pulse/config/env";
import { ConfigError, ProviderError } from "@/pulse/lib/errors";
import { logger } from "@/pulse/infrastructure/logger";

export type TemplateParameter = { type: "text"; text: string };

export type OutboundPayload =
  | { type: "text"; text: string }
  | { type: "template"; name: string; language: string; bodyParameters: string[] };

export type SendResult = { providerMessageId: string };

/** Transport abstraction so tests and local development never call Meta. */
export interface WhatsAppTransport {
  send(to: string, payload: OutboundPayload): Promise<SendResult>;
}

/**
 * Meta error codes we treat as permanent (do not retry). Others with 4xx are also
 * permanent; 429 and 5xx are retryable.
 * 131047: re-engagement required (outside the 24-hour window).
 * 131026: message undeliverable. 131051: unsupported message type.
 */
const OUTSIDE_WINDOW_CODES = new Set([131047]);

export class WhatsAppApiError extends ProviderError {
  constructor(
    code: string,
    message: string,
    retryable: boolean,
    public readonly httpStatus?: number,
    public readonly metaCode?: number,
    /** True when we cannot know whether Meta accepted the message (timeout/network). */
    public readonly uncertain = false
  ) {
    super(code, message, retryable);
  }
}

function buildBody(to: string, payload: OutboundPayload) {
  const base = { messaging_product: "whatsapp", recipient_type: "individual", to };
  if (payload.type === "text") {
    return { ...base, type: "text", text: { preview_url: false, body: payload.text.slice(0, 4096) } };
  }
  return {
    ...base,
    type: "template",
    template: {
      name: payload.name,
      language: { code: payload.language },
      components: payload.bodyParameters.length
        ? [{ type: "body", parameters: payload.bodyParameters.map((text) => ({ type: "text", text: text.slice(0, 1024) })) }]
        : [],
    },
  };
}

/** WhatsApp Cloud API transport: POST https://graph.facebook.com/{version}/{phone-number-id}/messages */
export class CloudApiTransport implements WhatsAppTransport {
  constructor(
    private readonly opts: {
      accessToken: string;
      phoneNumberId: string;
      apiVersion: string;
      timeoutMs: number;
      fetchImpl?: typeof fetch;
    }
  ) {}

  async send(to: string, payload: OutboundPayload): Promise<SendResult> {
    const url = `https://graph.facebook.com/${this.opts.apiVersion}/${encodeURIComponent(this.opts.phoneNumberId)}/messages`;
    const fetchImpl = this.opts.fetchImpl ?? fetch;
    const started = Date.now();
    let response: Response;
    try {
      response = await fetchImpl(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.opts.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(to, payload)),
        signal: AbortSignal.timeout(this.opts.timeoutMs),
        cache: "no-store",
      });
    } catch {
      throw new WhatsAppApiError("WA_NETWORK", "WhatsApp request failed before a response", false, undefined, undefined, true);
    }

    const latencyMs = Date.now() - started;
    const json = (await response.json().catch(() => null)) as
      | { messages?: { id?: string }[]; error?: { code?: number; message?: string } }
      | null;

    if (response.ok) {
      const id = json?.messages?.[0]?.id;
      if (!id) throw new WhatsAppApiError("WA_BAD_RESPONSE", "No message id in response", false, response.status, undefined, true);
      logger.debug("whatsapp.sent", { latencyMs, type: payload.type });
      return { providerMessageId: id };
    }

    const metaCode = json?.error?.code;
    const retryable = response.status === 429 || response.status >= 500;
    const code = metaCode && OUTSIDE_WINDOW_CODES.has(metaCode) ? "WA_OUTSIDE_WINDOW" : `WA_HTTP_${response.status}`;
    logger.warn("whatsapp.send_failed", { status: response.status, metaCode, latencyMs });
    throw new WhatsAppApiError(code, json?.error?.message?.slice(0, 300) ?? "WhatsApp API error", retryable, response.status, metaCode);
  }
}

/** Development-only transport that records messages instead of sending them. */
export class CaptureTransport implements WhatsAppTransport {
  public readonly sent: { to: string; payload: OutboundPayload; providerMessageId: string }[] = [];
  private counter = 0;
  public failNext: WhatsAppApiError | null = null;

  async send(to: string, payload: OutboundPayload): Promise<SendResult> {
    if (this.failNext) {
      const error = this.failNext;
      this.failNext = null;
      throw error;
    }
    const providerMessageId = `wamid.CAPTURE${Date.now()}${++this.counter}`;
    this.sent.push({ to, payload, providerMessageId });
    return { providerMessageId };
  }

  clear() {
    this.sent.length = 0;
  }
}

let override: WhatsAppTransport | null = null;

export function setTransportForTests(transport: WhatsAppTransport | null) {
  override = transport;
}

/** Local development: prints outbound messages instead of calling Meta. Refused in production. */
class LogTransport implements WhatsAppTransport {
  private n = 0;
  async send(to: string, payload: OutboundPayload): Promise<SendResult> {
    logger.info("whatsapp.dev_outbound", { to, payload: payload.type === "text" ? payload.text : payload });
    return { providerMessageId: `wamid.DEVLOG${Date.now()}${++this.n}` };
  }
}

export function getTransport(): WhatsAppTransport {
  if (override) return override;
  const env = getEnv();
  if (process.env.PULSE_WHATSAPP_TRANSPORT === "log") {
    if (env.NODE_ENV === "production") throw new ConfigError("PULSE_WHATSAPP_TRANSPORT=log is not allowed in production");
    override = new LogTransport();
    return override;
  }
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    throw new ConfigError("WhatsApp credentials are not configured");
  }
  return new CloudApiTransport({
    accessToken: env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
    apiVersion: env.WHATSAPP_GRAPH_API_VERSION,
    timeoutMs: env.WHATSAPP_TIMEOUT_MS,
  });
}
