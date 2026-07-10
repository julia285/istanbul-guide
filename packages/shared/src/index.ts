// content-hash.ts is deliberately NOT re-exported here: it uses node:crypto,
// which breaks bundling for edge/browser consumers (e.g. Next.js middleware)
// that import from this barrel. Node-only consumers (apps/workers) import it
// directly via "@istanbul-guide/shared/content-hash".
export * from "./locales.js";
export * from "./normalized-record.js";
export * from "./slugify.js";
