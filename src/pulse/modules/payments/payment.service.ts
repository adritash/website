import type { Db } from "@/pulse/infrastructure/db";
import { getEnv } from "@/pulse/config/env";
import { logger } from "@/pulse/infrastructure/logger";
import { audit } from "@/pulse/modules/audit/audit.service";
import type { EffectivePlan } from "@/pulse/modules/subscriptions/subscription.service";
import { RazorpayProvider, type PaymentProvider } from "./payment.provider";

let override: PaymentProvider | null | undefined;

export function setPaymentProviderForTests(p: PaymentProvider | null | undefined) {
  override = p;
}

export function getPaymentProvider(): PaymentProvider | null {
  if (override !== undefined) return override;
  const env = getEnv();
  if (env.PAYMENT_PROVIDER === "razorpay" && env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
    return new RazorpayProvider({ keyId: env.RAZORPAY_KEY_ID, keySecret: env.RAZORPAY_KEY_SECRET });
  }
  return null;
}

/**
 * Starts a paid subscription and returns the hosted payment link text.
 * The subscription only becomes ACTIVE when a signed provider webhook says so.
 */
export async function startUpgrade(db: Db, userId: string, current: EffectivePlan): Promise<string> {
  const env = getEnv();
  if (!env.PULSE_PAYMENTS_ENABLED) {
    return "Paid plans aren't available yet. Everything in the free plan keeps working; I'll let you know when Pulse Plus launches.";
  }
  if (current.code !== "FREE") return `You're already on ${current.name}.`;
  const provider = getPaymentProvider();
  const plan = await db.plan.findFirst({ where: { code: "PLUS", active: true } });
  if (!provider || !plan?.providerPlanId) {
    logger.alert("payments_misconfigured", { hasProvider: Boolean(provider), hasPlan: Boolean(plan?.providerPlanId) });
    return "Upgrades are temporarily unavailable. Please try again later.";
  }

  const pending = await db.subscription.findFirst({ where: { userId, planId: plan.id, status: "CREATED", createdAt: { gt: new Date(Date.now() - 24 * 3600 * 1000) } } });
  if (pending?.paymentLinkUrl) return `Here's your secure Razorpay link for ${plan.name} (₹${plan.pricePaise / 100}/month):\n${pending.paymentLinkUrl}`;

  const created = await provider.createSubscription({ providerPlanId: plan.providerPlanId, totalCount: 12, notes: { pulse_user_id: userId, plan_code: plan.code } });
  await db.subscription.create({
    data: { userId, planId: plan.id, status: "CREATED", provider: provider.name, providerSubscriptionId: created.providerSubscriptionId, paymentLinkUrl: created.paymentUrl },
  });
  await audit(db, { actorType: "USER", actorId: userId, action: "subscription.created", resourceType: "Subscription", outcome: "success" });
  return `Here's your secure Razorpay link for ${plan.name} (₹${plan.pricePaise / 100}/month):\n${created.paymentUrl}\nYour plan switches on as soon as Razorpay confirms the payment.`;
}
