import { z } from "zod";

const schema = z.object({
  MONGODB_URI: z.string().default(""),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters"),
  ENCRYPTION_KEY: z
    .string()
    .refine(
      (v) => Buffer.from(v, "base64").length === 32,
      "ENCRYPTION_KEY must be 32 random bytes, base64 encoded",
    ),
  CRON_SECRET: z.string().min(16),
  BREVO_API_KEY: z.string().default(""),
  BREVO_SENDER_EMAIL: z.string().default(""),
  BREVO_SENDER_NAME: z.string().default("Apexvest"),
  NEXT_PUBLIC_SITE_URL: z.string().default("http://localhost:3000"),
  ADMIN_EMAIL: z.string().default(""),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().default(""),
  VAPID_PRIVATE_KEY: z.string().default(""),
  VAPID_SUBJECT: z.string().default("mailto:admin@example.com"),
  BREVO_WEBHOOK_SECRET: z.string().default(""),
  ADMIN_PASSWORD: z.string().default(""),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

/** Validated environment, read lazily so builds work without secrets. */
export function getEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${msg}. See .env.example.`);
  }
  cached = parsed.data;
  return cached;
}

export const isDbConfigured = () => Boolean(process.env.MONGODB_URI);
