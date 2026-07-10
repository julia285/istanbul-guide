// Adding a language later = extending this list, not a schema migration
// (see packages/db/prisma/schema.prisma header notes on `locale` being a string column).
export const LOCALES = ["en", "tr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
