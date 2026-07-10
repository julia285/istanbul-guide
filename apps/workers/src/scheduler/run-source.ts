import { prisma, type Source, type Prisma } from "@istanbul-guide/db";
import { hashNormalizedRecord } from "@istanbul-guide/shared/content-hash";
import { buildAdapter } from "../adapters/registry.js";

export async function runSource(source: Source): Promise<{
  sourceSlug: string;
  fetched: number;
  changed: number;
}> {
  const adapter = buildAdapter(source);
  const records = await adapter.collect();

  let changed = 0;
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
    changed++;
  }

  await prisma.source.update({
    where: { id: source.id },
    data: { lastRunAt: new Date(), healthStatus: "ok" },
  });

  return { sourceSlug: source.slug, fetched: records.length, changed };
}
