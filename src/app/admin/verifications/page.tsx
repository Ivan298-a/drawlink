import { db } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";
import { VerificationRow } from "./VerificationRow";

const formatDate = (d: Date) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);

export default async function VerificationsQueue() {
  const users = await db.user.findMany({
    where: {
      role: "EXECUTOR",
      verificationStatus: "PENDING",
    },
    orderBy: { createdAt: "asc" },
    include: {
      profile: true,
      city: { select: { name: true } },
      executorCategories: {
        include: { category: { include: { parent: true } } },
      },
      catalogItems: {
        take: 8,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          code: true,
          title: true,
          previewUrl: true,
          isPublished: true,
        },
      },
    },
  });

  return (
    <div className="px-8 py-10 lg:px-12">
      <header className="mb-8 flex items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
            Верификация
          </p>
          <h1 className="font-display text-3xl font-bold -tracking-[0.02em] text-fg sm:text-4xl">
            Заявки исполнителей
          </h1>
          <p className="text-sm text-fg-secondary">
            {users.length} {users.length === 1 ? "заявка ждёт" : users.length < 5 ? "заявки ждут" : "заявок ждут"} проверки
          </p>
        </div>
        <Badge variant="warning">{users.length} в очереди</Badge>
      </header>

      {users.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-border-subtle bg-surface p-16 text-center">
          <p className="font-display text-xl font-semibold text-fg">
            ✓ Очередь пуста
          </p>
          <p className="mt-2 text-sm text-fg-secondary">
            Все заявки разобраны. Зайди позже.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {users.map((user) => (
            <VerificationRow
              key={user.id}
              user={{
                id: user.id,
                nickname: user.nickname,
                email: user.email,
                createdAt: formatDate(user.createdAt),
                cityName: user.city.name,
                profile: user.profile
                  ? {
                      realName: user.profile.realName ?? null,
                      vuz: user.profile.vuz ?? null,
                      groupName: user.profile.groupName ?? null,
                    }
                  : null,
                categories: Array.from(
                  new Set(
                    user.executorCategories.map(
                      (ec) => ec.category.parent?.name ?? ec.category.name
                    )
                  )
                ),
                portfolio: user.catalogItems.map((c) => ({
                  id: c.id,
                  code: c.code,
                  title: c.title,
                  previewUrl: getPublicPreviewUrl(c.previewUrl),
                })),
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function getPublicPreviewUrl(key: string): string {
  if (key.startsWith("http")) return key;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return "";
  return `${base}/storage/v1/object/public/catalog-previews/${key}`;
}
