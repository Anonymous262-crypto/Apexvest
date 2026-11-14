"use client";

import { Hash } from "lucide-react";

import { submitDepositAction } from "@/app/actions/user";

import { ActionForm, SubmitButton, TextField } from "./form";

/** "I have sent the payment". After the window closes, the transaction ID becomes required. */
export function SubmitPayment({
  id,
  expired,
}: {
  id: string;
  expired: boolean;
}) {
  return (
    <ActionForm action={submitDepositAction} resetOnSuccess={false}>
      <input type="hidden" name="id" value={id} />
      <TextField
        name="txRef"
        icon={Hash}
        label={expired ? "Transaction ID" : "Transaction ID (optional)"}
        required={expired}
        placeholder="Paste the transaction hash"
        autoComplete="off"
        spellCheck={false}
        hint={
          expired
            ? "The payment window closed. Enter the ID of the transaction you sent so we can find it."
            : "Optional, but it helps us verify your payment faster."
        }
      />
      <SubmitButton pending="Submitting…">I have sent the payment</SubmitButton>
    </ActionForm>
  );
}
