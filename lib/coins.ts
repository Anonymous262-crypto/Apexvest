import icons from "./coin-icons.json";

const available = new Set<string>(icons);

/** Local logo path for a ticker, or null when we do not ship one. */
export function coinLogo(symbol: string): string | null {
  const s = symbol.trim().toLowerCase();
  return available.has(s) ? `/crypto/${s}.svg` : null;
}

/** Best-effort chain logo from a free-form network name, e.g. "Tron (TRC20)" -> trx. Order matters. */
const CHAIN_HINTS: [RegExp, string][] = [
  [/trc[- ]?20|tron/i, "trx"],
  [/bep[- ]?20|bsc|bnb|binance/i, "bnb"],
  [/bitcoin cash|\bbch\b/i, "bch"],
  [/ethereum classic|\betc\b/i, "etc"],
  [/arbitrum/i, "arb"],
  [/optimism/i, "op"],
  [/\bbase\b/i, "base"],
  [/erc[- ]?20|ethereum|\beth\b/i, "eth"],
  [/solana|\bspl\b/i, "sol"],
  [/polygon|matic/i, "matic"],
  [/bitcoin|\bbtc\b|segwit/i, "btc"],
  [/litecoin|\bltc\b/i, "ltc"],
  [/xrp|ripple/i, "xrp"],
  [/\bton\b|toncoin/i, "ton"],
  [/avalanche|avax/i, "avax"],
  [/dogecoin|doge/i, "doge"],
  [/cardano/i, "ada"],
  [/polkadot/i, "dot"],
  [/stellar/i, "xlm"],
  [/cosmos/i, "atom"],
  [/\bnear\b/i, "near"],
  [/\bsui\b/i, "sui"],
  [/aptos/i, "apt"],
  [/monero/i, "xmr"],
  [/tezos/i, "xtz"],
  [/algorand/i, "algo"],
  [/filecoin/i, "fil"],
  [/hedera/i, "hbar"],
  [/internet computer/i, "icp"],
  [/vechain/i, "vet"],
  [/zcash/i, "zec"],
  [/\bdash\b/i, "dash"],
  [/cronos/i, "cro"],
  [/fantom/i, "ftm"],
  [/\beos\b/i, "eos"],
];

/** The coin whose chain a network name refers to, e.g. "Tron (TRC20)" -> "trx". */
export function chainOf(network: string): string | null {
  for (const [re, sym] of CHAIN_HINTS) if (re.test(network)) return sym;
  return null;
}

export function networkLogo(network: string): string | null {
  const sym = chainOf(network);
  return sym ? coinLogo(sym) : null;
}

export interface PopularAsset {
  symbol: string;
  name: string;
  networks: string[];
}

/** A broad catalogue admins can add in one click. Wallet addresses are still set by the admin. */
export const POPULAR_ASSETS: PopularAsset[] = [
  { symbol: "BTC", name: "Bitcoin", networks: ["Bitcoin"] },
  {
    symbol: "ETH",
    name: "Ethereum",
    networks: ["Ethereum (ERC20)", "Arbitrum One", "Base", "Optimism"],
  },
  {
    symbol: "USDT",
    name: "Tether",
    networks: [
      "Tron (TRC20)",
      "Ethereum (ERC20)",
      "BNB Smart Chain (BEP20)",
      "Solana",
      "Polygon",
      "TON",
    ],
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    networks: ["Ethereum (ERC20)", "Solana", "Base", "Polygon", "Arbitrum One"],
  },
  { symbol: "SOL", name: "Solana", networks: ["Solana"] },
  { symbol: "BNB", name: "BNB", networks: ["BNB Smart Chain (BEP20)"] },
  { symbol: "XRP", name: "XRP", networks: ["XRP Ledger"] },
  { symbol: "TON", name: "Toncoin", networks: ["TON"] },
  { symbol: "TRX", name: "Tron", networks: ["Tron (TRC20)"] },
  { symbol: "DOGE", name: "Dogecoin", networks: ["Dogecoin"] },
  { symbol: "ADA", name: "Cardano", networks: ["Cardano"] },
  { symbol: "AVAX", name: "Avalanche", networks: ["Avalanche C-Chain"] },
  { symbol: "LTC", name: "Litecoin", networks: ["Litecoin"] },
  { symbol: "DOT", name: "Polkadot", networks: ["Polkadot"] },
  { symbol: "MATIC", name: "Polygon", networks: ["Polygon"] },
  { symbol: "LINK", name: "Chainlink", networks: ["Ethereum (ERC20)"] },
  { symbol: "BCH", name: "Bitcoin Cash", networks: ["Bitcoin Cash"] },
  { symbol: "XLM", name: "Stellar", networks: ["Stellar"] },
  { symbol: "ATOM", name: "Cosmos", networks: ["Cosmos Hub"] },
  { symbol: "NEAR", name: "NEAR Protocol", networks: ["NEAR Protocol"] },
  { symbol: "SUI", name: "Sui", networks: ["Sui"] },
  { symbol: "APT", name: "Aptos", networks: ["Aptos"] },
  { symbol: "ARB", name: "Arbitrum", networks: ["Arbitrum One"] },
  { symbol: "OP", name: "Optimism", networks: ["Optimism"] },
  { symbol: "DAI", name: "Dai", networks: ["Ethereum (ERC20)"] },
  { symbol: "UNI", name: "Uniswap", networks: ["Ethereum (ERC20)"] },
  { symbol: "SHIB", name: "Shiba Inu", networks: ["Ethereum (ERC20)"] },
  { symbol: "PEPE", name: "Pepe", networks: ["Ethereum (ERC20)"] },
  { symbol: "AAVE", name: "Aave", networks: ["Ethereum (ERC20)"] },
  { symbol: "MKR", name: "Maker", networks: ["Ethereum (ERC20)"] },
  { symbol: "LDO", name: "Lido DAO", networks: ["Ethereum (ERC20)"] },
  { symbol: "ETC", name: "Ethereum Classic", networks: ["Ethereum Classic"] },
  { symbol: "XMR", name: "Monero", networks: ["Monero"] },
  { symbol: "ZEC", name: "Zcash", networks: ["Zcash"] },
  { symbol: "DASH", name: "Dash", networks: ["Dash"] },
  { symbol: "ALGO", name: "Algorand", networks: ["Algorand"] },
  { symbol: "FIL", name: "Filecoin", networks: ["Filecoin"] },
  { symbol: "HBAR", name: "Hedera", networks: ["Hedera"] },
  { symbol: "ICP", name: "Internet Computer", networks: ["Internet Computer"] },
  { symbol: "VET", name: "VeChain", networks: ["VeChain"] },
  { symbol: "XTZ", name: "Tezos", networks: ["Tezos"] },
  { symbol: "EOS", name: "EOS", networks: ["EOS"] },
  { symbol: "CRO", name: "Cronos", networks: ["Cronos"] },
  { symbol: "FTM", name: "Fantom", networks: ["Fantom"] },
  {
    symbol: "CAKE",
    name: "PancakeSwap",
    networks: ["BNB Smart Chain (BEP20)"],
  },
  { symbol: "SAND", name: "The Sandbox", networks: ["Ethereum (ERC20)"] },
  { symbol: "MANA", name: "Decentraland", networks: ["Ethereum (ERC20)"] },
  { symbol: "GRT", name: "The Graph", networks: ["Ethereum (ERC20)"] },
  { symbol: "SEI", name: "Sei", networks: ["Sei"] },
  { symbol: "TIA", name: "Celestia", networks: ["Celestia"] },
  { symbol: "IMX", name: "Immutable", networks: ["Ethereum (ERC20)"] },
  { symbol: "FLOW", name: "Flow", networks: ["Flow"] },
  { symbol: "KAVA", name: "Kava", networks: ["Kava"] },
  { symbol: "RUNE", name: "THORChain", networks: ["THORChain"] },
  { symbol: "EGLD", name: "MultiversX", networks: ["MultiversX"] },
  { symbol: "IOTA", name: "IOTA", networks: ["IOTA"] },
  { symbol: "CHZ", name: "Chiliz", networks: ["Ethereum (ERC20)"] },
];

export const ASSET_SUGGESTIONS = POPULAR_ASSETS.map(({ symbol, name }) => ({
  symbol,
  name,
}));

/** Suggestions for the "network" field. Admins may type anything. */
export const NETWORK_SUGGESTIONS = Array.from(
  new Set(POPULAR_ASSETS.flatMap((a) => a.networks)),
).sort();

/**
 * Native coins live on their own chain, so there is no network to choose: Bitcoin is Bitcoin.
 * Networks only matter for tokens that exist on several chains (USDT, USDC) or coins that run on
 * more than one (ETH on Ethereum, Arbitrum, Base...).
 */
export function nativeNetwork(symbol: string, assetName?: string): string {
  const hit = POPULAR_ASSETS.find((a) => a.symbol === symbol.toUpperCase());
  return hit?.networks[0] ?? assetName ?? symbol.toUpperCase();
}

/** Chains that identify the depositor with an extra tag or memo on a shared address. */
export const MEMO_HINTS: Record<string, string> = {
  XRP: "XRP uses a numeric destination tag.",
  XLM: "Stellar uses a memo.",
  TON: "TON uses a comment (memo).",
  ATOM: "Cosmos uses a memo.",
  EOS: "EOS uses a memo.",
  HBAR: "Hedera uses a memo.",
  KAVA: "Kava uses a memo.",
};

const B58 = "[1-9A-HJ-NP-Za-km-z]";
/** Address shapes per chain. Only chains with a well-known format are checked; others pass the generic check. */
const ADDRESS_RULES: Record<string, { label: string; re: RegExp }> = {
  btc: {
    label: "Bitcoin",
    re: new RegExp(`^(bc1[a-z0-9]{25,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$`),
  },
  bch: {
    label: "Bitcoin Cash",
    re: /^((bitcoincash:)?[qp][a-z0-9]{41}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/i,
  },
  ltc: {
    label: "Litecoin",
    re: /^(ltc1[a-z0-9]{25,87}|[LM3][a-km-zA-HJ-NP-Z1-9]{26,33})$/,
  },
  doge: { label: "Dogecoin", re: new RegExp(`^D${B58}{33}$`) },
  eth: { label: "Ethereum", re: /^0x[a-fA-F0-9]{40}$/ },
  etc: { label: "Ethereum Classic", re: /^0x[a-fA-F0-9]{40}$/ },
  bnb: { label: "BNB Smart Chain", re: /^0x[a-fA-F0-9]{40}$/ },
  arb: { label: "Arbitrum", re: /^0x[a-fA-F0-9]{40}$/ },
  op: { label: "Optimism", re: /^0x[a-fA-F0-9]{40}$/ },
  base: { label: "Base", re: /^0x[a-fA-F0-9]{40}$/ },
  matic: { label: "Polygon", re: /^0x[a-fA-F0-9]{40}$/ },
  avax: { label: "Avalanche C-Chain", re: /^0x[a-fA-F0-9]{40}$/ },
  trx: { label: "Tron", re: new RegExp(`^T${B58}{33}$`) },
  sol: { label: "Solana", re: new RegExp(`^${B58}{32,44}$`) },
  xrp: {
    label: "XRP Ledger",
    re: new RegExp(`^(r${B58}{24,34}|X${B58}{46})$`),
  },
  xlm: { label: "Stellar", re: /^G[A-Z2-7]{55}$/ },
  ton: {
    label: "TON",
    re: /^((EQ|UQ|kQ|0Q)[A-Za-z0-9_-]{46}|-?\d:[a-fA-F0-9]{64})$/,
  },
  dot: { label: "Polkadot", re: new RegExp(`^${B58}{47,48}$`) },
  atom: { label: "Cosmos", re: /^cosmos1[a-z0-9]{38}$/ },
};

/** Returns a plain-language problem with the address for this network, or null when it looks right. */
export function checkAddress(network: string, address: string): string | null {
  const sym = chainOf(network);
  const rule = sym ? ADDRESS_RULES[sym] : undefined;
  if (!rule) return null;
  return rule.re.test(address.trim())
    ? null
    : `That does not look like a valid ${rule.label} address. Check it and paste it again.`;
}

/** A block explorer page for a transaction, for chains with a well-known explorer. Null otherwise. */
export function explorerTxUrl(network: string, hash: string): string | null {
  const h = encodeURIComponent(hash.trim());
  if (!h) return null;
  switch (chainOf(network)) {
    case "btc":
      return `https://mempool.space/tx/${h}`;
    case "eth":
      return `https://etherscan.io/tx/${h}`;
    case "bnb":
      return `https://bscscan.com/tx/${h}`;
    case "trx":
      return `https://tronscan.org/#/transaction/${h}`;
    case "sol":
      return `https://solscan.io/tx/${h}`;
    case "matic":
      return `https://polygonscan.com/tx/${h}`;
    case "arb":
      return `https://arbiscan.io/tx/${h}`;
    case "op":
      return `https://optimistic.etherscan.io/tx/${h}`;
    case "base":
      return `https://basescan.org/tx/${h}`;
    case "avax":
      return `https://snowtrace.io/tx/${h}`;
    case "ltc":
      return `https://blockchair.com/litecoin/transaction/${h}`;
    case "doge":
      return `https://blockchair.com/dogecoin/transaction/${h}`;
    case "xrp":
      return `https://xrpscan.com/tx/${h}`;
    case "ton":
      return `https://tonviewer.com/transaction/${h}`;
    default:
      return null;
  }
}
