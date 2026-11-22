import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { ConfigError } from "./errors";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, keylen: number) => Promise<Buffer>;

function key(base64: string | undefined, name: string): Buffer {
  if (!base64) throw new ConfigError(`${name} is not configured`);
  const buf = Buffer.from(base64, "base64");
  if (buf.length !== 32) throw new ConfigError(`${name} must decode to 32 bytes`);
  return buf;
}

/** Constant-time string comparison. Returns false for different lengths. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function hmacSha256Hex(secret: string | Buffer, payload: string | Buffer): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function sha256Hex(payload: string | Buffer): string {
  return createHash("sha256").update(payload).digest("hex");
}

/** Deterministic keyed hash used to find users by phone without storing it in plaintext. */
export function hashPhone(digits: string, hashKeyB64: string | undefined): string {
  return hmacSha256Hex(key(hashKeyB64, "PULSE_PHONE_HASH_KEY"), `phone:${digits}`);
}

/** AES-256-GCM. Output: v1.<iv>.<tag>.<ciphertext> (base64url). */
export function encrypt(plaintext: string, keyB64: string | undefined): string {
  const k = key(keyB64, "PULSE_ENCRYPTION_KEY");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", k, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64url"), tag.toString("base64url"), ct.toString("base64url")].join(".");
}

export function decrypt(token: string, keyB64: string | undefined): string {
  const k = key(keyB64, "PULSE_ENCRYPTION_KEY");
  const [version, ivB64, tagB64, ctB64] = token.split(".");
  if (version !== "v1" || !ivB64 || !tagB64 || !ctB64) throw new Error("Unsupported ciphertext");
  const decipher = createDecipheriv("aes-256-gcm", k, Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, "base64url")), decipher.final()]).toString("utf8");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** scrypt password hash: scrypt$<salt>$<hash>. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64url");
  const derived = await scrypt(password, Buffer.from(saltB64, "base64url"), expected.length);
  return timingSafeEqual(derived, expected);
}

/** Signs a JSON payload with an expiry: base64url(payload).base64url(hmac). */
export function signToken(
  payload: Record<string, unknown>,
  secret: string | undefined,
  ttlSeconds: number
): string {
  if (!secret) throw new ConfigError("Session secret is not configured");
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds })
  ).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyToken<T extends Record<string, unknown>>(
  token: string | undefined,
  secret: string | undefined
): T | null {
  if (!token || !secret) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  if (!safeEqual(sig, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T & { exp?: unknown };
    if (typeof data.exp !== "number" || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}
