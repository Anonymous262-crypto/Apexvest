import type { Metadata } from "next";

import { resetAction } from "@/app/actions/auth";
import { ActionForm, SubmitButton, TextField } from "@/components/app/form";
import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { token = "" } = await searchParams;
  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="At least 10 characters, with a number."
    >
      <ActionForm action={resetAction} resetOnSuccess={false}>
        <input type="hidden" name="token" value={token} />
        <TextField
          name="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          required
        />
        <TextField
          name="confirm"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
        />
        <SubmitButton pending="Saving…">Update password</SubmitButton>
      </ActionForm>
    </AuthLayout>
  );
}
