import { ImageResponse } from "next/og";

const SIZES = ["180", "192", "512", "512-maskable"];

export const dynamicParams = false;
export function generateStaticParams() {
  return SIZES.map((size) => ({ size }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size } = await params;
  const maskable = size.endsWith("-maskable");
  const px = parseInt(size, 10);
  // Maskable icons keep the mark inside the central safe zone; others fill more of the tile.
  const mark = Math.round(px * (maskable ? 0.46 : 0.6));

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse 80% 60% at 50% 110%, #2459f2 0%, #0b1230 55%, #08090d 100%)",
        borderRadius: maskable ? 0 : Math.round(px * 0.22),
      }}
    >
      <svg width={mark} height={mark} viewBox="0 0 32 32">
        <rect width="32" height="32" rx="8" fill="#2459f2" />
        <path d="M5 24 14 8l9 16H5Z" fill="#fff" />
        <path d="m16.5 24 5-8.5 5.5 8.5h-10.5Z" fill="#d4af37" />
      </svg>
    </div>,
    { width: px, height: px },
  );
}
