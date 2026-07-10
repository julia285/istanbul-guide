import type { CleanedFacts } from "../schemas/cleaned-facts.js";
import type { Categorization } from "../schemas/category.js";
import { writtenCopySchema, type WrittenCopy } from "../schemas/writer.js";
import { generateStructured, CLAUDE_MODELS } from "../providers/claude.js";

// Deliberately takes only CleanedFacts + Categorization as input — never the
// raw NormalizedRecord / source description. This is what makes "never copy
// source text" a structural guarantee instead of a prompt instruction that
// could be ignored. See architecture doc section 4, Agent 5.
const SYSTEM_PROMPT = `You write original, engaging copy for an Istanbul events website (KudaGo/TimeOut/Secret London style — warm, specific, no generic filler like "don't miss this amazing event"). You are given only extracted facts, not source text, so everything you write is necessarily original. Never state a fact that wasn't provided to you.`;

export async function writeCopy(
  facts: CleanedFacts,
  categorization: Categorization,
): Promise<WrittenCopy> {
  const prompt = `Write publishable copy for this event, in English.

Facts:
- Name: ${facts.name}
- Venue: ${facts.venueName ?? "(unknown)"}
- Category: ${categorization.categorySlug}
- District: ${categorization.districtSlug ?? "(unknown)"}
- Tags: ${categorization.tagSlugs.join(", ") || "(none)"}
- Free: ${facts.isFree}
- Notable features: ${facts.features.join(", ") || "(none)"}`;

  return generateStructured({
    model: CLAUDE_MODELS.sonnet,
    system: SYSTEM_PROMPT,
    prompt,
    schema: writtenCopySchema,
    toolName: "record_written_copy",
    toolDescription: "Record the final publishable name and description.",
    maxTokens: 1024,
  });
}
