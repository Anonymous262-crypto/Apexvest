import * as React from "react";

import { cn } from "@/lib/utils";

function LayoutLines({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 top-0 hidden lg:block",
        className,
      )}
      {...props}
    >
      <div className="max-w-container line-y line-dashed mx-auto flex h-full flex-col"></div>
    </section>
  );
}

export { LayoutLines };
