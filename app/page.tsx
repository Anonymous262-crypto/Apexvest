import dynamic from "next/dynamic";

import { ScrollToTop } from "@/components/scroll-to-top";
import CTA from "@/components/sections/cta/default";
import Dashboards from "@/components/sections/dashboards/default";
import FAQ from "@/components/sections/faq/default";
import Footer from "@/components/sections/footer/default";
import Hero from "@/components/sections/hero/default";
import HowItWorks from "@/components/sections/how-it-works/default";
import Items from "@/components/sections/items/default";
import Logos from "@/components/sections/logos/default";
import Navbar from "@/components/sections/navbar/default";
import Plans from "@/components/sections/plans/default";
import Security from "@/components/sections/security/default";
import Stats from "@/components/sections/stats/default";
import { LayoutLines } from "@/components/ui/layout-lines";
import { getPublicPlans } from "@/lib/services/public-plans";

// Optional stretch section, loaded as its own chunk
const Calculator = dynamic(
  () => import("@/components/sections/calculator/default"),
);

// Rendered statically, refreshed every minute and instantly when an admin edits a plan (revalidatePath).
export const revalidate = 60;

export default async function Home() {
  const plans = await getPublicPlans();
  return (
    <>
      <ScrollToTop />
      <LayoutLines />
      <Navbar />
      <main id="main" className="bg-background text-foreground w-full">
        <Hero plans={plans} />
        <Logos />
        <Items />
        <HowItWorks />
        <Dashboards />
        <Plans plans={plans} />
        <Calculator />
        <Security />
        <Stats />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
