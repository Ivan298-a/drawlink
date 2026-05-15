/**
 * Включает Row Level Security на таблице messages и добавляет политику:
 *   читать сообщение может только участник сделки (buyer или seller).
 *
 * Зачем: клиентский Supabase-client с anon-ключом подписывается на
 * Realtime-канал messages. Без RLS он МОЖЕТ получать ВСЕ сообщения всех
 * чатов (фильтр chat_id на клиенте не защищает на сервере).
 *
 * Запуск: npm run db:rls
 *
 * Идемпотентно — DROP IF EXISTS + CREATE.
 */
import { Client } from "pg";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_URL / DATABASE_URL не задан");

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    console.log("🔒 Включаю RLS на messages…");
    await client.query(`ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY`);
    console.log("✓ RLS enabled");

    console.log("🔒 Удаляю старые политики (если есть)…");
    await client.query(
      `DROP POLICY IF EXISTS "messages_select_participants" ON public.messages`
    );

    console.log("🔒 Создаю политику messages_select_participants…");
    await client.query(`
      CREATE POLICY "messages_select_participants"
      ON public.messages
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.chats c
          JOIN public.deals d ON d.id = c.deal_id
          JOIN public.users u ON (u.id = d.buyer_id OR u.id = d.seller_id)
          WHERE c.id = messages.chat_id
            AND u.auth_id = auth.uid()::text
        )
      )
    `);
    console.log("✓ Policy created");

    // service_role обходит RLS автоматически — наш сервер через Prisma продолжит читать/писать без ограничений.
    console.log("");
    console.log("✅ RLS настроен. Теперь Realtime-подписки видят только сообщения своих сделок.");
    console.log("ℹ Сервер (Prisma → service_role) бэкенд-операций RLS не затрагивает.");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("❌", e.message ?? e);
  process.exit(1);
});
