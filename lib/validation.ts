import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(254);

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(128)
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/\d/, "Include at least one number.");

export const usd = (label = "Amount") =>
  z.coerce
    .number({ error: `${label} must be a number.` })
    .positive(`${label} must be greater than zero.`)
    .max(10_000_000)
    .transform((n) => Math.round(n * 100));

export type ActionState = {
  ok: boolean;
  error?: string;
  message?: string;
  fields?: Record<string, string>;
  codes?: string[];
  id?: string;
};

export function firstError(e: z.ZodError) {
  return e.issues[0]?.message ?? "Check the form and try again.";
}
