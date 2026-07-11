import { prisma, type Source, type Prisma } from "@istanbul-guide/db";
import { hashNormalizedRecord } from "@istanbul-guide/shared/content-hash";
import { buildAdapter } from "../adapters/registry.js";

export interface RunSourceResult {
  sourceSlug: string;
  discovered: number;
  created: number;
  updated: number;
}

export async function runSource(source: Source): Promise<RunSourceResult> {
  const adapter = buildAdapter(source);
  const records = await adapter.collect();

  let created = 0;
  let updated = 0;
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

    await prisma.rawListing.upsert({
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
      },
    });

    if (existing) {
      updated++;
    } else {
      created++;
    }
  }

  return { sourceSlug: source.slug, discovered: records.length, created, updated };
}
