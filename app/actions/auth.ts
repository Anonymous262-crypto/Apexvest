"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  createSession,
  destroyCurrentSession,
  getPendingUser,
  markMfaVerified,
} from "@/lib/auth/session";
import { connectDb, DbNotConfiguredError } from "@/lib/db";
import { User } from "@/lib/models";
import {
  checkCredentials,
  checkMfaCode,
  registerUser,
  requestReset,
  resendVerification,
  resetPassword,
} from "@/lib/services/auth";
import {
  type ActionState,
  emailSchema,
  firstError,
  passwordSchema,
} from "@/lib/validation";

const str = (f: FormData, k: string) => String(f.get(k) ?? "");

function fail(e: unknown): ActionState {
  if (e instanceof DbNotConfiguredError) {
    return {
      ok: false,
      error: "The service is not available yet. Please try again later.",
    };
  }
  console.error(e);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function registerAction(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({
      name: z.string().trim().max(80),
      email: emailSchema,
      password: passwordSchema,
      plan: z.string().max(40).optional(),
      ref: z.string().max(20).optional(),
    })
    .safeParse({
      name: str(f, "name"),
      email: str(f, "email"),
      password: str(f, "password"),
      plan: str(f, "plan") || undefined,
      ref: str(f, "ref") || undefined,
    });
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  try {
    await registerUser({
      ...parsed.data,
      planSlug: parsed.data.plan,
      referralCode: parsed.data.ref,
    });
  } catch (e) {
    return fail(e);
  }
  redirect(
    `/verify-email?sent=1&email=${encodeURIComponent(parsed.data.email)}`,
  );
}

/**
 * Where to land after signing in. Admins go to /admin. An investor who chose a plan before signing in
 * continues straight to the invest form for that plan; everyone else goes to the dashboard.
 */
async function homeFor(userId: string, role: "investor" | "admin") {
  if (role === "admin") return "/admin";
  await connectDb();
  const u = await User.findById(userId).select("pendingPlanSlug").lean();
  const slug = u?.pendingPlanSlug as string | undefined;
  return slug
    ? `/dashboard/investments?plan=${encodeURIComponent(slug)}#invest`
    : "/dashboard";
}

export async function loginAction(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({
      identifier: z.string().trim().min(1).max(254),
      password: z.string().min(1).max(128),
    })
    .safeParse({
      identifier: str(f, "identifier"),
      password: str(f, "password"),
    });
  if (!parsed.success)
    return { ok: false, error: "Enter your email or username and password." };
  let dest = "/dashboard";
  try {
    const ip =
      (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const r = await checkCredentials(
      parsed.data.identifier,
      parsed.data.password,
      ip,
    );
    if (r.status === "rate")
      return {
        ok: false,
        error: "Too many attempts. Try again in a few minutes.",
      };
    if (r.status === "invalid")
      return { ok: false, error: "Email or password is incorrect." };
    if (r.status === "suspended")
      return {
        ok: false,
        error: "This account is suspended. Contact support.",
      };
    if (r.status === "unverified") {
      dest = parsed.data.identifier.includes("@")
        ? `/verify-email?sent=1&email=${encodeURIComponent(parsed.data.identifier)}`
        : "/verify-email?sent=1";
    } else if (r.status === "ok" || r.status === "mfa") {
      await createSession(r.userId, { mfaVerified: r.status === "ok" });
      // A plan picked on the landing page (?plan=) is remembered, so we can continue to it after login.
      const plan = str(f, "plan");
      if (r.role === "investor" && /^[a-z0-9-]{2,30}$/.test(plan)) {
        await connectDb();
        await User.updateOne({ _id: r.userId }, { pendingPlanSlug: plan });
      }
      dest =
        r.status === "mfa" ? "/login/mfa" : await homeFor(r.userId, r.role);
    }
  } catch (e) {
    return fail(e);
  }
  redirect(dest);
}

export async function mfaAction(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const code = str(f, "code");
  if (!code.trim()) return { ok: false, error: "Enter your code." };
  let dest = "/dashboard";
  try {
    const u = await getPendingUser();
    if (!u) redirect("/login");
    if (!(await checkMfaCode(u.id, code)))
      return { ok: false, error: "That code is not valid." };
    await markMfaVerified(u.sessionId);
    dest = await homeFor(u.id, u.role);
  } catch (e) {
    if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
    return fail(e);
  }
  redirect(dest);
}

export async function logoutAction() {
  await destroyCurrentSession();
  redirect("/login");
}

export async function forgotAction(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const parsed = emailSchema.safeParse(str(f, "email"));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  try {
    await requestReset(parsed.data);
  } catch (e) {
    return fail(e);
  }
  return {
    ok: true,
    message: "If that email has an account, a reset link is on its way.",
  };
}

export async function resetAction(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const pw = passwordSchema.safeParse(str(f, "password"));
  if (!pw.success) return { ok: false, error: firstError(pw.error) };
  if (pw.data !== str(f, "confirm"))
    return { ok: false, error: "Passwords do not match." };
  try {
    if (!(await resetPassword(str(f, "token"), pw.data))) {
      return { ok: false, error: "This reset link is invalid or has expired." };
    }
  } catch (e) {
    return fail(e);
  }
  redirect("/login?reset=1");
}

export async function resendAction(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const parsed = emailSchema.safeParse(str(f, "email"));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  try {
    await resendVerification(parsed.data);
  } catch (e) {
    return fail(e);
  }
  return {
    ok: true,
    message: "If that account needs confirming, a new email is on its way.",
  };
}

export async function confirmEmailAction(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  try {
    const { confirmEmail } = await import("@/lib/services/auth");
    if (!(await confirmEmail(str(f, "token")))) {
      return {
        ok: false,
        error:
          "This confirmation link is invalid or has expired. Request a new one.",
      };
    }
  } catch (e) {
    return fail(e);
  }
  redirect("/login?verified=1");
}
