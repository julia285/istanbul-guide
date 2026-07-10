import { z } from "zod";

// What the Cleaner Agent extracts from a messy source record. Everything
// downstream (Writer, Category, SEO) works from THESE facts, not the raw
// source text — see agents/writer.ts for why that matters.
export const cleanedFactsSchema = z.object({
  name: z.string().min(1),
  venueName: z.string().optional(),
  addressText: z.string().optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  isFree: z.boolean(),
  priceAmount: z.number().optional(),
  priceCurrency: z.string().optional(),
  isIndoor: z.boolean().optional(),
  features: z.array(z.string()).describe(
    "Short factual bullet points extracted from the source (e.g. 'live DJ set', 'rooftop venue', 'doors at 9pm') — used by the Writer Agent as raw material, never quoted verbatim.",
  ),
});

export type CleanedFacts = z.infer<typeof cleanedFactsSchema>;
