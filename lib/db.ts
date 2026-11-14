import mongoose from "mongoose";

import { getEnv, isDbConfigured } from "./env";

export class DbNotConfiguredError extends Error {
  constructor() {
    super("MONGODB_URI is not set. Add it to .env.local to enable the app.");
    this.name = "DbNotConfiguredError";
  }
}

const g = globalThis as unknown as {
  _mongoose?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};
const cache = (g._mongoose ??= { conn: null, promise: null });

export async function connectDb() {
  if (!isDbConfigured()) throw new DbNotConfiguredError();
  if (cache.conn) return cache.conn;
  cache.promise ??= mongoose.connect(getEnv().MONGODB_URI, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 8000,
  });
  try {
    cache.conn = await cache.promise;
  } catch (e) {
    cache.promise = null;
    throw e;
  }
  return cache.conn;
}

/**
 * Runs `fn` inside a MongoDB transaction. Falls back to running without one
 * on a standalone server (local dev), where transactions are unsupported.
 */
export async function withTx<T>(
  fn: (session: mongoose.ClientSession | undefined) => Promise<T>,
): Promise<T> {
  await connectDb();
  const session = await mongoose.startSession();
  try {
    let result!: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/replica set|Transaction numbers|not supported/i.test(msg)) {
      return fn(undefined);
    }
    throw e;
  } finally {
    await session.endSession();
  }
}
