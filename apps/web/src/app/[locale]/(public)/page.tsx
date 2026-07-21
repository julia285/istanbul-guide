import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const s = await getTranslations("sections");

  const comingSoon = [
    s("nightlife"),
    s("museums"),
    s("hiddenGems"),
    s("neighborhoodGuides"),
    s("dayTrips"),
  ];

  return (
    <div>
      <section className="relative overflow-hidden bg-(--color-teal-900) text-(--color-sand-50)">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, var(--color-terracotta-500) 0%, transparent 40%), radial-gradient(circle at 85% 75%, var(--color-teal-600) 0%, transparent 45%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-5 py-24 sm:py-32">
          <p className="font-medium tracking-wide text-(--color-terracotta-500) uppercase text-sm">
            {t("eyebrow")}
          </p>
          <h1 className="font-display mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-(--color-sand-100)/80">
            {t("heroSubtitle")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/events"
              className="rounded-full bg-(--color-terracotta-500) px-6 py-3 text-sm font-semibold text-white transition hover:bg-(--color-terracotta-600)"
            >
              {t("exploreEvents")}
            </Link>
            <Link
              href="/restaurants"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {t("exploreRestaurants")}
            </Link>
            <Link
              href="/cafes"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {t("exploreCafes")}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="font-display text-2xl font-semibold text-(--color-teal-900)">
          {t("sectionsTitle")}
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {comingSoon.map((label) => (
            <div
              key={label}
              className="rounded-xl border border-dashed border-black/10 bg-white/50 px-4 py-5 text-center"
            >
              <span className="text-sm font-medium text-(--color-ink)/50">{label}</span>
              <span className="mt-1 block text-xs text-(--color-ink)/30">{t("comingSoon")}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
