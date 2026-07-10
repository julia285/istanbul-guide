import { prisma } from "@istanbul-guide/db";

// One-off backfill for the 11 events published by
// manual-publish-yabangee.ts, before the `sourceUrl` column existed.
// Values are the real source article URLs pulled from the original
// raw_listings.rawPayload fetch (see conversation 2026-07-10).
const SOURCE_URLS: Record<string, string> = {
  "Girli at Zorlu PSM": "https://yabangee.com/girli-zorlu-psm/",
  "The Bodyguard Musical at Zorlu PSM": "https://yabangee.com/bodyguard-musical-zorlu-psm/",
  "FJAAK at Flux — RX Saturdaze": "https://yabangee.com/rx-saturdaze-fjaak/",
  "GIGI FM at Flux — RX Saturdaze": "https://yabangee.com/rx-saturdaze-gigi-fm-flux/",
  "Adriana Lopez at Flux — RX Saturdaze": "https://yabangee.com/rx-saturdaze-adriana-lopez/",
  "DJ Boris at Flux — RX Saturdaze": "https://yabangee.com/rx-saturdaze-boris-flux/",
  "Tommy Four Seven at Flux — RX Saturdaze": "https://yabangee.com/tommy-four-seven-flux/",
  "David Garrett at Harbiye Open Air Theatre": "https://yabangee.com/david-garrett-harbiye-open-air-theatre/",
  "Regal at Flux — RX Fridaze": "https://yabangee.com/regal-flux-rx/",
  "Lamb of God at Bonus Parkorman": "https://yabangee.com/lamb-of-god-bonus-parkorman/",
  "Kovacs at IF Performance Hall Beşiktaş": "https://yabangee.com/kovacs-if-performance/",
  "I Hate Models: Disco Inferno at Life Park": "https://yabangee.com/i-hate-models-rx/",
};

async function main(): Promise<void> {
  const translations = await prisma.eventTranslation.findMany({
    where: { locale: "en", name: { in: Object.keys(SOURCE_URLS) } },
    select: { eventId: true, name: true },
  });

  for (const t of translations) {
    const sourceUrl = SOURCE_URLS[t.name];
    await prisma.event.update({ where: { id: t.eventId }, data: { sourceUrl } });
    console.log(`updated ${t.name} -> ${sourceUrl}`);
  }
  console.log(`done: ${translations.length} events updated`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
