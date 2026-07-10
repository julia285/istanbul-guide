import type { NormalizedRecord } from "@istanbul-guide/shared";

// One adapter per source. Sources that share a shape (any RSS feed, any
// source exposing the same REST API pattern) reuse the same adapter class
// with different config — only a genuinely bespoke site needs new code.
// See architecture doc section 5, Parser Workflow.
export interface SourceAdapter {
  collect(): Promise<NormalizedRecord[]>;
}
