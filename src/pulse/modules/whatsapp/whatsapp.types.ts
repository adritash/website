import { z } from "zod";

/**
 * Subset of the WhatsApp Cloud API webhook payload that Pulse consumes.
 * Unknown fields are allowed (Meta adds fields over time); required ones are validated.
 */
const textMessage = z.object({ body: z.string().max(4096) });

export const inboundMessageSchema = z.object({
  from: z.string().min(5).max(20),
  id: z.string().min(5).max(256),
  timestamp: z.string().regex(/^\d+$/),
  type: z.string().max(40),
  text: textMessage.optional(),
  button: z.object({ payload: z.string().max(256).optional(), text: z.string().max(256).optional() }).optional(),
  interactive: z
    .object({
      type: z.string(),
      button_reply: z.object({ id: z.string().max(256), title: z.string().max(256) }).optional(),
      list_reply: z.object({ id: z.string().max(256), title: z.string().max(256) }).optional(),
    })
    .optional(),
});

export const statusSchema = z.object({
  id: z.string().min(5).max(256),
  status: z.enum(["sent", "delivered", "read", "failed", "deleted", "warning"]).or(z.string().max(40)),
  timestamp: z.string().regex(/^\d+$/),
  recipient_id: z.string().max(20).optional(),
  pricing: z
    .object({
      billable: z.boolean().optional(),
      pricing_model: z.string().optional(),
      category: z.string().optional(),
      type: z.string().optional(),
    })
    .optional(),
  errors: z
    .array(z.object({ code: z.number().optional(), title: z.string().optional(), message: z.string().optional() }))
    .optional(),
});

export const webhookPayloadSchema = z.object({
  object: z.literal("whatsapp_business_account"),
  entry: z
    .array(
      z.object({
        id: z.string(),
        changes: z.array(
          z.object({
            field: z.string(),
            value: z.object({
              messaging_product: z.literal("whatsapp").optional(),
              metadata: z.object({ phone_number_id: z.string(), display_phone_number: z.string().optional() }).optional(),
              contacts: z.array(z.object({ wa_id: z.string(), profile: z.object({ name: z.string().optional() }).optional() })).optional(),
              messages: z.array(inboundMessageSchema).optional(),
              statuses: z.array(statusSchema).optional(),
            }),
          })
        ),
      })
    )
    .max(50),
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;
export type InboundMessage = z.infer<typeof inboundMessageSchema>;
export type StatusUpdate = z.infer<typeof statusSchema>;

export type NormalizedInbound = {
  kind: "message";
  providerMessageId: string;
  waId: string;
  profileName?: string;
  phoneNumberId?: string;
  sentAt: Date;
  messageType: string;
  /** Plain text the user typed or the title/payload of a tapped button. */
  text: string | null;
};

export type NormalizedStatus = {
  kind: "status";
  providerMessageId: string;
  status: string;
  at: Date;
  billable?: boolean;
  pricingCategory?: string;
  errorCode?: string;
  errorMessage?: string;
};

export type NormalizedEvent = NormalizedInbound | NormalizedStatus;
