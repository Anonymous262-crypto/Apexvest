"use client";

import { ArrowUpFromLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { WithdrawForm } from "./withdraw-form";

type Asset = { symbol: string; name: string; networks: { name: string }[] };

/** The withdrawal request, opened as a modal. On success it goes to the request's status page. */
export function WithdrawModal({
  assets,
  available,
  minCents,
  defaultOpen = false,
  label = "New withdrawal",
}: {
  assets: Asset[];
  available: number;
  minCents: number;
  defaultOpen?: boolean;
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o && defaultOpen)
          router.replace("/dashboard/withdraw", { scroll: false });
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg">
          <ArrowUpFromLine /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[94svh] overflow-y-auto sm:max-w-lg"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Withdraw to your wallet</DialogTitle>
          <DialogDescription>
            Available{" "}
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(available / 100)}
            . The amount is held right away, then reviewed and paid by our team.
          </DialogDescription>
        </DialogHeader>
        <WithdrawForm
          assets={assets}
          available={available}
          minCents={minCents}
          onDone={(id) => {
            setOpen(false);
            router.push(`/dashboard/withdraw/${id}`);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
