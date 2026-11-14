import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { closeOwnTicketAction, replyTicketAction } from "@/app/actions/support";
import { ActionForm, SubmitButton } from "@/components/app/form";
import { LiveRefresh } from "@/components/app/live-refresh";
import { TicketThread } from "@/components/app/ticket-thread";
import { ConfirmAction } from "@/components/app/toast-form";
import { Panel, StatusBadge } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/money";
import { getThread, markRead, ticketRef } from "@/lib/services/support";

export const metadata: Metadata = { title: "Conversation" };

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const data = await getThread(id, { includeInternal: false });
  if (!data || String(data.ticket.userId) !== user.id) notFound();
  if (data.ticket.unreadByUser) await markRead(id, "user");
  const { ticket, messages } = data;
  const closed = ticket.status === "closed";

  return (
    <>
      <Link
        href="/dashboard/support"
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> All requests
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {ticket.subject}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {ticketRef(ticket._id)} ·{" "}
            <span className="capitalize">{ticket.category}</span> · opened{" "}
            {formatDateTime(ticket.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge
            status={
              ticket.status === "open"
                ? "pending"
                : ticket.status === "pending"
                  ? "approved"
                  : "none"
            }
          />
          {!closed && (
            <ConfirmAction
              trigger={
                <Button size="sm" variant="outline">
                  Close request
                </Button>
              }
              title="Close this request?"
              description="You can reopen it any time by replying."
              confirmLabel="Close request"
              action={closeOwnTicketAction}
              fields={{ ticketId: id }}
            />
          )}
        </div>
      </div>
      <LiveRefresh seconds={8} />
      <Panel>
        <TicketThread messages={messages} viewer="user" />
        <div className="border-t pt-4">
          <ActionForm action={replyTicketAction}>
            <input type="hidden" name="ticketId" value={id} />
            <Textarea
              name="body"
              rows={3}
              required
              maxLength={4000}
              placeholder={
                closed ? "Reply to reopen this request" : "Write a reply"
              }
              aria-label="Your reply"
            />
            <SubmitButton
              pending="Sending…"
              className="self-start"
              size="default"
            >
              {closed ? "Reopen and send" : "Send reply"}
            </SubmitButton>
          </ActionForm>
        </div>
      </Panel>
    </>
  );
}
