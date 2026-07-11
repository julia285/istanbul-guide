import { prisma } from "@istanbul-guide/db";

// One-off backfill: create the EventSource ledger row for each of the 12
// events published manually before EventSource existed, so a future
// Yabangee re-parse recognizes them (matches on sourceId+sourceExternalId)
// instead of treating them as new/duplicate. rawListingId values are from
// manual-publish-yabangee.ts; sourceUrl/ticketUrl match the earlier
// backfill scripts. See conversation 2026-07-11.
const EVENTS: Array<{ name: string; rawListingId: string; sourceUrl: string; ticketUrl: string }> = [
  {
    name: "Girli at Zorlu PSM",
    rawListingId: "cmrce3mor0001cassw3e7fsji",
    sourceUrl: "https://yabangee.com/girli-zorlu-psm/",
    ticketUrl: "https://www.passo.com.tr/en/event/girli-zorlupsm-passo/11639319",
  },
  {
    name: "The Bodyguard Musical at Zorlu PSM",
    rawListingId: "cmrce3ol50003cass6seqg9nf",
    sourceUrl: "https://yabangee.com/bodyguard-musical-zorlu-psm/",
    ticketUrl:
      "https://www.passo.com.tr/en/event/bodyguard-muzikali-zorlupsm-turkcell-sahnesi-biletleri/11485326",
  },
  {
    name: "FJAAK at Flux — RX Saturdaze",
    rawListingId: "cmrce3pr00005cass6w5yukb8",
    sourceUrl: "https://yabangee.com/rx-saturdaze-fjaak/",
    ticketUrl: "https://bugece.co/en/event/rx-saturdaze-fjaak-09-19-26--fb96d30b",
  },
  {
    name: "GIGI FM at Flux — RX Saturdaze",
    rawListingId: "cmrce3r4h0007cass28xghc41",
    sourceUrl: "https://yabangee.com/rx-saturdaze-gigi-fm-flux/",
    ticketUrl: "https://bugece.co/en/event/rx-saturdaze-gigi-fm-08-15-26--5af0773f",
  },
  {
    name: "Adriana Lopez at Flux — RX Saturdaze",
    rawListingId: "cmrce3s7s0009casspeohozeg",
    sourceUrl: "https://yabangee.com/rx-saturdaze-adriana-lopez/",
    ticketUrl: "https://bugece.co/en/event/rx-saturdaze-adriana-lopez-08-08-26--c8d17a4e",
  },
  {
    name: "DJ Boris at Flux — RX Saturdaze",
    rawListingId: "cmrce3tcf000bcassp2krkm9j",
    sourceUrl: "https://yabangee.com/rx-saturdaze-boris-flux/",
    ticketUrl: "https://bugece.co/en/event/rx-saturdaze-boris-07-18-26",
  },
  {
    name: "Tommy Four Seven at Flux — RX Saturdaze",
    rawListingId: "cmrce3uqx000dcassc53ekjy9",
    sourceUrl: "https://yabangee.com/tommy-four-seven-flux/",
    ticketUrl: "https://bugece.co/en/event/rx-saturdaze-tommy-four-seven-08-01-26--9a212f75",
  },
  {
    name: "David Garrett at Harbiye Open Air Theatre",
    rawListingId: "cmrce3vyx000fcass0hky2pg8",
    sourceUrl: "https://yabangee.com/david-garrett-harbiye-open-air-theatre/",
    ticketUrl:
      "https://biletinial.com/tr-tr/muzik/david-garrett-millenium-symphony-open-air-tour-ikibinyirmialti",
  },
  {
    name: "Regal at Flux — RX Fridaze",
    rawListingId: "cmrce3x8e000hcasszyfqw6dh",
    sourceUrl: "https://yabangee.com/regal-flux-rx/",
    ticketUrl: "https://bugece.co/en/event/rx-fridaze-regal-07-24-26--f9ceafca",
  },
  {
    name: "Lamb of God at Bonus Parkorman",
    rawListingId: "cmrce40kt000jcasssv7cz7ap",
    sourceUrl: "https://yabangee.com/lamb-of-god-bonus-parkorman/",
    ticketUrl: "https://biletinial.com/tr-tr/muzik/lamb-of-god",
  },
  {
    name: "Kovacs at IF Performance Hall Beşiktaş",
    rawListingId: "cmrce4f9s000ncassewmfqvub",
    sourceUrl: "https://yabangee.com/kovacs-if-performance/",
    ticketUrl: "https://www.bubilet.com.tr/istanbul/etkinlik/-100-muzik-sunar-kovacs-istanbul",
  },
  {
    name: "I Hate Models: Disco Inferno at Life Park",
    rawListingId: "cmrce4mub000pcassr8rmaeqh",
    sourceUrl: "https://yabangee.com/i-hate-models-rx/",
    ticketUrl: "https://bugece.co/en/event/i-hate-models-presents-disco-inferno-07-04-26--3feb34d3",
  },
];

async function main(): Promise<void> {
  const yabangee = await prisma.source.findUniqueOrThrow({ where: { slug: "yabangee" } });

  for (const item of EVENTS) {
    const [translation, rawListing] = await Promise.all([
      prisma.eventTranslation.findFirst({
        where: { locale: "en", name: item.name },
        select: { eventId: true },
      }),
      prisma.rawListing.findUniqueOrThrow({ where: { id: item.rawListingId } }),
    ]);

    if (!translation) {
      console.warn(`skip: no event found for "${item.name}"`);
      continue;
    }

    await prisma.eventSource.upsert({
      where: {
        sourceId_sourceExternalId: {
          sourceId: yabangee.id,
          sourceExternalId: rawListing.sourceExternalId,
        },
      },
      create: {
        eventId: translation.eventId,
        sourceId: yabangee.id,
        rawListingId: rawListing.id,
        sourceExternalId: rawListing.sourceExternalId,
        sourceUrl: item.sourceUrl,
        priority: yabangee.priority,
        isPrimary: true,
      },
      update: {},
    });
    console.log(`linked ${item.name} -> EventSource (yabangee, primary)`);
  }
  console.log(`done: ${EVENTS.length} events processed`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
