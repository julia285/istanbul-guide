import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@istanbul-guide/db";
import { EmptyState } from "@/components/empty-state";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export default async function CafesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("cafes");

  const [cafes, districts] = await Promise.all([
    prisma.place.findMany({
      where: { status: "PUBLISHED", category: { slug: "cafes" } },
      orderBy: { publishedAt: "desc" },
      take: 48,
      include: {
        translations: { where: { locale } },
        district: { include: { translations: { where: { locale } } } },
        tags: { include: { tag: { include: { translations: { where: { locale } } } } } },
      },
    }),
    prisma.district.findMany({
      where: { places: { some: { status: "PUBLISHED", category: { slug: "cafes" } } } },
      include: { translations: { where: { locale } } },
      orderBy: { slug: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <h1 className="font-display text-3xl font-semibold text-(--color-teal-900)">{t("title")}</h1>
      <p className="mt-2 text-(--color-ink)/60">{t("subtitle")}</p>

      {districts.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {districts.map((district) => (
            <Link
              key={district.id}
              href={`/cafes/${district.slug}`}
              className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-(--color-ink)/60 transition hover:bg-(--color-teal-50)"
            >
              {district.translations[0]?.name ?? district.slug}
            </Link>
          ))}
        </div>
      )}

      {cafes.length === 0 ? (
        <EmptyState title={t("empty")} detail={t("emptyDetail")} />
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {cafes.map((place) => {
            const translation = place.translations[0];
            const card = (
              <>
                <h2 className="font-display text-lg font-semibold text-(--color-teal-900)">
                  {translation?.name ?? place.id}
                </h2>
                {translation?.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-(--color-ink)/60">
                    {translation.description}
                  </p>
                )}
                {place.addressText && (
                  <p className="mt-3 text-sm text-(--color-ink)/50">{place.addressText}</p>
                )}
                {place.district?.translations[0] && (
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-(--color-terracotta-500)">
                    {place.district.translations[0].name}
                  </p>
                )}
              </>
            );
            return (
              <li
                key={place.id}
                className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                {translation?.slug ? <Link href={`/cafes/${translation.slug}`}>{card}</Link> : card}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
