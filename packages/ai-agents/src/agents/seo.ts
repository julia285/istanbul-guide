import { slugify, type Locale } from "@istanbul-guide/shared";
import type { CleanedFacts } from "../schemas/cleaned-facts.js";
import type { Categorization } from "../schemas/category.js";
import { seoCopySchema, type SeoBundle } from "../schemas/seo.js";
import { generateStructured, CLAUDE_MODELS } from "../providers/claude.js";

const SYSTEM_PROMPT = `You write SEO metadata (meta title, meta description, keywords) for an Istanbul events website, in English and Turkish. Meta titles must stay under 60 characters, meta descriptions under 160 characters. Keywords should be realistic search terms a tourist, expat, or local might type — not the same words repeated.`;

interface SeoInput {
  copy: { en: { name: string; description: string }; tr: { name: string; description: string } };
  facts: CleanedFacts;
  categorization: Categorization;
  siteBaseUrl: string;
}

function buildEventJsonLd(input: SeoInput, locale: Locale): Record<string, unknown> {
  const name = input.copy[locale].name;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name,
    description: input.copy[locale].description,
    startDate: input.facts.startAt,
    endDate: input.facts.endAt,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: input.facts.addressText
      ? {
          "@type": "Place",
          name: input.facts.venueName ?? name,
          address: input.facts.addressText,
        }
      : undefined,
    offers: input.facts.isFree
      ? { "@type": "Offer", price: "0", priceCurrency: "TRY" }
      : input.facts.priceAmount
        ? {
            "@type": "Offer",
            price: input.facts.priceAmount,
            priceCurrency: input.facts.priceCurrency ?? "TRY",
          }
        : undefined,
  };
}

export async function generateSeo(
  input: SeoInput,
): Promise<{ en: SeoBundle; tr: SeoBundle }> {
  const seoCopy = await generateStructured({
    model: CLAUDE_MODELS.sonnet,
    system: SYSTEM_PROMPT,
    prompt: `Write SEO metadata for this event.

English name: ${input.copy.en.name}
English description: ${input.copy.en.description}
Turkish name: ${input.copy.tr.name}
Turkish description: ${input.copy.tr.description}
Category: ${input.categorization.categorySlug}
District: ${input.categorization.districtSlug ?? "unknown"}`,
    schema: seoCopySchema,
    toolName: "record_seo_copy",
    toolDescription: "Record the English and Turkish SEO metadata.",
    maxTokens: 1024,
  });

  const bundleFor = (locale: Locale): SeoBundle => {
    const slug = slugify(input.copy[locale].name);
    return {
      metaTitle: seoCopy[locale].metaTitle,
      metaDescription: seoCopy[locale].metaDescription,
      keywords: seoCopy[locale].keywords,
      slug,
      canonicalUrl: `${input.siteBaseUrl}/${locale}/events/${slug}`,
      ogTitle: seoCopy[locale].metaTitle,
      ogDescription: seoCopy[locale].metaDescription,
      schemaJsonLd: buildEventJsonLd(input, locale),
    };
  };

  return { en: bundleFor("en"), tr: bundleFor("tr") };
}
