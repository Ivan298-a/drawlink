import Link from "next/link";

export const metadata = {
  title: "Помощь — DrawLink",
  description: "FAQ: как работает DrawLink, эскроу, приватность, споры, Telegram-бот.",
};

type FaqItem = { q: string; a: string };
type FaqGroup = { id: string; title: string; eyebrow: string; items: FaqItem[] };

const groups: FaqGroup[] = [
  {
    id: "general",
    eyebrow: "О платформе",
    title: "Как работает DrawLink",
    items: [
      {
        q: "Что такое DrawLink?",
        a: "Маркетплейс инженерной графики для студентов. Две формы работы: биржа заказов (опубликовал задание — исполнители откликнулись) и каталог готовых работ (купил готовый чертёж со скидкой времени). Все платежи защищены через escrow.",
      },
      {
        q: "Сколько стоит регистрация?",
        a: "Регистрация и публикация заказов бесплатны. Платформа берёт 10% комиссии только с успешно завершённых сделок — комиссия удерживается из выплаты исполнителю.",
      },
      {
        q: "В каких городах работает?",
        a: "Россия, Беларусь, Казахстан. При регистрации указываешь свой город — он используется для фильтра приватности (см. ниже).",
      },
    ],
  },
  {
    id: "students",
    eyebrow: "Для заказчиков",
    title: "Если ты студент и хочешь заказать чертёж",
    items: [
      {
        q: "Как опубликовать заказ?",
        a: "В кабинете → «Опубликовать заказ». Укажи категорию (эпюр, чертёж, электросхема и т.д.), формат файла, размер бумаги, ГОСТ, бюджет и дедлайн. Прикрепи методичку — но НЕ указывай в описании своё ФИО или ВУЗ.",
      },
      {
        q: "Как выбрать исполнителя?",
        a: "В заказе появятся отклики — у каждого видно цену, срок, текст предложения и рейтинг чертёжника. Можешь сравнить и выбрать одного. После выбора деньги замораживаются на платформе через escrow.",
      },
      {
        q: "Что делать после получения файла?",
        a: "Скачай готовое из чата сделки, проверь. Если всё ок — нажми «Подтвердить готовое», и деньги уйдут исполнителю. Не подходит — открой спор. Если за 72 часа не подтвердишь и не откроешь спор, платёж уходит автоматически.",
      },
      {
        q: "Можно ли заказать на бумаге А1/А2/А3?",
        a: "Да, при создании заказа выбери «+ бумажная копия». Но имей в виду: для физической передачи нужен исполнитель из твоего города, и фильтр одногородних отключится.",
      },
    ],
  },
  {
    id: "executors",
    eyebrow: "Для исполнителей",
    title: "Если ты чертёжник и хочешь зарабатывать",
    items: [
      {
        q: "Как стать исполнителем?",
        a: "Зарегистрируйся как «Исполнитель», выбери специализации (категории чертежей) и опубликуй 3+ работы в каталог. Админ проверит профиль и выдаст бейдж «Проверен» — с ним больше доверия и выше шанс получить заказ.",
      },
      {
        q: "Как откликнуться на заказ?",
        a: "В разделе «Заказы» смотри ленту. Заказы из твоего города не показываются (приватность). На подходящий — жми «Откликнуться», предложи цену и срок, опиши подход. Заказчик увидит твой отклик в ленте.",
      },
      {
        q: "Когда я получу деньги?",
        a: "Когда заказчик подтвердит готовую работу (или автоматически через 72 часа, если не подтвердит и не откроет спор). Платформа удержит 10% комиссии. Оставшееся выводи на карту через раздел «Выплаты» в кабинете.",
      },
      {
        q: "Можно ли продавать готовые работы?",
        a: "Да — в каталоге. Опубликуй превью (с автоматическим водяным знаком) и оригинал. Покупатель получит signed-ссылку на оригинал на 15 минут после оплаты.",
      },
    ],
  },
  {
    id: "privacy",
    eyebrow: "Приватность",
    title: "Защита от ВУЗа и одногородних",
    items: [
      {
        q: "Узнает ли преподаватель?",
        a: "Нет. В публичном профиле и чате видны только никнеймы — без ФИО, ВУЗа и группы. Эти данные знаем только мы (платформа) для верификации, и они никогда не показываются другим пользователям.",
      },
      {
        q: "Что такое «фильтр одногородних»?",
        a: "По умолчанию мы прячем заказы и работы пользователей из твоего города — чтобы случайно не пересечься с одногруппником. Включается и отключается в /settings.",
      },
      {
        q: "А если я выбрал бумажную передачу?",
        a: "Тогда фильтр городов инвертируется — нужен исполнитель из твоего города. Анонимность в этом случае снижается, ты подтверждаешь это при создании заказа.",
      },
      {
        q: "Что с метаданными в файлах?",
        a: "При отдаче готовых файлов покупателю мы автоматически вырезаем EXIF и author-теги из PDF/DWG. Имя исполнителя в файле не утечёт.",
      },
    ],
  },
  {
    id: "escrow",
    eyebrow: "Эскроу и платежи",
    title: "Почему деньги в безопасности",
    items: [
      {
        q: "Как устроен escrow?",
        a: "Когда заказчик принимает отклик (или покупает работу из каталога), деньги списываются с его карты и замораживаются на счёте платформы. Исполнитель видит «оплачено» и работает. Деньги уходят исполнителю только после подтверждения готовой работы или автоматически через 72 часа.",
      },
      {
        q: "А если мне не понравится результат?",
        a: "Сначала обсуди в чате — обычно достаточно. Если не договорились — открой спор в течение 72 часов. Деньги останутся заморожены до решения.",
      },
      {
        q: "Какая комиссия платформы?",
        a: "10% от суммы сделки. Удерживается автоматически при выплате исполнителю.",
      },
    ],
  },
  {
    id: "disputes",
    eyebrow: "Споры",
    title: "Что делать, если что-то пошло не так",
    items: [
      {
        q: "Как открыть спор?",
        a: "На странице сделки или в чате — кнопка «Открыть спор». Укажи категорию (качество / срыв сроков / несоответствие ТЗ / другое) и подробно опиши проблему. Платёж заморозится до решения.",
      },
      {
        q: "Как решается спор?",
        a: "Сначала стороны могут сами выбрать решение: правки, частичный возврат или полный возврат. Если в течение 24 часов не договорились — модератор изучит чат, файлы и доказательства, и примет решение.",
      },
      {
        q: "Какие доказательства нужны?",
        a: "Скриншоты переписки, фото методички, готовый файл, любые материалы — добавляй на странице спора. Чем конкретнее факты, тем быстрее решение.",
      },
    ],
  },
  {
    id: "telegram",
    eyebrow: "Telegram",
    title: "Бот уведомлений",
    items: [
      {
        q: "Что приходит в Telegram?",
        a: "Новые отклики на твои заказы, сообщения в активных сделках, уведомления о готовых работах, выплатах, открытых спорах. Полная работа всегда на сайте — бот только пингует.",
      },
      {
        q: "Как подключить?",
        a: "В /settings → блок «Telegram» → «Подключить». Откроется чат с ботом, нажми «Начать» — и готово.",
      },
      {
        q: "Можно отключить?",
        a: "Да, в /settings есть тоггл уведомлений и кнопка «Отключить». Также внутри бота: команда /disconnect.",
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-[920px] px-6 py-14 lg:px-20 lg:py-20">
      <header className="mb-12 flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          Помощь
        </p>
        <h1 className="font-display text-4xl font-bold leading-[1.1] -tracking-[0.02em] text-fg sm:text-5xl">
          Часто задаваемые вопросы
        </h1>
        <p className="max-w-2xl text-base leading-[1.55] text-fg-secondary">
          Если не нашёл ответа — напиши в Telegram-поддержку, ответим в течение часа.
        </p>
      </header>

      {/* Anchor nav */}
      <nav className="mb-12 flex flex-wrap gap-2 rounded-[14px] border border-border-subtle bg-surface p-2">
        {groups.map((g) => (
          <a
            key={g.id}
            href={`#${g.id}`}
            className="rounded-[8px] px-3 py-2 text-[13px] font-medium text-fg-secondary transition-colors hover:bg-elevated hover:text-fg"
          >
            {g.title.length > 28 ? g.eyebrow : g.title}
          </a>
        ))}
      </nav>

      <div className="flex flex-col gap-14">
        {groups.map((g) => (
          <section key={g.id} id={g.id} className="flex flex-col gap-6 scroll-mt-24">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
                {g.eyebrow}
              </p>
              <h2 className="font-display text-2xl font-bold -tracking-[0.02em] text-fg sm:text-3xl">
                {g.title}
              </h2>
            </div>
            <div className="flex flex-col overflow-hidden rounded-[14px] border border-border-subtle bg-surface">
              {g.items.map((item, i) => (
                <details
                  key={i}
                  className={`group ${
                    i > 0 ? "border-t border-border-subtle" : ""
                  }`}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-[15px] font-semibold text-fg transition-colors hover:bg-elevated">
                    <span>{item.q}</span>
                    <span
                      aria-hidden
                      className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border-subtle text-fg-muted transition-transform group-open:rotate-45 group-open:border-brand group-open:text-brand"
                    >
                      +
                    </span>
                  </summary>
                  <div className="px-6 pb-6 pt-1 text-[14px] leading-[1.65] text-fg-secondary">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Contact CTA */}
      <section className="mt-16 flex flex-col items-start gap-4 rounded-[16px] border border-brand/40 bg-[color:oklch(0.69_0.16_70/0.08)] p-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
            Не нашёл ответ?
          </p>
          <h2 className="font-display text-2xl font-bold -tracking-[0.02em] text-fg">
            Напиши в поддержку
          </h2>
          <p className="text-sm text-fg-secondary">
            Отвечаем в Telegram в течение часа в рабочее время.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="https://t.me/drawlink_support"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-shimmer inline-flex h-11 items-center gap-2 rounded-[10px] bg-brand px-5 text-sm font-semibold text-brand-foreground"
          >
            ✈️ Telegram-поддержка
          </Link>
          <Link
            href="mailto:hello@drawlink.app"
            className="btn-shimmer btn-shimmer-amber inline-flex h-11 items-center gap-2 rounded-[10px] border border-border-strong bg-elevated px-5 text-sm font-semibold text-fg"
          >
            Email
          </Link>
        </div>
      </section>
    </div>
  );
}
