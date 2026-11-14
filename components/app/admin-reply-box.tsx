"use client";

import { Lock, Send } from "lucide-react";
import { useRef, useState } from "react";

import { adminReplyAction } from "@/app/actions/support";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { ActionForm, SubmitButton } from "./form";

/** Reply to the user or leave an internal note, with one-tap canned replies. */
export function AdminReplyBox({
  ticketId,
  canned,
}: {
  ticketId: string;
  canned: { label: string; text: string }[];
}) {
  const [mode, setMode] = useState<"reply" | "note">("reply");
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  return (
    <ActionForm action={adminReplyAction} onSuccess={() => setText("")}>
      <input type="hidden" name="ticketId" value={ticketId} />
      <input type="hidden" name="mode" value={mode} />
      <div
        className="bg-secondary inline-flex w-fit rounded-lg p-1 text-sm"
        role="group"
        aria-label="Message type"
      >
        {(
          [
            ["reply", "Reply to user", Send],
            ["note", "Internal note", Lock],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors",
              mode === value ? "bg-card shadow-sm" : "text-muted-foreground",
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" /> {label}
          </button>
        ))}
      </div>
      {mode === "reply" && (
        <div className="flex flex-wrap gap-1.5" aria-label="Canned replies">
          {canned.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => {
                setText(c.text);
                ref.current?.focus();
              }}
              className="bg-secondary hover:bg-accent rounded-full px-3 py-1 text-xs transition-colors"
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
      <Textarea
        ref={ref}
        name="body"
        rows={5}
        required
        maxLength={4000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          mode === "reply"
            ? "Write your reply. The user gets it by email and in the app."
            : "Only admins will see this note."
        }
        className={cn(mode === "note" && "border-gold/60 bg-gold/5")}
        aria-label="Message"
      />
      <SubmitButton size="default" pending="Sending…" className="self-start">
        {mode === "reply" ? "Send reply" : "Save note"}
      </SubmitButton>
    </ActionForm>
  );
}
