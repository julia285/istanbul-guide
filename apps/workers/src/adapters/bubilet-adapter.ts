import { z } from "zod";
import { HtmlJsonLdAdapter } from "./html-json-ld-adapter.js";

// Bubilet (bubilet.com.tr) — Phase 1 source #2. Technically the cleanest of
// the 5 researched candidates (most permissive robots.txt, clean
// server-rendered HTML, no anti-bot blocking, real schema.org Event
// JSON-LD with geo coordinates) but carries the most explicit anti-bot
// clause in its own ToS (civil + criminal language). Proceeding on your
// explicit call to accept that risk since collection stays within what
// robots.txt itself allows and doesn't touch checkout/profile/auth paths.
export const bubiletSourceConfigSchema = z.object({
  // Which city listing page(s) to discover events from. Defaults to
  // Istanbul only — Bubilet also lists events for ~80 other Turkish cities
  // under the same domain (see sitemap.xml).
  listingUrls: z.array(z.string().url()).default(["https://www.bubilet.com.tr/istanbul"]),
});

export type BubiletSourceConfig = z.infer<typeof bubiletSourceConfigSchema>;

// Unlike BUGECE, Bubilet's event detail pages carry a real
// <script type="application/ld+json"> tag with a proper schema.org Event
// object (plus Organization/WebSite/BreadcrumbList tags on the same page) —
// HtmlJsonLdAdapter's default extractJsonLd (cheerio, picks the tag whose
// @type mentions "event") handles this with no override needed.
//
// Discovery is plain <a href="/istanbul/etkinlik/..."> links directly in
// the server-rendered listing page HTML — no framework hydration payload
// to reverse-engineer this time.
const EVENT_HREF_PATTERN = /href="(\/istanbul\/etkinlik\/[a-z0-9-]+)"/g;

export class BubiletAdapter extends HtmlJsonLdAdapter {
  protected readonly sourceName = "Bubilet";

  constructor(private readonly config: BubiletSourceConfig) {
    super();
  }

  async discoverEventUrls(): Promise<string[]> {
    const paths = new Set<string>();
    for (const listingUrl of this.config.listingUrls) {
      const html = await this.fetchHtml(listingUrl);
      for (const match of html.matchAll(EVENT_HREF_PATTERN)) {
        paths.add(match[1]);
      }
    }
    return [...paths].map((path) => `https://www.bubilet.com.tr${path}`);
  }
}
