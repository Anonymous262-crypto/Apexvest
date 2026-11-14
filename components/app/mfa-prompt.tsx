"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { snoozeMfaPromptAction } from "@/app/actions/user";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Friendly, skippable nudge to turn on two-step login. Reappears after a growing delay. */
export function MfaPrompt({ due }: { due: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const blocked = pathname.startsWith("/dashboard/settings");

  useEffect(() => {
    if (!due || blocked) return;
    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
  }, [due, blocked]);

  function later() {
    setOpen(false);
    void snoozeMfaPromptAction();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : later())}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="items-center text-center sm:text-center">
          <span className="bg-brand/10 text-brand mb-1 flex size-12 items-center justify-center rounded-full">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </span>
          <DialogTitle>Secure your account</DialogTitle>
          <DialogDescription>
            Turn on two-step login and we will ask for a code from your
            authenticator app each time you log in. It takes about a minute.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button asChild size="lg" onClick={() => setOpen(false)}>
            <Link href="/dashboard/settings#two-step">
              Set up two-step login
            </Link>
          </Button>
          <Button variant="ghost" size="lg" onClick={later}>
            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
