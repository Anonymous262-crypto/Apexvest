import type { Metadata } from "next";
import Link from "next/link";

import { resendAction } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/app/form";
import { AuthLayout, authLink } from "@/components/auth/auth-layout";

export const metadata: Metadata = { title: "Check your email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { email = "" } = await searchParams;
  return (
    <AuthLayout
      title="Check your email"
      subtitle={
        email
          ? `We sent a link to ${email}.`
          : "We sent you a confirmation link."
      }
      footer={
        <Link href="/login" className={authLink}>
          Back to log in
        </Link>
      }
    >
      <ActionForm action={resendAction} resetOnSuccess={false}>
        <input type="hidden" name="email" value={email} />
        <SubmitButton variant="outline" pending="Sending…">
          Resend email
        </SubmitButton>
      </ActionForm>
    </AuthLayout>
  );
}
