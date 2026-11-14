import "server-only";

import { redirect } from "next/navigation";

import { getCurrentUser } from "./session";

/** Signed-in, verified, active investor or admin. Redirects otherwise. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status !== "active") redirect("/login?error=suspended");
  if (!user.emailVerified) redirect("/verify-email?sent=1");
  return user;
}

/** Same as requireUser, and the role must be admin (enforced on every call). */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}

/** For auth pages: bounce signed-in users to their home. */
export async function redirectIfSignedIn() {
  const user = await getCurrentUser();
  if (user?.emailVerified && user.status === "active") {
    redirect(user.role === "admin" ? "/admin" : "/dashboard");
  }
}
