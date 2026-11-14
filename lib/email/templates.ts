import { brand, disclaimers } from "@/content/site";

import { getEnv } from "../env";
import { type Block, renderEmail } from "./design";

export const absUrl = (path: string) =>
  `${getEnv().NEXT_PUBLIC_SITE_URL}${path}`;

export interface Mail {
  subject: string;
  html: string;
  text: string;
}

function mail(
  subject: string,
  opts: { preheader: string; blocks: Block[]; reason?: string },
): Mail {
  const { html, text } = renderEmail({
    preheader: opts.preheader,
    blocks: opts.blocks,
    brandName: brand.name,
    siteUrl: getEnv().NEXT_PUBLIC_SITE_URL,
    riskLine: disclaimers.footerRisk,
    reason:
      opts.reason ??
      `You received this email because you have an ${brand.name} account.`,
  });
  return { subject, html, text };
}

const hi = (name: string) => `Hi ${name || "there"},`;
const secure =
  "If this was not you, reset your password right away and contact support.";

/** Every transactional email the app sends. Keep copy short, specific and calm. */
export const emails = {
  /* ---------- Account ---------- */
  verify: (name: string, url: string): Mail =>
    mail(`Confirm your email for ${brand.name}`, {
      preheader: "One tap to activate your account.",
      blocks: [
        { t: "h", text: "Confirm your email" },
        {
          t: "p",
          text: `${hi(name)} welcome to ${brand.name}. Confirm your email address to activate your account.`,
        },
        { t: "button", label: "Confirm email", url },
        {
          t: "small",
          text: "This link expires in 24 hours. If you did not create an account, you can ignore this email.",
        },
      ],
      reason:
        "You received this email because someone signed up with this address.",
    }),

  welcome: (name: string, username: string): Mail =>
    mail(`Welcome to ${brand.name}`, {
      preheader: "Your account is ready. Here is how to get started.",
      blocks: [
        { t: "h", text: "Your account is ready" },
        {
          t: "p",
          text: `${hi(name)} thanks for confirming your email. You can log in with your email or your username **@${username}**.`,
        },
        {
          t: "details",
          rows: [
            ["Step 1", "Make your first deposit"],
            ["Step 2", "Choose an investment plan"],
            ["Step 3", "Verify your identity to withdraw"],
          ],
        },
        { t: "button", label: "Open dashboard", url: absUrl("/dashboard") },
        {
          t: "callout",
          tone: "info",
          text: "Turn on two-step login in Settings for extra protection.",
        },
      ],
    }),

  reset: (name: string, url: string): Mail =>
    mail(`Reset your ${brand.name} password`, {
      preheader: "Use this link to choose a new password.",
      blocks: [
        { t: "h", text: "Reset your password" },
        {
          t: "p",
          text: `${hi(name)} we received a request to reset your password.`,
        },
        { t: "button", label: "Choose a new password", url },
        {
          t: "small",
          text: "This link expires in 1 hour. If you did not ask for this, you can ignore this email and your password will stay the same.",
        },
      ],
    }),

  passwordChanged: (name: string): Mail =>
    mail("Your password was changed", {
      preheader: "Security notice about your account.",
      blocks: [
        { t: "h", text: "Password changed" },
        {
          t: "p",
          text: `${hi(name)} the password for your ${brand.name} account was just changed, and other devices were signed out.`,
        },
        { t: "callout", tone: "warn", text: secure },
        {
          t: "button",
          label: "Reset password",
          url: absUrl("/forgot-password"),
        },
      ],
    }),

  mfaEnabled: (): Mail =>
    mail("Two-step login is on", {
      preheader: "Authenticator-app login was turned on.",
      blocks: [
        { t: "h", text: "Two-step login enabled" },
        {
          t: "p",
          text: "Authenticator-app login is now on for your account. You will enter a code each time you log in. Keep your recovery codes somewhere safe.",
        },
        { t: "callout", tone: "warn", text: secure },
      ],
    }),

  mfaDisabled: (): Mail =>
    mail("Two-step login was turned off", {
      preheader: "Security notice about your account.",
      blocks: [
        { t: "h", text: "Two-step login turned off" },
        {
          t: "p",
          text: "Authenticator-app login was turned off for your account. Your account now uses only your password.",
        },
        { t: "callout", tone: "warn", text: secure },
        {
          t: "button",
          label: "Turn it back on",
          url: absUrl("/dashboard/settings#two-step"),
        },
      ],
    }),

  accountStatus: (suspended: boolean): Mail =>
    suspended
      ? mail("Your account was suspended", {
          preheader: "Access to your account is paused.",
          blocks: [
            { t: "h", text: "Account suspended" },
            {
              t: "p",
              text: "Access to your account has been paused and you were signed out. Contact support if you think this is a mistake.",
            },
          ],
        })
      : mail("Your account was reactivated", {
          preheader: "You can log in again.",
          blocks: [
            { t: "h", text: "Account reactivated" },
            {
              t: "p",
              text: "Your account is active again. You can log in as usual.",
            },
            { t: "button", label: "Log in", url: absUrl("/login") },
          ],
        }),

  /* ---------- Deposits ---------- */
  depositReceived: (amount: string, asset: string, network: string): Mail =>
    mail("We received your deposit request", {
      preheader: "We are reviewing it. Targeted within about an hour.",
      blocks: [
        { t: "h", text: "Deposit request received" },
        {
          t: "p",
          text: "Thanks. Our team is reviewing your deposit and will credit your balance once it is confirmed. We aim to confirm within about an hour, but a person reviews each one so it can take longer.",
        },
        {
          t: "details",
          rows: [
            ["Amount", amount],
            ["Asset", asset],
            ["Network", network],
            ["Status", "Pending review"],
          ],
        },
        {
          t: "button",
          label: "View deposits",
          url: absUrl("/dashboard/deposit"),
        },
      ],
    }),

  depositApproved: (d: {
    amount: string;
    asset: string;
    network?: string;
    reference?: string;
    requested?: string;
    balance?: string;
    date: string;
  }): Mail =>
    mail(`Deposit confirmed: ${d.amount}`, {
      preheader: `${d.amount} was added to your balance.`,
      blocks: [
        { t: "h", text: "Your deposit is confirmed" },
        {
          t: "p",
          text: `We confirmed your payment and added **${d.amount}** to your available balance. It is ready to invest.`,
        },
        {
          t: "details",
          rows: [
            ...(d.reference
              ? ([["Reference", d.reference]] as [string, string][])
              : []),
            ["Credited", d.amount],
            ["Method", d.network ? `${d.asset} on ${d.network}` : d.asset],
            ...(d.balance
              ? ([["New available balance", d.balance]] as [string, string][])
              : []),
            ["Confirmed", d.date],
          ],
        },
        ...(d.requested && d.requested !== d.amount
          ? ([
              {
                t: "callout",
                tone: "info",
                text: `You requested ${d.requested}, and ${d.amount} arrived, so that is the amount we credited.`,
              },
            ] as Block[])
          : []),
        {
          t: "button",
          label: "Choose a plan",
          url: absUrl("/dashboard/investments"),
        },
        {
          t: "small",
          text: "Questions about this payment? Reply to this email or open a support ticket from your dashboard.",
        },
      ],
    }),

  depositRejected: (amount: string, reason: string): Mail =>
    mail("Your deposit could not be confirmed", {
      preheader: "We were not able to confirm your deposit.",
      blocks: [
        { t: "h", text: "Deposit not confirmed" },
        { t: "p", text: `We could not confirm your deposit of **${amount}**.` },
        ...(reason
          ? ([
              { t: "callout", tone: "danger", text: `Reason: ${reason}` },
            ] as Block[])
          : []),
        {
          t: "button",
          label: "View deposits",
          url: absUrl("/dashboard/deposit"),
        },
      ],
    }),

  /* ---------- Investments ---------- */
  investmentStarted: (
    plan: string,
    amount: string,
    days: number,
    matures: string,
  ): Mail =>
    mail(`Your ${plan} investment has started`, {
      preheader: `${amount} invested for ${days} days.`,
      blocks: [
        { t: "h", text: "Investment started" },
        {
          t: "p",
          text: "Your investment is active. Profit is added every day and compounds on the running balance. Your principal and profit are locked until the end date, then credited to your available balance.",
        },
        {
          t: "details",
          rows: [
            ["Plan", plan],
            ["Amount", amount],
            ["Term", `${days} days`],
            ["Locked until", matures],
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "Projected returns are illustrative and not guaranteed. Your capital is at risk.",
        },
        {
          t: "button",
          label: "View investments",
          url: absUrl("/dashboard/investments"),
        },
      ],
    }),

  investmentMatured: (plan: string, payout: string): Mail =>
    mail(`Your ${plan} investment has matured`, {
      preheader: `${payout} was credited to your balance.`,
      blocks: [
        { t: "h", text: "Investment matured" },
        {
          t: "p",
          text: `Your **${plan}** investment has matured. The principal and profit were credited to your available balance.`,
        },
        {
          t: "details",
          rows: [
            ["Plan", plan],
            ["Credited", payout],
          ],
        },
        { t: "button", label: "Open dashboard", url: absUrl("/dashboard") },
      ],
    }),

  /* ---------- Withdrawals ---------- */
  withdrawalRequested: (
    amount: string,
    asset: string,
    network: string,
    address: string,
  ): Mail =>
    mail("We received your withdrawal request", {
      preheader: "The amount is on hold while we review it.",
      blocks: [
        { t: "h", text: "Withdrawal requested" },
        {
          t: "p",
          text: "The amount is on hold while our team reviews and pays your request.",
        },
        {
          t: "details",
          rows: [
            ["Amount", amount],
            ["Asset", asset],
            ["Network", network],
            ["Status", "Pending review"],
          ],
        },
        { t: "code", text: address },
        {
          t: "callout",
          tone: "warn",
          text: "Payouts cannot be reversed. If this address is not yours, contact support immediately.",
        },
      ],
    }),

  withdrawalPaid: (amount: string, txHash: string): Mail =>
    mail("Your withdrawal was paid", {
      preheader: `${amount} was sent to your wallet.`,
      blocks: [
        { t: "h", text: "Withdrawal paid" },
        { t: "p", text: `Your withdrawal of **${amount}** was paid out.` },
        ...(txHash
          ? ([
              { t: "small", text: "Transaction hash" },
              { t: "code", text: txHash },
            ] as Block[])
          : []),
        {
          t: "button",
          label: "View transactions",
          url: absUrl("/dashboard/transactions"),
        },
      ],
    }),

  withdrawalRejected: (amount: string, reason: string): Mail =>
    mail("Your withdrawal was rejected", {
      preheader: "The amount returned to your balance.",
      blocks: [
        { t: "h", text: "Withdrawal rejected" },
        {
          t: "p",
          text: `Your withdrawal of **${amount}** was rejected and the amount returned to your available balance.`,
        },
        ...(reason
          ? ([
              { t: "callout", tone: "danger", text: `Reason: ${reason}` },
            ] as Block[])
          : []),
        { t: "button", label: "Open dashboard", url: absUrl("/dashboard") },
      ],
    }),

  investmentReinvested: (
    plan: string,
    payout: string,
    nextPlan: string,
    amount: string,
    termDays: number,
    matures: string,
  ): Mail =>
    mail(`${plan} matured and was reinvested`, {
      preheader: `${amount} went into ${nextPlan}.`,
      blocks: [
        { t: "h", text: "Matured and reinvested" },
        {
          t: "p",
          text: `Your **${plan}** investment matured with a total of **${payout}**, and you had asked us to reinvest automatically.`,
        },
        {
          t: "details",
          rows: [
            ["Reinvested", amount],
            ["Plan", nextPlan],
            ["Term", `${termDays} days`],
            ["Matures", matures],
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "You can turn automatic reinvestment off for any active investment in your dashboard. Projected returns are illustrative and not guaranteed.",
        },
        {
          t: "button",
          label: "View investments",
          url: absUrl("/dashboard/investments"),
        },
      ],
    }),

  investmentOffer: (
    current: string,
    days: number,
    next: string,
    range: string,
    termDays: number,
    pct: number,
    path: string,
  ): Mail =>
    mail(`A new offer for you: ${next}`, {
      preheader: `You are ${days} days into ${current}. See what ${next} offers.`,
      blocks: [
        { t: "h", text: "Ready for the next step?" },
        {
          t: "p",
          text: `You are ${days} days into your **${current}** plan. Here is the next tier up, in case you want to put more to work.`,
        },
        {
          t: "details",
          rows: [
            ["Plan", next],
            ["Amount", range],
            ["Term", `${termDays} days`],
            ["Projected return", `${pct}% (illustrative)`],
          ],
        },
        { t: "button", label: `View ${next}`, url: absUrl(path) },
        {
          t: "callout",
          tone: "info",
          text: "Projected returns are illustrative and not guaranteed. Your capital is at risk.",
        },
      ],
    }),

  /* ---------- Identity ---------- */
  kycReceived: (): Mail =>
    mail("We received your verification", {
      preheader: "Our team will review your details.",
      blocks: [
        { t: "h", text: "Verification submitted" },
        {
          t: "p",
          text: "Thanks. Our team will review your identity details and let you know the result by email. Withdrawals unlock once you are approved.",
        },
        {
          t: "button",
          label: "View status",
          url: absUrl("/dashboard/settings"),
        },
      ],
    }),

  kycResult: (approved: boolean, reason: string): Mail =>
    approved
      ? mail("Identity verified", {
          preheader: "You can now request withdrawals.",
          blocks: [
            { t: "h", text: "Identity verified" },
            {
              t: "callout",
              tone: "success",
              text: "Your identity was verified. You can now request withdrawals.",
            },
            {
              t: "button",
              label: "Request a withdrawal",
              url: absUrl("/dashboard/withdraw"),
            },
          ],
        })
      : mail("Identity verification needs attention", {
          preheader: "We could not approve your verification.",
          blocks: [
            { t: "h", text: "Verification not approved" },
            {
              t: "p",
              text: "We could not approve your verification. You can submit your details again.",
            },
            ...(reason
              ? ([
                  { t: "callout", tone: "danger", text: `Reason: ${reason}` },
                ] as Block[])
              : []),
            {
              t: "button",
              label: "Submit again",
              url: absUrl("/dashboard/settings"),
            },
          ],
        }),

  /* ---------- Admin ---------- */
  adminAlert: (title: string, rows: [string, string][], path: string): Mail =>
    mail(`[Admin] ${title}`, {
      preheader: title,
      blocks: [
        { t: "h", text: title },
        { t: "details", rows },
        { t: "button", label: "Review now", url: absUrl(path) },
      ],
      reason: `You received this email because you are an ${brand.name} administrator.`,
    }),

  /** Sent to every admin the moment a user marks a deposit as paid. */
  adminNewDeposit: (d: {
    id: string;
    reference: string;
    user: string;
    amount: string;
    expected: string;
    asset: string;
    network: string;
    txRef?: string;
    explorerUrl?: string | null;
    address?: string;
    submittedAt: string;
  }): Mail =>
    mail(`New deposit ${d.amount} · ${d.reference}`, {
      preheader: `${d.user} says they sent ${d.amount} in ${d.asset}. Verify and credit.`,
      blocks: [
        { t: "h", text: `New deposit: ${d.amount}` },
        {
          t: "p",
          text: `**${d.user}** marked a payment as sent. Check that the funds reached your wallet, then approve or reject it.`,
        },
        {
          t: "details",
          rows: [
            ["Reference", d.reference],
            ["User", d.user],
            ["Amount (USD)", d.amount],
            ["Expect to receive", d.expected],
            ["Method", `${d.asset} on ${d.network}`],
            ...(d.address
              ? ([["Sent to", d.address]] as [string, string][])
              : []),
            ...(d.txRef
              ? ([["Transaction", d.txRef]] as [string, string][])
              : []),
            ["Submitted", d.submittedAt],
          ],
        },
        {
          t: "callout",
          tone: "warn",
          text: "Approve only after you have seen the funds arrive. Approving credits the user's balance.",
        },
        {
          t: "button",
          label: "Review deposit",
          url: absUrl(`/admin/deposits/${d.id}`),
        },
        ...(d.explorerUrl
          ? ([
              {
                t: "small",
                text: `Check the transaction on the block explorer: ${d.explorerUrl}`,
              },
            ] as Block[])
          : []),
      ],
      reason: `You received this email because you are an ${brand.name} administrator.`,
    }),

  referralReward: (amount: string): Mail =>
    mail("You earned a referral reward", {
      preheader: `${amount} was added to your balance.`,
      blocks: [
        { t: "h", text: "Referral reward" },
        {
          t: "p",
          text: `A friend you invited made their first deposit, so **${amount}** was credited to your available balance.`,
        },
        {
          t: "button",
          label: "See your referrals",
          url: absUrl("/dashboard/referrals"),
        },
      ],
    }),

  /* ---------- Support ---------- */
  ticketReply: (
    subject: string,
    ref: string,
    body: string,
    path: string,
  ): Mail =>
    mail(`Reply on ${ref}: ${subject}`, {
      preheader: body.replace(/\s+/g, " ").slice(0, 110),
      blocks: [
        { t: "h", text: "We replied to your request" },
        {
          t: "details",
          rows: [
            ["Ticket", ref],
            ["Subject", subject],
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: body.length > 600 ? `${body.slice(0, 600)}…` : body,
        },
        { t: "button", label: "Open conversation", url: absUrl(path) },
        {
          t: "small",
          text: "Reply from your dashboard so the whole conversation stays in one place.",
        },
      ],
      reason: `You received this email because you opened a support request on ${brand.name}.`,
    }),

  ticketClosed: (subject: string, ref: string, path: string): Mail =>
    mail(`${ref} was closed`, {
      preheader: "Your support request was marked as resolved.",
      blocks: [
        { t: "h", text: "Request closed" },
        {
          t: "p",
          text: `Your request **${subject}** (${ref}) was marked as resolved. If you still need help, reply and we will reopen it.`,
        },
        { t: "button", label: "View conversation", url: absUrl(path) },
      ],
    }),

  /* ---------- Admin messages ---------- */
  /** Free-form message written by an admin. Blank line = paragraph, "- " lines become bullets. */
  adminMessage: (
    subject: string,
    body: string,
    cta?: { label: string; url: string },
  ): Mail => {
    const blocks: Block[] = [{ t: "h", text: subject }];
    for (const para of body.split(/\n{2,}/)) {
      const text = para
        .split("\n")
        .map((l) => l.replace(/^\s*[-*]\s+/, "• "))
        .join("\n")
        .trim();
      if (text) blocks.push({ t: "p", text });
    }
    if (cta?.label && cta.url) {
      blocks.push({
        t: "button",
        label: cta.label,
        url: cta.url.startsWith("/") ? absUrl(cta.url) : cta.url,
      });
    }
    return mail(subject, {
      preheader: body.replace(/\*\*/g, "").replace(/\s+/g, " ").slice(0, 110),
      blocks,
      reason: `You received this message from the ${brand.name} team because you have an account.`,
    });
  },

  /* ---------- Diagnostics ---------- */
  test: (): Mail =>
    mail(`${brand.name} email test`, {
      preheader: "Email delivery is working.",
      blocks: [
        { t: "h", text: "Email is working" },
        {
          t: "p",
          text: `This is a test message from ${brand.name}. Brevo delivery is configured correctly.`,
        },
        {
          t: "callout",
          tone: "success",
          text: "If you can read this, your sender address is verified.",
        },
      ],
    }),
};
