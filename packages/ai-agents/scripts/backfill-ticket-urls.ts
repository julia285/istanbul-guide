import { prisma } from "@istanbul-guide/db";

// One-off backfill: real ticket-seller links found by reading the full
// source article for each of the 12 Yabangee-sourced events (the RSS
// excerpt alone doesn't include them). See conversation 2026-07-10.
const TICKET_URLS: Record<string, string> = {
  "Girli at Zorlu PSM": "https://www.passo.com.tr/en/event/girli-zorlupsm-passo/11639319",
  "The Bodyguard Musical at Zorlu PSM":
    "https://www.passo.com.tr/en/event/bodyguard-muzikali-zorlupsm-turkcell-sahnesi-biletleri/11485326",
  "FJAAK at Flux — RX Saturdaze": "https://bugece.co/en/event/rx-saturdaze-fjaak-09-19-26--fb96d30b",
  "GIGI FM at Flux — RX Saturdaze": "https://bugece.co/en/event/rx-saturdaze-gigi-fm-08-15-26--5af0773f",
  "Adriana Lopez at Flux — RX Saturdaze":
    "https://bugece.co/en/event/rx-saturdaze-adriana-lopez-08-08-26--c8d17a4e",
  "DJ Boris at Flux — RX Saturdaze": "https://bugece.co/en/event/rx-saturdaze-boris-07-18-26",
  "Tommy Four Seven at Flux — RX Saturdaze":
    "https://bugece.co/en/event/rx-saturdaze-tommy-four-seven-08-01-26--9a212f75",
  "David Garrett at Harbiye Open Air Theatre":
    "https://biletinial.com/tr-tr/muzik/david-garrett-millenium-symphony-open-air-tour-ikibinyirmialti",
  "Regal at Flux — RX Fridaze": "https://bugece.co/en/event/rx-fridaze-regal-07-24-26--f9ceafca",
  "Lamb of God at Bonus Parkorman": "https://biletinial.com/tr-tr/muzik/lamb-of-god",
  "Kovacs at IF Performance Hall Beşiktaş":
    "https://www.bubilet.com.tr/istanbul/etkinlik/-100-muzik-sunar-kovacs-istanbul",
  "I Hate Models: Disco Inferno at Life Park":
    "https://bugece.co/en/event/i-hate-models-presents-disco-inferno-07-04-26--3feb34d3",
};

async function main(): Promise<void> {
  const translations = await prisma.eventTranslation.findMany({
    where: { locale: "en", name: { in: Object.keys(TICKET_URLS) } },
    select: { eventId: true, name: true },
  });

  for (const t of translations) {
    const ticketUrl = TICKET_URLS[t.name];
    await prisma.event.update({ where: { id: t.eventId }, data: { ticketUrl } });
    console.log(`updated ${t.name} -> ${ticketUrl}`);
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
