import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CreateOrderForm } from "./CreateOrderForm";

export const metadata = { title: "Новый заказ — DrawLink" };

export default async function NewOrderPage() {
  await requireRole("STUDENT");

  const categories = await db.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    include: {
      children: { orderBy: { sortOrder: "asc" } },
    },
  });

  // Плоский список для select: только подкатегории (или сами родители без детей)
  const options = categories.flatMap((root) => {
    if (root.children.length === 0) {
      return [{ value: root.id, label: root.name, group: root.name }];
    }
    return root.children.map((c) => ({
      value: c.id,
      label: c.name,
      group: root.name,
    }));
  });

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-12 lg:px-20">
      <div className="mb-10 flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          Новый заказ
        </p>
        <h1 className="font-display text-4xl font-bold -tracking-[0.02em] text-fg">
          Опубликуй задание
        </h1>
        <p className="max-w-2xl text-base text-fg-secondary">
          Опиши, что нужно сделать. Чем точнее ТЗ — тем меньше правок и быстрее найдётся исполнитель.
          Не указывай ФИО, ВУЗ или контакты.
        </p>
      </div>

      <CreateOrderForm categoryOptions={options} />
    </div>
  );
}
