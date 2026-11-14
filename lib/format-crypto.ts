const STABLE = new Set(["USDT", "USDC", "DAI"]);

/** Client-safe crypto amount formatter, e.g. 0.01542301 BTC or 250.00 USDT. */
export function formatCrypto(symbol: string, n: number) {
  const s = symbol.toUpperCase();
  const d = STABLE.has(s)
    ? 2
    : s === "BTC" || s === "LTC" || s === "BCH" || s === "ETH"
      ? 8
      : 6;
  return `${n.toLocaleString("en-US", { minimumFractionDigits: STABLE.has(s) ? 2 : 0, maximumFractionDigits: d })} ${s}`;
}
