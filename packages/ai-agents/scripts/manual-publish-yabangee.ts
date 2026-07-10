import { prisma, type Prisma } from "@istanbul-guide/db";
import { slugify } from "@istanbul-guide/shared";

// One-off manual run standing in for the paid AI pipeline (see conversation
// with the site owner, 2026-07-09): the owner wanted to see real published
// pages before funding the Anthropic API. Every field below was produced by
// reading the actual raw_listings content and writing original copy from
// those facts — same discipline the Writer Agent enforces (never copy
// source text) — just done by hand instead of via API call. Once the API
// is funded, packages/ai-agents/src/pipeline.ts takes over for new listings;
// this script is not part of the ongoing pipeline.

const SITE_BASE_URL = process.env.SITE_BASE_URL ?? "http://localhost:3000";

interface ManualEvent {
  rawListingId: string;
  venueName: string;
  categorySlug: string;
  districtSlug: string | null;
  startAt: string;
  endAt?: string;
  isOutdoor: boolean;
  isFree: boolean;
  tags: string[];
  status: "PUBLISHED" | "EXPIRED";
  en: { name: string; description: string; metaTitle: string; metaDescription: string; keywords: string[] };
  tr: { name: string; description: string; metaTitle: string; metaDescription: string; keywords: string[] };
}

const EVENTS: ManualEvent[] = [
  {
    rawListingId: "cmrce3mor0001cassw3e7fsji",
    venueName: "Zorlu PSM",
    categorySlug: "concerts",
    districtSlug: "besiktas",
    startAt: "2026-10-09T19:00:00+03:00",
    isOutdoor: false,
    isFree: false,
    tags: ["live-music", "indoor", "expat-friendly"],
    status: "PUBLISHED",
    en: {
      name: "Girli at Zorlu PSM",
      description:
        "British singer-songwriter Girli brings her genre-blending mix of pop, punk, and hyperpop to Zorlu PSM this October. Known for candid, humor-laced songwriting about identity and mental health, her live shows pair sharp pop hooks with an unfiltered, DIY energy.",
      metaTitle: "Girli Live at Zorlu PSM, Istanbul",
      metaDescription: "British pop-punk artist Girli performs at Zorlu PSM this October — candid songwriting meets high-energy live show.",
      keywords: ["Girli Istanbul", "Zorlu PSM concerts", "pop punk Istanbul", "Istanbul concerts October"],
    },
    tr: {
      name: "Zorlu PSM'de Girli",
      description:
        "İngiliz şarkıcı-söz yazarı Girli, pop, punk ve hyperpop'u harmanlayan tarzını bu Ekim'de Zorlu PSM'ye taşıyor. Kimlik ve ruh sağlığı üzerine samimi, esprili şarkı sözleriyle tanınan sanatçı, sahne performanslarında keskin pop nakaratlarını filtresiz bir enerjiyle birleştiriyor.",
      metaTitle: "Girli Zorlu PSM'de – İstanbul Konseri",
      metaDescription: "İngiliz pop-punk sanatçısı Girli bu Ekim'de Zorlu PSM'de sahne alıyor.",
      keywords: ["Girli İstanbul", "Zorlu PSM konser", "pop punk İstanbul"],
    },
  },
  {
    rawListingId: "cmrce3ol50003cass6seqg9nf",
    venueName: "Zorlu PSM",
    categorySlug: "theater",
    districtSlug: "besiktas",
    startAt: "2026-09-11T20:00:00+03:00",
    endAt: "2026-09-20T22:00:00+03:00",
    isOutdoor: false,
    isFree: false,
    tags: ["indoor", "tourist-friendly", "expat-friendly"],
    status: "PUBLISHED",
    en: {
      name: "The Bodyguard Musical at Zorlu PSM",
      description:
        "The stage adaptation of the iconic 1992 film starring Whitney Houston and Kevin Costner makes its Istanbul debut at Zorlu PSM this September. Expect a run that blends romance, suspense, and a soundtrack of Whitney Houston hits, staged for the first time in the city.",
      metaTitle: "The Bodyguard Musical – Istanbul Premiere",
      metaDescription: "The Bodyguard Musical, based on the Whitney Houston film, makes its Istanbul debut at Zorlu PSM this September.",
      keywords: ["Bodyguard Musical Istanbul", "Zorlu PSM theater", "Whitney Houston musical", "Istanbul musicals"],
    },
    tr: {
      name: "Zorlu PSM'de The Bodyguard Musical",
      description:
        "Whitney Houston ve Kevin Costner'ın başrol oynadığı efsanevi 1992 filminin sahne uyarlaması, bu Eylül'de Zorlu PSM'de İstanbul prömiyerini yapıyor. Romantizm, gerilim ve Whitney Houston'ın unutulmaz şarkılarını bir araya getiren gösteri, şehirde ilk kez sahneleniyor.",
      metaTitle: "The Bodyguard Musical – İstanbul Prömiyeri",
      metaDescription: "Whitney Houston filminden uyarlanan The Bodyguard Musical, bu Eylül İstanbul'da Zorlu PSM'de.",
      keywords: ["Bodyguard Musical İstanbul", "Zorlu PSM tiyatro", "müzikal İstanbul"],
    },
  },
  {
    rawListingId: "cmrce3pr00005cass6w5yukb8",
    venueName: "Flux",
    categorySlug: "nightlife",
    districtSlug: "besiktas",
    startAt: "2026-09-19T23:00:00+03:00",
    isOutdoor: false,
    isFree: false,
    tags: ["live-music", "indoor"],
    status: "PUBLISHED",
    en: {
      name: "FJAAK at Flux — RX Saturdaze",
      description:
        "Berlin duo FJAAK headline RX Saturdaze at Flux, bringing their signature mix of techno, breakbeat, and jungle straight from the city's DIY underground scene. Expect an analogue-heavy set from two of the most talked-about names in the current European club circuit.",
      metaTitle: "FJAAK at Flux: RX Saturdaze Istanbul",
      metaDescription: "Berlin techno duo FJAAK headline RX Saturdaze at Flux nightclub, Istanbul.",
      keywords: ["FJAAK Istanbul", "Flux nightclub", "RX Saturdaze", "techno Istanbul"],
    },
    tr: {
      name: "Flux'ta FJAAK — RX Saturdaze",
      description:
        "Berlin ikilisi FJAAK, RX Saturdaze kapsamında Flux'ta sahne alarak techno, breakbeat ve jungle'ı harmanlayan imza tarzını şehrin DIY underground sahnesinden doğrudan getiriyor. Avrupa kulüp sahnesinin en çok konuşulan isimlerinden ikisinden analog ağırlıklı bir set sizi bekliyor.",
      metaTitle: "FJAAK Flux'ta – RX Saturdaze İstanbul",
      metaDescription: "Berlinli techno ikilisi FJAAK, RX Saturdaze kapsamında Flux'ta sahne alıyor.",
      keywords: ["FJAAK İstanbul", "Flux gece kulübü", "techno İstanbul"],
    },
  },
  {
    rawListingId: "cmrce3r4h0007cass28xghc41",
    venueName: "Flux",
    categorySlug: "nightlife",
    districtSlug: "besiktas",
    startAt: "2026-08-15T23:00:00+03:00",
    isOutdoor: false,
    isFree: false,
    tags: ["live-music", "indoor"],
    status: "PUBLISHED",
    en: {
      name: "GIGI FM at Flux — RX Saturdaze",
      description:
        "DJ, producer, and vocalist GIGI FM takes over Flux for a night moving fluidly between techno, ambient, and experimental club sounds. As a genre-defying multidisciplinary artist, she's built a reputation for sets that resist easy categorization.",
      metaTitle: "GIGI FM at Flux: RX Saturdaze Istanbul",
      metaDescription: "Multidisciplinary artist GIGI FM plays techno, ambient, and experimental sounds at Flux, Istanbul.",
      keywords: ["GIGI FM Istanbul", "Flux nightclub", "RX Saturdaze", "techno Istanbul"],
    },
    tr: {
      name: "Flux'ta GIGI FM — RX Saturdaze",
      description:
        "DJ, prodüktör ve vokalist GIGI FM, techno, ambient ve deneysel kulüp sesleri arasında akıcı bir şekilde gezinen bir gece için Flux'ı devralıyor. Türler arası sınırları aşan çok yönlü bir sanatçı olarak, kolay kategorize edilemeyen setleriyle tanınıyor.",
      metaTitle: "GIGI FM Flux'ta – RX Saturdaze İstanbul",
      metaDescription: "Çok yönlü sanatçı GIGI FM, Flux'ta techno ve deneysel sesler sunuyor.",
      keywords: ["GIGI FM İstanbul", "Flux gece kulübü", "techno İstanbul"],
    },
  },
  {
    rawListingId: "cmrce3s7s0009casspeohozeg",
    venueName: "Flux",
    categorySlug: "nightlife",
    districtSlug: "besiktas",
    startAt: "2026-08-08T23:00:00+03:00",
    isOutdoor: false,
    isFree: false,
    tags: ["live-music", "indoor"],
    status: "PUBLISHED",
    en: {
      name: "Adriana Lopez at Flux — RX Saturdaze",
      description:
        "Colombian DJ and producer Adriana Lopez brings her hypnotic, deep-rooted techno to Flux as part of RX Saturdaze. Her sets favor slow-building progression over instant peaks, making her a fixture at some of the world's most respected clubs.",
      metaTitle: "Adriana Lopez at Flux — RX Saturdaze",
      metaDescription: "Colombian techno DJ Adriana Lopez headlines RX Saturdaze at Flux, Istanbul.",
      keywords: ["Adriana Lopez Istanbul", "Flux nightclub", "RX Saturdaze", "techno Istanbul"],
    },
    tr: {
      name: "Flux'ta Adriana Lopez — RX Saturdaze",
      description:
        "Kolombiyalı DJ ve prodüktör Adriana Lopez, RX Saturdaze kapsamında hipnotik ve köklü techno sesini Flux'a taşıyor. Sette ani doruk noktaları yerine yavaş yavaş yükselen bir ilerlemeyi tercih eden sanatçı, dünyanın en saygın kulüplerinin vazgeçilmez isimlerinden biri.",
      metaTitle: "Adriana Lopez Flux'ta – RX Saturdaze",
      metaDescription: "Kolombiyalı techno DJ'i Adriana Lopez, RX Saturdaze kapsamında Flux'ta sahne alıyor.",
      keywords: ["Adriana Lopez İstanbul", "Flux gece kulübü", "techno İstanbul"],
    },
  },
  {
    rawListingId: "cmrce3tcf000bcassp2krkm9j",
    venueName: "Flux",
    categorySlug: "nightlife",
    districtSlug: "besiktas",
    startAt: "2026-07-18T23:00:00+03:00",
    isOutdoor: false,
    isFree: false,
    tags: ["live-music", "indoor", "weekend"],
    status: "PUBLISHED",
    en: {
      name: "DJ Boris at Flux — RX Saturdaze",
      description:
        "New York house veteran DJ Boris headlines Flux for RX Saturdaze, drawing on decades of experience in the city's underground scene. His marathon sets are built on tribal and progressive house rhythms, balancing driving percussion with melodic late-night moments.",
      metaTitle: "DJ Boris at Flux: RX Saturdaze Istanbul",
      metaDescription: "New York house veteran DJ Boris headlines RX Saturdaze at Flux, Istanbul.",
      keywords: ["DJ Boris Istanbul", "Flux nightclub", "RX Saturdaze", "house music Istanbul"],
    },
    tr: {
      name: "Flux'ta DJ Boris — RX Saturdaze",
      description:
        "New York house sahnesinin duayen ismi DJ Boris, şehrin underground sahnesindeki onlarca yıllık deneyimini RX Saturdaze kapsamında Flux'a taşıyor. Maraton setleri, sürükleyici perküsyonu melodik gece sonu anlarıyla dengeleyen tribal ve progressive house ritimleri üzerine kurulu.",
      metaTitle: "DJ Boris Flux'ta – RX Saturdaze İstanbul",
      metaDescription: "New York house sahnesinin duayeni DJ Boris, RX Saturdaze kapsamında Flux'ta.",
      keywords: ["DJ Boris İstanbul", "Flux gece kulübü", "house müzik İstanbul"],
    },
  },
  {
    rawListingId: "cmrce3uqx000dcassc53ekjy9",
    venueName: "Flux",
    categorySlug: "nightlife",
    districtSlug: "besiktas",
    startAt: "2026-08-01T23:00:00+03:00",
    isOutdoor: false,
    isFree: false,
    tags: ["live-music", "indoor"],
    status: "PUBLISHED",
    en: {
      name: "Tommy Four Seven at Flux — RX Saturdaze",
      description:
        "British producer Tommy Four Seven headlines RX Saturdaze at Flux with over a decade of shaping industrial, hard-edged techno. Known for uncompromising productions and forward-looking marathon sets, he remains one of the genre's defining figures.",
      metaTitle: "Tommy Four Seven at Flux, Istanbul",
      metaDescription: "Industrial techno producer Tommy Four Seven headlines RX Saturdaze at Flux, Istanbul.",
      keywords: ["Tommy Four Seven Istanbul", "Flux nightclub", "industrial techno", "RX Saturdaze"],
    },
    tr: {
      name: "Flux'ta Tommy Four Seven — RX Saturdaze",
      description:
        "İngiliz prodüktör Tommy Four Seven, endüstriyel ve sert techno türünü on yılı aşkın süredir şekillendiren bir isim olarak RX Saturdaze kapsamında Flux'ta sahne alıyor. Ödün vermeyen prodüksiyonları ve ileri görüşlü maraton setleriyle türün en belirleyici isimlerinden biri olmaya devam ediyor.",
      metaTitle: "Tommy Four Seven Flux'ta – İstanbul",
      metaDescription: "Endüstriyel techno prodüktörü Tommy Four Seven, RX Saturdaze kapsamında Flux'ta.",
      keywords: ["Tommy Four Seven İstanbul", "Flux gece kulübü", "endüstriyel techno"],
    },
  },
  {
    rawListingId: "cmrce3vyx000fcass0hky2pg8",
    venueName: "Cemil Topuzlu Harbiye Open Air Theatre",
    categorySlug: "concerts",
    districtSlug: "sisli",
    startAt: "2026-08-29T20:30:00+03:00",
    isOutdoor: true,
    isFree: false,
    tags: ["outdoor", "live-music", "tourist-friendly", "expat-friendly"],
    status: "PUBLISHED",
    en: {
      name: "David Garrett at Harbiye Open Air Theatre",
      description:
        "Virtuoso violinist David Garrett brings his Millennium Symphony Open Air Tour to Harbiye's open-air stage, reimagining pop and rock classics through orchestral, crossover-classical arrangements. It's a rare outdoor setting for one of crossover classical music's biggest international names.",
      metaTitle: "David Garrett Open Air, Harbiye Istanbul",
      metaDescription: "Violinist David Garrett performs his Millennium Symphony Open Air Tour at Harbiye Open Air Theatre, Istanbul.",
      keywords: ["David Garrett Istanbul", "Harbiye Open Air Theatre", "classical crossover", "Istanbul concerts"],
    },
    tr: {
      name: "Harbiye Açıkhava Tiyatrosu'nda David Garrett",
      description:
        "Virtüöz kemancı David Garrett, Millennium Symphony Open Air turnesini Harbiye'nin açık hava sahnesine taşıyarak pop ve rock klasiklerini orkestral, crossover-klasik düzenlemelerle yeniden yorumluyor. Crossover klasik müziğin en büyük uluslararası isimlerinden birini nadir görülen bir açık hava ortamında izleme fırsatı.",
      metaTitle: "David Garrett Harbiye Açıkhava'da",
      metaDescription: "Kemancı David Garrett, Millennium Symphony Open Air turnesiyle Harbiye Açıkhava Tiyatrosu'nda.",
      keywords: ["David Garrett İstanbul", "Harbiye Açıkhava Tiyatrosu", "klasik müzik İstanbul"],
    },
  },
  {
    rawListingId: "cmrce3x8e000hcasszyfqw6dh",
    venueName: "Flux",
    categorySlug: "nightlife",
    districtSlug: "besiktas",
    startAt: "2026-07-24T23:00:00+03:00",
    isOutdoor: false,
    isFree: false,
    tags: ["live-music", "indoor"],
    status: "PUBLISHED",
    en: {
      name: "Regal at Flux — RX Fridaze",
      description:
        "Spanish producer Regal headlines RX Fridaze at Flux with a set built on peak-time techno, acid influences, and cinematic melodic touches. He's become a prominent fixture of Europe's contemporary club circuit, known for extended, immersive takeovers.",
      metaTitle: "Regal at Flux: RX Fridaze Istanbul",
      metaDescription: "Spanish techno producer Regal headlines RX Fridaze at Flux nightclub, Istanbul.",
      keywords: ["Regal Istanbul", "Flux nightclub", "RX Fridaze", "techno Istanbul"],
    },
    tr: {
      name: "Flux'ta Regal — RX Fridaze",
      description:
        "İspanyol prodüktör Regal, RX Fridaze kapsamında Flux'ta peak-time techno, acid etkileri ve sinematik melodik dokunuşlar üzerine kurulu bir setle sahne alıyor. Uzun ve sürükleyici performanslarıyla tanınan sanatçı, Avrupa'nın güncel kulüp sahnesinin öne çıkan isimlerinden biri haline geldi.",
      metaTitle: "Regal Flux'ta – RX Fridaze İstanbul",
      metaDescription: "İspanyol techno prodüktörü Regal, RX Fridaze kapsamında Flux'ta sahne alıyor.",
      keywords: ["Regal İstanbul", "Flux gece kulübü", "techno İstanbul"],
    },
  },
  {
    rawListingId: "cmrce40kt000jcasssv7cz7ap",
    venueName: "Bonus Parkorman",
    categorySlug: "concerts",
    districtSlug: "sariyer",
    startAt: "2026-07-24T20:00:00+03:00",
    isOutdoor: true,
    isFree: false,
    tags: ["outdoor", "live-music", "tourist-friendly"],
    status: "PUBLISHED",
    en: {
      name: "Lamb of God at Bonus Parkorman",
      description:
        "American groove metal pioneers Lamb of God headline an outdoor triple bill at Bonus Parkorman, joined by Sweden's Orbit Culture and a Turkish support act. Expect a setlist spanning three decades from one of the genre's most influential bands.",
      metaTitle: "Lamb of God Live at Bonus Parkorman",
      metaDescription: "Groove metal pioneers Lamb of God headline an outdoor show at Bonus Parkorman, Istanbul.",
      keywords: ["Lamb of God Istanbul", "Bonus Parkorman", "metal concert Istanbul", "Orbit Culture"],
    },
    tr: {
      name: "Bonus Parkorman'da Lamb of God",
      description:
        "Amerikalı groove metal öncüleri Lamb of God, İsveç'ten Orbit Culture ve bir Türk grubunun eşlik ettiği açık hava üçlü konserinde Bonus Parkorman'da sahne alıyor. Türün en etkili gruplarından birinden otuz yılı aşkın bir repertuvarı kapsayan bir set sizi bekliyor.",
      metaTitle: "Lamb of God Bonus Parkorman'da",
      metaDescription: "Groove metal öncüleri Lamb of God, Bonus Parkorman'da açık hava konseri veriyor.",
      keywords: ["Lamb of God İstanbul", "Bonus Parkorman", "metal konser İstanbul"],
    },
  },
  {
    rawListingId: "cmrce4f9s000ncassewmfqvub",
    venueName: "IF Performance Hall Beşiktaş",
    categorySlug: "concerts",
    districtSlug: "besiktas",
    startAt: "2026-12-12T20:00:00+03:00",
    isOutdoor: false,
    isFree: false,
    tags: ["indoor", "live-music", "expat-friendly"],
    status: "PUBLISHED",
    en: {
      name: "Kovacs at IF Performance Hall Beşiktaş",
      description:
        "Dutch singer-songwriter Kovacs closes out a three-date Turkish tour at IF Performance Hall in Beşiktaş this December, following stops in Ankara and İzmir. Her soulful, smoke-and-velvet vocal style has earned her a devoted international following.",
      metaTitle: "Kovacs Live at IF Performance Hall",
      metaDescription: "Dutch singer Kovacs closes her Turkish tour at IF Performance Hall, Beşiktaş, this December.",
      keywords: ["Kovacs Istanbul", "IF Performance Hall", "Beşiktaş concerts", "Istanbul December events"],
    },
    tr: {
      name: "IF Performance Hall Beşiktaş'ta Kovacs",
      description:
        "Hollandalı şarkıcı-söz yazarı Kovacs, Ankara ve İzmir duraklarının ardından bu Aralık ayında üç şehirli Türkiye turnesini Beşiktaş'taki IF Performance Hall'da tamamlıyor. Dumanlı, kadifemsi vokal tarzıyla tanınan sanatçının uluslararası alanda sadık bir dinleyici kitlesi bulunuyor.",
      metaTitle: "Kovacs IF Performance Hall'da – Beşiktaş",
      metaDescription: "Hollandalı şarkıcı Kovacs, Türkiye turnesini bu Aralık Beşiktaş'ta tamamlıyor.",
      keywords: ["Kovacs İstanbul", "IF Performance Hall", "Beşiktaş konser"],
    },
  },
  {
    rawListingId: "cmrce4mub000pcassr8rmaeqh",
    venueName: "Life Park",
    categorySlug: "nightlife",
    districtSlug: null,
    startAt: "2026-07-04T23:00:00+03:00",
    isOutdoor: false,
    isFree: false,
    tags: ["live-music"],
    status: "EXPIRED",
    en: {
      name: "I Hate Models: Disco Inferno at Life Park",
      description:
        "French producer I Hate Models brought his 'Disco Inferno' concept to Life Park, exploring the harder, more emotionally charged edges of industrial techno, acid, and trance. Known for blurring genre lines, his sets are built for high-intensity, immersive nights.",
      metaTitle: "I Hate Models: Disco Inferno, Istanbul",
      metaDescription: "French producer I Hate Models brought his Disco Inferno show to Life Park, Istanbul.",
      keywords: ["I Hate Models Istanbul", "Life Park", "industrial techno"],
    },
    tr: {
      name: "Life Park'ta I Hate Models: Disco Inferno",
      description:
        "Fransız prodüktör I Hate Models, 'Disco Inferno' konseptini Life Park'a taşıyarak endüstriyel techno, acid ve trance'in daha sert ve duygusal yönlerini keşfetti. Tür sınırlarını bulanıklaştırmasıyla tanınan sanatçının setleri, yüksek yoğunluklu ve sürükleyici geceler için kuruluyor.",
      metaTitle: "I Hate Models Life Park'ta – Disco Inferno",
      metaDescription: "Fransız prodüktör I Hate Models, Disco Inferno konseptini Life Park'a taşıdı.",
      keywords: ["I Hate Models İstanbul", "Life Park", "endüstriyel techno"],
    },
  },
];

// Editorial articles picked up by the RSS feed that aren't events at all —
// a real Cleaner/Quality Agent pass would reject these too; skipped rather
// than force them into the Event model.
const SKIP_RAW_LISTING_IDS = ["cmrce42y8000lcass6ke07zfk", "cmrce4o9x000rcasspofcvmek"];

function buildJsonLd(ev: ManualEvent, locale: "en" | "tr") {
  const copy = ev[locale];
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: copy.name,
    description: copy.description,
    startDate: ev.startAt,
    endDate: ev.endAt,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus:
      ev.status === "EXPIRED" ? "https://schema.org/EventScheduled" : "https://schema.org/EventScheduled",
    location: { "@type": "Place", name: ev.venueName },
    offers: { "@type": "Offer", priceCurrency: "TRY" },
  };
}

async function main(): Promise<void> {
  for (const ev of EVENTS) {
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: ev.categorySlug } });
    const district = ev.districtSlug
      ? await prisma.district.findUnique({ where: { slug: ev.districtSlug } })
      : null;
    const tags = ev.tags.length
      ? await prisma.tag.findMany({ where: { slug: { in: ev.tags } } })
      : [];
    const raw = await prisma.rawListing.findUniqueOrThrow({ where: { id: ev.rawListingId } });

    const enSlug = slugify(ev.en.name);
    const trSlug = slugify(ev.tr.name);

    const event = await prisma.event.create({
      data: {
        sourceId: raw.sourceId,
        categoryId: category.id,
        districtId: district?.id,
        startAt: new Date(ev.startAt),
        endAt: ev.endAt ? new Date(ev.endAt) : undefined,
        price: { isFree: ev.isFree },
        status: ev.status,
        confidenceScore: 0.95,
        publishedAt: ev.status === "PUBLISHED" ? new Date() : undefined,
        tags: { create: tags.map((tag) => ({ tagId: tag.id })) },
        translations: {
          create: [
            {
              locale: "en",
              name: ev.en.name,
              description: ev.en.description,
              slug: enSlug,
              metaTitle: ev.en.metaTitle,
              metaDescription: ev.en.metaDescription,
              canonicalUrl: `${SITE_BASE_URL}/en/events/${enSlug}`,
              keywords: ev.en.keywords,
              ogTitle: ev.en.metaTitle,
              ogDescription: ev.en.metaDescription,
              schemaJsonLd: buildJsonLd(ev, "en") as Prisma.InputJsonValue,
            },
            {
              locale: "tr",
              name: ev.tr.name,
              description: ev.tr.description,
              slug: trSlug,
              metaTitle: ev.tr.metaTitle,
              metaDescription: ev.tr.metaDescription,
              canonicalUrl: `${SITE_BASE_URL}/tr/events/${trSlug}`,
              keywords: ev.tr.keywords,
              ogTitle: ev.tr.metaTitle,
              ogDescription: ev.tr.metaDescription,
              schemaJsonLd: buildJsonLd(ev, "tr") as Prisma.InputJsonValue,
            },
          ],
        },
      },
    });

    await prisma.aiLog.create({
      data: {
        entityType: "event",
        entityId: event.id,
        agentName: "manual-curation",
        status: "ok",
        confidenceScore: 0.95,
        outputSnapshot: {
          note: "Manually curated by Claude in chat, standing in for the paid pipeline — see packages/ai-agents/scripts/manual-publish-yabangee.ts header.",
        },
      },
    });

    await prisma.rawListing.update({
      where: { id: ev.rawListingId },
      data: { status: "PROCESSED" },
    });

    console.log(`created ${ev.status}: ${event.id} — ${ev.en.name}`);
  }

  for (const id of SKIP_RAW_LISTING_IDS) {
    await prisma.rawListing.update({ where: { id }, data: { status: "PROCESSED" } });
    console.log(`skipped (not an event): ${id}`);
  }

  console.log("done");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
