import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import { getEnv } from "./env";

export const sha256 = (v: string) =>
  createHash("sha256").update(v).digest("hex");

/** URL-safe random token. */
export const randomToken = (bytes = 32) =>
  randomBytes(bytes).toString("base64url");

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

const key = () => Buffer.from(getEnv().ENCRYPTION_KEY, "base64");

/** AES-256-GCM. Output: base64(iv | tag | ciphertext). */
export function encrypt(plain: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString("base64");
}

export function decrypt(payload: string) {
  const buf = Buffer.from(payload, "base64");
  const d = createDecipheriv("aes-256-gcm", key(), buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString(
    "utf8",
  );
}

export const maskId = (v: string) =>
  v.length <= 4 ? "••••" : `${"•".repeat(v.length - 4)}${v.slice(-4)}`;
