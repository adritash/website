/**
 * Idempotent seed: plans, the verified NSE 2026 calendar and a starter instrument list.
 * Safe to run repeatedly (`npm run pulse:seed`). Does not create admin users; use
 * `npm run pulse:create-admin`.
 */
import "dotenv/config";
import { createDb } from "../src/pulse/infrastructure/db";
import { DEFAULT_PLANS } from "../src/pulse/modules/subscriptions/plans";
import { NSE_2026_SOURCE, NSE_HOLIDAYS_2026 } from "./seed-data/nse-holidays-2026";
import { STARTER_INSTRUMENTS } from "./seed-data/instruments";

export async function seed(databaseUrl: string) {
  const db = createDb(databaseUrl);
  try {
    for (const plan of DEFAULT_PLANS) {
      await db.plan.upsert({
        where: { code: plan.code },
        // Existing limits/prices are left as operators set them.
        update: {},
        create: { code: plan.code, name: plan.name, pricePaise: plan.pricePaise, isDefault: plan.isDefault, limits: plan.limits },
      });
    }

    for (const [date, description] of NSE_HOLIDAYS_2026) {
      await db.marketHoliday.upsert({
        where: { exchange_date: { exchange: "NSE", date: new Date(`${date}T00:00:00Z`) } },
        update: { description, source: NSE_2026_SOURCE },
        create: { exchange: "NSE", date: new Date(`${date}T00:00:00Z`), description, source: NSE_2026_SOURCE },
      });
    }
    await db.marketCalendarYear.upsert({
      where: { exchange_year: { exchange: "NSE", year: 2026 } },
      update: { source: NSE_2026_SOURCE },
      create: { exchange: "NSE", year: 2026, source: NSE_2026_SOURCE },
    });

    for (const i of STARTER_INSTRUMENTS) {
      await db.instrument.upsert({
        where: { symbol_exchange: { symbol: i.symbol, exchange: "NSE" } },
        update: { companyName: i.companyName, aliases: i.aliases },
        create: { symbol: i.symbol, exchange: "NSE", companyName: i.companyName, aliases: i.aliases, source: "starter-seed" },
      });
    }
  } finally {
    await db.$disconnect();
  }
}

if (process.argv[1]?.endsWith("seed.ts")) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  seed(url).then(() => console.log("Pulse seed complete"));
}
