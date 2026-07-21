import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@istanbul-guide/db";
import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";

const SITE_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://istanbul-guide-delta.vercel.app";

async function getPlace(locale: string, slug: string) {
  const translation = await prisma.placeTranslation.findUnique({
    where: { locale_slug: { locale, slug } },
    include: {
      place: {
        include: {
          category: { include: { translations: { where: { locale } } } },
          district: { include: { translations: { where: { locale } } } },
          tags: { include: { tag: { include: { translations: { where: { locale } } } } } },
        },
      },
    },
  });

  if (!translation) return null;
  if (translation.place.status !== "PUBLISHED" || translation.place.category.slug !== "cafes") return null;
  return translation;
}

// Programmatic SEO: a slug that isn't an individual cafe might be a
// district — /cafes/kadikoy is a real, crawlable archive page generated
// from taxonomy that already exists, same pattern as events/restaurants.
async function getDistrictArchive(locale: string, slug: string) {
  const district = await prisma.district.findUnique({
    where: { slug },
    include: { translations: { where: { locale } } },
  });
  if (!district) return null;

  const places = await prisma.place.findMany({
    where: { status: "PUBLISHED", category: { slug: "cafes" }, districtId: district.id },
    orderBy: { publishedAt: "desc" },
    take: 48,
    include: {
      translations: { where: { locale } },
      district: { include: { translations: { where: { locale } } } },
    },
  });
  return { taxonomy: district, places };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const translation = await getPlace(locale, slug);
  if (translation) {
    return {
      title: translation.metaTitle ?? translation.name,
      description: translation.metaDescription ?? undefined,
      keywords: translation.keywords,
      alternates: translation.canonicalUrl ? { canonical: translation.canonicalUrl } : undefined,
      openGraph: {
        title: translation.ogTitle ?? translation.metaTitle ?? translation.name,
        description: translation.ogDescription ?? translation.metaDescription ?? undefined,
      },
    };
  }

  const archive = await getDistrictArchive(locale, slug);
  if (!archive) return {};
  const name = archive.taxonomy.translations[0]?.name ?? slug;
  const title = locale === "tr" ? `${name}'de Kafeler` : `Cafes in ${name}, Istanbul`;
  return { title, alternates: { canonical: `${SITE_BASE_URL}/${locale}/cafes/${slug}` } };
}

const PRICE_RANGE_SYMBOLS: Record<string, string> = { BUDGET: "$", MODERATE: "$$", EXPENSIVE: "$$$" };

function buildCafeJsonLd(translation: NonNullable<Awaited<ReturnType<typeof getPlace>>>): Record<string, unknown> {
  const { place } = translation;
  const contact = place.contact as { website?: string } | null;
  return {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    name: translation.name,
    description: translation.description,
    url: translation.canonicalUrl ?? undefined,
    ...(contact?.website ? { sameAs: contact.website } : {}),
    ...(place.addressText
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: place.addressText,
            addressLocality: place.district?.translations[0]?.name,
            addressCountry: "TR",
          },
        }
      : {}),
    ...(place.priceTier && PRICE_RANGE_SYMBOLS[place.priceTier]
      ? { priceRange: PRICE_RANGE_SYMBOLS[place.priceTier] }
      : {}),
  };
}

function ArchivePage({
  locale,
  slug,
  archive,
}: {
  locale: string;
  slug: string;
  archive: NonNullable<Awaited<ReturnType<typeof getDistrictArchive>>>;
}) {
  const name = archive.taxonomy.translations[0]?.name ?? slug;
  const title = locale === "tr" ? `${name}'de Kafeler` : `Cafes in ${name}`;

  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <Link href="/cafes" className="text-sm font-medium text-(--color-teal-700) hover:underline">
        ← {locale === "tr" ? "Kafeler" : "Cafes"}
      </Link>
      <h1 className="font-display mt-4 text-3xl font-semibold text-(--color-teal-900)">{title}</h1>

      {archive.places.length === 0 ? (
        <EmptyState title={locale === "tr" ? "Henüz yayınlanan yok" : "Nothing published yet"} detail="" />
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {archive.places.map((place) => {
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

export default async function CafeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const translation = await getPlace(locale, slug);

  if (!translation) {
    const archive = await getDistrictArchive(locale, slug);
    if (archive) return <ArchivePage locale={locale} slug={slug} archive={archive} />;
    notFound();
  }

  const { place } = translation;
  const t = await getTranslations("cafes");
  const otherTags = place.tags;
  const contact = place.contact as { website?: string } | null;
  const jsonLd = translation.schemaJsonLd ?? buildCafeJsonLd(translation);

  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/cafes" className="text-sm font-medium text-(--color-teal-700) hover:underline">
        ← {t("back")}
      </Link>

      <h1 className="font-display mt-4 text-3xl font-semibold text-(--color-teal-900) sm:text-4xl">
        {translation.name}
      </h1>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium uppercase tracking-wide text-(--color-terracotta-500)">
        {place.district?.translations[0] && <span>{place.district.translations[0].name}</span>}
      </div>

      <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-(--color-ink)/80">
        {translation.description}
      </p>

      {place.addressText && (
        <div className="mt-8">
          <p className="text-xs font-medium uppercase tracking-wide text-(--color-ink)/40">{t("address")}</p>
          <p className="mt-1 text-sm text-(--color-ink)/70">{place.addressText}</p>
        </div>
      )}

      {(contact?.website || place.sourceUrl) && (
        <div className="mt-8 flex flex-wrap items-center gap-4">
          {contact?.website && (
            <a
              href={contact.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-(--color-terracotta-500) px-6 py-3 text-sm font-semibold text-white transition hover:bg-(--color-terracotta-600)"
            >
              {t("visitWebsite")}
              <span aria-hidden>↗</span>
            </a>
          )}
          {place.sourceUrl && place.sourceUrl !== contact?.website && (
            <a
              href={place.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-(--color-teal-700) hover:underline"
            >
              {t("readSource")}
            </a>
          )}
        </div>
      )}
      {(contact?.website || place.sourceUrl) && (
        <p className="mt-2 text-xs text-(--color-ink)/40">{t("sourceNote")}</p>
      )}

      {otherTags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {otherTags.map(({ tag }) => (
            <span
              key={tag.id}
              className="rounded-full bg-(--color-teal-50) px-3 py-1 text-xs font-medium text-(--color-teal-700)"
            >
              {tag.translations[0]?.name ?? tag.slug}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
