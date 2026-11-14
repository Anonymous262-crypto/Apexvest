"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Quietly re-fetches the page data so a conversation feels live. Pauses when hidden or offline. */
export function LiveRefresh({ seconds = 8 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible" && navigator.onLine)
        router.refresh();
    };
    const t = setInterval(tick, seconds * 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, seconds]);
  return null;
}
