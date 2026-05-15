/**
 * Включает Supabase Realtime publication на таблице messages.
 * Запуск: npm run db:realtime
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
    // Проверим, есть ли уже в publication
    const inPub = await client.query<{ pubname: string }>(
      `SELECT pubname FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages'`
    );
    if (inPub.rowCount && inPub.rowCount > 0) {
      console.log("✓ messages уже в supabase_realtime");
    } else {
      await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE public.messages`);
      console.log("✓ messages добавлен в supabase_realtime publication");
    }

    // Включаем REPLICA IDENTITY FULL для inserts с полными старыми строками (для UPDATE)
    await client.query(`ALTER TABLE public.messages REPLICA IDENTITY FULL`);
    console.log("✓ REPLICA IDENTITY FULL установлен для messages");

    console.log("✅ Realtime готов");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("❌", e.message ?? e);
  process.exit(1);
});
