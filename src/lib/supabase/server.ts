import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client для серверных компонентов и server actions.
 * Использует cookies() из next/headers — работает в Server Components,
 * Route Handlers и Server Actions.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components не могут устанавливать cookies — это нормально,
            // middleware/route handler сделает refresh сессии.
          }
        },
      },
    }
  );
}

/**
 * Admin клиент с service-role ключом. ТОЛЬКО для серверных операций,
 * которые требуют bypass RLS (создание City, миграции, cron-задачи).
 * НИКОГДА не вызывать в Server Component, отдающем данные клиенту.
 */
export function createSupabaseAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    }
  );
}
