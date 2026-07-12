"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma, Prisma, type ContentStatus } from "@istanbul-guide/db";
import { slugify } from "@istanbul-guide/shared";

export async function createCollection(formData: FormData): Promise<void> {
  const titleEn = String(formData.get("titleEn") ?? "").trim();
  const titleTr = String(formData.get("titleTr") ?? "").trim();
  const bodyEn = String(formData.get("bodyEn") ?? "").trim();
  const bodyTr = String(formData.get("bodyTr") ?? "").trim();
  const publishNow = formData.get("publishNow") === "on";

  if (!titleEn || !titleTr || !bodyEn || !bodyTr) {
    redirect("/admin/collections/new?error=missing-fields");
  }

  const placeIds = formData.getAll("placeId").map(String);
  const items = placeIds
    .map((placeId, index) => {
      const positionRaw = formData.get(`position_${placeId}`);
      const position = positionRaw ? Number(positionRaw) : index;
      return { placeId, position: Number.isFinite(position) ? position : index };
    })
    .sort((a, b) => a.position - b.position)
    .map((item, index) => ({ placeId: item.placeId, position: index }));

  if (items.length === 0) {
    redirect("/admin/collections/new?error=no-restaurants");
  }

  const enSlug = slugify(titleEn);
  const trSlug = slugify(titleTr);
  const now = new Date();
  const status: ContentStatus = publishNow ? "PUBLISHED" : "DRAFT";

  try {
    await prisma.article.create({
      data: {
        type: "LISTICLE",
        status,
        confidenceScore: 1,
        publishedAt: publishNow ? now : undefined,
        translations: {
          create: [
            { locale: "en", title: titleEn, body: bodyEn, slug: enSlug, metaTitle: titleEn, metaDescription: bodyEn.slice(0, 155), ogTitle: titleEn, ogDescription: bodyEn.slice(0, 155) },
            { locale: "tr", title: titleTr, body: bodyTr, slug: trSlug, metaTitle: titleTr, metaDescription: bodyTr.slice(0, 155), ogTitle: titleTr, ogDescription: bodyTr.slice(0, 155) },
          ],
        },
        items: { create: items },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect("/admin/collections/new?error=duplicate-slug");
    }
    throw error;
  }

  revalidatePath("/[locale]/admin/collections", "page");
  revalidatePath("/[locale]/restaurants", "page");
  redirect("/admin/collections");
}

export async function setArticleStatus(articleId: string, status: ContentStatus): Promise<void> {
  await prisma.article.update({
    where: { id: articleId },
    data: { status, publishedAt: status === "PUBLISHED" ? new Date() : undefined },
  });
  revalidatePath("/[locale]/admin/collections", "page");
  revalidatePath("/[locale]/restaurants", "page");
}
