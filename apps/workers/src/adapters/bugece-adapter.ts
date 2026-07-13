import { z } from "zod";
import { HtmlJsonLdAdapter, type SchemaOrgEvent } from "./html-json-ld-adapter.js";

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

// BUGECE's event pages don't use a plain <script type="application/ld+json">
// tag — the framework (Next.js App Router) embeds the JSON-LD object as an
// escaped string literal inside a React Server Components hydration payload
// (`self.__next_f.push([...])`). Same is true for the event slugs on the
// listing page. Both need a bespoke extractor rather than the HtmlJsonLdAdapter
// default (which looks for a real <script> tag) — everything else about the
// adapter (fetch/validate/dedupe/collect) is the generic base behavior.
function extractBalancedJsonLiteral(html: string, marker: string): unknown | null {
  const start = html.indexOf(marker);
  if (start === -1) return null;

  let raw = "";
  let depth = 0;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (c === "\\" && html[i + 1] === '"') {
      raw += '"';
      i++;
      continue;
    }
    if (c === "\\" && html[i + 1] === "n") {
      raw += " ";
      i++;
      continue;
    }
    if (c === "\\" && html[i + 1] === "\\") {
      raw += "\\";
      i++;
      continue;
    }
    raw += c;
    if (c === "{") depth++;
    if (c === "}") {
      depth--;
      if (depth === 0) break;
    }
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const SLUG_PATTERN = /\\"slug\\":\\"([a-z0-9-]+--[0-9a-f]{6,})\\"/g;
const JSON_LD_MARKER = '{\\"@context\\":\\"https://schema.org\\"';

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

  protected extractJsonLd(html: string): SchemaOrgEvent | null {
    return extractBalancedJsonLiteral(html, JSON_LD_MARKER) as SchemaOrgEvent | null;
  }
}
