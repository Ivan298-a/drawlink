import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Тарифы — DrawLink",
  description:
    "Сколько стоит DrawLink: 10% комиссии с успешной сделки, без подписок и скрытых платежей.",
};

const includedForAll = [
  "Безлимит публикаций заказов и работ",
  "Чат с защищённой передачей файлов",
  "Watermark на превью каталога",
  "Telegram-уведомления",
  "Защита приватности (никнеймы, фильтр городов)",
  "Очистка EXIF из готовых файлов",
];

const includedForExecutors = [
  "Доступ ко всей ленте заказов",
  "Публикация работ в каталог",
  "Бейдж «Проверен» после модерации",
  "Автоматическая выплата на карту",
  "Рейтинг и отзывы — твоя личная репутация",
];

const includedForCustomers = [
  "Escrow — деньги в безопасности до подтверждения",
  "Споры с арбитражем платформы",
  "Возврат при срыве сроков или плохом качестве",
  "Подбор только проверенных исполнителей",
  "Фильтр одногородних включён по умолчанию",
];

export default function TariffsPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-6 py-14 lg:px-20 lg:py-20">
      <header className="mb-14 flex flex-col items-center gap-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          Тарифы
        </p>
        <h1 className="font-display text-4xl font-bold leading-[1.1] -tracking-[0.02em] text-fg sm:text-5xl">
          Просто. Прозрачно. Без подписок.
        </h1>
        <p className="max-w-2xl text-base leading-[1.55] text-fg-secondary">
          Один тариф для всех. Регистрация и публикация бесплатные. Платформа
          берёт комиссию только с успешных сделок — никаких ежемесячных платежей,
          скрытых сборов и платных подписок.
        </p>
      </header>

      {/* Main tariff card */}
      <section className="mb-14 rounded-[20px] border border-brand bg-surface p-8 sm:p-12">
        <div className="flex flex-col items-start gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
              Единственный тариф
            </p>
            <h2 className="font-display text-3xl font-bold -tracking-[0.02em] text-fg sm:text-4xl">
              DrawLink
            </h2>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-display text-6xl font-bold -tracking-[0.03em] text-brand sm:text-7xl">
              10%
            </span>
            <span className="text-base text-fg-secondary">
              комиссии с успешной сделки
            </span>
          </div>

          <p className="max-w-2xl text-[15px] leading-[1.6] text-fg-secondary">
            Комиссия удерживается из выплаты исполнителю. Заказчик платит цену,
            указанную в заказе — никаких сюрпризов. Если сделка отменилась или
            возвращена через спор — комиссия тоже возвращается.
          </p>

          <div className="grid w-full gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1 rounded-[12px] border border-border-subtle bg-elevated p-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                Регистрация
              </span>
              <span className="font-display text-2xl font-bold text-fg">0 ₽</span>
            </div>
            <div className="flex flex-col gap-1 rounded-[12px] border border-border-subtle bg-elevated p-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                Подписка
              </span>
              <span className="font-display text-2xl font-bold text-fg">Нет</span>
            </div>
            <div className="flex flex-col gap-1 rounded-[12px] border border-border-subtle bg-elevated p-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                Скрытые платежи
              </span>
              <span className="font-display text-2xl font-bold text-fg">Нет</span>
            </div>
          </div>

          <Link href="/sign-up" className="mt-2">
            <Button variant="primary" size="lg">
              Зарегистрироваться бесплатно
            </Button>
          </Link>
        </div>
      </section>

      {/* Example calculation */}
      <section className="mb-14 flex flex-col gap-5 rounded-[18px] border border-border-subtle bg-surface p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          Пример расчёта
        </p>
        <h2 className="font-display text-2xl font-bold -tracking-[0.02em] text-fg sm:text-3xl">
          Эпюр за 1 000 ₽
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Row
            top="Заказчик платит"
            value="1 000 ₽"
            sub="Снимается с карты при выборе исполнителя"
            accent="text-fg"
          />
          <Row
            top="Платформа удерживает"
            value="100 ₽"
            sub="10% после подтверждения работы"
            accent="text-fg-muted"
          />
          <Row
            top="Исполнитель получает"
            value="900 ₽"
            sub="На карту через СБП после релиза escrow"
            accent="text-brand"
          />
        </div>
      </section>

      {/* What's included */}
      <section className="mb-14 grid gap-6 lg:grid-cols-3">
        <IncludedCard
          eyebrow="Всем пользователям"
          title="Базовая защита"
          items={includedForAll}
        />
        <IncludedCard
          eyebrow="Заказчикам"
          title="Без рисков"
          items={includedForCustomers}
        />
        <IncludedCard
          eyebrow="Исполнителям"
          title="Без подписок"
          items={includedForExecutors}
        />
      </section>

      {/* FAQ short */}
      <section className="flex flex-col gap-4 rounded-[18px] border border-border-subtle bg-inset p-8 sm:p-10">
        <h2 className="font-display text-2xl font-bold -tracking-[0.02em] text-fg sm:text-3xl">
          Частые вопросы
        </h2>

        <Faq
          q="Если я не выберу исполнителя, деньги списались?"
          a="Нет. Деньги списываются только в момент, когда ты жмёшь «Выбрать» отклик. До этого — заказ просто висит в открытом виде."
        />
        <Faq
          q="Если открыл спор и выиграл — комиссия возвращается?"
          a="Если решение — полный возврат, комиссия тоже возвращается заказчику. При частичном возврате — комиссия удерживается с той части, что осталась у исполнителя."
        />
        <Faq
          q="А если работа из каталога?"
          a="Та же логика: 10% от цены работы. Покупатель получает оригинал, исполнитель — 90%, платформа — 10%."
        />
        <Faq
          q="Будут платные «pro»-подписки?"
          a="Нет. Принципиально не хотим вводить подписки. Доход платформы — только с комиссии."
        />

        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/help" className="text-[13px] font-medium text-brand hover:underline">
            Полный FAQ →
          </Link>
          <Link href="/rules" className="text-[13px] font-medium text-brand hover:underline">
            Правила платформы →
          </Link>
        </div>
      </section>
    </div>
  );
}

function Row({
  top,
  value,
  sub,
  accent,
}: {
  top: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[12px] border border-border-subtle bg-elevated p-5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
        {top}
      </span>
      <span className={`font-display text-3xl font-bold -tracking-[0.02em] ${accent}`}>
        {value}
      </span>
      <span className="text-[12px] text-fg-secondary">{sub}</span>
    </div>
  );
}

function IncludedCard({
  eyebrow,
  title,
  items,
}: {
  eyebrow: string;
  title: string;
  items: string[];
}) {
  return (
    <div className="flex flex-col gap-5 rounded-[14px] border border-border-subtle bg-surface p-6">
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
          {eyebrow}
        </p>
        <h3 className="font-display text-xl font-bold -tracking-[0.01em] text-fg">
          {title}
        </h3>
      </div>
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-[13px] leading-[1.55] text-fg">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-[10px] border border-border-subtle bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[14px] font-semibold text-fg">
        <span>{q}</span>
        <span
          aria-hidden
          className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border-subtle text-fg-muted transition-transform group-open:rotate-45 group-open:border-brand group-open:text-brand"
        >
          +
        </span>
      </summary>
      <div className="px-5 pb-4 text-[13px] leading-[1.6] text-fg-secondary">
        {a}
      </div>
    </details>
  );
}
