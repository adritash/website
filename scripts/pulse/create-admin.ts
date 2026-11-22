/**
 * Creates or updates a Pulse admin account.
 * Usage: npm run pulse:create-admin -- <email> <OWNER|OPERATOR|VIEWER>
 * The password is read from the PULSE_ADMIN_PASSWORD environment variable (min 12 chars)
 * so it never appears in shell history or process listings.
 */
import "dotenv/config";
import { createDb } from "../../src/pulse/infrastructure/db";
import { hashPassword } from "../../src/pulse/lib/crypto";

async function main() {
  const [email, role = "VIEWER"] = process.argv.slice(2);
  const password = process.env.PULSE_ADMIN_PASSWORD ?? "";
  if (!email || !/^[^@\s]+@[^@\s]+$/.test(email)) throw new Error("Usage: pulse:create-admin -- <email> <role>");
  if (!["OWNER", "OPERATOR", "VIEWER"].includes(role)) throw new Error("Role must be OWNER, OPERATOR or VIEWER");
  if (password.length < 12) throw new Error("Set PULSE_ADMIN_PASSWORD (at least 12 characters)");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const db = createDb(process.env.DATABASE_URL);
  const passwordHash = await hashPassword(password);
  await db.adminUser.upsert({
    where: { email: email.toLowerCase() },
    update: { passwordHash, role: role as "OWNER", active: true },
    create: { email: email.toLowerCase(), passwordHash, role: role as "OWNER" },
  });
  await db.$disconnect();
  console.log(`Admin ${email.toLowerCase()} saved with role ${role}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
