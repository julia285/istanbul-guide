import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@istanbul-guide/db";
import { EmptyState } from "@/components/empty-state";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

// Cuisine tags are a subset of Tag, distinguished only by slug suffix —
// same taxonomy-as-filter pattern as event categories, see taxonomy.ts.
const CUISINE_TAG_SLUGS = ["turkish-cuisine", "italian-cuisine", "japanese-cuisine", "seafood"];

export default async function RestaurantsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cuisine?: string }>;
}) {
  const { locale } = await params;
  const { cuisine: selectedCuisine } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("restaurants");

  const [restaurants, cuisineTags] = await Promise.all([
    prisma.place.findMany({
      where: {
        status: "PUBLISHED",
        category: { slug: "restaurants" },
        ...(selectedCuisine ? { tags: { some: { tag: { slug: selectedCuisine } } } } : {}),
      },
      orderBy: { publishedAt: "desc" },
      take: 48,
      include: {
        translations: { where: { locale } },
        district: { include: { translations: { where: { locale } } } },
        tags: { include: { tag: { include: { translations: { where: { locale } } } } } },
      },
    }),
    prisma.tag.findMany({
      where: { slug: { in: CUISINE_TAG_SLUGS } },
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
          href="/restaurants"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            !selectedCuisine
              ? "bg-(--color-teal-900) text-white"
              : "bg-white text-(--color-ink)/60 hover:bg-(--color-teal-50)"
          }`}
        >
          {t("allCuisines")}
        </Link>
        {cuisineTags.map((tag) => {
          const label = tag.translations[0]?.name ?? tag.slug;
          const isActive = selectedCuisine === tag.slug;
          return (
            <Link
              key={tag.id}
              href={`/restaurants?cuisine=${tag.slug}`}
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

      {restaurants.length === 0 ? (
        <EmptyState title={t("empty")} detail={t("emptyDetail")} />
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {restaurants.map((place) => {
            const translation = place.translations[0];
            const cuisineTag = place.tags.find(({ tag }) => CUISINE_TAG_SLUGS.includes(tag.slug));
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
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-(--color-terracotta-500)">
                  {cuisineTag ? `${cuisineTag.tag.translations[0]?.name ?? cuisineTag.tag.slug} · ` : ""}
                  {place.district?.translations[0]?.name}
                </p>
              </>
            );
            return (
              <li
                key={place.id}
                className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                {translation?.slug ? <Link href={`/restaurants/${translation.slug}`}>{card}</Link> : card}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
