import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { hashNormalizedRecord } from "@istanbul-guide/shared/content-hash";
import { BubiletAdapter } from "./bubilet-adapter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, "__fixtures__", "bubilet");

function readFixture(name: string): string {
  return readFileSync(path.join(FIXTURES_DIR, name), "utf8");
}

const LISTING_URL = "https://www.bubilet.com.tr/istanbul";
const PINK_MARTINI_URL = "https://www.bubilet.com.tr/istanbul/etkinlik/pink-martini";
const KARSU_URL = "https://www.bubilet.com.tr/istanbul/etkinlik/karsu";
const MALFORMED_URL = "https://www.bubilet.com.tr/istanbul/etkinlik/malformed-fixture";

const FIXTURE_BY_URL: Record<string, string> = {
  [LISTING_URL]: readFixture("listing-istanbul.html"),
  [PINK_MARTINI_URL]: readFixture("event-pink-martini.html"),
  [KARSU_URL]: readFixture("event-karsu.html"),
  [MALFORMED_URL]: readFixture("event-malformed-no-jsonld.html"),
};

function mockFetch() {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = typeof input === "string" ? input : input.toString();
    const body = FIXTURE_BY_URL[url];
    if (body !== undefined) {
      return new Response(body, { status: 200 });
    }
    // The real listing fixture discovers ~25 events; unregistered
    // event-detail URLs fall back to a real fixture so collect() can
    // process the full discovered list without a fixture per event.
    if (url.startsWith("https://www.bubilet.com.tr/istanbul/etkinlik/")) {
      return new Response(FIXTURE_BY_URL[PINK_MARTINI_URL], { status: 200 });
    }
    throw new Error(`No fixture registered for ${url}`);
  });
}

describe("BubiletAdapter", () => {
  let adapter: BubiletAdapter;

  beforeEach(() => {
    mockFetch();
    adapter = new BubiletAdapter({ listingUrls: [LISTING_URL] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getSourceName", () => {
    expect(adapter.getSourceName()).toBe("Bubilet");
  });

  describe("discoverEventUrls", () => {
    // Note: the Karsu fixture (event-karsu.html) was fetched separately
    // from the listing fixture, and Bubilet's listing is live/daily-changing
    // — Karsu isn't necessarily one of the ~25 events in this particular
    // listing snapshot, so only Pink Martini (confirmed present) is
    // asserted here. Karsu is still exercised directly via
    // fetchEventDetails in the normalizeEvent tests below.
    it("extracts event URLs from the real listing page fixture", async () => {
      const urls = await adapter.discoverEventUrls();
      expect(urls.length).toBeGreaterThan(0);
      expect(urls).toContain(PINK_MARTINI_URL);
      for (const url of urls) {
        expect(url).toMatch(/^https:\/\/www\.bubilet\.com\.tr\/istanbul\/etkinlik\/[a-z0-9-]+$/);
      }
    });

    it("de-duplicates URLs that appear in multiple sections of the listing page", async () => {
      const urls = await adapter.discoverEventUrls();
      expect(new Set(urls).size).toBe(urls.length);
    });
  });

  describe("normalizeEvent (via fetchEventDetails, using the base class's default JSON-LD extraction)", () => {
    it("maps a real event's JSON-LD to the canonical NormalizedRecord fields", async () => {
      const details = await adapter.fetchEventDetails({ url: PINK_MARTINI_URL });
      const record = adapter.normalizeEvent(details);

      expect(record).not.toBeNull();
      expect(record?.name).toBe("Pink Martini");
      expect(record?.sourceUrl).toBe(PINK_MARTINI_URL);
      expect(record?.startAt).toBe("2026-07-22T18:00:00+00:00");
      expect(record?.endAt).toBe("2026-07-22T19:30:00+00:00");
      expect(record?.addressText).toContain("Şişli");
      expect(record?.coordinates).toEqual({ lat: 41.04726676, lng: 28.98961301 });
      expect(record?.ticketUrl).toBe(PINK_MARTINI_URL);
      expect(record?.priceHint).toBe("2500 TRY");
      expect(record?.images.length).toBeGreaterThan(0);
    });

    it("maps a second real event correctly (distinct fixture)", async () => {
      const details = await adapter.fetchEventDetails({ url: KARSU_URL });
      const record = adapter.normalizeEvent(details);

      expect(record).not.toBeNull();
      expect(record?.name).toBe("Karsu");
      expect(record?.startAt).toBe("2026-11-28T18:00:00+00:00");
      expect(record?.coordinates).toEqual({ lat: 40.95752872, lng: 29.10219167 });
    });

    it("picks the Event tag out of the page's other JSON-LD tags (Organization/WebSite/BreadcrumbList)", async () => {
      // Bubilet's pages carry 6 separate <script type="application/ld+json">
      // tags — Organization, WebSite, the real Event, and 3 BreadcrumbLists.
      // This is really a regression check on HtmlJsonLdAdapter's default
      // extractor (picks the tag whose @type mentions "event"), exercised
      // here since Bubilet is the first source with multiple JSON-LD tags
      // per page.
      const details = await adapter.fetchEventDetails({ url: PINK_MARTINI_URL });
      const record = adapter.normalizeEvent(details);
      expect(record?.name).not.toBe("Bubilet");
    });

    it("never invents fields the source didn't provide", async () => {
      const details = await adapter.fetchEventDetails({ url: PINK_MARTINI_URL });
      const record = adapter.normalizeEvent(details);
      expect(record?.districtHint).toBeUndefined();
      expect(record?.categoryHint).toBeUndefined();
    });
  });

  describe("failure handling", () => {
    it("returns null instead of throwing when no JSON-LD tag has an Event type", async () => {
      const details = await adapter.fetchEventDetails({ url: MALFORMED_URL });
      expect(() => adapter.normalizeEvent(details)).not.toThrow();
      expect(adapter.normalizeEvent(details)).toBeNull();
    });

    it("healthCheck reports ok when the listing page is reachable and has events", async () => {
      const health = await adapter.healthCheck();
      expect(health.ok).toBe(true);
    });

    it("healthCheck reports not-ok when the listing fetch fails", async () => {
      vi.restoreAllMocks();
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
      const health = await adapter.healthCheck();
      expect(health.ok).toBe(false);
      expect(health.detail).toContain("network down");
    });
  });

  describe("collect (end-to-end) + idempotency", () => {
    it("collects normalized, validated records from the listing + detail fixtures", async () => {
      const records = await adapter.collect();
      const names = records.map((r) => r.name);
      expect(names).toContain("Pink Martini");
      for (const record of records) {
        expect(record.sourceExternalId.length).toBeGreaterThan(0);
        expect(record.sourceUrl.length).toBeGreaterThan(0);
      }
    }, 15_000);

    it("re-running collect() against the same fixtures is idempotent (same content hash)", async () => {
      const first = await adapter.collect();
      const second = await adapter.collect();

      const firstBySourceId = new Map(first.map((r) => [r.sourceExternalId, hashNormalizedRecord(r)]));
      const secondBySourceId = new Map(second.map((r) => [r.sourceExternalId, hashNormalizedRecord(r)]));

      expect(secondBySourceId.size).toBe(firstBySourceId.size);
      for (const [sourceExternalId, hash] of firstBySourceId) {
        expect(secondBySourceId.get(sourceExternalId)).toBe(hash);
      }
    }, 30_000);
  });
});
