import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@istanbul-guide/db";
import { EmptyState } from "@/components/empty-state";
import { Link } from "@/i18n/navigation";

// Published events change whenever the AI pipeline publishes/updates one;
// on-demand revalidation (revalidatePath, called by the Quality Agent at
// publish time) supersedes a time-based window here — see architecture
// doc section 10 (SEO Strategy).
export const dynamic = "force-dynamic";

export default async function EventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  const { category: selectedCategory } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("events");

  const [events, categories] = await Promise.all([
    prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        ...(selectedCategory ? { category: { slug: selectedCategory } } : {}),
      },
      orderBy: { startAt: "asc" },
      take: 24,
      include: {
        translations: { where: { locale } },
        district: { include: { translations: { where: { locale } } } },
      },
    }),
    prisma.category.findMany({
      include: { translations: { where: { locale } } },
      orderBy: { slug: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <h1 className="font-display text-3xl font-semibold text-(--color-teal-900)">{t("title")}</h1>
      <p className="mt-2 text-(--color-ink)/60">{t("subtitle")}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/events"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            !selectedCategory
              ? "bg-(--color-teal-900) text-white"
              : "bg-white text-(--color-ink)/60 hover:bg-(--color-teal-50)"
          }`}
        >
          {t("allCategories")}
        </Link>
        {categories.map((category) => {
          const label = category.translations[0]?.name ?? category.slug;
          const isActive = selectedCategory === category.slug;
          return (
            <Link
              key={category.id}
              href={`/events/${category.slug}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "bg-(--color-teal-900) text-white"
                  : "bg-white text-(--color-ink)/60 hover:bg-(--color-teal-50)"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {events.length === 0 ? (
        <EmptyState title={t("empty")} detail={t("emptyDetail")} />
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {events.map((event) => {
            const translation = event.translations[0];
            const card = (
              <>
                <h2 className="font-display text-lg font-semibold text-(--color-teal-900)">
                  {translation?.name ?? event.id}
                </h2>
                {translation?.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-(--color-ink)/60">
                    {translation.description}
                  </p>
                )}
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-(--color-terracotta-500)">
                  {new Date(event.startAt).toLocaleDateString(locale, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                  {event.district?.translations[0] ? ` · ${event.district.translations[0].name}` : ""}
                </p>
              </>
            );
            return (
              <li
                key={event.id}
                className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                {translation?.slug ? (
                  <Link href={`/events/${translation.slug}`}>{card}</Link>
                ) : (
                  card
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
