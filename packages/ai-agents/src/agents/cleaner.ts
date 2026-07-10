import type { NormalizedRecord } from "@istanbul-guide/shared";
import { generateStructured, CLAUDE_MODELS } from "../providers/claude.js";
import { cleanedFactsSchema, type CleanedFacts } from "../schemas/cleaned-facts.js";

const SYSTEM_PROMPT = `You extract clean, structured facts from messy event listing text scraped from a website. You never invent information that isn't present or clearly implied — if something isn't stated, omit it. Dates must be converted to ISO 8601. Assume Europe/Istanbul timezone unless stated otherwise.`;

export async function cleanRecord(record: NormalizedRecord): Promise<CleanedFacts> {
  const prompt = `Extract clean structured facts from this event listing.

Name: ${record.name}
Description: ${record.description ?? "(none)"}
Address: ${record.addressText ?? "(none)"}
District hint: ${record.districtHint ?? "(none)"}
Start: ${record.startAt ?? "(unspecified)"}
End: ${record.endAt ?? "(unspecified)"}
Price hint: ${record.priceHint ?? "(unspecified)"}
Hours text: ${record.hoursText ?? "(none)"}`;

  return generateStructured({
    model: CLAUDE_MODELS.haiku,
    system: SYSTEM_PROMPT,
    prompt,
    schema: cleanedFactsSchema,
    toolName: "record_cleaned_facts",
    toolDescription: "Record the cleaned, structured facts extracted from the listing.",
  });
}
