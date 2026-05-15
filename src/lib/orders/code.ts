import { randomBytes } from "crypto";

/**
 * Генерирует код заказа вида ORD-2026-A7K2X9 (6 hex символов).
 * Уникальность гарантируется unique-constraint в БД — при коллизии
 * повторяем (вероятность ничтожна).
 */
export function generateOrderCode(): string {
  const year = new Date().getFullYear();
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `ORD-${year}-${suffix}`;
}

export function generateCatalogCode(): string {
  const year = new Date().getFullYear();
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `DL-${year}-${suffix}`;
}

export function generateDisputeCode(): string {
  const year = new Date().getFullYear();
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `DPT-${year}-${suffix}`;
}
