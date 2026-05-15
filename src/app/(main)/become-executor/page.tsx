import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Стать исполнителем — DrawLink" };

export default function BecomeExecutorPage() {
  return (
    <div className="mx-auto max-w-[720px] px-6 py-20 lg:px-20">
      <div className="flex flex-col gap-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          Исполнителям
        </p>
        <h1 className="font-display text-4xl font-bold -tracking-[0.02em] text-fg sm:text-5xl">
          Зарабатывай на чертежах
        </h1>
        <p className="text-base leading-[1.55] text-fg-secondary">
          Если ты умеешь делать чертежи в КОМПАС, AutoCAD или SolidWorks — DrawLink
          даёт постоянный поток заказов от студентов из других городов. Платформа
          держит деньги в эскроу, ты получаешь после подтверждения.
        </p>

        <ul className="flex flex-col gap-3 rounded-[14px] border border-border-subtle bg-surface p-6 text-[14px]">
          <li className="flex items-start gap-3">
            <span className="mt-1 size-2 rounded-full bg-brand" aria-hidden />
            <span className="text-fg">
              <b>10% комиссии</b> — больше платформа не берёт
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 size-2 rounded-full bg-brand" aria-hidden />
            <span className="text-fg">
              <b>Безопасно</b> — деньги замораживаются ДО начала работы
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 size-2 rounded-full bg-brand" aria-hidden />
            <span className="text-fg">
              <b>Анонимно</b> — ФИО и ВУЗ скрыты от заказчиков
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 size-2 rounded-full bg-brand" aria-hidden />
            <span className="text-fg">
              <b>Без одногородних</b> — заказчики из твоего города не видят твои
              работы (если не сам разрешил)
            </span>
          </li>
        </ul>

        <div className="flex flex-wrap gap-3">
          <Link href="/sign-up">
            <Button variant="primary" size="lg">
              Зарегистрироваться как исполнитель
            </Button>
          </Link>
          <Link href="/help">
            <Button variant="secondary" size="lg">
              Как это работает
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
