import { coinLogo, networkLogo } from "@/lib/coins";
import { cn } from "@/lib/utils";

/** Real coin logo (shipped locally in /public/crypto), with a tidy ticker fallback. */
export function CoinLogo({
  symbol,
  className,
}: {
  symbol: string;
  className?: string;
}) {
  const src = coinLogo(symbol);
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={32}
        height={32}
        className={cn("size-8 shrink-0 rounded-full", className)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "bg-brand/10 text-brand flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
        className,
      )}
    >
      {symbol.slice(0, 4).toUpperCase()}
    </span>
  );
}

export function NetworkLogo({
  network,
  className,
}: {
  network: string;
  className?: string;
}) {
  const src = networkLogo(network);
  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      width={16}
      height={16}
      className={cn("size-4 shrink-0 rounded-full", className)}
    />
  );
}
