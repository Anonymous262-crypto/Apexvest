"use client";

import { useEffect, useState } from "react";

import { keepUsernameAction } from "@/app/actions/user";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { UsernameForm } from "./username-form";

/** First-run prompt: we assigned a username, offer to keep it or pick another. */
export function UsernamePrompt({
  username,
  due,
}: {
  username: string;
  due: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!due) return;
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, [due]);

  function keep() {
    setOpen(false);
    void keepUsernameAction();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : keep())}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Choose your username</DialogTitle>
          <DialogDescription>
            We gave you{" "}
            <span className="text-foreground font-medium">@{username}</span>.
            Keep it, or pick your own. You can log in with your username or your
            email.
          </DialogDescription>
        </DialogHeader>
        <UsernameForm
          current={username}
          onSaved={() => setOpen(false)}
          secondary={
            <Button type="button" variant="ghost" size="lg" onClick={keep}>
              Keep @{username}
            </Button>
          }
        />
      </DialogContent>
    </Dialog>
  );
}
