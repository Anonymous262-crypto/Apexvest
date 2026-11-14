import { NextResponse } from "next/server";

import { safeEqual } from "@/lib/crypto";
import { retryDueEmails } from "@/lib/email/brevo";
import { getEnv } from "@/lib/env";

/** Retries failed emails that are due. Send `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (!safeEqual(auth, `Bearer ${getEnv().CRON_SECRET}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json({ ok: true, ...(await retryDueEmails()) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
