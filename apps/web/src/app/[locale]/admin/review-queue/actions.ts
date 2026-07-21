"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@istanbul-guide/db";

export async function resolveReviewItem(
  itemId: string,
  eventId: string,
  decision: "PUBLISHED" | "REJECTED",
): Promise<void> {
  await prisma.$transaction([
    prisma.event.update({
      where: { id: eventId },
      data: { status: decision, publishedAt: decision === "PUBLISHED" ? new Date() : undefined },
    }),
    prisma.reviewQueueItem.update({
      where: { id: itemId },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    }),
  ]);
  revalidatePath("/[locale]/admin/review-queue", "page");
  revalidatePath("/[locale]/admin", "page");
  revalidatePath("/[locale]/events", "page");
}
