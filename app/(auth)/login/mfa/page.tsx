import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { mfaAction } from "@/app/actions/auth";
import { ActionForm, SubmitButton, TextField } from "@/components/app/form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { getPendingUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Two-step login" };

export default async function MfaPage() {
  const user = await getPendingUser();
  if (!user) redirect("/login");
  return (
    <AuthLayout
      title="Two-step login"
      subtitle="Enter the code from your authenticator app."
    >
      <ActionForm action={mfaAction} resetOnSuccess={false}>
        <TextField
          name="code"
          label="Code"
          autoComplete="one-time-code"
          inputMode="text"
          required
          autoFocus
        />
        <SubmitButton pending="Checking…">Continue</SubmitButton>
      </ActionForm>
    </AuthLayout>
  );
}
