import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", weight: ["500", "600"] });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: { default: t("title"), template: `%s | ${t("title")}` },
    description: t("tagline"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "nav" });

  return (
    <html lang={locale} className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        <NextIntlClientProvider>
          <header className="sticky top-0 z-10 border-b border-black/5 bg-(--color-sand-50)/90 backdrop-blur">
            <nav className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
              <Link href="/" className="flex items-baseline gap-2">
                <span className="font-display text-xl font-semibold tracking-tight text-(--color-teal-900)">
                  Istanbul
                </span>
                <span className="font-display text-xl font-semibold tracking-tight text-(--color-terracotta-500)">
                  Guide
                </span>
              </Link>
              <div className="flex items-center gap-6">
                <Link
                  href="/events"
                  className="text-sm font-medium text-(--color-ink)/70 transition hover:text-(--color-teal-900)"
                >
                  {t("events")}
                </Link>
                <Link
                  href="/restaurants"
                  className="text-sm font-medium text-(--color-ink)/70 transition hover:text-(--color-teal-900)"
                >
                  {t("restaurants")}
                </Link>
                <LanguageSwitcher />
              </div>
            </nav>
          </header>
          <main>{children}</main>
          <footer className="mt-24 border-t border-black/5 py-10 text-center text-sm text-(--color-ink)/50">
            Istanbul Guide — {new Date().getFullYear()}
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
