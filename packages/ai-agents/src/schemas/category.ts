import { z } from "zod";
import { CATEGORY_SLUGS, DISTRICT_SLUGS, TAG_SLUGS } from "../taxonomy.js";

export const categorizationSchema = z.object({
  categorySlug: z.enum(CATEGORY_SLUGS as [string, ...string[]]),
  districtSlug: z.enum(DISTRICT_SLUGS as [string, ...string[]]).nullable().describe(
    "Null if the district genuinely cannot be determined from the address/venue name — do not guess.",
  ),
  tagSlugs: z.array(z.enum(TAG_SLUGS as [string, ...string[]])),
  isIndoor: z.boolean().nullable(),
});

export type Categorization = z.infer<typeof categorizationSchema>;
