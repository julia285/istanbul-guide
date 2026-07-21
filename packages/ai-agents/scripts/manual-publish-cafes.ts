import { prisma } from "@istanbul-guide/db";
import { slugify } from "@istanbul-guide/shared";

// Same manual-curation discipline as manual-publish-restaurants.ts: every
// address and fact below comes from real research (see conversation
// 2026-07-21), every description is original writing from those facts,
// never copied from a source. Launch batch for the new Cafes section —
// smaller than the restaurant batch on purpose, real and verified over
// padded with unconfirmed candidates (a Petra Roasting Co. Moda location
// and a Ministry of Coffee Cihangir location were both floated by sources
// but couldn't be confirmed, so neither made this list).

const SITE_BASE_URL = process.env.SITE_BASE_URL ?? "http://localhost:3000";

interface ManualPlace {
  districtSlug: string;
  priceTier: "BUDGET" | "MODERATE";
  tags: string[];
  addressText: string;
  sourceUrl?: string;
  website?: string;
  en: { name: string; description: string; metaTitle: string; metaDescription: string; keywords: string[] };
  tr: { name: string; description: string; metaTitle: string; metaDescription: string; keywords: string[] };
}

const PLACES: ManualPlace[] = [
  {
    districtSlug: "kadikoy",
    priceTier: "MODERATE",
    tags: ["specialty-coffee", "roastery", "hidden-gem"],
    addressText: "Caferağa Mah., Badem Altı Sk. No:21/B, 34710 Kadıköy",
    website: "https://walterscoffee.com/",
    sourceUrl: "https://www.tripadvisor.com/Restaurant_Review-g293974-d8458553-Reviews-Walter_s_Coffee_Roastery-Istanbul.html",
    en: {
      name: "Walter's Coffee Roastery",
      description:
        "Istanbul's original coffee-laboratory concept, roasting daily in a Breaking Bad-themed space where the baristas work in hazmat suits — a genuine novelty that's kept it a fixture of the Kadıköy coffee scene for years, not just a gimmick that faded. The coffee itself, roasted on site, is the reason people come back.",
      metaTitle: "Walter's Coffee Roastery — Kadıköy's Breaking Bad Cafe",
      metaDescription: "Walter's Coffee Roastery: Istanbul's original daily-roasting coffee lab, Breaking Bad-themed, in Kadıköy.",
      keywords: ["Walter's Coffee Roastery", "Kadıköy cafe", "Istanbul specialty coffee", "Breaking Bad cafe Istanbul"],
    },
    tr: {
      name: "Walter's Coffee Roastery",
      description:
        "İstanbul'un özgün kahve laboratuvarı konsepti — baristaların tulumla çalıştığı Breaking Bad temalı bir mekanda her gün kahve kavruluyor. Yıllardır Kadıköy kahve sahnesinin sabit bir noktası olması, bunun geçici bir jimmick olmadığının kanıtı. Yerinde kavrulan kahvenin kendisi, insanların tekrar gelmesinin asıl nedeni.",
      metaTitle: "Walter's Coffee Roastery — Kadıköy'ün Breaking Bad Kafesi",
      metaDescription: "Walter's Coffee Roastery: Kadıköy'de İstanbul'un özgün, her gün kavuran, Breaking Bad temalı kahve mekanı.",
      keywords: ["Walter's Coffee Roastery", "Kadıköy kafe", "İstanbul özel kahve"],
    },
  },
  {
    districtSlug: "beyoglu",
    priceTier: "MODERATE",
    tags: ["specialty-coffee", "roastery"],
    addressText: "Kemankeş Karamustafa Paşa, Karaali Kaptan Sk. No:4, 34425 Karaköy/Beyoğlu",
    website: "https://www.kronotrop.com.tr",
    sourceUrl: "https://www.tripadvisor.com/Restaurant_Review-g293974-d3155592-Reviews-Kronotrop-Istanbul.html",
    en: {
      name: "Kronotrop",
      description:
        "One of the true pioneers of Istanbul's specialty-coffee scene, roasting its own beans since the early days of the movement in Karaköy — the neighborhood that became the city's coffee capital largely because of shops like this one. Serious barista craft, no theatrics needed.",
      metaTitle: "Kronotrop — Specialty Coffee Pioneer, Karaköy",
      metaDescription: "Kronotrop: one of the original specialty-coffee roasters that put Karaköy on Istanbul's coffee map.",
      keywords: ["Kronotrop Istanbul", "Karaköy coffee", "Istanbul specialty coffee", "coffee roastery Istanbul"],
    },
    tr: {
      name: "Kronotrop",
      description:
        "İstanbul'un özel kahve sahnesinin gerçek öncülerinden biri — Karaköy'de hareketin ilk günlerinden beri kendi çekirdeklerini kavuruyor. Karaköy'ü şehrin kahve başkenti yapan mekanlardan biri de bu. Gösterişe gerek duymayan, ciddi bir barista işçiliği.",
      metaTitle: "Kronotrop — Özel Kahve Öncüsü, Karaköy",
      metaDescription: "Kronotrop: Karaköy'ü İstanbul'un kahve haritasına yerleştiren özgün özel kahve kavurucularından biri.",
      keywords: ["Kronotrop İstanbul", "Karaköy kahve", "İstanbul özel kahve"],
    },
  },
  {
    districtSlug: "beyoglu",
    priceTier: "MODERATE",
    tags: ["specialty-coffee"],
    addressText: "Şahkulu Mah., Küçük Hendek Cd. No:7, 34421 Beyoğlu",
    website: "https://federal.coffee/",
    sourceUrl: "https://istanbul.com/federal-coffee-company",
    en: {
      name: "Federal Coffee Company",
      description:
        "A short walk from Galata Tower, Federal brings an easy Australian-café energy to Karaköy — the kind of place people specifically seek out for a proper flat white, done right rather than as an afterthought on a longer menu.",
      metaTitle: "Federal Coffee Company — Australian-Style Cafe Near Galata Tower",
      metaDescription: "Federal Coffee Company: an Australian-style cafe near Galata Tower, known for a proper flat white.",
      keywords: ["Federal Coffee Company", "Karaköy cafe", "Galata Tower coffee", "flat white Istanbul"],
    },
    tr: {
      name: "Federal Coffee Company",
      description:
        "Galata Kulesi'ne birkaç adım mesafede, Federal Karaköy'e rahat bir Avustralya kafe enerjisi getiriyor — insanların özellikle düzgün bir flat white için, uzun bir menünün ek maddesi değil, asıl konu olarak aradığı türden bir mekan.",
      metaTitle: "Federal Coffee Company — Galata Kulesi Yanında Avustralya Tarzı Kafe",
      metaDescription: "Federal Coffee Company: Galata Kulesi yakınında, düzgün flat white'ıyla bilinen Avustralya tarzı kafe.",
      keywords: ["Federal Coffee Company", "Karaköy kafe", "Galata Kulesi kahve"],
    },
  },
  {
    districtSlug: "sisli",
    priceTier: "MODERATE",
    tags: ["specialty-coffee", "roastery"],
    addressText: "Teşvikiye Mah., Şakayık Sk. No:4/A, 34365 Nişantaşı/Şişli",
    sourceUrl: "https://www.tripadvisor.com/Restaurant_Review-g293974-d7076657-Reviews-M_O_C_Ministry_of_Coffee-Istanbul.html",
    en: {
      name: "Ministry of Coffee (MOC)",
      description:
        "Roasting on site and pouring beans from a dozen different origins, MOC brings a serious specialty-coffee approach to Nişantaşı — a part of the city better known for boutiques than for coffee craft, which makes this one worth the detour.",
      metaTitle: "Ministry of Coffee (MOC) — Specialty Roastery, Nişantaşı",
      metaDescription: "Ministry of Coffee: a serious on-site roastery in Nişantaşı, pouring beans from a dozen origins.",
      keywords: ["Ministry of Coffee Istanbul", "MOC cafe", "Nişantaşı coffee", "Istanbul roastery"],
    },
    tr: {
      name: "Ministry of Coffee (MOC)",
      description:
        "Yerinde kavurup bir düzine farklı kökenden çekirdek sunan MOC, daha çok butikleriyle bilinen Nişantaşı'na ciddi bir özel kahve yaklaşımı getiriyor — bu da mekanı küçük bir sapmaya değer kılıyor.",
      metaTitle: "Ministry of Coffee (MOC) — Özel Kavurma Evi, Nişantaşı",
      metaDescription: "Ministry of Coffee: Nişantaşı'nda bir düzine kökenden çekirdek sunan ciddi bir yerinde kavurma evi.",
      keywords: ["Ministry of Coffee İstanbul", "MOC kafe", "Nişantaşı kahve"],
    },
  },
];

async function main(): Promise<void> {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: "cafes" } });

  for (const item of PLACES) {
    const district = await prisma.district.findUnique({ where: { slug: item.districtSlug } });
    const tags = await prisma.tag.findMany({ where: { slug: { in: item.tags } } });
    const enSlug = slugify(item.en.name);
    const trSlug = slugify(item.tr.name);

    const existing = await prisma.placeTranslation.findFirst({
      where: { locale: "en", name: item.en.name },
    });
    if (existing) {
      console.log(`skip (already exists): ${item.en.name}`);
      continue;
    }

    const place = await prisma.place.create({
      data: {
        categoryId: category.id,
        districtId: district?.id,
        priceTier: item.priceTier,
        addressText: item.addressText,
        sourceUrl: item.sourceUrl,
        contact: item.website ? { website: item.website } : undefined,
        status: "PUBLISHED",
        confidenceScore: 0.95,
        publishedAt: new Date(),
        tags: { create: tags.map((tag) => ({ tagId: tag.id })) },
        translations: {
          create: [
            {
              locale: "en",
              name: item.en.name,
              description: item.en.description,
              slug: enSlug,
              metaTitle: item.en.metaTitle,
              metaDescription: item.en.metaDescription,
              canonicalUrl: `${SITE_BASE_URL}/en/cafes/${enSlug}`,
              keywords: item.en.keywords,
              ogTitle: item.en.metaTitle,
              ogDescription: item.en.metaDescription,
            },
            {
              locale: "tr",
              name: item.tr.name,
              description: item.tr.description,
              slug: trSlug,
              metaTitle: item.tr.metaTitle,
              metaDescription: item.tr.metaDescription,
              canonicalUrl: `${SITE_BASE_URL}/tr/cafes/${trSlug}`,
              keywords: item.tr.keywords,
              ogTitle: item.tr.metaTitle,
              ogDescription: item.tr.metaDescription,
            },
          ],
        },
      },
    });

    console.log(`created: ${place.id} — ${item.en.name}`);
  }
  console.log(`done: ${PLACES.length} cafes processed`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
