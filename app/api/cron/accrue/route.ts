import { NextResponse } from "next/server";

import { safeEqual } from "@/lib/crypto";
import { getEnv } from "@/lib/env";
import { accrue } from "@/lib/services/investments";

/** Daily job: accrue profit and settle matured investments. Send `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (!safeEqual(auth, `Bearer ${getEnv().CRON_SECRET}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json({ ok: true, ...(await accrue()) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
