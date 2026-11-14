"use client";

import { usePathname } from "next/navigation";

import { pageTitle } from "./app-sidebar";

export function PageTitle({ variant }: { variant: "investor" | "admin" }) {
  const pathname = usePathname();
  return (
    <span className="text-sm font-medium">{pageTitle(variant, pathname)}</span>
  );
}
