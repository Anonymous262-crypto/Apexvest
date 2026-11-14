"use client";

import { Plus } from "lucide-react";
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

import { DepositCheckout } from "./deposit-checkout";

type Asset = {
  symbol: string;
  name: string;
  networks: { name: string; address: string; memo?: string }[];
};

/** The deposit checkout, opened as a modal so nothing else competes for attention while paying. */
export function DepositModal({
  assets,
  windowMin,
  defaultOpen = false,
  label = "New deposit",
}: {
  assets: Asset[];
  windowMin: number;
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
        // Drop ?new=1 from the address once the modal closes.
        if (!o && defaultOpen)
          router.replace("/dashboard/deposit", { scroll: false });
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg">
          <Plus /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[94svh] overflow-y-auto sm:max-w-lg"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>New deposit</DialogTitle>
          <DialogDescription>
            Create a payment in three steps.
          </DialogDescription>
        </DialogHeader>
        <DepositCheckout assets={assets} windowMin={windowMin} />
      </DialogContent>
    </Dialog>
  );
}
