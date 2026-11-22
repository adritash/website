import type { Db } from "@/pulse/infrastructure/db";
import type { InstrumentRef } from "@/pulse/modules/market-data/market-data.types";

/** Every query is scoped by userId; there is no way to address another user's rows. */
export async function listWatchlist(db: Db, userId: string) {
  return db.watchlistItem.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
}

export type AddResult = { status: "added" } | { status: "exists" } | { status: "limit"; max: number };

export async function addToWatchlist(db: Db, userId: string, instrument: InstrumentRef, max: number): Promise<AddResult> {
  const existing = await db.watchlistItem.findUnique({
    where: { userId_symbol_exchange: { userId, symbol: instrument.symbol, exchange: instrument.exchange } },
  });
  if (existing) return { status: "exists" };
  const count = await db.watchlistItem.count({ where: { userId } });
  if (count >= max) return { status: "limit", max };
  try {
    await db.watchlistItem.create({
      data: { userId, symbol: instrument.symbol, exchange: instrument.exchange, companyName: instrument.companyName },
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return { status: "exists" };
    throw error;
  }
  return { status: "added" };
}

/** Removes only the watchlist entry. Alerts for the stock are left untouched. */
export async function removeFromWatchlist(db: Db, userId: string, instrument: InstrumentRef): Promise<boolean> {
  const result = await db.watchlistItem.deleteMany({
    where: { userId, symbol: instrument.symbol, exchange: instrument.exchange },
  });
  return result.count > 0;
}
