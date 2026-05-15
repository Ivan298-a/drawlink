/**
 * Делает пользователя админом.
 *
 * Запуск:
 *   npm run db:admin user@example.com
 *   npm run db:admin nickname
 *
 * Можно передавать как email, так и nickname.
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const db = new PrismaClient({ adapter });

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error(
      "❌ Укажи email или никнейм: npm run db:admin user@example.com"
    );
    process.exit(1);
  }

  const user = await db.user.findFirst({
    where: arg.includes("@")
      ? { email: arg.toLowerCase() }
      : { nickname: arg },
  });
  if (!user) {
    console.error(`❌ Пользователь "${arg}" не найден`);
    process.exit(1);
  }

  if (user.role === "ADMIN") {
    console.log(`ⓘ ${user.nickname} (${user.email}) уже админ`);
    return;
  }

  await db.user.update({
    where: { id: user.id },
    data: { role: "ADMIN", verificationStatus: "APPROVED" },
  });

  console.log(`✓ ${user.nickname} (${user.email}) теперь ADMIN`);
}

main()
  .catch((e) => {
    console.error("❌", e.message ?? e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
