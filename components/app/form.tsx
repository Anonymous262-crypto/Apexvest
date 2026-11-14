"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useOnline } from "@/lib/use-online";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/lib/validation";

import { IconInput, IconSelect } from "./icon-input";
import { PasswordInput } from "./password-input";

function omitType<
  T extends { type?: unknown; icon?: unknown; iconKey?: unknown },
>(p: T) {
  const { type: _type, icon: _icon, iconKey: _iconKey, ...rest } = p;
  return rest;
}

export function SubmitButton({
  children,
  pending: label,
  className,
  variant,
  size = "lg",
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  pending?: string;
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
}) {
  const { pending } = useFormStatus();
  const online = useOnline();
  return (
    <Button
      type="submit"
      disabled={pending || !online || disabled}
      className={className}
      variant={variant}
      size={size}
    >
      {!online ? "Offline" : pending ? (label ?? "Working…") : children}
    </Button>
  );
}

export function IconSubmit({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="icon-sm"
      variant="ghost"
      disabled={pending}
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  return (
    <div aria-live="polite" role="status" className="text-sm">
      {state.error && (
        <p className="text-destructive-foreground">{state.error}</p>
      )}
    </div>
  );
}

/** Wraps a server action with pending/error/success handling (React 19 useActionState). */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = true,
  after,
  onSuccess,
}: {
  action: (prev: ActionState, data: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  after?: (state: ActionState) => React.ReactNode;
  onSuccess?: (state: ActionState) => void;
}) {
  // A flaky connection can throw before we get a reply. Turn that into a friendly message,
  // and send a key so a retry after a timeout never creates a duplicate.
  const keyRef = useRef("");
  const safe = async (
    prev: ActionState,
    data: FormData,
  ): Promise<ActionState> => {
    try {
      // The same key is reused for retries of one submit, and renewed after a success.
      if (!keyRef.current) keyRef.current = crypto.randomUUID();
      data.set("idemKey", keyRef.current);
      return await action(prev, data);
    } catch {
      return {
        ok: false,
        error:
          "We could not reach the server. Check your connection and try again. Nothing is submitted twice.",
      };
    }
  };
  const [state, formAction] = useActionState(safe, {
    ok: false,
  } as ActionState);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) keyRef.current = "";
    if (!state.ok) return;
    if (state.message) toast.success(state.message);
    if (resetOnSuccess) ref.current?.reset();
    onSuccess?.(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <>
      <form
        ref={ref}
        action={formAction}
        className={cn("flex flex-col gap-4", className)}
      >
        {children}
        <FormMessage state={state} />
      </form>
      {after?.(state)}
    </>
  );
}

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  htmlFor: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

export function TextField({
  name,
  label,
  hint,
  ...props
}: React.ComponentProps<typeof IconInput> & {
  name: string;
  label: string;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint} htmlFor={name}>
      {props.type === "password" ? (
        <PasswordInput
          id={name}
          name={name}
          icon={props.icon}
          iconKey={props.iconKey}
          {...omitType(props)}
        />
      ) : (
        <IconInput id={name} name={name} {...props} />
      )}
    </Field>
  );
}

export const NativeSelect = IconSelect;
