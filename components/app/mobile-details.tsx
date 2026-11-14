import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { TableCell } from "@/components/ui/table";

/**
 * The last cell of a table row. On phones, where rows turn into cards, it shows a full-width button to
 * the details page. On larger screens it is hidden because the row already links through its first cell.
 */
export function MobileDetails({
  href,
  label = "View details",
  desktop = false,
}: {
  href: string;
  label?: string;
  /** Also show the button on larger screens (for tables whose rows have no other link). */
  desktop?: boolean;
}) {
  return (
    <TableCell data-label="" className={desktop ? "" : "sm:hidden"}>
      <Button
        asChild
        variant="outline"
        size="sm"
        className={desktop ? "w-full sm:w-auto" : "w-full"}
      >
        <Link href={href}>
          {label} <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </Button>
    </TableCell>
  );
}
