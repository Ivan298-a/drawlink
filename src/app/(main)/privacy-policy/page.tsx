import Link from "next/link";

export const metadata = {
  title: "Политика конфиденциальности — DrawLink",
  description:
    "Какие данные собирает DrawLink, зачем они нужны и как защищены.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-[800px] px-6 py-14 lg:px-20 lg:py-20">
      <header className="mb-10 flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          Privacy Policy
        </p>
        <h1 className="font-display text-4xl font-bold leading-[1.1] -tracking-[0.02em] text-fg sm:text-5xl">
          Политика конфиденциальности
        </h1>
        <p className="text-[13px] text-fg-muted">
          Редакция от 15 мая 2026.
        </p>
      </header>

      <article className="flex flex-col gap-10 text-[15px] leading-[1.7] text-fg">
        <Section title="Коротко (TL;DR)">
          <ul>
            <li>
              ФИО, ВУЗ, группа, email и телефон видны только Платформе. Другим
              пользователям видны только никнеймы.
            </li>
            <li>
              Мы не продаём данные третьим лицам и не используем их для
              таргетированной рекламы.
            </li>
            <li>
              Из готовых файлов автоматически вырезаются EXIF и author-метаданные.
            </li>
            <li>
              Можно запросить удаление аккаунта и всех данных в любой момент.
            </li>
          </ul>
        </Section>

        <Section title="1. Кто оператор">
          <p>
            Оператором персональных данных является команда DrawLink. После
            регистрации юридического лица в этом разделе появятся полные
            реквизиты. Связаться:{" "}
            <a className="text-brand hover:underline" href="mailto:hello@drawlink.app">
              hello@drawlink.app
            </a>
            .
          </p>
        </Section>

        <Section title="2. Какие данные мы собираем">
          <ol>
            <li>
              <b>При регистрации:</b> email, никнейм, пароль (хешированный),
              город, роль (заказчик/исполнитель).
            </li>
            <li>
              <b>В приватном профиле (опционально):</b> реальное ФИО, ВУЗ,
              группа, телефон. Эти данные нужны для верификации исполнителей и
              разрешения споров.
            </li>
            <li>
              <b>При использовании:</b> тексты заказов, сообщения чатов,
              загруженные файлы (методички, готовые работы, доказательства
              споров), отзывы, рейтинги.
            </li>
            <li>
              <b>Технические данные:</b> IP-адрес, тип браузера,
              referrer, время визита — для безопасности и аналитики.
            </li>
            <li>
              <b>Платёжные данные</b> собирает платёжный провайдер (YooKassa
              или аналог). Платформа хранит только идентификатор транзакции и
              сумму.
            </li>
            <li>
              <b>Telegram:</b> при подключении бота — chat_id и username (если
              указан). Реальные ФИО Telegram не запрашивает.
            </li>
          </ol>
        </Section>

        <Section title="3. Зачем мы их используем">
          <ol>
            <li>Регистрация и авторизация (email, пароль).</li>
            <li>
              Сопоставление пользователей: исключение одногородних, фильтр
              категорий (город, ВУЗ).
            </li>
            <li>Расчёты по сделкам (платёжный идентификатор, сумма).</li>
            <li>
              Уведомления: email и Telegram о новых откликах, сообщениях,
              платежах.
            </li>
            <li>Модерация: проверка верификации, разрешение споров.</li>
            <li>Безопасность: предотвращение мошенничества, защита аккаунтов.</li>
          </ol>
        </Section>

        <Section title="4. Кому видны данные">
          <ol>
            <li>
              <b>Другим пользователям</b> — только публичные поля: никнейм,
              город (если показ включён), рейтинг, отзывы, портфолио.
            </li>
            <li>
              <b>Платформе (команде DrawLink)</b> — все данные, включая
              приватные, в объёме, необходимом для модерации и поддержки.
            </li>
            <li>
              <b>Платёжному провайдеру</b> — только данные, необходимые для
              проведения платежа.
            </li>
            <li>
              <b>Государственным органам</b> — только по официальному запросу в
              рамках законодательства.
            </li>
            <li>
              Третьим лицам в иных целях данные <b>не передаются</b>.
            </li>
          </ol>
        </Section>

        <Section title="5. Где хранятся данные">
          <ol>
            <li>
              База данных и файлы — Supabase (Postgres + S3-совместимое
              хранилище), регион Frankfurt (EU).
            </li>
            <li>
              Хостинг приложения — Vercel.
            </li>
            <li>
              Резервные копии хранятся в шифрованном виде, доступ — только
              администраторам.
            </li>
          </ol>
        </Section>

        <Section title="6. Сколько храним">
          <ol>
            <li>Аккаунт и связанные с ним данные — пока он активен.</li>
            <li>
              Финансовые записи о сделках — 3 года после закрытия сделки (для
              налоговой отчётности).
            </li>
            <li>
              Удалённые аккаунты — анонимизируются (никнейм →{" "}
              <code>deleted_xxxx</code>), сообщения в чатах остаются с пометкой
              «пользователь удалил аккаунт».
            </li>
            <li>Логи безопасности — 90 дней.</li>
          </ol>
        </Section>

        <Section title="7. Защита данных">
          <ol>
            <li>HTTPS-шифрование всего трафика.</li>
            <li>Пароли хранятся в хешированном виде (bcrypt/argon2 через Supabase Auth).</li>
            <li>
              Доступ к серверной инфраструктуре — по 2FA, ключи доступа
              регулярно ротируются.
            </li>
            <li>
              Watermark на превью каталога; оригиналы файлов доступны только
              через signed URL c ограничением по времени (15 минут).
            </li>
            <li>EXIF и author-метаданные из файлов удаляются автоматически.</li>
          </ol>
        </Section>

        <Section title="8. Cookies и аналитика">
          <ol>
            <li>
              Технические cookies (сессия, аутентификация) обязательны для
              работы сайта.
            </li>
            <li>
              Аналитика на момент запуска не подключена. Если будет —
              предупредим в этом разделе и добавим cookie-баннер.
            </li>
          </ol>
        </Section>

        <Section title="9. Твои права">
          <p>В любой момент можешь:</p>
          <ol>
            <li>
              <b>Запросить копию своих данных</b> — напиши в поддержку, в
              течение 30 дней получишь архив.
            </li>
            <li>
              <b>Исправить данные</b> — большинство полей доступны в
              <Link href="/settings" className="text-brand hover:underline">
                {" "}настройках профиля
              </Link>
              .
            </li>
            <li>
              <b>Удалить аккаунт</b> — через поддержку. Удаление невозможно
              отменить.
            </li>
            <li>
              <b>Отозвать согласие на обработку</b> — равнозначно удалению
              аккаунта (без данных пользоваться платформой нельзя).
            </li>
            <li>
              <b>Подать жалобу</b> — оператору (нам) или в Роскомнадзор
              (для РФ) / в надзорный орган своей страны.
            </li>
          </ol>
        </Section>

        <Section title="10. Дети">
          <p>
            Платформа не предназначена для лиц младше 16 лет. Если выяснится,
            что аккаунт принадлежит ребёнку младше 16 — он будет удалён.
          </p>
        </Section>

        <Section title="11. Изменения политики">
          <p>
            При существенных изменениях мы публикуем новую редакцию здесь и
            отправляем уведомления на email и в Telegram-бот за 7 дней до
            вступления в силу.
          </p>
        </Section>

        <Section title="12. Контакты">
          <p>
            По любым вопросам о персональных данных:{" "}
            <a className="text-brand hover:underline" href="mailto:hello@drawlink.app">
              hello@drawlink.app
            </a>
            ,{" "}
            <a className="text-brand hover:underline" href="https://t.me/drawlink_support">
              Telegram-поддержка
            </a>
            .
          </p>
        </Section>
      </article>

      <footer className="mt-14 flex flex-wrap gap-4 border-t border-border-subtle pt-6 text-[13px]">
        <Link href="/rules" className="text-brand hover:underline">
          Правила платформы →
        </Link>
        <Link href="/terms" className="text-brand hover:underline">
          Оферта →
        </Link>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-2xl font-semibold -tracking-[0.01em] text-fg">
        {title}
      </h2>
      <div className="flex flex-col gap-3 text-fg-secondary [&_ol]:flex [&_ol]:flex-col [&_ol]:gap-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:list-disc [&_ul]:pl-6 [&_b]:font-semibold [&_b]:text-fg [&_code]:rounded [&_code]:bg-elevated [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:text-fg">
        {children}
      </div>
    </section>
  );
}
