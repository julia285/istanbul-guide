"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma, Prisma, type ContentStatus } from "@istanbul-guide/db";
import { slugify } from "@istanbul-guide/shared";

const SITE_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://istanbul-guide-delta.vercel.app";

export async function createRestaurant(formData: FormData): Promise<void> {
  const nameEn = String(formData.get("nameEn") ?? "").trim();
  const nameTr = String(formData.get("nameTr") ?? "").trim();
  const descriptionEn = String(formData.get("descriptionEn") ?? "").trim();
  const descriptionTr = String(formData.get("descriptionTr") ?? "").trim();
  const districtId = String(formData.get("districtId") ?? "") || undefined;
  const priceTier = (String(formData.get("priceTier") ?? "") || undefined) as
    | "BUDGET"
    | "MODERATE"
    | "EXPENSIVE"
    | undefined;
  const addressText = String(formData.get("addressText") ?? "").trim() || undefined;
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim() || undefined;
  const website = String(formData.get("website") ?? "").trim() || undefined;
  const publishNow = formData.get("publishNow") === "on";
  const tagSlugs = formData.getAll("tags").map(String);

  if (!nameEn || !nameTr || !descriptionEn || !descriptionTr) {
    redirect("/admin/restaurants/new?error=missing-fields");
  }

  const category = await prisma.category.findUniqueOrThrow({ where: { slug: "restaurants" } });
  const tags = tagSlugs.length ? await prisma.tag.findMany({ where: { slug: { in: tagSlugs } } }) : [];

  const enSlug = slugify(nameEn);
  const trSlug = slugify(nameTr);
  const now = new Date();
  const status: ContentStatus = publishNow ? "PUBLISHED" : "DRAFT";

  try {
    await prisma.place.create({
      data: {
        categoryId: category.id,
        districtId,
        priceTier,
        addressText,
        sourceUrl,
        contact: website ? { website } : undefined,
        status,
        confidenceScore: 1,
        publishedAt: publishNow ? now : undefined,
        tags: { create: tags.map((tag) => ({ tagId: tag.id })) },
        translations: {
          create: [
            {
              locale: "en",
              name: nameEn,
              description: descriptionEn,
              slug: enSlug,
              metaTitle: nameEn,
              metaDescription: descriptionEn.slice(0, 155),
              canonicalUrl: `${SITE_BASE_URL}/en/restaurants/${enSlug}`,
              keywords: [],
              ogTitle: nameEn,
              ogDescription: descriptionEn.slice(0, 155),
            },
            {
              locale: "tr",
              name: nameTr,
              description: descriptionTr,
              slug: trSlug,
              metaTitle: nameTr,
              metaDescription: descriptionTr.slice(0, 155),
              canonicalUrl: `${SITE_BASE_URL}/tr/restaurants/${trSlug}`,
              keywords: [],
              ogTitle: nameTr,
              ogDescription: descriptionTr.slice(0, 155),
            },
          ],
        },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect("/admin/restaurants/new?error=duplicate-slug");
    }
    throw error;
  }

  revalidatePath("/[locale]/admin/restaurants", "page");
  revalidatePath("/[locale]/restaurants", "page");
  redirect("/admin/restaurants");
}

export async function setPlaceStatus(placeId: string, status: ContentStatus): Promise<void> {
  await prisma.place.update({
    where: { id: placeId },
    data: { status, publishedAt: status === "PUBLISHED" ? new Date() : undefined },
  });
  revalidatePath("/[locale]/admin/restaurants", "page");
  revalidatePath("/[locale]/restaurants", "page");
}
