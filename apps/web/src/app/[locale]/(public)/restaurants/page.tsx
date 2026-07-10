import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@istanbul-guide/db";
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";

export default async function RestaurantsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("restaurants");

  const restaurants = await prisma.place.findMany({
    where: { status: "PUBLISHED", category: { slug: "restaurants" } },
    orderBy: { publishedAt: "desc" },
    take: 24,
    include: {
      translations: { where: { locale } },
      district: { include: { translations: { where: { locale } } } },
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <h1 className="font-display text-3xl font-semibold text-(--color-teal-900)">{t("title")}</h1>
      <p className="mt-2 text-(--color-ink)/60">{t("subtitle")}</p>

      {restaurants.length === 0 ? (
        <EmptyState title={t("empty")} detail={t("emptyDetail")} />
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {restaurants.map((place) => {
            const translation = place.translations[0];
            return (
              <li
                key={place.id}
                className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <h2 className="font-display text-lg font-semibold text-(--color-teal-900)">
                  {translation?.name ?? place.id}
                </h2>
                {translation?.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-(--color-ink)/60">
                    {translation.description}
                  </p>
                )}
                {place.district?.translations[0] && (
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-(--color-terracotta-500)">
                    {place.district.translations[0].name}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
