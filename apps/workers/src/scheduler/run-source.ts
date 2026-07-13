import { prisma, type Source, type Prisma } from "@istanbul-guide/db";
import { hashNormalizedRecord } from "@istanbul-guide/shared/content-hash";
import { processRawListing } from "@istanbul-guide/ai-agents";
import { buildAdapter } from "../adapters/registry.js";

// Matches the fallback convention used by the manual-publish scripts in
// packages/ai-agents/scripts/*.ts — canonical URLs generated during local
// dev point at localhost, production points at the real domain.
const SITE_BASE_URL = process.env.SITE_BASE_URL ?? "http://localhost:3000";

export interface RunSourceResult {
  sourceSlug: string;
  discovered: number;
  created: number;
  updated: number;
  rejected: number;
  processingErrors: number;
}

export async function runSource(source: Source): Promise<RunSourceResult> {
  const adapter = buildAdapter(source);
  const records = await adapter.collect();

  let created = 0;
  let updated = 0;
  let rejected = 0;
  let processingErrors = 0;

  for (const record of records) {
    const contentHash = hashNormalizedRecord(record);
    const existing = await prisma.rawListing.findUnique({
      where: {
        sourceId_sourceExternalId: {
          sourceId: source.id,
          sourceExternalId: record.sourceExternalId,
        },
      },
    });

    if (existing?.contentHash === contentHash) {
      continue; // unchanged — skip, so the AI pipeline never re-runs on it
    }

    const rawListing = await prisma.rawListing.upsert({
      where: {
        sourceId_sourceExternalId: {
          sourceId: source.id,
          sourceExternalId: record.sourceExternalId,
        },
      },
      create: {
        sourceId: source.id,
        sourceExternalId: record.sourceExternalId,
        rawPayload: record as unknown as Prisma.InputJsonValue,
        contentHash,
        status: "PENDING",
      },
      update: {
        rawPayload: record as unknown as Prisma.InputJsonValue,
        contentHash,
        status: "PENDING",
        fetchedAt: new Date(),
        errorMessage: null,
      },
    });

    if (existing) {
      updated++;
    } else {
      created++;
    }

    // One bad listing (a malformed record, a transient LLM error) must not
    // abort the rest of the source's run — logged onto the raw listing
    // itself and counted, not thrown.
    try {
      const outcome = await processRawListing(rawListing, SITE_BASE_URL, {
        // A source that's been auto-disabled after repeated failures (see
        // run.ts FAILURE_THRESHOLD) still gets its listings processed —
        // just never straight to PUBLISHED — until a human re-enables it.
        allowAutoPublish: source.autoPublishEnabled,
      });
      if (outcome.status === "REJECTED") {
        rejected++;
      }
    } catch (error) {
      processingErrors++;
      await prisma.rawListing.update({
        where: { id: rawListing.id },
        data: {
          status: "ERROR",
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  return { sourceSlug: source.slug, discovered: records.length, created, updated, rejected, processingErrors };
}
