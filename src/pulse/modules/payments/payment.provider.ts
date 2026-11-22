import { ProviderError } from "@/pulse/lib/errors";

export type CreatedSubscription = { providerSubscriptionId: string; paymentUrl: string; status: string };

/** Payment provider abstraction. Card/UPI details are only ever handled by the provider's hosted page. */
export interface PaymentProvider {
  readonly name: string;
  createSubscription(input: { providerPlanId: string; totalCount: number; notes: Record<string, string> }): Promise<CreatedSubscription>;
  cancelSubscription(providerSubscriptionId: string): Promise<void>;
}

/** Razorpay Subscriptions API (https://razorpay.com/docs/api/payments/subscriptions/). */
export class RazorpayProvider implements PaymentProvider {
  readonly name = "razorpay";

  constructor(private readonly opts: { keyId: string; keySecret: string; timeoutMs?: number; fetchImpl?: typeof fetch }) {}

  private async call(path: string, body: unknown): Promise<Record<string, unknown>> {
    let response: Response;
    try {
      response = await (this.opts.fetchImpl ?? fetch)(`https://api.razorpay.com/v1${path}`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.opts.keyId}:${this.opts.keySecret}`).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.opts.timeoutMs ?? 10_000),
      });
    } catch (error) {
      throw new ProviderError("PAY_NETWORK", "Payment provider unreachable", true, error);
    }
    const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) throw new ProviderError(`PAY_HTTP_${response.status}`, "Payment provider error", response.status >= 500);
    return json;
  }

  async createSubscription(input: { providerPlanId: string; totalCount: number; notes: Record<string, string> }): Promise<CreatedSubscription> {
    const json = await this.call("/subscriptions", {
      plan_id: input.providerPlanId,
      total_count: input.totalCount,
      quantity: 1,
      customer_notify: 1,
      notes: input.notes,
    });
    const id = json.id;
    const url = json.short_url;
    if (typeof id !== "string" || typeof url !== "string") throw new ProviderError("PAY_BAD_RESPONSE", "Missing subscription id or link", false);
    return { providerSubscriptionId: id, paymentUrl: url, status: String(json.status ?? "created") };
  }

  async cancelSubscription(providerSubscriptionId: string): Promise<void> {
    await this.call(`/subscriptions/${encodeURIComponent(providerSubscriptionId)}/cancel`, { cancel_at_cycle_end: 1 });
  }
}
