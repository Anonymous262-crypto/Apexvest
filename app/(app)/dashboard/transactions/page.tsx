import { Receipt } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { MobileDetails } from "@/components/app/mobile-details";
import {
  EmptyState,
  LEDGER_LABEL,
  PageHeader,
  Panel,
} from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth/guards";
import { connectDb } from "@/lib/db";
import { LedgerEntry } from "@/lib/models";
import { formatDateTime, formatUsd } from "@/lib/money";
import { plain } from "@/lib/services/queries";

export const metadata: Metadata = { title: "Transactions" };

const related = (e: { refType?: string; refId?: string }) => {
  if (!e.refId) return null;
  if (e.refType === "deposit") return `/dashboard/deposit/${e.refId}`;
  if (e.refType === "withdrawal") return `/dashboard/withdraw/${e.refId}`;
  if (e.refType === "investment") return `/dashboard/investments/${e.refId}`;
  return null;
};

export default async function TransactionsPage() {
  const user = await requireUser();
  await connectDb();
  const rows = plain(
    await LedgerEntry.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean(),
  );
  return (
    <>
      <PageHeader
        title="Transactions"
        description="Every deposit, investment, payout and withdrawal, with a running balance."
      />
      <Panel>
        {rows.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Your ledger starts with your first deposit"
            body="Every deposit, investment, payout and withdrawal is recorded here with a running balance."
            action={
              <Button asChild size="sm">
                <Link href="/dashboard/deposit">Make a deposit</Link>
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(
                (e: {
                  _id: string;
                  createdAt: string;
                  type: string;
                  note?: string;
                  refType?: string;
                  refId?: string;
                  amountCents: number;
                  balanceAfterCents: number;
                }) => (
                  <TableRow key={e._id}>
                    <TableCell data-label="Date">
                      {formatDateTime(e.createdAt)}
                    </TableCell>
                    <TableCell data-label="Type" className="font-medium">
                      {LEDGER_LABEL[e.type] ?? e.type}
                    </TableCell>
                    <TableCell
                      data-label="Detail"
                      className="text-muted-foreground"
                    >
                      {e.note ?? ""}
                    </TableCell>
                    <TableCell
                      data-label="Amount"
                      className={`text-right tabular-nums ${e.amountCents >= 0 ? "text-success" : ""}`}
                    >
                      {e.amountCents >= 0 ? "+" : ""}
                      {formatUsd(e.amountCents)}
                    </TableCell>
                    <TableCell
                      data-label="Balance"
                      className="text-right tabular-nums"
                    >
                      {formatUsd(e.balanceAfterCents)}
                    </TableCell>
                    {related(e) ? (
                      <MobileDetails href={related(e)!} desktop />
                    ) : (
                      <TableCell data-label="" className="max-sm:hidden" />
                    )}
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  );
}
