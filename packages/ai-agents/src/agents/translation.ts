import type { WrittenCopy } from "../schemas/writer.js";
import { translationSchema, type Translation } from "../schemas/translation.js";
import { generateStructured, CLAUDE_MODELS } from "../providers/claude.js";

// Translates the Writer Agent's own output, not the original source text —
// keeps both language versions consistent with each other and equally
// "original" (neither is a copy of scraped prose).
const SYSTEM_PROMPT = `You are a professional English-to-Turkish translator specializing in event listings for a Turkish audience. Preserve tone and meaning; do not add or omit facts. Use natural, idiomatic Turkish, not a literal word-for-word translation.`;

export async function translateToTurkish(copy: WrittenCopy): Promise<Translation> {
  const prompt = `Translate this event listing to Turkish.

Name: ${copy.name}
Description: ${copy.description}`;

  return generateStructured({
    model: CLAUDE_MODELS.sonnet,
    system: SYSTEM_PROMPT,
    prompt,
    schema: translationSchema,
    toolName: "record_translation",
    toolDescription: "Record the Turkish translation.",
    maxTokens: 1024,
  });
}
