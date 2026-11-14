import { NextResponse } from "next/server";

import { safeEqual } from "@/lib/crypto";
import { connectDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { EmailLog, User } from "@/lib/models";

/**
 * Brevo transactional webhook. Brevo does not sign requests, so we require a secret in the URL
 * (?token=BREVO_WEBHOOK_SECRET) and fail closed if none is configured.
 *
 * Handled events (Brevo sends snake_case in the payload):
 *   delivered            -> log: delivered
 *   hard_bounce, invalid, blocked -> log: bounced, address suppressed
 *   spam                 -> log: complaint, address suppressed
 *   soft_bounce, deferred -> recorded on the log only
 *   unsubscribed         -> address suppressed
 */
const SUPPRESS = new Set([
  "hard_bounce",
  "invalid",
  "blocked",
  "spam",
  "unsubscribed",
]);
const LOG_STATUS: Record<string, string> = {
  delivered: "delivered",
  hard_bounce: "bounced",
  invalid: "bounced",
  blocked: "bounced",
  spam: "complaint",
};

interface BrevoEvent {
  event?: string;
  email?: string;
  "message-id"?: string;
  reason?: string;
  ts_event?: number;
  ts_epoch?: number;
}

export async function POST(req: Request) {
  const secret = getEnv().BREVO_WEBHOOK_SECRET;
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!secret)
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 },
    );
  if (!safeEqual(token, secret))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const events = (Array.isArray(payload) ? payload : [payload]) as BrevoEvent[];

  await connectDb();
  for (const e of events) {
    const type = String(e.event ?? "")
      .toLowerCase()
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .toLowerCase();
    const email = e.email?.trim().toLowerCase();
    const messageId = e["message-id"]?.replace(/[<>]/g, "");
    const at = e.ts_epoch
      ? new Date(e.ts_epoch)
      : e.ts_event
        ? new Date(e.ts_event * 1000)
        : new Date();
    if (!type) continue;

    if (messageId) {
      const log = await EmailLog.findOne({ messageId });
      if (log) {
        // Brevo has no unique event id, so de-duplicate on type + timestamp.
        const dup = log.events?.some(
          (x: { type: string; at: Date }) =>
            x.type === type && Math.abs(x.at.getTime() - at.getTime()) < 1000,
        );
        if (!dup) {
          log.events.push({ type, at, reason: e.reason });
          if (LOG_STATUS[type]) log.status = LOG_STATUS[type];
          if (type !== "delivered" && e.reason) log.lastError = e.reason;
          await log.save();
        }
      }
    }
    if (email && SUPPRESS.has(type)) {
      await User.updateOne(
        { email },
        { emailSuppressed: { reason: type, at } },
      );
    }
  }
  return NextResponse.json({ ok: true });
}
