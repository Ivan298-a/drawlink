import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Как это работает — DrawLink",
  description:
    "Жизненный цикл сделки на DrawLink: от публикации заказа до выплаты и отзыва.",
};

const studentSteps = [
  {
    n: "01",
    title: "Опубликуй задание",
    description:
      "Укажи категорию, формат файла, размер бумаги, ГОСТ, бюджет и дедлайн. Прикрепи методичку. ФИО и ВУЗ — не указывай, никто их не увидит.",
  },
  {
    n: "02",
    title: "Получи отклики",
    description:
      "Исполнители увидят заказ в своей ленте. Каждый предложит цену, срок и подход. По умолчанию исполнители из твоего города не видят твой заказ.",
  },
  {
    n: "03",
    title: "Выбери исполнителя",
    description:
      "Сравни по рейтингу, цене, отзывам. Жмёшь «Выбрать» — деньги списываются с твоей карты и замораживаются на платформе через escrow.",
  },
  {
    n: "04",
    title: "Проверь готовое",
    description:
      "Исполнитель загружает файл. Скачиваешь, проверяешь. Если всё ок — подтверждаешь, деньги уходят. Не подошло — открываешь спор за 72 часа.",
  },
  {
    n: "05",
    title: "Оставь отзыв",
    description:
      "Оцениваешь качество, сроки и общение по 5-балльной шкале. Отзыв помогает другим заказчикам и поднимает рейтинг хорошим исполнителям.",
  },
];

const executorSteps = [
  {
    n: "01",
    title: "Стань исполнителем",
    description:
      "Регистрируешься как «Исполнитель», выбираешь специализации (эпюр, чертёж, схема и т.д.). Подписываешь NDA. Город используется только для фильтра.",
  },
  {
    n: "02",
    title: "Опубликуй портфолио",
    description:
      "Загружаешь 3+ готовые работы в каталог с превью и оригиналом. Админ проверяет — даёт бейдж «Проверен». С бейджем больше доверия и заказов.",
  },
  {
    n: "03",
    title: "Откликайся на заказы",
    description:
      "В ленте «Заказы» — все актуальные задания (заказчики из твоего города не показываются). Жмёшь «Откликнуться», предлагаешь цену и срок.",
  },
  {
    n: "04",
    title: "Выполни работу",
    description:
      "Заказчик принял отклик — деньги уже на платформе. Делаешь работу, общаешься в чате, загружаешь готовый файл через защищённый канал.",
  },
  {
    n: "05",
    title: "Получи выплату",
    description:
      "Заказчик подтверждает — деньги (минус 10% комиссии) уходят тебе. Если за 72 часа не подтвердил и не открыл спор — деньги уходят автоматически.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-6 py-14 lg:px-20 lg:py-20">
      <header className="mb-14 flex flex-col items-center gap-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          Как это работает
        </p>
        <h1 className="font-display text-4xl font-bold leading-[1.1] -tracking-[0.02em] text-fg sm:text-5xl">
          От задания до готового чертежа за 5 шагов
        </h1>
        <p className="max-w-2xl text-base leading-[1.55] text-fg-secondary">
          DrawLink — это не «биржа фриланса вообще», а узкий маркетплейс для
          инженерной графики с защитой денег через escrow и фильтром
          одногородних.
        </p>
      </header>

      {/* Two columns: student / executor */}
      <div className="mb-16 grid gap-10 lg:grid-cols-2">
        <Column eyebrow="Если ты заказчик" title="Студент" steps={studentSteps} />
        <Column
          eyebrow="Если ты исполнитель"
          title="Чертёжник"
          steps={executorSteps}
        />
      </div>

      {/* Trust + how money is protected */}
      <section className="mb-16 flex flex-col gap-6 rounded-[18px] border border-border-subtle bg-surface p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          Защита платежей
        </p>
        <h2 className="font-display text-2xl font-bold -tracking-[0.02em] text-fg sm:text-3xl">
          Как устроен escrow
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Pillar
            n="1"
            title="Списание"
            text="Заказчик жмёт «Выбрать». Деньги списываются с карты и попадают на счёт платформы."
          />
          <Pillar
            n="2"
            title="Заморозка"
            text="Платформа держит средства. Исполнитель видит «оплачено» и спокойно работает."
          />
          <Pillar
            n="3"
            title="Передача"
            text="Готовый файл доступен заказчику через signed URL только после оплаты. Метаданные очищены."
          />
          <Pillar
            n="4"
            title="Выплата"
            text="Подтверждение → деньги уходят исполнителю, 10% комиссии — платформе."
          />
        </div>
      </section>

      {/* Privacy block */}
      <section className="mb-16 flex flex-col gap-4 rounded-[18px] border border-brand/40 bg-[color:oklch(0.69_0.16_70/0.06)] p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          🛡 Приватность
        </p>
        <h2 className="font-display text-2xl font-bold -tracking-[0.02em] text-fg sm:text-3xl">
          Преподаватель не узнает. Одногруппник не пересечётся.
        </h2>
        <ul className="flex flex-col gap-3 text-[14px] leading-[1.6] text-fg">
          <li>
            <b>Никнеймы вместо ФИО.</b> В публичном профиле и чате — только
            псевдонимы. ВУЗ и группа знаем только мы для верификации.
          </li>
          <li>
            <b>Фильтр одногородних.</b> По умолчанию пользователи из твоего
            города не видят твои публикации (можно отключить, например для
            физической передачи на A1).
          </li>
          <li>
            <b>Чистые файлы.</b> Из готовых PDF/DWG автоматически вырезаются
            EXIF и author-метаданные.
          </li>
          <li>
            <b>NDA для исполнителей.</b> При регистрации подписывают соглашение
            о неразглашении.
          </li>
        </ul>
      </section>

      {/* Disputes */}
      <section className="mb-16 flex flex-col gap-4 rounded-[18px] border border-border-subtle bg-surface p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          Если что-то пошло не так
        </p>
        <h2 className="font-display text-2xl font-bold -tracking-[0.02em] text-fg sm:text-3xl">
          Споры и арбитраж
        </h2>
        <ul className="flex flex-col gap-3 text-[14px] leading-[1.6] text-fg-secondary">
          <li>
            <b className="text-fg">1. Обсуди в чате.</b> 90% разногласий решаются
            одним сообщением.
          </li>
          <li>
            <b className="text-fg">2. Открой спор.</b> Если не договорились —
            кнопка прямо в чате. Деньги остаются замороженными.
          </li>
          <li>
            <b className="text-fg">3. Добавьте доказательства.</b> Стороны
            прикрепляют скриншоты, файлы, ссылки.
          </li>
          <li>
            <b className="text-fg">4. Решение.</b> Стороны выбирают одно из трёх:
            правки, частичный возврат, полный возврат. Не договорились за 24
            часа — модератор арбитража принимает решение.
          </li>
        </ul>
        <div className="flex flex-wrap gap-3">
          <Link href="/rules" className="text-[13px] font-medium text-brand hover:underline">
            Правила платформы →
          </Link>
          <Link href="/help#disputes" className="text-[13px] font-medium text-brand hover:underline">
            Подробнее в FAQ →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="flex flex-col items-center gap-6 rounded-[18px] border border-border-subtle bg-inset p-10 text-center sm:p-14">
        <h2 className="font-display text-3xl font-bold leading-[1.1] -tracking-[0.02em] text-fg sm:text-4xl">
          Готов попробовать?
        </h2>
        <p className="max-w-xl text-base text-fg-secondary">
          Регистрация занимает 30 секунд. Платишь только за результат.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/orders/new">
            <Button variant="primary" size="lg">
              Опубликовать заказ
            </Button>
          </Link>
          <Link href="/become-executor">
            <Button variant="secondary" size="lg">
              Стать исполнителем
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function Column({
  eyebrow,
  title,
  steps,
}: {
  eyebrow: string;
  title: string;
  steps: Array<{ n: string; title: string; description: string }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          {eyebrow}
        </p>
        <h2 className="font-display text-2xl font-bold -tracking-[0.02em] text-fg sm:text-3xl">
          {title}
        </h2>
      </div>
      <ol className="flex flex-col gap-4">
        {steps.map((s) => (
          <li
            key={s.n}
            className="flex gap-5 rounded-[14px] border border-border-subtle bg-surface p-5"
          >
            <span className="font-display text-3xl font-bold -tracking-[0.04em] text-brand">
              {s.n}
            </span>
            <div className="flex flex-col gap-1.5">
              <h3 className="font-display text-base font-semibold -tracking-[0.01em] text-fg">
                {s.title}
              </h3>
              <p className="text-[13px] leading-[1.55] text-fg-secondary">
                {s.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Pillar({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-[12px] border border-border-subtle bg-elevated p-5">
      <span className="font-display text-lg font-bold text-brand">{n}</span>
      <h3 className="font-display text-base font-semibold -tracking-[0.01em] text-fg">
        {title}
      </h3>
      <p className="text-[13px] leading-[1.55] text-fg-secondary">{text}</p>
    </div>
  );
}
