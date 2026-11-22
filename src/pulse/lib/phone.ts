/** WhatsApp sends `wa_id` as digits with country code and no "+". Normalise to digits only. */
export function normalizeWaId(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

export function maskPhone(last4: string): string {
  return `••••••${last4}`;
}
