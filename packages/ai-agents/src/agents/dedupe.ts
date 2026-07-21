import { prisma } from "@istanbul-guide/db";

// Deliberately not embedding-based (no second AI provider needed): narrows
// candidates with a normal indexed query (same category/district, nearby
// date), then scores name similarity with Sørensen–Dice over character
// trigrams — the same underlying idea Postgres's pg_trgm uses, just computed
// in-process so we don't need any extra extension or external API. Revisit
// with real embeddings if fuzzy name matching proves too weak at scale.
const DUPLICATE_SIMILARITY_THRESHOLD = 0.6;
const DATE_WINDOW_HOURS = 36;

function trigrams(input: string): Set<string> {
  const clean = input
    .toLowerCase()
    .replace(/[^a-z0-9ışğüöç\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const grams = new Set<string>();
  for (let i = 0; i <= clean.length - 3; i++) {
    grams.add(clean.slice(i, i + 3));
  }
  return grams;
}

// Exported so it can be unit-tested directly (e.g. verifying a new
// source's event names don't collide with existing ones) without needing
// a live database connection the way findDuplicateEvent does.
export function diceSimilarity(a: string, b: string): number {
  const setA = trigrams(a);
  const setB = trigrams(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const gram of setA) {
    if (setB.has(gram)) intersection++;
  }
  return (2 * intersection) / (setA.size + setB.size);
}

export interface DuplicateMatch {
  eventId: string;
  similarity: number;
}

// A second source's page URL for the exact same real-world event and the
// first source's article/ticket link for it are never the same string, so
// URL identifiers only catch a duplicate when one source's ticketUrl
// happens to equal another's sourceUrl/ticketUrl — which does happen in
// practice (see the Kovacs/Bubilet case below) whenever a listing was
// itself backfilled with, or independently discovered, the same ticket
// page. It's a precise but narrow signal, layered in front of the fuzzy
// name check rather than replacing it.
export interface EventIdentifiers {
  sourceUrl?: string;
  ticketUrl?: string;
}

// Real case this exists to catch: Yabangee's article for "Kovacs at IF
// Performance Hall Beşiktaş" and Bubilet's own listing page for the same
// show ("Kovacs | İstanbul") score ~0.2 name similarity — nowhere near the
// 0.6 threshold, because past the shared word "Kovacs" the titles share
// almost nothing. But the Yabangee event's ticketUrl was backfilled to
// point at that exact Bubilet page, so when Bubilet is scraped, its
// sourceUrl for that page exactly matches the existing event's ticketUrl —
// an unambiguous signal a name-similarity check alone can't see.
async function findDuplicateByIdentifier(identifiers: EventIdentifiers): Promise<DuplicateMatch | null> {
  const urls = [identifiers.sourceUrl, identifiers.ticketUrl].filter(
    (url): url is string => Boolean(url),
  );
  if (urls.length === 0) return null;

  const match = await prisma.event.findFirst({
    where: {
      status: { in: ["PUBLISHED", "REVIEW"] },
      OR: [{ sourceUrl: { in: urls } }, { ticketUrl: { in: urls } }],
    },
  });
  return match ? { eventId: match.id, similarity: 1 } : null;
}

export async function findDuplicateEvent(
  name: string,
  venueName: string | undefined,
  categoryId: string,
  districtId: string | null,
  startAt: string,
  identifiers: EventIdentifiers = {},
): Promise<DuplicateMatch | null> {
  const identifierMatch = await findDuplicateByIdentifier(identifiers);
  if (identifierMatch) return identifierMatch;

  const start = new Date(startAt);
  const windowMs = DATE_WINDOW_HOURS * 60 * 60 * 1000;

  const candidates = await prisma.event.findMany({
    where: {
      categoryId,
      districtId: districtId ?? undefined,
      status: { in: ["PUBLISHED", "REVIEW"] },
      startAt: {
        gte: new Date(start.getTime() - windowMs),
        lte: new Date(start.getTime() + windowMs),
      },
    },
    include: { translations: { where: { locale: "en" } } },
  });

  const compareText = [name, venueName].filter(Boolean).join(" ");
  let best: DuplicateMatch | null = null;

  for (const candidate of candidates) {
    const candidateName = candidate.translations[0]?.name;
    if (!candidateName) continue;
    const similarity = diceSimilarity(compareText, candidateName);
    if (similarity >= DUPLICATE_SIMILARITY_THRESHOLD && (!best || similarity > best.similarity)) {
      best = { eventId: candidate.id, similarity };
    }
  }

  return best;
}
