import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CatalogPublishForm } from "./CatalogPublishForm";

export const metadata = { title: "Опубликовать работу — DrawLink" };

export default async function NewCatalogItemPage() {
  const user = await requireUser("/catalog/new");
  if (user.role !== "EXECUTOR" && user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-[800px] px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-fg">
          Доступно только исполнителям
        </h1>
        <p className="mt-2 text-sm text-fg-secondary">
          Чтобы публиковать готовые работы, заведи аккаунт исполнителя.
        </p>
      </div>
    );
  }

  const categories = await db.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    include: { children: { orderBy: { sortOrder: "asc" } } },
  });

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
    <div className="mx-auto max-w-[1280px] px-6 py-10 lg:px-20">
      <div className="mb-10 flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          Каталог
        </p>
        <h1 className="font-display text-3xl font-bold -tracking-[0.02em] text-fg sm:text-4xl">
          Опубликовать работу
        </h1>
        <p className="max-w-2xl text-base text-fg-secondary">
          Загрузи готовый чертёж в каталог. На превью автоматически наложится
          водяной знак; оригинал увидит только тот, кто оплатил.
        </p>
      </div>

      <CatalogPublishForm categoryOptions={options} />
    </div>
  );
}
