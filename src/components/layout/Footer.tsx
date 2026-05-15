import Link from "next/link";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/marketing/Logo";

export function Footer() {
  const t = useTranslations("footer");

  const columns = [
    {
      title: t("columns.platform.title"),
      links: [
        { label: t("columns.platform.links.catalog"), href: "/catalog" },
        { label: t("columns.platform.links.orders"), href: "/orders" },
        { label: t("columns.platform.links.categories"), href: "/catalog" },
        { label: t("columns.platform.links.how"), href: "/how-it-works" },
      ],
    },
    {
      title: t("columns.executors.title"),
      links: [
        { label: t("columns.executors.links.become"), href: "/become-executor" },
        { label: t("columns.executors.links.tariffs"), href: "/tariffs" },
        { label: t("columns.executors.links.rules"), href: "/rules" },
        { label: t("columns.executors.links.faq"), href: "/help" },
      ],
    },
    {
      title: t("columns.support.title"),
      links: [
        { label: t("columns.support.links.help"), href: "/help" },
        { label: t("columns.support.links.disputes"), href: "/disputes" },
        { label: t("columns.support.links.telegram"), href: "https://t.me/missssbutstillworking" },
        { label: t("columns.support.links.contact"), href: "https://t.me/missssbutstillworking" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border-subtle bg-inset">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-6 py-14 lg:grid-cols-[1fr_auto] lg:px-20">
        <div className="flex flex-col gap-4">
          <Logo size="sm" />
          <p className="text-xs text-fg-muted">{t("copyright")}</p>
          <p className="text-[11px] text-fg-muted">{t("disclaimer")}</p>
        </div>

        <div className="flex flex-wrap gap-16">
          {columns.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
                {col.title}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-fg-secondary transition-colors hover:text-fg"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
