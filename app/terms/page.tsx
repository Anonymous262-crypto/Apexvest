import type { Metadata } from "next";

import LegalPage from "@/components/sections/legal/default";
import { legal } from "@/content/site";

export const metadata: Metadata = {
  title: legal.pages.terms.title,
  alternates: { canonical: "/terms" },
};

export default function Page() {
  return <LegalPage page="terms" />;
}
