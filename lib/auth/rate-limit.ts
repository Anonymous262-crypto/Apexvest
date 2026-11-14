import { connectDb } from "../db";
import { RateLimit } from "../models";

/** Fixed-window counter in MongoDB. Returns true when the action is allowed. */
export async function rateLimit(key: string, max: number, windowSec: number) {
  await connectDb();
  const now = Date.now();
  const doc = await RateLimit.findOneAndUpdate(
    { key },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date(now + windowSec * 1000) },
    },
    { upsert: true, new: true },
  );
  return doc.count <= max;
}
