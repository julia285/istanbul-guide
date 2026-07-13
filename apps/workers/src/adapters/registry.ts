import type { Source } from "@istanbul-guide/db";
import type { SourceAdapter } from "./types.js";
import { RssAdapter, rssSourceConfigSchema } from "./rss-adapter.js";
import { BugeceAdapter, bugeceSourceConfigSchema } from "./bugece-adapter.js";

// SCRAPE sources are bespoke per-site (unlike RSS/API, which share one
// generic adapter class keyed by config) — keyed by Source.slug so adding
// a new scraped source is "add a factory entry + write the adapter class",
// no changes needed to the scheduler or AI pipeline.
const SCRAPE_ADAPTERS: Record<string, (scrapeConfig: unknown) => SourceAdapter> = {
  bugece: (scrapeConfig) => new BugeceAdapter(bugeceSourceConfigSchema.parse(scrapeConfig ?? {})),
};

export function buildAdapter(source: Source): SourceAdapter {
  switch (source.type) {
    case "RSS":
      return new RssAdapter(rssSourceConfigSchema.parse(source.scrapeConfig));
    case "SCRAPE": {
      const factory = SCRAPE_ADAPTERS[source.slug];
      if (!factory) {
        throw new Error(
          `No SCRAPE adapter implemented for source slug "${source.slug}" — add one to SCRAPE_ADAPTERS in registry.ts`,
        );
      }
      return factory(source.scrapeConfig);
    }
    case "API":
      throw new Error(`No adapter implemented yet for source type "API" (source: ${source.slug})`);
    default:
      throw new Error(`Unknown source type "${source.type as string}" (source: ${source.slug})`);
  }
}
