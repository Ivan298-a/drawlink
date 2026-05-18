/**
 * Создаёт 2 тестовых аккаунта для E2E на проде:
 *   - test_student  (заказчик, Москва)
 *   - test_executor (исполнитель, Новосибирск, верифицирован)
 *
 * Используем Supabase Admin API (email_confirm: true) — без писем.
 * Запуск: npm run db:test-users
 *
 * Идемпотентно: если auth-пользователь уже есть — переиспользуем,
 * User-строку upsert по email.
 */
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error("❌ Нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const db = new PrismaClient({ adapter });

type TestUser = {
  email: string;
  password: string;
  nickname: string;
  role: "STUDENT" | "EXECUTOR";
  cityName: string;
  verified: boolean;
};

const PASSWORD = "DrawLinkTest2026!";

const users: TestUser[] = [
  {
    email: "test.student@drawlink.test",
    password: PASSWORD,
    nickname: "test_student",
    role: "STUDENT",
    cityName: "Москва",
    verified: false,
  },
  {
    email: "test.executor@drawlink.test",
    password: PASSWORD,
    nickname: "test_executor",
    role: "EXECUTOR",
    cityName: "Новосибирск",
    verified: true,
  },
];

async function findOrCreateAuthUser(email: string, password: string): Promise<string> {
  // Пытаемся создать
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (data?.user) return data.user.id;

  // Уже существует — ищем в списке
  if (error && /already/i.test(error.message)) {
    let page = 1;
    while (page <= 10) {
      const { data: list } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      const found = list?.users.find((u) => u.email === email);
      if (found) {
        // Сбросим пароль на известный
        await supabase.auth.admin.updateUserById(found.id, { password });
        return found.id;
      }
      if (!list || list.users.length < 200) break;
      page++;
    }
  }
  throw new Error(`Не удалось создать/найти auth-пользователя ${email}: ${error?.message}`);
}

async function main() {
  for (const u of users) {
    const city = await db.city.findUnique({ where: { name: u.cityName } });
    if (!city) throw new Error(`Город "${u.cityName}" не найден — запусти db:seed`);

    const authId = await findOrCreateAuthUser(u.email, u.password);

    await db.user.upsert({
      where: { email: u.email },
      update: {
        authId,
        nickname: u.nickname,
        role: u.role,
        cityId: city.id,
        verificationStatus: u.verified ? "APPROVED" : "PENDING",
      },
      create: {
        authId,
        email: u.email,
        nickname: u.nickname,
        role: u.role,
        cityId: city.id,
        verificationStatus: u.verified ? "APPROVED" : "PENDING",
      },
    });

    console.log(
      `✓ ${u.nickname} (${u.role}, ${u.cityName})  →  ${u.email}  /  ${u.password}`
    );
  }

  console.log("");
  console.log("✅ Тестовые аккаунты готовы. Логинься на https://drawlink.vercel.app/sign-in");
}

main()
  .catch((e) => {
    console.error("❌", e.message ?? e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
