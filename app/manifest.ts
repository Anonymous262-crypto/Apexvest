import type { MetadataRoute } from "next";

import { brand } from "@/content/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${brand.name} Investor`,
    short_name: brand.name,
    description: "Fund your balance, choose a plan and follow your portfolio.",
    id: "/dashboard",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#08090d",
    theme_color: "#08090d",
    categories: ["finance"],
    icons: [
      {
        src: "/pwa-icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon/512-maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Deposit",
        url: "/dashboard/deposit",
        icons: [{ src: "/pwa-icon/192", sizes: "192x192" }],
      },
      {
        name: "Investments",
        url: "/dashboard/investments",
        icons: [{ src: "/pwa-icon/192", sizes: "192x192" }],
      },
    ],
  };
}
