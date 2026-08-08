export type AiAnalyticsEvent =
  | "ai_widget_shown"
  | "ai_widget_opened"
  | "ai_message_sent"
  | "ai_response_received"
  | "ai_response_error"
  | "ai_booking_clicked"
  | "ai_contact_clicked";

type AiAnalyticsPayload = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function trackAiEvent(
  event: AiAnalyticsEvent,
  payload: AiAnalyticsPayload = {}
) {
  if (process.env.NODE_ENV === "development") {
    console.info(`[ai-analytics] ${event}`, payload);
  }

  if (typeof window === "undefined") {
    return;
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", event, payload);
    return;
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event, ...payload });
  }
}
