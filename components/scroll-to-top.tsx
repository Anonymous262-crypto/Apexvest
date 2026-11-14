"use client";

import { useEffect } from "react";

/**
 * Landing page always opens at the top (unless the URL has a #section).
 * Stops the browser restoring an old scroll position, e.g. the bottom CTA,
 * when coming back from the auth pages.
 */
export function ScrollToTop() {
  useEffect(() => {
    const prev = history.scrollRestoration;
    history.scrollRestoration = "manual";
    if (!window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
    return () => {
      history.scrollRestoration = prev;
    };
  }, []);
  return null;
}
