import { prisma, type RawListing, type Prisma } from "@istanbul-guide/db";
import { normalizedRecordSchema } from "@istanbul-guide/shared";
import { cleanRecord } from "./agents/cleaner.js";
import { categorize } from "./agents/category.js";
import { findDuplicateEvent } from "./agents/dedupe.js";
import { writeCopy } from "./agents/writer.js";
import { translateToTurkish } from "./agents/translation.js";
import { generateSeo } from "./agents/seo.js";
import { scoreQuality } from "./agents/quality.js";
import { createInitialEventSource, recordEventSource } from "./event-source-merge.js";

export type PipelineOutcome =
  | { status: "PUBLISHED" | "REVIEW" | "REJECTED"; eventId: string }
  | { status: "DUPLICATE"; existingEventId: string };

async function logStep(
  entityId: string,
  agentName: string,
  status: "ok" | "error",
  extra?: { confidenceScore?: number; error?: string },
): Promise<void> {
  await prisma.aiLog.create({
    data: {
      entityType: "raw_listing",
      entityId,
      agentName,
      status,
      confidenceScore: extra?.confidenceScore,
      outputSnapshot: extra?.error ? { error: extra.error } : undefined,
    },
  });
}

export async function processRawListing(
  rawListing: RawListing,
  siteBaseUrl: string,
): Promise<PipelineOutcome> {
  const record = normalizedRecordSchema.parse(rawListing.rawPayload);

  const facts = await cleanRecord(record);
  await logStep(rawListing.id, "cleaner", "ok");

  const categorization = await categorize(facts, record.districtHint);
  await logStep(rawListing.id, "category", "ok");

  if (!facts.startAt) {
    throw new Error(`Cannot create an Event without a start date (raw listing ${rawListing.id})`);
  }

  const [category, district] = await Promise.all([
    prisma.category.findUniqueOrThrow({ where: { slug: categorization.categorySlug } }),
    categorization.districtSlug
      ? prisma.district.findUnique({ where: { slug: categorization.districtSlug } })
      : Promise.resolve(null),
  ]);

  const duplicate = await findDuplicateEvent(
    facts.name,
    facts.venueName,
    category.id,
    district?.id ?? null,
    facts.startAt,
  );
  if (duplicate) {
    await logStep(rawListing.id, "dedupe", "ok", { confidenceScore: duplicate.similarity });

    // Not discarded — recorded as an additional source for the same
    // canonical event, promoted to primary if it outranks the current one.
    await recordEventSource(
      {
        eventId: duplicate.eventId,
        sourceId: rawListing.sourceId,
        rawListingId: rawListing.id,
        sourceExternalId: rawListing.sourceExternalId,
        sourceUrl: record.sourceUrl,
      },
      facts,
    );

    await prisma.rawListing.update({
      where: { id: rawListing.id },
      data: { status: "PROCESSED" },
    });
    return { status: "DUPLICATE", existingEventId: duplicate.eventId };
  }
  await logStep(rawListing.id, "dedupe", "ok", { confidenceScore: 0 });

  const englishCopy = await writeCopy(facts, categorization);
  await logStep(rawListing.id, "writer", "ok");

  const turkishCopy = await translateToTurkish(englishCopy);
  await logStep(rawListing.id, "translation", "ok");

  const seo = await generateSeo({
    copy: { en: englishCopy, tr: turkishCopy },
    facts,
    categorization,
    siteBaseUrl,
  });
  await logStep(rawListing.id, "seo", "ok");

  const quality = scoreQuality(facts, categorization, record.images.length > 0);
  await logStep(rawListing.id, "quality", "ok", { confidenceScore: quality.score });

  const tags = categorization.tagSlugs.length
    ? await prisma.tag.findMany({ where: { slug: { in: categorization.tagSlugs } } })
    : [];

  const now = new Date();
  const event = await prisma.event.create({
    data: {
      sourceId: rawListing.sourceId,
      sourceUrl: record.sourceUrl,
      categoryId: category.id,
      districtId: district?.id,
      startAt: new Date(facts.startAt),
      endAt: facts.endAt ? new Date(facts.endAt) : undefined,
      price: facts.isFree
        ? { isFree: true }
        : { isFree: false, amount: facts.priceAmount, currency: facts.priceCurrency },
      status: quality.decision,
      confidenceScore: quality.score,
      publishedAt: quality.decision === "PUBLISHED" ? now : undefined,
      tags: { create: tags.map((tag) => ({ tagId: tag.id })) },
      translations: {
        create: [
          {
            locale: "en",
            name: englishCopy.name,
            description: englishCopy.description,
            slug: seo.en.slug,
            metaTitle: seo.en.metaTitle,
            metaDescription: seo.en.metaDescription,
            canonicalUrl: seo.en.canonicalUrl,
            keywords: seo.en.keywords,
            ogTitle: seo.en.ogTitle,
            ogDescription: seo.en.ogDescription,
            schemaJsonLd: seo.en.schemaJsonLd as Prisma.InputJsonValue,
          },
          {
            locale: "tr",
            name: turkishCopy.name,
            description: turkishCopy.description,
            slug: seo.tr.slug,
            metaTitle: seo.tr.metaTitle,
            metaDescription: seo.tr.metaDescription,
            canonicalUrl: seo.tr.canonicalUrl,
            keywords: seo.tr.keywords,
            ogTitle: seo.tr.ogTitle,
            ogDescription: seo.tr.ogDescription,
            schemaJsonLd: seo.tr.schemaJsonLd as Prisma.InputJsonValue,
          },
        ],
      },
    },
  });

  await createInitialEventSource({
    eventId: event.id,
    sourceId: rawListing.sourceId,
    rawListingId: rawListing.id,
    sourceExternalId: rawListing.sourceExternalId,
    sourceUrl: record.sourceUrl,
  });

  if (quality.decision === "REVIEW") {
    await prisma.reviewQueueItem.create({
      data: {
        entityType: "event",
        entityId: event.id,
        reason: quality.reasons.join("; ") || "below auto-publish confidence threshold",
        confidenceScore: quality.score,
      },
    });
  }

  await prisma.rawListing.update({
    where: { id: rawListing.id },
    data: { status: "PROCESSED" },
  });

  return { status: quality.decision, eventId: event.id };
}
