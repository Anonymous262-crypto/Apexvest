import type { Metadata } from "next";

import { MobileDetails } from "@/components/app/mobile-details";
import { Pagination } from "@/components/app/pagination";
import { TableToolbar } from "@/components/app/table-toolbar";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/app/ui";
import { UserLink } from "@/components/app/user-link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  paramsToQuery,
  parseParams,
  queryResource,
} from "@/lib/admin/resources";
import { connectDb } from "@/lib/db";
import { Plan } from "@/lib/models";
import { formatDate, formatUsd } from "@/lib/money";

export const metadata: Metadata = { title: "Investments" };

type Row = {
  _id: string;
  userId: { _id: string; email: string } | null;
  planName: string;
  kind?: string;
  principalCents: number;
  totalProfitCents: number;
  startedAt: string;
  maturesAt: string;
  status: string;
  autoCompound?: boolean;
};

export default async function AdminInvestments({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = parseParams(await searchParams);
  await connectDb();
  const [{ rows, total, page, pages, pageSize }, plans] = await Promise.all([
    queryResource("investments", params),
    Plan.find().sort({ sort: 1 }).select("slug name").lean(),
  ]);
  const data = rows as Row[];

  return (
    <>
      <PageHeader
        title="Investments"
        description="All investments across the platform, including top-ups and automatic reinvestments."
      />
      <Panel>
        <TableToolbar
          placeholder="Search user or plan"
          dates
          exportResource="investments"
          filters={[
            {
              key: "status",
              label: "Status",
              options: [
                { value: "active", label: "Active" },
                { value: "matured", label: "Matured" },
              ],
            },
            {
              key: "plan",
              label: "Plan",
              options: plans.map((p) => ({
                value: p.slug as string,
                label: p.name as string,
              })),
            },
            {
              key: "type",
              label: "Kind",
              options: [
                { value: "new", label: "New" },
                { value: "topup", label: "Top-up" },
                { value: "reinvest", label: "Reinvest" },
              ],
            },
          ]}
        />
        {data.length === 0 ? (
          <EmptyState
            title="No investments match"
            body="Investments appear here once users start a plan."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Projected profit</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Matures</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((i) => (
                <TableRow key={i._id}>
                  <TableCell data-label="User">
                    <UserLink user={i.userId} />
                  </TableCell>
                  <TableCell data-label="Plan">
                    {i.planName}
                    {i.kind && i.kind !== "new" && (
                      <span className="text-muted-foreground"> · {i.kind}</span>
                    )}
                    {i.autoCompound && (
                      <span className="text-brand"> · auto</span>
                    )}
                  </TableCell>
                  <TableCell
                    data-label="Amount"
                    className="text-right tabular-nums"
                  >
                    {formatUsd(i.principalCents)}
                  </TableCell>
                  <TableCell
                    data-label="Projected profit"
                    className="text-right tabular-nums"
                  >
                    {formatUsd(i.totalProfitCents)}
                  </TableCell>
                  <TableCell data-label="Started">
                    {formatDate(i.startedAt)}
                  </TableCell>
                  <TableCell data-label="Matures">
                    {formatDate(i.maturesAt)}
                  </TableCell>
                  <TableCell data-label="Status">
                    <StatusBadge status={i.status} />
                  </TableCell>
                  {i.userId?._id && (
                    <MobileDetails
                      href={`/admin/users/${i.userId._id}`}
                      label="View investor"
                    />
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <Pagination
          basePath="/admin/investments"
          query={paramsToQuery(params)}
          page={page}
          pages={pages}
          total={total}
          pageSize={pageSize}
        />
      </Panel>
    </>
  );
}
