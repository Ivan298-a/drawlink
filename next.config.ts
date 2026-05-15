import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  : "";

/**
 * Content Security Policy — ограничивает откуда загружаются ресурсы.
 * Защищает от XSS / inline-инъекций / клика на malicious-iframe.
 */
const csp = [
  `default-src 'self'`,
  // 'unsafe-inline' для Next.js inline-стилей в SSR + 'unsafe-eval' для турбопака в dev
  `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
  `style-src 'self' 'unsafe-inline'`,
  // Изображения: свой домен, blob: (preview из FileReader), data: (favicon), Supabase
  `img-src 'self' blob: data: https://*.supabase.co${supabaseHost ? ` https://${supabaseHost}` : ""}`,
  // Fonts: next/font делает self
  `font-src 'self' data:`,
  // API/WS: Supabase realtime + Telegram API
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.telegram.org`,
  // Запрещаем iframe / Object целиком — никакого embedding
  `frame-src 'none'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  // Формы только на свой домен
  `form-action 'self'`,
  // Запретить встраивание DrawLink в чужие iframe
  `frame-ancestors 'none'`,
  // Принудительный апгрейд на HTTPS
  `upgrade-insecure-requests`,
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Принудительный HTTPS на 2 года + поддомены
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Запрет MIME-sniffing — браузер не угадывает тип файла
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Запрет встраивания в iframe (на случай если CSP не отработал)
  { key: "X-Frame-Options", value: "DENY" },
  // Минимум данных в Referrer при переходах
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Отключаем все ненужные браузерные API
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()",
  },
  // Изолируем процессы (защита от Spectre)
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  typedRoutes: false,
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Применяется ко всем маршрутам
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
