"use client";

import { useState, useTransition } from "react";

import {
  confirmMfaAction,
  disableMfaAction,
  startMfaAction,
} from "@/app/actions/user";
import { Button } from "@/components/ui/button";

import { CopyButton } from "./copy-button";
import { ActionForm, SubmitButton, TextField } from "./form";

export function MfaPanel({ enabled }: { enabled: boolean }) {
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(
    null,
  );
  const [pending, start] = useTransition();

  if (enabled) {
    return (
      <ActionForm action={disableMfaAction} className="max-w-sm">
        <p className="text-sm">
          Two-step login is <b>on</b>. Enter your password to turn it off.
        </p>
        <TextField
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
        />
        <SubmitButton variant="outline" pending="Turning off…">
          Turn off two-step login
        </SubmitButton>
      </ActionForm>
    );
  }

  if (!setup) {
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground text-sm">
          Protect your account with a code from an authenticator app, plus
          one-time recovery codes.
        </p>
        <Button
          disabled={pending}
          onClick={() => start(async () => setSetup(await startMfaAction()))}
        >
          {pending ? "Preparing…" : "Set up two-step login"}
        </Button>
      </div>
    );
  }

  return (
    <ActionForm
      action={confirmMfaAction}
      className="max-w-sm"
      resetOnSuccess={false}
      after={(s) =>
        s.ok && s.codes ? (
          <div className="mt-4 max-w-sm space-y-2 rounded-lg border p-3">
            <p className="text-sm font-medium">Recovery codes</p>
            <p className="text-muted-foreground text-xs">
              Each code works once. Store them somewhere safe. They will not be
              shown again.
            </p>
            <ul className="grid grid-cols-2 gap-1 font-mono text-sm">
              {s.codes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <CopyButton value={s.codes.join("\n")} label="Copy codes" />
          </div>
        ) : null
      }
    >
      <p className="text-sm">
        Scan this QR code with your authenticator app, then enter the 6-digit
        code.
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={setup.qr}
        alt="QR code for your authenticator app"
        width={192}
        height={192}
        className="rounded-lg border bg-white p-1"
      />
      <p className="text-muted-foreground text-xs">
        Or enter this key manually:{" "}
        <span className="font-mono break-all">{setup.secret}</span>
      </p>
      <TextField
        name="code"
        label="6-digit code"
        inputMode="numeric"
        autoComplete="one-time-code"
        required
      />
      <SubmitButton pending="Verifying…">Turn on two-step login</SubmitButton>
    </ActionForm>
  );
}
