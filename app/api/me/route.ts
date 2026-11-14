import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { isDbConfigured } from "@/lib/env";

/** Who is signed in, for the public pages. Always fresh, never cached. */
export async function GET() {
  const none = NextResponse.json(
    { user: null },
    { headers: { "cache-control": "no-store" } },
  );
  if (!isDbConfigured()) return none;
  try {
    const u = await getCurrentUser();
    if (!u || !u.emailVerified || u.status !== "active") return none;
    return NextResponse.json(
      {
        user: {
          email: u.email,
          username: u.username,
          name: u.name,
          role: u.role,
        },
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return none;
  }
}
