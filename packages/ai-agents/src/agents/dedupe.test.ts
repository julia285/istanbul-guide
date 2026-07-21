import { describe, it, expect } from "vitest";
import { diceSimilarity } from "./dedupe.js";

// The 12 events currently live on the site, published manually before any
// automated pipeline ran (see packages/ai-agents/scripts/manual-publish-yabangee.ts).
// Real names, not fixtures — this is what a new source's events get compared
// against in production once dedupe actually runs against them.
const EXISTING_YABANGEE_EVENT_NAMES = [
  "Girli at Zorlu PSM",
  "The Bodyguard Musical at Zorlu PSM",
  "FJAAK at Flux — RX Saturdaze",
  "GIGI FM at Flux — RX Saturdaze",
  "Adriana Lopez at Flux — RX Saturdaze",
  "DJ Boris at Flux — RX Saturdaze",
  "Tommy Four Seven at Flux — RX Saturdaze",
  "David Garrett at Harbiye Open Air Theatre",
  "Regal at Flux — RX Fridaze",
  "Lamb of God at Bonus Parkorman",
  "Kovacs at IF Performance Hall Beşiktaş",
  "I Hate Models: Disco Inferno at Life Park",
];

// Real event names pulled from the BUGECE fixtures (apps/workers/src/adapters/__fixtures__/bugece/).
const BUGECE_FIXTURE_EVENT_NAMES = ["Soundscape Festival Istanbul 2026", "Jeton presents Sara Landry"];

// Real event names pulled from the Bubilet fixtures (apps/workers/src/adapters/__fixtures__/bubilet/).
const BUBILET_FIXTURE_EVENT_NAMES = ["Pink Martini", "Karsu"];

const DUPLICATE_SIMILARITY_THRESHOLD = 0.6;

describe("diceSimilarity", () => {
  it("scores identical strings at 1", () => {
    expect(diceSimilarity("Soundscape Festival Istanbul 2026", "Soundscape Festival Istanbul 2026")).toBe(1);
  });

  it("scores completely unrelated strings near 0", () => {
    expect(diceSimilarity("Soundscape Festival Istanbul 2026", "Girli at Zorlu PSM")).toBeLessThan(0.3);
  });

  it("is tolerant of minor wording differences (same real event, two sources)", () => {
    // The kind of variation you'd actually see between two sources
    // describing the same show — a venue name appended, punctuation/case
    // differences — should still clear the threshold.
    const similarity = diceSimilarity(
      "Soundscape Festival Istanbul 2026",
      "Soundscape Festival Istanbul 2026 at Life Park",
    );
    expect(similarity).toBeGreaterThanOrEqual(DUPLICATE_SIMILARITY_THRESHOLD);
  });

  // "Verify dedup against Yabangee" — this repo's dedupe.findDuplicateEvent()
  // needs a live Postgres connection (it queries prisma.event.findMany) that
  // this environment can't reach (see the Supabase pooler being unreachable
  // during the schema migration step). What CAN be verified without a DB is
  // the pure similarity function itself: none of BUGECE's real event names
  // should false-positive against the 12 already-published Yabangee event
  // names, since they're genuinely different events. A true end-to-end
  // "does BUGECE recognize the Yabangee/Passo/BUGECE overlap" test needs a
  // reachable DB and is listed as a follow-up limitation.
  it("does not false-positive BUGECE fixture events against existing Yabangee events", () => {
    for (const bugeceName of BUGECE_FIXTURE_EVENT_NAMES) {
      for (const yabangeeName of EXISTING_YABANGEE_EVENT_NAMES) {
        const similarity = diceSimilarity(bugeceName, yabangeeName);
        expect(similarity, `"${bugeceName}" vs "${yabangeeName}"`).toBeLessThan(
          DUPLICATE_SIMILARITY_THRESHOLD,
        );
      }
    }
  });

  it("does not false-positive Bubilet fixture events against existing Yabangee/BUGECE events", () => {
    for (const bubiletName of BUBILET_FIXTURE_EVENT_NAMES) {
      for (const otherName of [...EXISTING_YABANGEE_EVENT_NAMES, ...BUGECE_FIXTURE_EVENT_NAMES]) {
        const similarity = diceSimilarity(bubiletName, otherName);
        expect(similarity, `"${bubiletName}" vs "${otherName}"`).toBeLessThan(DUPLICATE_SIMILARITY_THRESHOLD);
      }
    }
  });

  // FIXED at a different layer: name-only trigram similarity between the
  // existing Yabangee event "Kovacs at IF Performance Hall Beşiktaş" and
  // Bubilet's own listing for the same show ("Kovacs | İstanbul") scores
  // well below the 0.6 threshold — confirmed here — because past the
  // shared word "Kovacs" the two titles share almost nothing. This is
  // exactly why findDuplicateEvent() now checks sourceUrl/ticketUrl for an
  // exact match *before* falling back to name similarity: the Yabangee
  // event's ticketUrl was backfilled to Bubilet's page for this show
  // (packages/ai-agents/scripts/backfill-ticket-urls.ts), so when Bubilet
  // is scraped, its sourceUrl for that exact page matches — see
  // findDuplicateByIdentifier in dedupe.ts. That DB-querying path can't be
  // unit tested in this environment (no reachable Postgres here), but the
  // name-similarity half of the story — why a fallback was needed at all —
  // is verified below.
  it("shows why name-similarity alone would have missed the Kovacs/Bubilet duplicate", () => {
    const similarity = diceSimilarity("Kovacs | İstanbul", "Kovacs at IF Performance Hall Beşiktaş");
    expect(similarity).toBeLessThan(DUPLICATE_SIMILARITY_THRESHOLD);
  });
});
