"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/guards";
import { connectDb } from "@/lib/db";
import { sendEmail } from "@/lib/email/brevo";
import { emails } from "@/lib/email/templates";
import { MessageTemplate } from "@/lib/models";
import { type AudienceKey, AUDIENCES } from "@/lib/services/audiences";
import {
  fillVars,
  MAX_RECIPIENTS,
  resolveAudience,
  searchUsers,
  sendMessage,
} from "@/lib/services/messages";
import { type ActionState, firstError } from "@/lib/validation";

const audienceKeys = AUDIENCES.map((a) => a.key) as [
  AudienceKey,
  ...AudienceKey[],
];

const composeSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(3, "Add a subject (3+ characters).")
    .max(120, "Keep the subject under 120 characters."),
  body: z
    .string()
    .trim()
    .min(10, "Write a message (10+ characters).")
    .max(5000, "Keep the message under 5,000 characters."),
  audience: z.enum(audienceKeys),
  userIds: z.array(z.string()).max(MAX_RECIPIENTS),
  email: z.boolean(),
  inApp: z.boolean(),
  ctaLabel: z.string().trim().max(40),
  ctaUrl: z.string().trim().max(300),
});

function parseCompose(f: FormData) {
  let userIds: string[] = [];
  try {
    userIds = JSON.parse(String(f.get("userIds") ?? "[]"));
  } catch {}
  const parsed = composeSchema.safeParse({
    subject: String(f.get("subject") ?? ""),
    body: String(f.get("body") ?? ""),
    audience: String(f.get("audience") ?? ""),
    userIds,
    email: f.get("email") === "on",
    inApp: f.get("inApp") === "on",
    ctaLabel: String(f.get("ctaLabel") ?? ""),
    ctaUrl: String(f.get("ctaUrl") ?? ""),
  });
  if (!parsed.success) return { error: firstError(parsed.error) } as const;
  const d = parsed.data;
  if (!d.email && !d.inApp)
    return { error: "Choose at least one channel: email or in-app." } as const;
  if (d.audience === "selected" && d.userIds.length === 0)
    return { error: "Pick at least one recipient." } as const;
  if (Boolean(d.ctaLabel) !== Boolean(d.ctaUrl))
    return {
      error: "Add both a button label and a link, or neither.",
    } as const;
  if (d.ctaUrl && !/^(\/|https:\/\/)/.test(d.ctaUrl))
    return {
      error: "The link must start with / (in the app) or https://.",
    } as const;
  return { data: d } as const;
}

/** Live recipient count for the composer. */
export async function countAudienceAction(
  audience: AudienceKey,
  userIds: string[],
) {
  await requireAdmin();
  if (audience === "selected") return userIds.length;
  return (await resolveAudience(audience)).length;
}

export async function searchUsersAction(q: string) {
  await requireAdmin();
  return searchUsers(q);
}

/** Renders the real email with sample values for the live preview. */
export async function previewMessageAction(
  subject: string,
  body: string,
  ctaLabel: string,
  ctaUrl: string,
) {
  await requireAdmin();
  const sample = {
    email: "alex@example.com",
    name: "Alex Morgan",
    username: "alex",
  };
  const cta = ctaLabel && ctaUrl ? { label: ctaLabel, url: ctaUrl } : undefined;
  return emails.adminMessage(
    fillVars(subject || "Your subject", sample),
    fillVars(body || "Your message appears here.", sample),
    cta,
  ).html;
}

export async function sendMessageAction(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = parseCompose(f);
  if ("error" in p) return { ok: false, error: p.error };
  const d = p.data;
  try {
    const r = await sendMessage(admin, {
      subject: d.subject,
      body: d.body,
      audience: d.audience,
      userIds: d.userIds,
      channels: { email: d.email, inApp: d.inApp },
      cta: d.ctaLabel ? { label: d.ctaLabel, url: d.ctaUrl } : undefined,
      templateKey: String(f.get("templateKey") ?? "") || undefined,
    });
    revalidatePath("/admin/messages");
    return {
      ok: true,
      message: `Sent to ${r.recipients} user${r.recipients === 1 ? "" : "s"}${d.email ? ` (${r.emailSent} emails delivered${r.emailFailed ? `, ${r.emailFailed} failed` : ""})` : ""}.`,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not send.",
    };
  }
}

/** Sends the message to the admin only, so they can check it in a real inbox. */
export async function sendTestMessageAction(f: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const subject = String(f.get("subject") ?? "").trim();
  const body = String(f.get("body") ?? "").trim();
  if (subject.length < 3 || body.length < 10)
    return { ok: false, error: "Write a subject and message first." };
  const ctaLabel = String(f.get("ctaLabel") ?? "").trim();
  const ctaUrl = String(f.get("ctaUrl") ?? "").trim();
  const me = { email: admin.email, name: admin.name, username: admin.username };
  const res = await sendEmail({
    to: admin.email,
    ...emails.adminMessage(
      fillVars(subject, me),
      fillVars(body, me),
      ctaLabel && ctaUrl ? { label: ctaLabel, url: ctaUrl } : undefined,
    ),
  });
  return res.ok
    ? { ok: true, message: `Test sent to ${admin.email}.` }
    : { ok: false, error: `Email failed: ${res.error}` };
}

export async function saveTemplateAction(f: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Give the template a name.").max(60),
      subject: z.string().trim().min(3, "Add a subject.").max(120),
      body: z.string().trim().min(10, "Write a message.").max(5000),
    })
    .safeParse({
      name: String(f.get("name") ?? ""),
      subject: String(f.get("subject") ?? ""),
      body: String(f.get("body") ?? ""),
    });
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  await connectDb();
  await MessageTemplate.create({ ...parsed.data, createdBy: admin.id });
  revalidatePath("/admin/messages/new");
  return { ok: true, message: `Template “${parsed.data.name}” saved.` };
}

export async function deleteTemplateAction(f: FormData): Promise<ActionState> {
  await requireAdmin();
  await connectDb();
  await MessageTemplate.deleteOne({ _id: String(f.get("id") ?? "") });
  revalidatePath("/admin/messages/new");
  return { ok: true, message: "Template deleted." };
}
