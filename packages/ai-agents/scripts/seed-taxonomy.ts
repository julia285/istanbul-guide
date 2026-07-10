import { prisma } from "@istanbul-guide/db";
import { CATEGORIES, DISTRICTS, TAGS } from "../src/taxonomy.js";

async function main(): Promise<void> {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: {
        slug: category.slug,
        translations: {
          create: [
            { locale: "en", name: category.en },
            { locale: "tr", name: category.tr },
          ],
        },
      },
      update: {},
    });
  }
  console.log(`Seeded ${CATEGORIES.length} categories`);

  for (const district of DISTRICTS) {
    await prisma.district.upsert({
      where: { slug: district.slug },
      create: {
        slug: district.slug,
        translations: {
          create: [
            { locale: "en", name: district.en },
            { locale: "tr", name: district.tr },
          ],
        },
      },
      update: {},
    });
  }
  console.log(`Seeded ${DISTRICTS.length} districts`);

  for (const tag of TAGS) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      create: {
        slug: tag.slug,
        translations: {
          create: [
            { locale: "en", name: tag.en },
            { locale: "tr", name: tag.tr },
          ],
        },
      },
      update: {},
    });
  }
  console.log(`Seeded ${TAGS.length} tags`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
