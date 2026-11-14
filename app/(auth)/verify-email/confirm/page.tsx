import type { Metadata } from "next";

import { confirmEmailAction } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/app/form";
import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = { title: "Confirm email" };

// A button (not an automatic GET) so email scanners cannot consume the token.
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { token = "" } = await searchParams;
  return (
    <AuthLayout
      title="Confirm your email"
      subtitle="One tap to activate your account."
    >
      <ActionForm action={confirmEmailAction} resetOnSuccess={false}>
        <input type="hidden" name="token" value={token} />
        <SubmitButton pending="Confirming…">Confirm email</SubmitButton>
      </ActionForm>
    </AuthLayout>
  );
}
