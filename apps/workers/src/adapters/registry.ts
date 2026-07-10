import type { Source } from "@istanbul-guide/db";
import type { SourceAdapter } from "./types.js";
import { RssAdapter, rssSourceConfigSchema } from "./rss-adapter.js";

// Only RSS is implemented so far. API and SCRAPE adapters get added here
// as real sources are onboarded (architecture doc section 5) — there is
// deliberately no stub/fake adapter for them yet.
export function buildAdapter(source: Source): SourceAdapter {
  switch (source.type) {
    case "RSS":
      return new RssAdapter(rssSourceConfigSchema.parse(source.scrapeConfig));
    case "API":
    case "SCRAPE":
      throw new Error(
        `No adapter implemented yet for source type "${source.type}" (source: ${source.slug})`,
      );
    default:
      throw new Error(`Unknown source type "${source.type as string}" (source: ${source.slug})`);
  }
}
