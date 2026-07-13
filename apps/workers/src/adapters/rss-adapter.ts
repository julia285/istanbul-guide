import Parser from "rss-parser";
import { z } from "zod";
import { normalizedRecordSchema, type NormalizedRecord } from "@istanbul-guide/shared";
import type { SourceAdapter, RawEventCandidate, HealthCheckResult } from "./types.js";

// Generic adapter for any source that publishes an RSS/Atom feed —
// the "API/partnership-first" path from the sourcing strategy. Reused
// across every RSS-based source; only `scrapeConfig.feedUrl` changes.
export const rssSourceConfigSchema = z.object({
  feedUrl: z.string().url(),
  sourceName: z.string().optional(),
});

export type RssSourceConfig = z.infer<typeof rssSourceConfigSchema>;

export class RssAdapter implements SourceAdapter {
  private readonly parser = new Parser();

  constructor(private readonly config: RssSourceConfig) {}

  getSourceName(): string {
    return this.config.sourceName ?? new URL(this.config.feedUrl).hostname;
  }

  async discoverEventUrls(): Promise<string[]> {
    const feed = await this.parser.parseURL(this.config.feedUrl);
    return (feed.items ?? []).flatMap((item) => (item.link ? [item.link] : []));
  }

  // Feed items already carry everything we need — "the list" and "the
  // details" are the same fetch for RSS, unlike a site that needs a
  // separate page load per event.
  async fetchEventList(): Promise<RawEventCandidate[]> {
    const feed = await this.parser.parseURL(this.config.feedUrl);
    return (feed.items ?? []).flatMap((item) =>
      item.link ? [{ url: item.link, json: item }] : [],
    );
  }

  async fetchEventDetails(candidate: RawEventCandidate): Promise<RawEventCandidate> {
    return candidate;
  }

  normalizeEvent(raw: RawEventCandidate): NormalizedRecord | null {
    const item = raw.json as Parser.Item | undefined;
    if (!item) return null;

    const sourceExternalId = item.guid ?? item.link ?? item.title;
    if (!sourceExternalId || !item.link || !item.title) {
      return null;
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
    return parsed.success ? parsed.data : null;
  }

  validateEvent(record: NormalizedRecord): boolean {
    return normalizedRecordSchema.safeParse(record).success;
  }

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      const feed = await this.parser.parseURL(this.config.feedUrl);
      return { ok: true, detail: `${feed.items?.length ?? 0} items` };
    } catch (error) {
      return { ok: false, detail: error instanceof Error ? error.message : String(error) };
    }
  }

  // Same output as before this interface existed — composed from the
  // granular methods above rather than re-implemented, but the actual
  // logic (which items get skipped, what fields get set) is unchanged.
  async collect(): Promise<NormalizedRecord[]> {
    const candidates = await this.fetchEventList();
    return candidates.flatMap((candidate) => {
      const record = this.normalizeEvent(candidate);
      return record && this.validateEvent(record) ? [record] : [];
    });
  }
}
