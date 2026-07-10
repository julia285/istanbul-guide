import { createHash } from "node:crypto";
import type { NormalizedRecord } from "./normalized-record.js";

// Recursively sorts object keys so JSON.stringify output is stable
// regardless of key insertion order, at every nesting level.
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([a], [b]) => a.localeCompare(b),
    );
    return Object.fromEntries(entries.map(([k, v]) => [k, canonicalize(v)]));
  }
  return value;
}

// Stable hash of the fields that matter for "did this listing change" —
// used by the parser scheduler to skip AI reprocessing of unchanged
// records (architecture doc section 5, Parser Workflow).
export function hashNormalizedRecord(record: NormalizedRecord): string {
  const { sourceExternalId: _sourceExternalId, ...rest } = record;
  const stable = JSON.stringify(canonicalize(rest));
  return createHash("sha256").update(stable).digest("hex");
}
