import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@istanbul-guide/db";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

const CUISINE_TAG_SLUGS = ["turkish-cuisine", "italian-cuisine", "japanese-cuisine", "seafood"];

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
  if (translation.place.status !== "PUBLISHED") return null;
  return translation;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const translation = await getPlace(locale, slug);
  if (!translation) return {};

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

function priceTierLabel(tier: string | null, t: (key: string) => string): string | null {
  if (tier === "MODERATE") return t("priceModerate");
  if (tier === "EXPENSIVE") return t("priceExpensive");
  return null;
}

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const translation = await getPlace(locale, slug);
  if (!translation) notFound();

  const { place } = translation;
  const t = await getTranslations("restaurants");
  const cuisineTags = place.tags.filter(({ tag }) => CUISINE_TAG_SLUGS.includes(tag.slug));
  const otherTags = place.tags.filter(({ tag }) => !CUISINE_TAG_SLUGS.includes(tag.slug));
  const contact = place.contact as { website?: string } | null;
  const priceLabel = priceTierLabel(place.priceTier, t);

  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      {translation.schemaJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(translation.schemaJsonLd) }}
        />
      ) : null}

      <Link href="/restaurants" className="text-sm font-medium text-(--color-teal-700) hover:underline">
        ← {t("back")}
      </Link>

      <h1 className="font-display mt-4 text-3xl font-semibold text-(--color-teal-900) sm:text-4xl">
        {translation.name}
      </h1>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium uppercase tracking-wide text-(--color-terracotta-500)">
        {cuisineTags.map(({ tag }) => (
          <span key={tag.id}>{tag.translations[0]?.name ?? tag.slug}</span>
        ))}
        {place.district?.translations[0] && <span>· {place.district.translations[0].name}</span>}
        {priceLabel && <span>· {priceLabel}</span>}
      </div>

      <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-(--color-ink)/80">
        {translation.description}
      </p>

      {place.addressText && (
        <div className="mt-8">
          <p className="text-xs font-medium uppercase tracking-wide text-(--color-ink)/40">
            {t("address")}
          </p>
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

      {place.category.translations[0] && (
        <p className="mt-8 text-sm text-(--color-ink)/50">{place.category.translations[0].name}</p>
      )}
    </div>
  );
}
