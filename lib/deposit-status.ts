/** How a deposit status reads to the user, like a payment platform. */
export const DEPOSIT_LABEL: Record<string, string> = {
  awaiting: "Awaiting payment",
  pending: "Under review",
  approved: "Credited",
  rejected: "Not confirmed",
  expired: "Expired",
  cancelled: "Cancelled",
};
