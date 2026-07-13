import { describe, it, expect, vi, afterEach } from "vitest";
import Parser from "rss-parser";
import { RssAdapter } from "./rss-adapter.js";

// Regression coverage for the one adapter that actually worked before this
// change — the EventSourceAdapter interface retrofit (types.ts) must not
// alter RssAdapter's behavior. Mocks rss-parser directly rather than the
// network, since RssAdapter's only external dependency is Parser.parseURL.
describe("RssAdapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const FEED_URL = "https://example.com/feed.xml";

  it("maps feed items to NormalizedRecord, skipping items missing required fields", async () => {
    vi.spyOn(Parser.prototype, "parseURL").mockResolvedValue({
      items: [
        {
          guid: "guid-1",
          link: "https://example.com/event-1",
          title: "Real Event",
          contentSnippet: "A description",
          isoDate: "2026-08-01T18:00:00.000Z",
          enclosure: { url: "https://example.com/image.jpg" },
        },
        // Missing link/title — must be dropped, not throw.
        { guid: "guid-2", title: "No Link Event" },
      ],
    } as never);

    const adapter = new RssAdapter({ feedUrl: FEED_URL });
    const records = await adapter.collect();

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      sourceExternalId: "guid-1",
      sourceUrl: "https://example.com/event-1",
      name: "Real Event",
      description: "A description",
      startAt: "2026-08-01T18:00:00.000Z",
      images: ["https://example.com/image.jpg"],
    });
  });

  it("getSourceName falls back to the feed's hostname when no sourceName is configured", () => {
    const adapter = new RssAdapter({ feedUrl: "https://yabangee.com/feed/" });
    expect(adapter.getSourceName()).toBe("yabangee.com");
  });

  it("healthCheck reports failure without throwing when the feed is unreachable", async () => {
    vi.spyOn(Parser.prototype, "parseURL").mockRejectedValue(new Error("ENOTFOUND"));
    const adapter = new RssAdapter({ feedUrl: FEED_URL });
    const health = await adapter.healthCheck();
    expect(health.ok).toBe(false);
    expect(health.detail).toContain("ENOTFOUND");
  });
});
