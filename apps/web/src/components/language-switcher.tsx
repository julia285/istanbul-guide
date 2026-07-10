"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const currentLocale = useLocale();

  return (
    <div className="flex items-center gap-1 text-sm font-medium">
      {routing.locales.map((locale, index) => (
        <span key={locale} className="flex items-center gap-1">
          {index > 0 && <span className="text-(--color-ink)/20">/</span>}
          <Link
            href={pathname}
            locale={locale}
            className={
              locale === currentLocale
                ? "text-(--color-teal-900)"
                : "text-(--color-ink)/40 transition hover:text-(--color-ink)/70"
            }
          >
            {locale.toUpperCase()}
          </Link>
        </span>
      ))}
    </div>
  );
}
