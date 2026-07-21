import type { MetadataRoute } from "next";
import { prisma } from "@istanbul-guide/db";
import { LOCALES } from "@istanbul-guide/shared";

const SITE_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://istanbul-guide-delta.vercel.app";

function urlFor(path: string, locale: string): string {
  return `${SITE_BASE_URL}/${locale}${path}`;
}

// Every static, category/district archive, and individual content URL, for
// both locales — the taxonomy-as-filter pages (events/[category],
// restaurants/[district|cuisine]) are exactly the long-tail programmatic
// SEO surface described in the architecture doc; a static list here keeps
// this in sync with the fallback routes without a second source of truth.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, places, articles, categories, districts, cuisineTags] = await Promise.all([
    prisma.event.findMany({
      where: { status: { in: ["PUBLISHED", "EXPIRED"] } },
      select: { updatedAt: true, translations: { select: { locale: true, slug: true } } },
    }),
    prisma.place.findMany({
      where: { status: "PUBLISHED" },
      select: { updatedAt: true, translations: { select: { locale: true, slug: true } } },
    }),
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      select: { updatedAt: true, translations: { select: { locale: true, slug: true } } },
    }),
    // Category is shared between Event and Place ("restaurants"/"cafes" are
    // categories too, just never used on an Event) — restrict to
    // categories that actually have events, or /events/restaurants and
    // /events/cafes end up in the sitemap as permanently-empty pages.
    prisma.category.findMany({ where: { events: { some: {} } }, select: { slug: true } }),
    prisma.district.findMany({ select: { slug: true } }),
    prisma.tag.findMany({
      where: { slug: { in: ["turkish-cuisine", "italian-cuisine", "japanese-cuisine", "seafood"] } },
      select: { slug: true },
    }),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    entries.push(
      { url: urlFor("", locale), changeFrequency: "daily", priority: 1 },
      { url: urlFor("/events", locale), changeFrequency: "hourly", priority: 0.9 },
      { url: urlFor("/restaurants", locale), changeFrequency: "daily", priority: 0.9 },
      { url: urlFor("/collections", locale), changeFrequency: "weekly", priority: 0.6 },
    );

    for (const category of categories) {
      entries.push({ url: urlFor(`/events/${category.slug}`, locale), changeFrequency: "hourly", priority: 0.7 });
    }
    for (const district of districts) {
      entries.push(
        { url: urlFor(`/events/${district.slug}`, locale), changeFrequency: "daily", priority: 0.6 },
        { url: urlFor(`/restaurants/${district.slug}`, locale), changeFrequency: "weekly", priority: 0.6 },
      );
    }
    for (const tag of cuisineTags) {
      entries.push({ url: urlFor(`/restaurants/${tag.slug}`, locale), changeFrequency: "weekly", priority: 0.6 });
    }
  }

  for (const event of events) {
    for (const translation of event.translations) {
      entries.push({
        url: urlFor(`/events/${translation.slug}`, translation.locale),
        lastModified: event.updatedAt,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  }
  for (const place of places) {
    for (const translation of place.translations) {
      entries.push({
        url: urlFor(`/restaurants/${translation.slug}`, translation.locale),
        lastModified: place.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }
  for (const article of articles) {
    for (const translation of article.translations) {
      entries.push({
        url: urlFor(`/collections/${translation.slug}`, translation.locale),
        lastModified: article.updatedAt,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  }

  return entries;
}
