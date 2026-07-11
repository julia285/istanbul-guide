import { prisma } from "@istanbul-guide/db";

async function main(): Promise<void> {
  const restaurantCount = await prisma.place.count({
    where: { status: "PUBLISHED", category: { slug: "restaurants" } },
  });
  const withAddress = await prisma.place.count({
    where: { status: "PUBLISHED", category: { slug: "restaurants" }, addressText: { not: null } },
  });
  const collections = await prisma.article.count({ where: { status: "PUBLISHED", type: "LISTICLE" } });
  console.log({ restaurantCount, withAddress, collections });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
