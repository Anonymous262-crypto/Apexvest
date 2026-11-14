import { connectDb } from "../db";
import { Idempotency } from "../models";

type Result = { ok: boolean; message?: string; error?: string };

/**
 * Makes a form submit safe to retry. On a weak connection a request can time out after the server
 * already did the work, and the user taps again. The first submit with a given key runs; repeats
 * return success without doing it twice. A failed attempt releases the key so the user can fix it and retry.
 */
export async function withIdempotency<T extends Result>(
  userId: string,
  key: string | undefined,
  fn: () => Promise<T>,
): Promise<T | Result> {
  if (!key || key.length < 8) return fn();
  const id = `${userId}:${key.slice(0, 80)}`;
  await connectDb();
  try {
    await Idempotency.create({ key: id, userId });
  } catch (e) {
    if (e instanceof Error && /E11000|duplicate key/i.test(e.message)) {
      return {
        ok: true,
        message: "Already received. We did not create a duplicate.",
      };
    }
    throw e;
  }
  try {
    const r = await fn();
    if (!r.ok) await Idempotency.deleteOne({ key: id });
    return r;
  } catch (e) {
    await Idempotency.deleteOne({ key: id });
    throw e;
  }
}
