import Anthropic from "@anthropic-ai/sdk";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { ZodSchema } from "zod";

let client: Anthropic | undefined;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set — required for the AI pipeline's Claude-backed agents.",
      );
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export const CLAUDE_MODELS = {
  // Cheap/fast — high-volume, low-risk steps (cleaning, first-pass classification).
  haiku: "claude-haiku-4-5-20251001",
  // Higher quality — customer-facing text generation (writer, SEO, translation).
  sonnet: "claude-sonnet-5",
} as const;

export type ClaudeModel = (typeof CLAUDE_MODELS)[keyof typeof CLAUDE_MODELS];

// Forces a single structured tool call and validates the result against the
// given Zod schema, so every agent gets a typed, guaranteed-shape response
// instead of parsing free-form text.
export async function generateStructured<T>(opts: {
  model: ClaudeModel;
  system: string;
  prompt: string;
  schema: ZodSchema<T>;
  toolName: string;
  toolDescription: string;
  maxTokens?: number;
}): Promise<T> {
  const anthropic = getClient();
  const jsonSchema = zodToJsonSchema(opts.schema, { target: "openApi3" });

  const response = await anthropic.messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens ?? 2048,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
    tools: [
      {
        name: opts.toolName,
        description: opts.toolDescription,
        input_schema: jsonSchema as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: opts.toolName },
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error(`Claude did not return a "${opts.toolName}" tool call`);
  }

  return opts.schema.parse(toolUse.input);
}
