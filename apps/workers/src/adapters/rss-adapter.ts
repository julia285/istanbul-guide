import Parser from "rss-parser";
import { z } from "zod";
import { normalizedRecordSchema, type NormalizedRecord } from "@istanbul-guide/shared";
import type { SourceAdapter } from "./types.js";

// Generic adapter for any source that publishes an RSS/Atom feed —
// the "API/partnership-first" path from the sourcing strategy. Reused
// across every RSS-based source; only `scrapeConfig.feedUrl` changes.
export const rssSourceConfigSchema = z.object({
  feedUrl: z.string().url(),
});

export type RssSourceConfig = z.infer<typeof rssSourceConfigSchema>;

export class RssAdapter implements SourceAdapter {
  private readonly parser = new Parser();

  constructor(private readonly config: RssSourceConfig) {}

  async collect(): Promise<NormalizedRecord[]> {
    const feed = await this.parser.parseURL(this.config.feedUrl);

    const records = (feed.items ?? []).flatMap((item) => {
      const sourceExternalId = item.guid ?? item.link ?? item.title;
      if (!sourceExternalId || !item.link || !item.title) {
        return [];
      }

      const candidate: NormalizedRecord = {
        sourceExternalId,
        sourceUrl: item.link,
        name: item.title,
        description: item.contentSnippet ?? item.content ?? undefined,
        startAt: item.isoDate ?? undefined,
        images: item.enclosure?.url ? [item.enclosure.url] : [],
      };

      const parsed = normalizedRecordSchema.safeParse(candidate);
      return parsed.success ? [parsed.data] : [];
    });

    return records;
  }
}
