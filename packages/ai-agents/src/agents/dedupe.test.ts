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

  // KNOWN LIMITATION, not a false positive: packages/ai-agents/scripts/backfill-ticket-urls.ts
  // records that the existing Yabangee event "Kovacs at IF Performance Hall
  // Beşiktaş" and Bubilet's own listing for the same show
  // (bubilet.com.tr/istanbul/etkinlik/-100-muzik-sunar-kovacs-istanbul,
  // titled "Kovacs | İstanbul") are the SAME real-world event — confirmed by
  // the site owner reading both pages by hand. Name-only trigram similarity
  // scores this pair well BELOW the 0.6 duplicate threshold, because past
  // the shared word "Kovacs" the two titles share almost nothing
  // (venue name vs. just "İstanbul"). findDuplicateEvent() has no other
  // signal to fall back on — it doesn't compare ticketUrl or source
  // identifiers at all, despite the architecture plan calling for exactly
  // that as an additional dedup signal. Net effect: adding Bubilet as a
  // live source would very likely create a second, separate Event row for
  // this show rather than recognizing the overlap. Fixing this means
  // extending findDuplicateEvent with a ticketUrl/organizer/source-identifier
  // check, not something in this adapter's scope — flagging here with a
  // real, reproducible example rather than leaving it undiscovered.
  it("documents a real true-positive duplicate that name-similarity alone misses", () => {
    const similarity = diceSimilarity("Kovacs | İstanbul", "Kovacs at IF Performance Hall Beşiktaş");
    expect(similarity).toBeLessThan(DUPLICATE_SIMILARITY_THRESHOLD);
  });
});
