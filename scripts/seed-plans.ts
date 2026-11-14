/** Non-destructive: loads the default plan lineup without touching users or money. */
import mongoose from "mongoose";

import { syncDefaultPlans } from "@/lib/services/plans-seed";

syncDefaultPlans()
  .then(async (r) => {
    console.log(
      `Plans synced: ${r.created} created, ${r.updated} updated, ${r.removed} old plans removed, ${r.closed} old plans closed.`,
    );
    await mongoose.disconnect();
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
