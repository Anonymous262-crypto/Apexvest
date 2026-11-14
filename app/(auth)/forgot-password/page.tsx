import type { Metadata } from "next";
import Link from "next/link";

import { forgotAction } from "@/app/actions/auth";
import { ActionForm, SubmitButton, TextField } from "@/components/app/form";
import { AuthLayout, authLink } from "@/components/auth/auth-layout";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPage() {
  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="We will email you a reset link."
      footer={
        <Link href="/login" className={authLink}>
          Back to log in
        </Link>
      }
    >
      <ActionForm action={forgotAction}>
        <TextField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
        />
        <SubmitButton pending="Sending…">Send reset link</SubmitButton>
      </ActionForm>
    </AuthLayout>
  );
}
