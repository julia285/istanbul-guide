import { prisma, Prisma } from "@istanbul-guide/db";
import type { CleanedFacts } from "./schemas/cleaned-facts.js";

interface EventSourceInput {
  eventId: string;
  sourceId: string;
  rawListingId: string;
  sourceExternalId: string;
  sourceUrl: string;
  ticketUrl?: string;
}

// First source to report a brand-new event — always starts as primary.
export async function createInitialEventSource(input: EventSourceInput): Promise<void> {
  const source = await prisma.source.findUniqueOrThrow({ where: { id: input.sourceId } });
  await prisma.eventSource.create({
    data: {
      eventId: input.eventId,
      sourceId: input.sourceId,
      rawListingId: input.rawListingId,
      sourceExternalId: input.sourceExternalId,
      sourceUrl: input.sourceUrl,
      priority: source.priority,
      isPrimary: true,
    },
  });
}

function detectConflicts(facts: CleanedFacts, event: { startAt: Date; price: unknown }): Record<string, unknown> {
  const conflicts: Record<string, unknown> = {};
  if (facts.startAt && new Date(facts.startAt).getTime() !== event.startAt.getTime()) {
    conflicts.startAt = facts.startAt;
  }
  const existingIsFree = (event.price as { isFree?: boolean } | null)?.isFree;
  if (existingIsFree !== undefined && existingIsFree !== facts.isFree) {
    conflicts.isFree = facts.isFree;
  }
  return conflicts;
}

// A second (or third...) source reports an event that dedupe.ts already
// matched to an existing canonical Event — record it in the ledger instead
// of discarding it, flag any factual disagreements for admin review, and
// promote it to primary if it outranks the current one (lower priority
// number wins — see Source.priority comment in schema.prisma).
export async function recordEventSource(input: EventSourceInput, facts: CleanedFacts): Promise<void> {
  const [source, event] = await Promise.all([
    prisma.source.findUniqueOrThrow({ where: { id: input.sourceId } }),
    prisma.event.findUniqueOrThrow({ where: { id: input.eventId } }),
  ]);

  const conflicts = detectConflicts(facts, event);

  await prisma.eventSource.upsert({
    where: {
      sourceId_sourceExternalId: { sourceId: input.sourceId, sourceExternalId: input.sourceExternalId },
    },
    create: {
      eventId: input.eventId,
      sourceId: input.sourceId,
      rawListingId: input.rawListingId,
      sourceExternalId: input.sourceExternalId,
      sourceUrl: input.sourceUrl,
      priority: source.priority,
      conflictingFields: Object.keys(conflicts).length
        ? (conflicts as Prisma.InputJsonValue)
        : undefined,
    },
    update: {
      sourceUrl: input.sourceUrl,
      lastSeenAt: new Date(),
      conflictingFields: Object.keys(conflicts).length
        ? (conflicts as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    },
  });

  const currentPrimary = await prisma.eventSource.findFirst({
    where: { eventId: input.eventId, isPrimary: true },
  });

  if (!currentPrimary || source.priority < currentPrimary.priority) {
    await prisma.$transaction([
      prisma.eventSource.updateMany({ where: { eventId: input.eventId }, data: { isPrimary: false } }),
      prisma.eventSource.update({
        where: {
          sourceId_sourceExternalId: { sourceId: input.sourceId, sourceExternalId: input.sourceExternalId },
        },
        data: { isPrimary: true },
      }),
      prisma.event.update({
        where: { id: input.eventId },
        data: { sourceId: input.sourceId, sourceUrl: input.sourceUrl, ticketUrl: input.ticketUrl },
      }),
    ]);
  }
}
