import { z } from "zod";
import { HtmlJsonLdAdapter } from "./html-json-ld-adapter.js";

// BUGECE (bugece.co) — Phase 1 source #1. Chosen first because it's the
// only Phase-1 candidate that's unambiguously safe: permissive robots.txt
// (only /_next/, /api/, checkout, and profile paths disallowed — event
// pages are wide open), a real sitemap, and confirmed schema.org
// structured data on every event page, with no anti-scraping clause in
// its terms. See the Phase 1 feasibility research for the other 4 sources.
export const bugeceSourceConfigSchema = z.object({
  // Which city browse page(s) to discover events from. Defaults to
  // Istanbul only — this is an Istanbul events platform, and BUGECE also
  // lists Izmir/Ankara/Cesme/Bodrum events under the same domain.
  listingUrls: z.array(z.string().url()).default(["https://bugece.co/en/browse/istanbul/events"]),
});

export type BugeceSourceConfig = z.infer<typeof bugeceSourceConfigSchema>;

// Event detail pages carry a standard <script type="application/ld+json">
// tag, so extraction uses HtmlJsonLdAdapter's default (cheerio-based)
// implementation — no override needed there.
//
// Discovery is the one bespoke piece: the Istanbul browse/listing page has
// no JSON-LD or plain <a href> links to event pages (Next.js App Router
// client component, hydrated after load). Event slugs ARE present
// server-rendered, though — embedded as escaped strings inside a React
// Server Components hydration payload (`self.__next_f.push([...])`).
// Pulling them out with a regex is more fragile than reading real markup,
// but reliable in practice: verified against ~25 real Istanbul events with
// zero misses across repeated runs.
const SLUG_PATTERN = /\\"slug\\":\\"([a-z0-9-]+--[0-9a-f]{6,})\\"/g;

export class BugeceAdapter extends HtmlJsonLdAdapter {
  protected readonly sourceName = "BUGECE";

  constructor(private readonly config: BugeceSourceConfig) {
    super();
  }

  async discoverEventUrls(): Promise<string[]> {
    const slugs = new Set<string>();
    for (const listingUrl of this.config.listingUrls) {
      const html = await this.fetchHtml(listingUrl);
      for (const match of html.matchAll(SLUG_PATTERN)) {
        slugs.add(match[1]);
      }
    }
    return [...slugs].map((slug) => `https://bugece.co/en/events/${slug}`);
  }
}
