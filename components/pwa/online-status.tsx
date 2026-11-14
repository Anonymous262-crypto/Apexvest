"use client";

import { WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useOnline } from "@/lib/use-online";

/** Slim banner while offline, and a refresh plus toast when the connection comes back. */
export function OnlineStatus() {
  const online = useOnline();
  const router = useRouter();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      return;
    }
    if (wasOffline.current) {
      wasOffline.current = false;
      toast.success("Back online");
      router.refresh();
    }
  }, [online, router]);

  if (online) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-gold/15 text-foreground flex items-center justify-center gap-2 border-b px-4 py-2 text-center text-sm"
    >
      <WifiOff className="size-4 shrink-0" aria-hidden="true" />
      You are offline. Buttons that save changes are paused until your
      connection returns.
    </div>
  );
}
