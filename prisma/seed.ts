/**
 * DrawLink — seed данных.
 *
 * Запуск:
 *   npm run db:seed
 *
 * Идемпотентно — можно запускать многократно, использует upsert по уникальным ключам.
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const db = new PrismaClient({ adapter });

// ============= CITIES (СНГ — топ-30) =============
const cities: Array<{ name: string; region: string }> = [
  // Россия
  { name: "Москва", region: "Россия" },
  { name: "Санкт-Петербург", region: "Россия" },
  { name: "Новосибирск", region: "Россия" },
  { name: "Екатеринбург", region: "Россия" },
  { name: "Казань", region: "Россия" },
  { name: "Нижний Новгород", region: "Россия" },
  { name: "Челябинск", region: "Россия" },
  { name: "Самара", region: "Россия" },
  { name: "Уфа", region: "Россия" },
  { name: "Ростов-на-Дону", region: "Россия" },
  { name: "Краснодар", region: "Россия" },
  { name: "Омск", region: "Россия" },
  { name: "Воронеж", region: "Россия" },
  { name: "Пермь", region: "Россия" },
  { name: "Волгоград", region: "Россия" },
  { name: "Саратов", region: "Россия" },
  { name: "Тюмень", region: "Россия" },
  { name: "Томск", region: "Россия" },
  { name: "Иркутск", region: "Россия" },
  { name: "Калининград", region: "Россия" },
  { name: "Красноярск", region: "Россия" },
  { name: "Барнаул", region: "Россия" },
  { name: "Новокузнецк", region: "Россия" },
  { name: "Кемерово", region: "Россия" },
  { name: "Хабаровск", region: "Россия" },
  { name: "Владивосток", region: "Россия" },
  { name: "Махачкала", region: "Россия" },
  { name: "Ставрополь", region: "Россия" },
  { name: "Сочи", region: "Россия" },
  { name: "Новороссийск", region: "Россия" },
  { name: "Симферополь", region: "Россия" },
  { name: "Севастополь", region: "Россия" },
  { name: "Ялта", region: "Россия" },
  { name: "Керчь", region: "Россия" },
  { name: "Тула", region: "Россия" },
  { name: "Рязань", region: "Россия" },
  { name: "Липецк", region: "Россия" },
  { name: "Киров", region: "Россия" },
  { name: "Ярославль", region: "Россия" },
  { name: "Иваново", region: "Россия" },
  { name: "Архангельск", region: "Россия" },
  { name: "Мурманск", region: "Россия" },
  { name: "Чебоксары", region: "Россия" },
  { name: "Ижевск", region: "Россия" },
  { name: "Оренбург", region: "Россия" },
  { name: "Пенза", region: "Россия" },
  { name: "Ульяновск", region: "Россия" },
  { name: "Тольятти", region: "Россия" },
  { name: "Брянск", region: "Россия" },
  { name: "Курск", region: "Россия" },
  { name: "Орёл", region: "Россия" },
  { name: "Белгород", region: "Россия" },
  { name: "Тамбов", region: "Россия" },
  { name: "Калуга", region: "Россия" },
  { name: "Тверь", region: "Россия" },
  { name: "Смоленск", region: "Россия" },
  { name: "Псков", region: "Россия" },
  { name: "Великий Новгород", region: "Россия" },
  { name: "Вологда", region: "Россия" },
  { name: "Кострома", region: "Россия" },
  { name: "Владимир", region: "Россия" },
  { name: "Сыктывкар", region: "Россия" },
  { name: "Петрозаводск", region: "Россия" },
  { name: "Магнитогорск", region: "Россия" },
  { name: "Нижний Тагил", region: "Россия" },
  { name: "Сургут", region: "Россия" },
  { name: "Нижневартовск", region: "Россия" },
  { name: "Якутск", region: "Россия" },
  { name: "Улан-Удэ", region: "Россия" },
  { name: "Чита", region: "Россия" },
  { name: "Грозный", region: "Россия" },
  { name: "Нальчик", region: "Россия" },
  { name: "Владикавказ", region: "Россия" },
  { name: "Майкоп", region: "Россия" },
  { name: "Саранск", region: "Россия" },
  { name: "Йошкар-Ола", region: "Россия" },
  // Беларусь
  { name: "Минск", region: "Беларусь" },
  { name: "Гомель", region: "Беларусь" },
  { name: "Брест", region: "Беларусь" },
  { name: "Витебск", region: "Беларусь" },
  { name: "Гродно", region: "Беларусь" },
  { name: "Могилёв", region: "Беларусь" },
  { name: "Барановичи", region: "Беларусь" },
  { name: "Бобруйск", region: "Беларусь" },
  { name: "Борисов", region: "Беларусь" },
  { name: "Пинск", region: "Беларусь" },
  { name: "Орша", region: "Беларусь" },
  { name: "Мозырь", region: "Беларусь" },
  { name: "Солигорск", region: "Беларусь" },
  { name: "Лида", region: "Беларусь" },
  { name: "Молодечно", region: "Беларусь" },
  { name: "Полоцк", region: "Беларусь" },
  { name: "Новополоцк", region: "Беларусь" },
  // Казахстан
  { name: "Астана", region: "Казахстан" },
  { name: "Алматы", region: "Казахстан" },
  { name: "Шымкент", region: "Казахстан" },
  { name: "Караганда", region: "Казахстан" },
  { name: "Тараз", region: "Казахстан" },
  { name: "Павлодар", region: "Казахстан" },
  { name: "Усть-Каменогорск", region: "Казахстан" },
  { name: "Семей", region: "Казахстан" },
  { name: "Костанай", region: "Казахстан" },
  { name: "Кызылорда", region: "Казахстан" },
  { name: "Атырау", region: "Казахстан" },
  { name: "Петропавловск", region: "Казахстан" },
  { name: "Актобе", region: "Казахстан" },
  { name: "Уральск", region: "Казахстан" },
  { name: "Туркестан", region: "Казахстан" },
  { name: "Кокшетау", region: "Казахстан" },
  { name: "Талдыкорган", region: "Казахстан" },
  { name: "Актау", region: "Казахстан" },
  { name: "Темиртау", region: "Казахстан" },
];

// ============= CATEGORIES =============
type CategoryTree = {
  name: string;
  slug: string;
  sortOrder: number;
  children?: Array<{ name: string; slug: string; sortOrder: number }>;
};

const categories: CategoryTree[] = [
  {
    name: "Чертежи",
    slug: "drawings",
    sortOrder: 1,
    children: [
      { name: "Машиностроительные", slug: "drawings-mech", sortOrder: 1 },
      { name: "Строительные", slug: "drawings-construction", sortOrder: 2 },
      { name: "Архитектурные", slug: "drawings-arch", sortOrder: 3 },
      { name: "Прочие чертежи", slug: "drawings-other", sortOrder: 99 },
    ],
  },
  {
    name: "Эпюры",
    slug: "epyuri",
    sortOrder: 2,
    children: [
      { name: "Точка / прямая / плоскость", slug: "epyuri-points", sortOrder: 1 },
      { name: "Пересечение поверхностей", slug: "epyuri-intersections", sortOrder: 2 },
      { name: "Развёртки", slug: "epyuri-developments", sortOrder: 3 },
      { name: "Аксонометрия", slug: "epyuri-axonometry", sortOrder: 4 },
      { name: "Сечения", slug: "epyuri-sections", sortOrder: 5 },
    ],
  },
  {
    name: "Электросхемы",
    slug: "electrical",
    sortOrder: 3,
    children: [
      { name: "Принципиальные (Э3)", slug: "electrical-e3", sortOrder: 1 },
      { name: "Структурные (Э1)", slug: "electrical-e1", sortOrder: 2 },
      { name: "Функциональные (Э2)", slug: "electrical-e2", sortOrder: 3 },
      { name: "Монтажные (Э4)", slug: "electrical-e4", sortOrder: 4 },
      { name: "Печатные платы (PCB)", slug: "electrical-pcb", sortOrder: 5 },
    ],
  },
  {
    name: "Схемы",
    slug: "schemes",
    sortOrder: 4,
    children: [
      { name: "Гидравлические", slug: "schemes-hydraulic", sortOrder: 1 },
      { name: "Пневматические", slug: "schemes-pneumatic", sortOrder: 2 },
      { name: "Кинематические", slug: "schemes-kinematic", sortOrder: 3 },
    ],
  },
  {
    name: "3D-модели",
    slug: "models3d",
    sortOrder: 5,
    children: [
      { name: "КОМПАС 3D", slug: "models3d-kompas", sortOrder: 1 },
      { name: "SolidWorks", slug: "models3d-solidworks", sortOrder: 2 },
      { name: "Inventor", slug: "models3d-inventor", sortOrder: 3 },
    ],
  },
  {
    name: "Прочее",
    slug: "other",
    sortOrder: 99,
  },
];

async function main() {
  console.log("🌱 Seeding cities…");
  for (const city of cities) {
    await db.city.upsert({
      where: { name: city.name },
      update: { region: city.region },
      create: city,
    });
  }
  console.log(`✓ ${cities.length} cities`);

  console.log("🌱 Seeding categories…");
  let categoriesCount = 0;
  for (const root of categories) {
    const rootRow = await db.category.upsert({
      where: { slug: root.slug },
      update: { name: root.name, sortOrder: root.sortOrder },
      create: { name: root.name, slug: root.slug, sortOrder: root.sortOrder },
    });
    categoriesCount++;
    for (const child of root.children ?? []) {
      await db.category.upsert({
        where: { slug: child.slug },
        update: { name: child.name, sortOrder: child.sortOrder, parentId: rootRow.id },
        create: {
          name: child.name,
          slug: child.slug,
          sortOrder: child.sortOrder,
          parentId: rootRow.id,
        },
      });
      categoriesCount++;
    }
  }
  console.log(`✓ ${categoriesCount} categories (с подразделами)`);

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
