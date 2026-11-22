import "dotenv/config";
import { defineConfig } from "prisma/config";

// Pulse database configuration. DATABASE_URL is required for migrate commands only;
// `prisma generate` works without it (used by the Vercel build).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
