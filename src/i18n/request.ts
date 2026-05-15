import { getRequestConfig } from "next-intl/server";

export const defaultLocale = "ru" as const;
export const locales = ["ru"] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
  const locale: Locale = defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
