import { execSync } from "node:child_process";

/**
 * Applies pending migrations to the dedicated local test database (non-destructive).
 * Tests then clear their own rows between cases. Never point this at a real database.
 */
export default function setup() {
  const url = process.env.PULSE_TEST_DATABASE_URL ?? "postgresql://pulse@localhost:54329/pulse_test";
  if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url)) throw new Error("Pulse tests only run against a local test database");
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url }, stdio: "pipe" });
}
