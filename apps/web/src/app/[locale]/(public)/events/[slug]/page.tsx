import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@istanbul-guide/db";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

async function getEvent(locale: string, slug: string) {
  const translation = await prisma.eventTranslation.findUnique({
    where: { locale_slug: { locale, slug } },
    include: {
      event: {
        include: {
          category: { include: { translations: { where: { locale } } } },
          district: { include: { translations: { where: { locale } } } },
          tags: { include: { tag: { include: { translations: { where: { locale } } } } } },
        },
      },
    },
  });

  if (!translation) return null;
  // Draft/review/rejected items aren't meant to be publicly reachable —
  // only published (visible now) or expired (kept up, noindexed) are.
  if (translation.event.status !== "PUBLISHED" && translation.event.status !== "EXPIRED") {
    return null;
  }
  return translation;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const translation = await getEvent(locale, slug);
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
    robots: translation.event.status === "EXPIRED" ? { index: false, follow: true } : undefined,
  };
}

function formatPrice(price: unknown, locale: string): string | null {
  if (!price || typeof price !== "object") return null;
  const p = price as { isFree?: boolean; amount?: number; currency?: string };
  if (p.isFree) return locale === "tr" ? "Ücretsiz" : "Free";
  if (typeof p.amount === "number") {
    return new Intl.NumberFormat(locale, { style: "currency", currency: p.currency ?? "TRY" }).format(
      p.amount,
    );
  }
  return null;
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const translation = await getEvent(locale, slug);
  if (!translation) notFound();

  const { event } = translation;
  const t = await getTranslations("events");
  const price = formatPrice(event.price, locale);
  const isExpired = event.status === "EXPIRED";

  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      {translation.schemaJsonLd ? (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(translation.schemaJsonLd) }}
        />
      ) : null}

      <Link href="/events" className="text-sm font-medium text-(--color-teal-700) hover:underline">
        ← {t("title")}
      </Link>

      {isExpired && (
        <p className="mt-4 inline-block rounded-full bg-(--color-terracotta-100) px-3 py-1 text-xs font-medium text-(--color-terracotta-600)">
          {locale === "tr" ? "Bu etkinlik sona erdi" : "This event has already happened"}
        </p>
      )}

      <h1 className="font-display mt-4 text-3xl font-semibold text-(--color-teal-900) sm:text-4xl">
        {translation.name}
      </h1>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium uppercase tracking-wide text-(--color-terracotta-500)">
        <span>
          {new Date(event.startAt).toLocaleDateString(locale, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        {event.district?.translations[0] && <span>· {event.district.translations[0].name}</span>}
        {price && <span>· {price}</span>}
      </div>

      <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-(--color-ink)/80">
        {translation.description}
      </p>

      {event.sourceUrl && !isExpired && (
        <a
          href={event.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-(--color-terracotta-500) px-6 py-3 text-sm font-semibold text-white transition hover:bg-(--color-terracotta-600)"
        >
          {locale === "tr" ? "Bilet ve Detaylar" : "Get Tickets & Details"}
          <span aria-hidden>↗</span>
        </a>
      )}
      {event.sourceUrl && (
        <p className="mt-2 text-xs text-(--color-ink)/40">
          {locale === "tr"
            ? "Orijinal kaynağa yönlendirileceksiniz."
            : "You'll be taken to the original source."}
        </p>
      )}

      {event.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {event.tags.map(({ tag }) => (
            <span
              key={tag.id}
              className="rounded-full bg-(--color-teal-50) px-3 py-1 text-xs font-medium text-(--color-teal-700)"
            >
              {tag.translations[0]?.name ?? tag.slug}
            </span>
          ))}
        </div>
      )}

      {event.category.translations[0] && (
        <p className="mt-8 text-sm text-(--color-ink)/50">
          {event.category.translations[0].name}
        </p>
      )}
    </div>
  );
}
