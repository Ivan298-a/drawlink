import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";

// Load env from .env.local first, then .env (Next.js precedence)
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // CLI (migrate dev / db push) использует datasource.url для соединения и
  // создания shadow-БД. DIRECT_URL — без pgbouncer.
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
  // Runtime-адаптер для рантайма (не обязательный для CLI миграций)
  adapter: async () =>
    new PrismaPg({
      connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    }),
});
