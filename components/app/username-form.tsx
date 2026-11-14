"use client";

import { AtSign, Check, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  checkUsernameAction,
  saveUsernameAction,
  type UsernameCheckResult,
} from "@/app/actions/user";
import { cn } from "@/lib/utils";

import { ActionForm, SubmitButton } from "./form";
import { IconInput } from "./icon-input";

type Status = UsernameCheckResult["state"] | "idle" | "checking";

/** Username field with live availability feedback. */
export function UsernameForm({
  current,
  onSaved,
  submitLabel = "Save username",
  secondary,
}: {
  current: string;
  onSaved?: () => void;
  submitLabel?: string;
  secondary?: React.ReactNode;
}) {
  const [value, setValue] = useState(current);
  const [status, setStatus] = useState<Status>("same");
  const [message, setMessage] = useState("This is your current username.");
  const seq = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  /** Runs from the input handler: debounced live check, ignoring stale responses. */
  function onChange(next: string) {
    setValue(next);
    clearTimeout(timer.current);
    const v = next.trim().replace(/^@/, "");
    const id = ++seq.current;
    if (!v || v.toLowerCase() === current.toLowerCase()) {
      setStatus("same");
      setMessage(v ? "This is your current username." : "Choose a username.");
      return;
    }
    setStatus("checking");
    timer.current = setTimeout(async () => {
      try {
        const r = await checkUsernameAction(v);
        if (id !== seq.current) return;
        setStatus(r.state);
        setMessage(r.message);
      } catch {
        if (id === seq.current) {
          setStatus("invalid");
          setMessage("Could not check right now.");
        }
      }
    }, 350);
  }

  const ok = status === "available";
  const Icon =
    status === "checking"
      ? Loader2
      : ok
        ? Check
        : status === "taken" || status === "invalid"
          ? X
          : null;

  return (
    <ActionForm
      action={saveUsernameAction}
      resetOnSuccess={false}
      onSuccess={onSaved}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="username" className="text-sm font-medium">
          Username
        </label>
        <IconInput
          id="username"
          name="username"
          icon={AtSign}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={21}
          aria-invalid={
            status === "taken" || status === "invalid" ? true : undefined
          }
          aria-describedby="username-status"
        />
        <p
          id="username-status"
          role="status"
          aria-live="polite"
          className={cn(
            "flex items-center gap-1.5 text-xs",
            ok
              ? "text-success"
              : status === "taken" || status === "invalid"
                ? "text-destructive-foreground"
                : "text-muted-foreground",
          )}
        >
          {Icon && (
            <Icon
              className={cn(
                "size-3.5",
                status === "checking" && "animate-spin",
              )}
              aria-hidden="true"
            />
          )}
          {status === "checking" ? "Checking…" : message}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <SubmitButton
          pending="Saving…"
          className={cn(!ok && "pointer-events-none opacity-50")}
        >
          {submitLabel}
        </SubmitButton>
        {secondary}
      </div>
    </ActionForm>
  );
}
