import type { NormalizedRecord } from "@istanbul-guide/shared";

// A discovered-but-not-yet-fully-fetched event, plus whatever raw material
// each fetch stage attaches. `html`/`json` are both optional because
// different sources carry their event data differently (RSS: json only,
// the feed item itself; scraped sites: html, with structured data usually
// embedded inside it rather than served as its own document).
export interface RawEventCandidate {
  url: string;
  html?: string;
  json?: unknown;
}

export interface HealthCheckResult {
  ok: boolean;
  detail?: string;
}

// One adapter per source. Sources that share a shape (any RSS feed, any
// source exposing the same REST API pattern) reuse the same adapter class
// with different config — only a genuinely bespoke site needs new code.
// See architecture doc section 5, Parser Workflow.
//
// `collect()` is what the scheduler (run-source.ts) actually calls — it's
// the composed result of the granular steps below. The granular methods
// exist so each stage is independently testable (fixture-based tests can
// call normalizeEvent() directly against a saved HTML/JSON sample without
// making a network request) and so a source-specific health check can run
// without doing a full collect.
export interface SourceAdapter {
  getSourceName(): string;
  discoverEventUrls(): Promise<string[]>;
  fetchEventList(): Promise<RawEventCandidate[]>;
  fetchEventDetails(candidate: RawEventCandidate): Promise<RawEventCandidate>;
  normalizeEvent(raw: RawEventCandidate): NormalizedRecord | null;
  validateEvent(record: NormalizedRecord): boolean;
  healthCheck(): Promise<HealthCheckResult>;
  collect(): Promise<NormalizedRecord[]>;
}

// Alias kept for readability at call sites that talk about "an event
// source" specifically (vs. SourceAdapter, which is the DB/registry-facing
// name) — same interface, no behavior difference.
export type EventSourceAdapter = SourceAdapter;
