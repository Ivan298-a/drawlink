import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { PrivacyForm } from "./PrivacyForm";
import { CityForm } from "./CityForm";
import { TelegramCard } from "./TelegramCard";
import { telegramConfigured } from "@/lib/telegram";

export const metadata = { title: "Настройки — DrawLink" };

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

export default async function SettingsPage() {
  const user = await requireUser("/settings");
  const [cities, profile, city] = await Promise.all([
    db.city.findMany({
      orderBy: [{ region: "asc" }, { name: "asc" }],
      select: { id: true, name: true, region: true },
    }),
    db.userProfile.findUnique({ where: { userId: user.id } }),
    db.city.findUnique({
      where: { id: user.cityId },
      select: { name: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-[960px] px-6 py-10 lg:px-20">
      <div className="mb-10 flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          Настройки
        </p>
        <h1 className="font-display text-3xl font-bold -tracking-[0.02em] text-fg sm:text-4xl">
          Профиль и приватность
        </h1>
        <p className="text-sm text-fg-secondary">
          Контролируй, что видят другие пользователи и как работают фильтры.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Personal data — read-only, скрыто от всех */}
        <Card>
          <CardHeader
            badge="Личные данные — скрыты от всех"
            title="Что знает только платформа"
            description="Эти поля видны только тебе и админу. Другие пользователи их не видят."
          />
          <dl className="flex flex-col gap-3">
            <Row label="Никнейм" value={user.nickname} />
            <Row label="Email" value={user.email} muted />
            <Row label="Реальное имя" value={profile?.realName ?? "Не указано"} muted />
            <Row label="ВУЗ" value={profile?.vuz ?? "Не указано"} muted />
            <Row label="Зарегистрирован" value={formatDate(user.createdAt)} muted />
          </dl>
        </Card>

        {/* Public profile */}
        <Card>
          <CardHeader
            badge="Публичный профиль"
            title="Что видят другие"
          />
          <dl className="flex flex-col gap-3">
            <Row
              label="Никнейм"
              value={user.nickname}
              hint="Можно сменить раз в 30 дней (скоро добавим)"
            />
            <Row
              label="Роль"
              value={
                user.role === "STUDENT"
                  ? "Заказчик"
                  : user.role === "EXECUTOR"
                    ? "Исполнитель"
                    : "Админ"
              }
            />
            <Row label="Город (виден)" value={city?.name ?? "—"} />
          </dl>
        </Card>

        {/* Privacy toggles */}
        <Card>
          <CardHeader
            badge="Приватность"
            title="Фильтры одногородних и видимость"
          />
          <PrivacyForm
            defaults={{
              hideFromSameCity: user.hideFromSameCity,
              hideFromSameVuz: user.hideFromSameVuz,
              showOnline: user.showOnline,
            }}
          />
        </Card>

        {/* Telegram */}
        <Card>
          <CardHeader
            badge="Telegram"
            title="Мгновенные уведомления"
            description="Новые отклики, сообщения в чате, дедлайны и споры — приходят в TG. Полная работа всегда на сайте."
          />
          <TelegramCard
            connected={user.telegramChatId != null}
            username={user.telegramUsername}
            notifyEnabled={user.notifyTelegram}
            configured={telegramConfigured()}
          />
        </Card>

        {/* City change */}
        <Card>
          <CardHeader
            badge="Смена города"
            title="Город используется для фильтрации"
            description="Если переехал — обнови. Это повлияет на видимость заказов."
          />
          <CityForm
            currentCityId={user.cityId}
            cities={cities.map((c) => ({
              value: c.id,
              label: c.name,
              group: c.region ?? "Прочее",
            }))}
          />
        </Card>

        {user.role === "EXECUTOR" && user.verificationStatus !== "APPROVED" && (
          <Card accent>
            <CardHeader
              badge="Верификация"
              title="Подтверди опыт"
              description="Загрузи 3+ работы из портфолио, чтобы получить бейдж «Проверен» и доступ к заказам с высоким бюджетом."
            />
            <div className="flex items-center gap-3">
              <Badge variant={user.verificationStatus === "PENDING" ? "warning" : "danger"}>
                {user.verificationStatus === "PENDING" ? "На рассмотрении" : "Отклонено"}
              </Badge>
              <span className="text-sm text-fg-secondary">
                {user.verificationStatus === "PENDING"
                  ? "Заявка отправлена, ждём проверки админа."
                  : "Верификация отклонена. Загляни в email или свяжись с поддержкой."}
              </span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function Card({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <section
      className={`flex flex-col gap-5 rounded-[14px] border bg-surface p-7 ${
        accent ? "border-brand" : "border-border-subtle"
      }`}
    >
      {children}
    </section>
  );
}

function CardHeader({
  badge,
  title,
  description,
}: {
  badge: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
        {badge}
      </p>
      <h2 className="font-display text-lg font-semibold -tracking-[0.01em] text-fg">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-fg-secondary">{description}</p>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  hint,
  muted,
}: {
  label: string;
  value: string;
  hint?: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border-subtle pb-3 last:border-b-0 last:pb-0">
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] text-fg-secondary">{label}</span>
        {hint && <span className="text-[11px] text-fg-muted">{hint}</span>}
      </div>
      <span
        className={`text-[14px] font-semibold ${muted ? "text-fg-muted" : "text-fg"}`}
      >
        {value}
      </span>
    </div>
  );
}
