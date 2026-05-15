import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // typedRoutes отключены — пока не все маршруты заведены (/forgot-password,
  // /rules, /tariffs и т.д.). Включим когда будут все страницы.
  typedRoutes: false,
};

export default withNextIntl(nextConfig);
