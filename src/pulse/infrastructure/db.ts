import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/pulse/generated/prisma/client";
import { getEnv } from "@/pulse/config/env";
import { ConfigError } from "@/pulse/lib/errors";

export type Db = InstanceType<typeof PrismaClient>;

const globalForPrisma = globalThis as unknown as { pulsePrisma?: Db };

export function createDb(connectionString: string): Db {
  const adapter = new PrismaPg({ connectionString, max: Number(process.env.PULSE_DB_POOL_MAX ?? 5) });
  return new PrismaClient({ adapter });
}

/** Shared Prisma client. Reused across hot reloads and serverless invocations. */
export function getDb(): Db {
  if (!globalForPrisma.pulsePrisma) {
    const url = getEnv().DATABASE_URL;
    if (!url) throw new ConfigError("DATABASE_URL is not configured");
    globalForPrisma.pulsePrisma = createDb(url);
  }
  return globalForPrisma.pulsePrisma;
}

export function setDbForTests(db: Db | undefined) {
  globalForPrisma.pulsePrisma = db;
}
