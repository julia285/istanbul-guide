import * as cheerio from "cheerio";
import { normalizedRecordSchema, type NormalizedRecord } from "@istanbul-guide/shared";
import type { SourceAdapter, RawEventCandidate, HealthCheckResult } from "./types.js";

const DEFAULT_USER_AGENT =
  "IstanbulGuideBot/1.0 (+https://istanbul-guide.example; event listing aggregator, respects robots.txt)";
const REQUEST_TIMEOUT_MS = 15_000;
// Politeness delay between sequential detail-page fetches within a single
// source's run — sources run one at a time (apps/workers scheduler), so
// this is the only concurrency control needed for now; see limitations.
const REQUEST_DELAY_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function politeFetch(url: string, userAgent: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { "User-Agent": userAgent }, signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} fetching ${url}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

// Loose schema.org Event/MusicEvent/... shape — only the fields we read.
interface SchemaOrgPlace {
  name?: string;
  address?: string | { streetAddress?: string };
  geo?: { latitude?: number; longitude?: number };
}
interface SchemaOrgOrganizer {
  name?: string;
}
interface SchemaOrgOffer {
  url?: string;
  price?: number;
  lowPrice?: number;
  highPrice?: number;
  priceCurrency?: string;
}
export interface SchemaOrgEvent {
  ["@type"]?: string;
  name?: string;
  url?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  image?: string | string[];
  location?: SchemaOrgPlace | SchemaOrgPlace[];
  organizer?: SchemaOrgOrganizer | SchemaOrgOrganizer[];
  offers?: SchemaOrgOffer | SchemaOrgOffer[];
  eventStatus?: string;
}

function buildPriceHint(offer: SchemaOrgOffer | undefined): string | undefined {
  if (!offer) return undefined;
  const currency = offer.priceCurrency ?? "";
  if (offer.lowPrice !== undefined && offer.highPrice !== undefined) {
    return offer.lowPrice === offer.highPrice
      ? `${offer.lowPrice} ${currency}`.trim()
      : `${offer.lowPrice}-${offer.highPrice} ${currency}`.trim();
  }
  if (offer.price !== undefined) {
    return `${offer.price} ${currency}`.trim();
  }
  return undefined;
}

// Base class for sources whose event detail pages carry schema.org
// Event (or a subtype, e.g. MusicEvent) structured data — the JSON-LD tier
// in the sourcing priority order. Subclasses supply how to discover event
// URLs (discoverEventUrls) and, if the source doesn't use a plain
// <script type="application/ld+json"> tag, how to pull the JSON-LD object
// out of the raw HTML (override extractJsonLd).
export abstract class HtmlJsonLdAdapter implements SourceAdapter {
  protected abstract readonly sourceName: string;
  protected readonly userAgent: string = DEFAULT_USER_AGENT;

  abstract discoverEventUrls(): Promise<string[]>;

  getSourceName(): string {
    return this.sourceName;
  }

  protected fetchHtml(url: string): Promise<string> {
    return politeFetch(url, this.userAgent);
  }

  // Default extraction: a standard <script type="application/ld+json">
  // tag whose @type mentions "Event". Override this for sites that embed
  // JSON-LD some other way (see BugeceAdapter).
  protected extractJsonLd(html: string): SchemaOrgEvent | null {
    const $ = cheerio.load(html);
    for (const el of $('script[type="application/ld+json"]').toArray()) {
      try {
        const parsed = JSON.parse($(el).contents().text()) as unknown;
        const candidates = Array.isArray(parsed) ? parsed : [parsed];
        for (const candidate of candidates) {
          const type = (candidate as SchemaOrgEvent)?.["@type"];
          if (typeof type === "string" && type.toLowerCase().includes("event")) {
            return candidate as SchemaOrgEvent;
          }
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  async fetchEventList(): Promise<RawEventCandidate[]> {
    const urls = await this.discoverEventUrls();
    return urls.map((url) => ({ url }));
  }

  async fetchEventDetails(candidate: RawEventCandidate): Promise<RawEventCandidate> {
    const html = await this.fetchHtml(candidate.url);
    const json = this.extractJsonLd(html);
    return { ...candidate, html, json: json ?? undefined };
  }

  // Maps the parsed schema.org object to our canonical NormalizedRecord.
  // Deliberately only reads fields that are actually present in the
  // source's structured data — no inference, no invented facts (per the
  // AI-processing policy: dates/prices/venues/ticket links must come from
  // source data, not be guessed).
  normalizeEvent(raw: RawEventCandidate): NormalizedRecord | null {
    const ld = raw.json as SchemaOrgEvent | undefined;
    if (!ld || !ld.name) return null;

    const location = Array.isArray(ld.location) ? ld.location[0] : ld.location;
    const address = location?.address;
    const addressText = typeof address === "string" ? address : address?.streetAddress;
    const geo = location?.geo;
    const coordinates =
      typeof geo?.latitude === "number" && typeof geo?.longitude === "number"
        ? { lat: geo.latitude, lng: geo.longitude }
        : undefined;

    const organizers = Array.isArray(ld.organizer) ? ld.organizer : ld.organizer ? [ld.organizer] : [];
    const organizerName = organizers.find((o) => Boolean(o?.name))?.name;

    const offer = Array.isArray(ld.offers) ? ld.offers[0] : ld.offers;

    const images = (Array.isArray(ld.image) ? ld.image : ld.image ? [ld.image] : []).filter(
      (src): src is string => typeof src === "string",
    );

    const candidate: NormalizedRecord = {
      sourceExternalId: raw.url,
      sourceUrl: raw.url,
      name: ld.name,
      description: ld.description,
      addressText,
      coordinates,
      startAt: ld.startDate,
      endAt: ld.endDate,
      priceHint: buildPriceHint(offer),
      ticketUrl: offer?.url ?? ld.url,
      organizerName,
      images,
    };

    const parsed = normalizedRecordSchema.safeParse(candidate);
    return parsed.success ? parsed.data : null;
  }

  validateEvent(record: NormalizedRecord): boolean {
    return normalizedRecordSchema.safeParse(record).success;
  }

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      const urls = await this.discoverEventUrls();
      return { ok: urls.length > 0, detail: `${urls.length} event URLs discovered` };
    } catch (error) {
      return { ok: false, detail: error instanceof Error ? error.message : String(error) };
    }
  }

  async collect(): Promise<NormalizedRecord[]> {
    const candidates = await this.fetchEventList();
    const records: NormalizedRecord[] = [];
    for (const candidate of candidates) {
      const details = await this.fetchEventDetails(candidate);
      const record = this.normalizeEvent(details);
      if (record && this.validateEvent(record)) {
        records.push(record);
      }
      await sleep(REQUEST_DELAY_MS);
    }
    return records;
  }
}
