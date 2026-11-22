/**
 * Local testing only: sends a correctly signed, WhatsApp-shaped webhook to a running
 * Pulse instance, as if a user had messaged the business number.
 * Usage: npm run pulse:simulate -- "price of TCS" [waId] [baseUrl]
 * Requires WHATSAPP_APP_SECRET and WHATSAPP_PHONE_NUMBER_ID to match the server.
 */
import "dotenv/config";
import { createHmac } from "node:crypto";

async function main() {
  const [text, waId = "919800000001", base = "http://localhost:3100"] = process.argv.slice(2);
  const secret = process.env.WHATSAPP_APP_SECRET;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!text || !secret || !phoneNumberId) throw new Error('Usage: pulse:simulate -- "message" [waId] [baseUrl] (needs WHATSAPP_APP_SECRET, WHATSAPP_PHONE_NUMBER_ID)');
  if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(base)) throw new Error("Simulation is only allowed against a local server");
  const id = `wamid.SIM${Date.now()}`;
  const body = JSON.stringify({
    object: "whatsapp_business_account",
    entry: [{ id: "SIM", changes: [{ field: "messages", value: {
      messaging_product: "whatsapp",
      metadata: { display_phone_number: "000", phone_number_id: phoneNumberId },
      contacts: [{ wa_id: waId, profile: { name: "Simulated User" } }],
      messages: [{ from: waId, id, timestamp: String(Math.floor(Date.now() / 1000)), type: "text", text: { body: text } }],
    } }] }],
  });
  const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  const res = await fetch(`${base}/api/pulse/whatsapp/webhook`, { method: "POST", headers: { "Content-Type": "application/json", "X-Hub-Signature-256": signature }, body });
  console.log(res.status, await res.text());
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
