"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/validation";

type Action = (data: FormData) => Promise<ActionState | void>;

function report(r: ActionState | void) {
  if (!r) return;
  if (r.ok) toast.success(r.message ?? "Done.");
  else toast.error(r.error ?? "Something went wrong.");
}

/** A plain form whose server action result is shown as a toast. */
export function ToastForm({
  action,
  children,
  className,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <form
      className={className}
      action={async (fd) => {
        try {
          report(await action(fd));
        } catch {
          toast.error("Something went wrong. Please try again.");
        }
      }}
    >
      {children}
    </form>
  );
}

/** Destructive action behind a confirmation dialog. */
export function ConfirmAction({
  trigger,
  title,
  description,
  confirmLabel = "Delete",
  action,
  fields,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  action: Action;
  fields: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="outline"
            className="border-destructive-foreground/50 text-destructive-foreground hover:bg-destructive-foreground/10"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const fd = new FormData();
                for (const [k, v] of Object.entries(fields)) fd.set(k, v);
                try {
                  const r = await action(fd);
                  report(r);
                  if (!r || r.ok) setOpen(false);
                } catch {
                  toast.error("Something went wrong. Please try again.");
                }
              })
            }
          >
            {pending ? "Working…" : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
