"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { AnimatedThemeToggler } from "./animated-theme-toggler";
import { buttonVariants } from "./button";

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const current =
    mounted && (resolvedTheme === "dark" || resolvedTheme === "light")
      ? resolvedTheme
      : undefined;

  return (
    <AnimatedThemeToggler
      variant="circle"
      duration={500}
      theme={current}
      onThemeChange={setTheme}
      className={buttonVariants({ variant: "ghost", size: "icon" })}
    />
  );
}
