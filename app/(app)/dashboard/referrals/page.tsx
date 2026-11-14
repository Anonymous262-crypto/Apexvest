import { Gift, HandCoins, UserCheck, Users } from "lucide-react";
import type { Metadata } from "next";

import { ShareReferral } from "@/components/app/share-referral";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatCard,
  StatusBadge,
} from "@/components/app/ui";
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
import { Referral } from "@/lib/models";
import { formatDate, formatUsd } from "@/lib/money";
import { plain } from "@/lib/services/queries";
import {
  ensureReferralCode,
  getReferralSettings,
  maskEmail,
} from "@/lib/services/referrals";

export const metadata: Metadata = { title: "Referrals" };

type R = {
  _id: string;
  status: string;
  rewardCents: number;
  createdAt: string;
  referredId: { email: string } | null;
};

export default async function ReferralsPage() {
  const user = await requireUser();
  const [code, st] = await Promise.all([
    ensureReferralCode(user.id),
    getReferralSettings(),
  ]);
  await connectDb();
  const rows = plain(
    await Referral.find({ referrerId: user.id })
      .populate("referredId", "email")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
  ) as R[];
  const rewarded = rows.filter((r) => r.status === "rewarded");
  const earned = rewarded.reduce((s, r) => s + r.rewardCents, 0);

  return (
    <>
      <PageHeader
        title="Referrals"
        description="Invite friends. When someone you invite makes their first qualifying deposit, you earn a reward."
      />

      {!st.enabled && (
        <p className="bg-muted/50 rounded-lg border px-4 py-3 text-sm">
          The referral programme is paused right now. Your link still works and
          rewards resume when it is back.
        </p>
      )}

      <Panel title="Your invite link">
        <ShareReferral code={code} />
      </Panel>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Joined" value={String(rows.length)} icon={Users} />
        <StatCard
          label="Deposited"
          value={String(rewarded.length)}
          icon={UserCheck}
        />
        <StatCard
          label="Earned"
          value={formatUsd(earned)}
          icon={HandCoins}
          tone={earned > 0 ? "positive" : undefined}
        />
      </div>

      <Panel title="How it works">
        <ol className="text-muted-foreground list-decimal space-y-1.5 pl-5 text-sm">
          <li>
            Share your link. Friends who sign up with it are linked to you.
          </li>
          <li>
            When a friend&apos;s first deposit of at least{" "}
            {formatUsd(st.minDepositUsd * 100)} is confirmed, you earn {st.pct}%
            of it, up to {formatUsd(st.capUsd * 100)}.
          </li>
          <li>
            The reward is credited to your available balance and shows in your
            transactions. Each friend can earn you a reward once.
          </li>
        </ol>
        <p className="text-muted-foreground text-xs">
          Rewards are not earned on your own accounts. We may withhold rewards
          where we suspect abuse. Referral rewards are not a return on
          investment.
        </p>
      </Panel>

      <Panel title="Your invites">
        {rows.length === 0 ? (
          <EmptyState
            icon={Gift}
            title="No invites yet"
            body="Share your link above. People who join with it will appear here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Friend</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Reward</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r._id}>
                  <TableCell data-label="Friend">
                    {r.referredId
                      ? maskEmail(r.referredId.email)
                      : "Closed account"}
                  </TableCell>
                  <TableCell data-label="Joined">
                    {formatDate(r.createdAt)}
                  </TableCell>
                  <TableCell data-label="Status">
                    <StatusBadge
                      status={r.status === "rewarded" ? "approved" : "pending"}
                    />
                  </TableCell>
                  <TableCell
                    data-label="Reward"
                    className="text-right tabular-nums"
                  >
                    {r.status === "rewarded"
                      ? `+${formatUsd(r.rewardCents)}`
                      : "Waiting for first deposit"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  );
}
