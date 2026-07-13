import { z } from "zod";

// The contract every source adapter returns to the parser scheduler
// (apps/workers). One record can describe a Place-like or Event-like
// listing — the Cleaner/Category agents decide which it becomes.
// Deliberately loose (source data is messy); the AI pipeline is what
// turns this into strongly-typed Place/Event rows.
export const normalizedRecordSchema = z.object({
  sourceExternalId: z.string().min(1),
  sourceUrl: z.string().url(),
  name: z.string().min(1),
  description: z.string().optional(),
  addressText: z.string().optional(),
  districtHint: z.string().optional(),
  categoryHint: z.string().optional(),
  coordinates: z
    .object({ lat: z.number(), lng: z.number() })
    .optional(),
  // { offset: true } accepts timezone-offset timestamps (e.g. "+03:00"),
  // not just UTC "Z" — schema.org JSON-LD sources report local Istanbul
  // offsets directly, which is exactly the data we want, not something to
  // reject and force through a lossy UTC conversion.
  startAt: z.string().datetime({ offset: true }).optional(),
  endAt: z.string().datetime({ offset: true }).optional(),
  priceHint: z.string().optional(),
  // Exact structured facts, when the source provides them directly (e.g.
  // JSON-LD `offers.url` / `performer.name`) — passed straight through to
  // the Event record rather than through the Cleaner LLM, since these are
  // precise identifiers/names, not free text that benefits from extraction.
  ticketUrl: z.string().url().optional(),
  organizerName: z.string().optional(),
  contact: z
    .object({
      phone: z.string().optional(),
      website: z.string().optional(),
      email: z.string().optional(),
    })
    .optional(),
  hoursText: z.string().optional(),
  images: z.array(z.string().url()).default([]),
});

export type NormalizedRecord = z.infer<typeof normalizedRecordSchema>;
