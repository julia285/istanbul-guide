import { prisma } from "@istanbul-guide/db";

// Creates the Source rows the scheduler (apps/workers) needs to actually
// run BUGECE/Bubilet — neither has ever been created in the database.
// intervalMinutes: 720 = twice a day. The scheduler wakes every minute to
// check what's due (apps/workers/src/scheduler/run.ts), but that check is
// cheap (one query, no fetching) — actual scraping/AI-pipeline work only
// happens for a source once every `intervalMinutes`, per-source.
const SOURCES = [
  {
    slug: "bugece",
    name: "BUGECE",
    baseUrl: "https://bugece.co",
    type: "SCRAPE" as const,
    // Ticket seller for its own listed events, not just an aggregator
    // pointing elsewhere — see Source.priority comment in schema.prisma.
    priority: 1,
    intervalMinutes: 720,
    scrapeConfig: { listingUrls: ["https://bugece.co/en/browse/istanbul/events"] },
  },
  {
    slug: "bubilet",
    name: "Bubilet",
    baseUrl: "https://www.bubilet.com.tr",
    type: "SCRAPE" as const,
    priority: 1,
    intervalMinutes: 720,
    scrapeConfig: { listingUrls: ["https://www.bubilet.com.tr/istanbul"] },
  },
];

async function main(): Promise<void> {
  for (const source of SOURCES) {
    await prisma.source.upsert({
      where: { slug: source.slug },
      create: source,
      update: {
        baseUrl: source.baseUrl,
        type: source.type,
        priority: source.priority,
        intervalMinutes: source.intervalMinutes,
        scrapeConfig: source.scrapeConfig,
      },
    });
  }
  console.log(`Seeded ${SOURCES.length} sources: ${SOURCES.map((s) => s.slug).join(", ")}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
