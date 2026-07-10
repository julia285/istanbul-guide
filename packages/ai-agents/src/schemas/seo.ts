import { z } from "zod";

const localeSeoCopySchema = z.object({
  metaTitle: z.string().max(60),
  metaDescription: z.string().max(160),
  keywords: z.array(z.string()).min(3).max(10),
});

export const seoCopySchema = z.object({
  en: localeSeoCopySchema,
  tr: localeSeoCopySchema,
});

export type SeoCopy = z.infer<typeof seoCopySchema>;

// The rest of the SEO bundle (slug, canonical URL, OpenGraph, Schema.org
// JSON-LD) is generated deterministically in agents/seo.ts, not by the LLM —
// that structure is mechanical and an LLM is more likely to get it subtly
// wrong (bad date formats, invalid JSON-LD) than a plain function is.
export interface SeoBundle {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  slug: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  schemaJsonLd: Record<string, unknown>;
}
