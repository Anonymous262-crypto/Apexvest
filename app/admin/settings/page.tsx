import { BadgePercent, Mail, ScrollText, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  saveActivityTickerAction,
  saveReferralSettingsAction,
} from "@/app/actions/admin";
import { ActionForm, SubmitButton, TextField } from "@/components/app/form";
import { PageHeader, Panel } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { isTickerEnabled } from "@/lib/services/activity";
import { getReferralSettings } from "@/lib/services/referrals";

export const metadata: Metadata = { title: "Settings" };

const links = [
  {
    href: "/admin/payment-methods",
    icon: Wallet,
    title: "Payment methods",
    body: "Assets, networks and wallet addresses.",
  },
  {
    href: "/admin/plans",
    icon: BadgePercent,
    title: "Plans",
    body: "Terms, status and order of investment plans.",
  },
  {
    href: "/admin/email-log",
    icon: Mail,
    title: "Email log",
    body: "Delivery, retries, bounces and complaints.",
  },
  {
    href: "/admin/audit",
    icon: ScrollText,
    title: "Audit log",
    body: "Every admin action on money, users and settings.",
  },
];

export default async function AdminSettings() {
  const [ref, ticker] = await Promise.all([
    getReferralSettings(),
    isTickerEnabled(),
  ]);
  return (
    <>
      <PageHeader title="Settings" description="Platform configuration." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {links.map((l) => (
          <Panel key={l.href} title={l.title} description={l.body}>
            <Button asChild variant="outline" size="sm" className="self-start">
              <Link href={l.href}>
                <l.icon /> Open
              </Link>
            </Button>
          </Panel>
        ))}
      </div>

      <Panel
        title="Referral programme"
        description="Users earn a reward when someone they invited makes their first qualifying deposit. Rewards are credited once per referred user."
      >
        <ActionForm
          action={saveReferralSettingsAction}
          className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3"
          resetOnSuccess={false}
        >
          <TextField
            name="pct"
            label="Reward (%)"
            type="number"
            step="0.1"
            min="0"
            defaultValue={ref.pct}
            required
            hint="Of the first deposit."
          />
          <TextField
            name="capUsd"
            label="Cap per referral (USD)"
            type="number"
            min="1"
            defaultValue={ref.capUsd}
            required
          />
          <TextField
            name="minDepositUsd"
            label="Minimum deposit (USD)"
            type="number"
            min="1"
            defaultValue={ref.minDepositUsd}
            required
          />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={ref.enabled}
              className="size-4"
            />{" "}
            Programme is on
          </label>
          <div className="sm:justify-self-end">
            <SubmitButton pending="Saving…">Save</SubmitButton>
          </div>
        </ActionForm>
      </Panel>

      <Panel
        title="Recent activity ticker"
        description="A slim strip across the top of the investor app showing real recent activity (paid withdrawals, profit credited and confirmed deposits) with masked usernames such as j***n. It only shows real events from the last two weeks, and stays hidden when there are fewer than three."
      >
        <ActionForm
          action={saveActivityTickerAction}
          className="max-w-md"
          resetOnSuccess={false}
        >
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={ticker}
              className="size-4"
            />{" "}
            Show the ticker to investors
          </label>
          <SubmitButton pending="Saving…" className="self-start">
            Save
          </SubmitButton>
        </ActionForm>
      </Panel>
    </>
  );
}
