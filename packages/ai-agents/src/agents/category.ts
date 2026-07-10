import type { CleanedFacts } from "../schemas/cleaned-facts.js";
import { categorizationSchema, type Categorization } from "../schemas/category.js";
import { generateStructured, CLAUDE_MODELS } from "../providers/claude.js";
import { CATEGORIES, DISTRICTS, TAGS } from "../taxonomy.js";

const SYSTEM_PROMPT = `You classify Istanbul event listings against a FIXED taxonomy. You must only use the exact slugs provided — never invent new ones. If the district can't be reasonably determined, return null rather than guessing.`;

export async function categorize(
  facts: CleanedFacts,
  rawDistrictHint: string | undefined,
): Promise<Categorization> {
  const prompt = `Classify this event.

Name: ${facts.name}
Venue: ${facts.venueName ?? "(unknown)"}
Address: ${facts.addressText ?? "(unknown)"}
District hint from source: ${rawDistrictHint ?? "(none)"}
Features: ${facts.features.join(", ") || "(none)"}
Free: ${facts.isFree}

Available categories: ${CATEGORIES.map((c) => c.slug).join(", ")}
Available districts: ${DISTRICTS.map((d) => d.slug).join(", ")}
Available tags: ${TAGS.map((t) => t.slug).join(", ")}`;

  return generateStructured({
    model: CLAUDE_MODELS.haiku,
    system: SYSTEM_PROMPT,
    prompt,
    schema: categorizationSchema,
    toolName: "record_categorization",
    toolDescription: "Record the category, district, tags, and indoor/outdoor classification.",
  });
}
