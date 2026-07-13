import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { hashNormalizedRecord } from "@istanbul-guide/shared/content-hash";
import { BugeceAdapter } from "./bugece-adapter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, "__fixtures__", "bugece");

function readFixture(name: string): string {
  return readFileSync(path.join(FIXTURES_DIR, name), "utf8");
}

const LISTING_URL = "https://bugece.co/en/browse/istanbul/events";
const SOUNDSCAPE_URL = "https://bugece.co/en/events/soundscape-festival-istanbul-2026-07-25-26--f20fb9ef";
const SARA_LANDRY_URL = "https://bugece.co/en/events/jeton-presents-sara-landry-08-15-26--4748e149";

// Maps fixture files to the fetch calls the adapter will actually make,
// so no test here hits the real network — every request is answered from
// a saved real-response fixture (see __fixtures__/bugece/).
const FIXTURE_BY_URL: Record<string, string> = {
  [LISTING_URL]: readFixture("listing-istanbul.html"),
  [SOUNDSCAPE_URL]: readFixture("event-soundscape-festival.html"),
  [SARA_LANDRY_URL]: readFixture("event-sara-landry.html"),
  "https://bugece.co/en/events/malformed-fixture": readFixture("event-malformed-no-jsonld.html"),
};

function mockFetch() {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = typeof input === "string" ? input : input.toString();
    const body = FIXTURE_BY_URL[url];
    if (body !== undefined) {
      return new Response(body, { status: 200 });
    }
    // The real listing fixture discovers ~25 events; rather than saving a
    // fixture per event, unregistered event-detail URLs fall back to a
    // real detail-page fixture so collect() can process the full
    // discovered list. This still exercises the real parsing/normalizing
    // path for each one — only the specific fixtures above are asserted
    // on by name.
    if (url.startsWith("https://bugece.co/en/events/")) {
      return new Response(FIXTURE_BY_URL[SOUNDSCAPE_URL], { status: 200 });
    }
    throw new Error(`No fixture registered for ${url}`);
  });
}

describe("BugeceAdapter", () => {
  let adapter: BugeceAdapter;

  beforeEach(() => {
    mockFetch();
    adapter = new BugeceAdapter({ listingUrls: [LISTING_URL] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getSourceName", () => {
    expect(adapter.getSourceName()).toBe("BUGECE");
  });

  describe("discoverEventUrls", () => {
    it("extracts event URLs from the real listing page fixture", async () => {
      const urls = await adapter.discoverEventUrls();
      expect(urls.length).toBeGreaterThan(0);
      expect(urls).toContain(SOUNDSCAPE_URL);
      expect(urls).toContain(SARA_LANDRY_URL);
      // Every discovered URL should be a well-formed BUGECE event URL.
      for (const url of urls) {
        expect(url).toMatch(/^https:\/\/bugece\.co\/en\/events\/[a-z0-9-]+--[0-9a-f]{6,}$/);
      }
    });

    it("de-duplicates slugs (a slug shouldn't produce two URLs)", async () => {
      const urls = await adapter.discoverEventUrls();
      expect(new Set(urls).size).toBe(urls.length);
    });
  });

  describe("normalizeEvent (via fetchEventDetails)", () => {
    it("maps a real event's JSON-LD to the canonical NormalizedRecord fields", async () => {
      const details = await adapter.fetchEventDetails({ url: SOUNDSCAPE_URL });
      const record = adapter.normalizeEvent(details);

      expect(record).not.toBeNull();
      expect(record?.name).toBe("Soundscape Festival Istanbul 2026");
      expect(record?.sourceUrl).toBe(SOUNDSCAPE_URL);
      expect(record?.sourceExternalId).toBe(SOUNDSCAPE_URL);
      expect(record?.startAt).toBe("2026-07-25T15:00:00+03:00");
      expect(record?.endAt).toBe("2026-07-27T02:00:00+03:00");
      expect(record?.addressText).toContain("Sarıyer");
      // Organizer is picked from the JSON-LD organizer array — not invented.
      expect(record?.organizerName).toBe("Generic Music");
      // Ticket URL comes from offers.url, exactly as published by the
      // source — BUGECE's own JSON-LD uses its canonical (non-locale) URL
      // here, distinct from the /en/events/... page we fetched.
      expect(record?.ticketUrl).toBe(
        "https://bugece.co/event/soundscape-festival-istanbul-2026-07-25-26--f20fb9ef",
      );
      expect(record?.priceHint).toBe("1250-275000 TRY");
      expect(record?.images.length).toBeGreaterThan(0);
    });

    it("maps a second real event correctly (distinct fixture)", async () => {
      const details = await adapter.fetchEventDetails({ url: SARA_LANDRY_URL });
      const record = adapter.normalizeEvent(details);

      expect(record).not.toBeNull();
      expect(record?.name).toBe("Jeton presents Sara Landry");
      expect(record?.startAt).toBe("2026-08-15T16:00:00+03:00");
    });

    it("never invents fields the source didn't provide", async () => {
      const details = await adapter.fetchEventDetails({ url: SOUNDSCAPE_URL });
      const record = adapter.normalizeEvent(details);
      // districtHint/categoryHint aren't in schema.org Event — the adapter
      // must leave these undefined for the AI pipeline to infer, not guess.
      expect(record?.districtHint).toBeUndefined();
      expect(record?.categoryHint).toBeUndefined();
    });
  });

  describe("failure handling", () => {
    it("returns null instead of throwing when a page has no JSON-LD (schema/markup change)", async () => {
      const details = await adapter.fetchEventDetails({ url: "https://bugece.co/en/events/malformed-fixture" });
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
    // These exercise the full discovered listing (~25 events from the real
    // fixture), paced by the adapter's own politeness delay between detail
    // fetches — a longer timeout than vitest's 5s default is expected here,
    // not a sign of something wrong.
    it("collects normalized, validated records from the listing + detail fixtures", async () => {
      const records = await adapter.collect();
      const names = records.map((r) => r.name);
      expect(names).toContain("Soundscape Festival Istanbul 2026");
      expect(names).toContain("Jeton presents Sara Landry");
      // Every record must satisfy the same schema the scheduler validates
      // against before writing to raw_listings.
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
        // Same hash means run-source.ts's "existing?.contentHash === contentHash"
        // check would skip re-writing this listing — no duplicate raw_listing
        // rows or duplicate AI-pipeline runs from re-scraping unchanged events.
        expect(secondBySourceId.get(sourceExternalId)).toBe(hash);
      }
    }, 30_000);
  });
});
