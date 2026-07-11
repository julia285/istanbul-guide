import { prisma } from "@istanbul-guide/db";
import { slugify } from "@istanbul-guide/shared";

// One-off manual curation of cuisine "Best Of" collections (Article model,
// type LISTICLE) — references the 16 restaurants published in
// manual-publish-restaurants.ts by name, ordered by curatorial judgment
// (Michelin/awarded first, then long-standing local favorites). No new
// facts here, just original editorial framing around already-verified data.

const SITE_BASE_URL = process.env.SITE_BASE_URL ?? "http://localhost:3000";

interface ManualCollection {
  placeNamesInOrder: string[];
  en: { title: string; body: string; metaTitle: string; metaDescription: string; keywords: string[] };
  tr: { title: string; body: string; metaTitle: string; metaDescription: string; keywords: string[] };
}

const COLLECTIONS: ManualCollection[] = [
  {
    placeNamesInOrder: [
      "TURK Fatih Tutak",
      "Neolokal",
      "Mikla",
      "Araf İstanbul",
      "Çiya Sofrası",
      "Kanaat Lokantası",
      "Pandeli",
      "Zübeyir Ocakbaşı",
      "Karaköy Lokantası",
      "Malva",
    ],
    en: {
      title: "Best Turkish Restaurants in Istanbul",
      body: "Istanbul's Turkish food scene runs from two-Michelin-star tasting menus to lokantas that have been feeding the same neighborhood since the 1930s — and the best version of the city's food culture usually sits somewhere between the two. This list moves from the reservation-only fine-dining end (TURK Fatih Tutak, Neolokal, Mikla, and the newly-starred Araf İstanbul) to the places locals actually eat at daily: Çiya Sofrası for regional dishes most of Turkey has forgotten, Kanaat and Pandeli for Ottoman-era cooking that hasn't changed on purpose, and Zübeyir or Karaköy Lokantası for a proper grill or meyhane night without the tourist markup.",
      metaTitle: "Best Turkish Restaurants in Istanbul — Fine Dining to Lokantas",
      metaDescription: "From Michelin-starred tasting menus to century-old lokantas, the best real Turkish restaurants in Istanbul.",
      keywords: ["best Turkish restaurants Istanbul", "Turkish cuisine Istanbul", "Istanbul lokanta", "Michelin Istanbul"],
    },
    tr: {
      title: "İstanbul'un En İyi Türk Restoranları",
      body: "İstanbul'un Türk mutfağı sahnesi, iki Michelin yıldızlı tadım menülerinden 1930'lardan beri aynı mahalleyi besleyen lokantalara kadar uzanıyor — ve şehrin yemek kültürünün en iyi hali genellikle ikisinin arasında bir yerde bulunuyor. Bu liste, sadece rezervasyonla girilen fine-dining ucundan (TURK Fatih Tutak, Neolokal, Mikla ve yeni yıldızlanan Araf İstanbul) yerlilerin gerçekten her gün yemek yediği mekanlara doğru ilerliyor: Türkiye'nin çoğunun unuttuğu yöresel yemekler için Çiya Sofrası, değişmeden kalan Osmanlı mutfağı için Kanaat ve Pandeli, turist fiyatı olmadan düzgün bir ocakbaşı veya meyhane gecesi için Zübeyir ya da Karaköy Lokantası.",
      metaTitle: "İstanbul'un En İyi Türk Restoranları — Fine Dining'den Lokantalara",
      metaDescription: "Michelin yıldızlı tadım menülerinden yüzyıllık lokantalara, İstanbul'un gerçek en iyi Türk restoranları.",
      keywords: ["İstanbul en iyi Türk restoranları", "İstanbul Türk mutfağı", "İstanbul lokanta"],
    },
  },
  {
    placeNamesInOrder: ["Da Mario", "Monteverdi Ristorante"],
    en: {
      title: "Best Italian Restaurants in Istanbul",
      body: "Istanbul's Italian dining scene has grown fast in recent years, but two addresses anchor it from opposite ends of the timeline. Da Mario has been Istanbul's Italian restaurant since 1993 — the one that predates the current boom entirely, still serving simple, well-made pasta in Etiler. Monteverdi Ristorante, inside the Conrad Istanbul Bosphorus, represents the newer wave: Michelin Guide-recommended, built on Lombardy tradition, with handmade pasta and wood-fired Neapolitan pizza done properly.",
      metaTitle: "Best Italian Restaurants in Istanbul",
      metaDescription: "The two Italian restaurants in Istanbul worth knowing: one open since 1993, one newly Michelin-recommended.",
      keywords: ["best Italian restaurants Istanbul", "Italian food Istanbul", "Istanbul pasta restaurant"],
    },
    tr: {
      title: "İstanbul'un En İyi İtalyan Restoranları",
      body: "İstanbul'un İtalyan mutfağı sahnesi son yıllarda hızla büyüdü, ama zaman çizgisinin iki ucundan iki adres bu sahneyi çapalıyor. Da Mario, 1993'ten beri İstanbul'un İtalyan restoranı — bugünkü patlamadan tamamen önce gelen, Etiler'de hâlâ sade ve iyi yapılmış makarna sunan mekân. Conrad İstanbul Bosphorus içindeki Monteverdi Ristorante ise daha yeni dalgayı temsil ediyor: Michelin Rehberi tavsiyeli, Lombardiya geleneğine dayanan, el yapımı makarna ve odun ateşinde düzgün Napoli pizzası.",
      metaTitle: "İstanbul'un En İyi İtalyan Restoranları",
      metaDescription: "İstanbul'da bilinmesi gereken iki İtalyan restoranı: biri 1993'ten beri açık, biri yeni Michelin tavsiyeli.",
      keywords: ["İstanbul en iyi İtalyan restoranları", "İstanbul İtalyan mutfağı"],
    },
  },
  {
    placeNamesInOrder: ["Sankai by Nagaya", "Zuma Istanbul"],
    en: {
      title: "Best Japanese Restaurants in Istanbul",
      body: "Japanese fine dining in Istanbul is still a short list, which makes it easy to name the two that matter. Sankai by Nagaya, a 24-seat omakase counter in Bebek developed with three-Michelin-star chef Yoshizumi Nagaya, holds the city's only Michelin star for Japanese cuisine — no à la carte, just two tasting menus and a Bosphorus view. Zuma Istanbul, the local outpost of the international group, sits waterside in Ortaköy with three separate kitchens (robata, sushi, and mains) and is consistently one of the hardest tables in the city to book.",
      metaTitle: "Best Japanese Restaurants in Istanbul",
      metaDescription: "Istanbul's two standout Japanese restaurants: a Michelin-starred omakase counter and the Bosphorus branch of Zuma.",
      keywords: ["best Japanese restaurants Istanbul", "omakase Istanbul", "sushi Istanbul", "Zuma Istanbul"],
    },
    tr: {
      title: "İstanbul'un En İyi Japon Restoranları",
      body: "İstanbul'da Japon fine dining hâlâ kısa bir liste, bu da önemli olan iki mekanı saymayı kolaylaştırıyor. Bebek'te üç Michelin yıldızlı şef Yoshizumi Nagaya ile geliştirilen 24 kişilik omakase tezgahı Sankai by Nagaya, şehrin Japon mutfağındaki tek Michelin yıldızını taşıyor — à la carte yok, sadece iki tadım menüsü ve Boğaz manzarası. Uluslararası grubun yerel şubesi olan Zuma Istanbul ise Ortaköy'de suyun kenarında, üç ayrı mutfakla (robata, suşi ve ana yemekler) şehrin en zor rezervasyon alınan masalarından biri olmayı sürdürüyor.",
      metaTitle: "İstanbul'un En İyi Japon Restoranları",
      metaDescription: "İstanbul'un öne çıkan iki Japon restoranı: Michelin yıldızlı bir omakase tezgahı ve Zuma'nın Boğaz şubesi.",
      keywords: ["İstanbul en iyi Japon restoranları", "İstanbul omakase", "Zuma İstanbul"],
    },
  },
  {
    placeNamesInOrder: ["Sur Balık", "Bebek Balıkçı", "Karaköy Lokantası"],
    en: {
      title: "Best Seafood Restaurants in Istanbul",
      body: "A city on two seas takes its fish seriously, and these three cover the range. Sur Balık in Arnavutköy pairs fresh catch with Mediterranean technique right on the Bosphorus waterfront. Bebek Balıkçı has held its ground as a genuine neighborhood fish restaurant since 1998, in one of the most expensive stretches of real estate on the water — no tasting menu, just well-done grilled fish. And Karaköy Lokantası, better known as a meyhane, earns its place here too: seasonal mezze and fish that's been quietly loved by locals for years.",
      metaTitle: "Best Seafood Restaurants in Istanbul",
      metaDescription: "Where to eat fish in Istanbul: three Bosphorus-side seafood restaurants locals actually trust.",
      keywords: ["best seafood restaurants Istanbul", "fish restaurant Istanbul", "Bosphorus seafood"],
    },
    tr: {
      title: "İstanbul'un En İyi Deniz Ürünleri Restoranları",
      body: "İki denize kıyısı olan bir şehir balığını ciddiye alır, ve bu üç mekan bu yelpazeyi kapsıyor. Arnavutköy'deki Sur Balık, taze balığı Akdeniz tekniğiyle doğrudan Boğaz kıyısında birleştiriyor. Bebek Balıkçı, suyun en pahalı bölgelerinden birinde 1998'den beri gerçek bir mahalle balıkçısı olarak yerini koruyor — tadım menüsü yok, sadece iyi yapılmış ızgara balık var. Daha çok meyhane olarak bilinen Karaköy Lokantası da burada yerini hak ediyor: yıllardır yerlilerin sessizce sevdiği mevsimlik mezeler ve balık.",
      metaTitle: "İstanbul'un En İyi Deniz Ürünleri Restoranları",
      metaDescription: "İstanbul'da nerede balık yenir: yerlilerin gerçekten güvendiği üç Boğaz kıyısı restoranı.",
      keywords: ["İstanbul en iyi deniz ürünleri restoranları", "İstanbul balık restoranı", "Boğaz balık"],
    },
  },
];

async function main(): Promise<void> {
  for (const collection of COLLECTIONS) {
    const enSlug = slugify(collection.en.title);
    const trSlug = slugify(collection.tr.title);

    const existing = await prisma.articleTranslation.findFirst({
      where: { locale: "en", title: collection.en.title },
    });
    if (existing) {
      console.log(`skip (already exists): ${collection.en.title}`);
      continue;
    }

    const places = await prisma.placeTranslation.findMany({
      where: { locale: "en", name: { in: collection.placeNamesInOrder } },
      select: { name: true, placeId: true },
    });
    const placeIdByName = new Map(places.map((p) => [p.name, p.placeId]));
    const orderedPlaceIds = collection.placeNamesInOrder
      .map((name) => placeIdByName.get(name))
      .filter((id): id is string => Boolean(id));

    if (orderedPlaceIds.length === 0) {
      console.warn(`skip (no matching places found): ${collection.en.title}`);
      continue;
    }

    const article = await prisma.article.create({
      data: {
        type: "LISTICLE",
        status: "PUBLISHED",
        confidenceScore: 0.95,
        publishedAt: new Date(),
        translations: {
          create: [
            {
              locale: "en",
              title: collection.en.title,
              body: collection.en.body,
              slug: enSlug,
              metaTitle: collection.en.metaTitle,
              metaDescription: collection.en.metaDescription,
              ogTitle: collection.en.metaTitle,
              ogDescription: collection.en.metaDescription,
            },
            {
              locale: "tr",
              title: collection.tr.title,
              body: collection.tr.body,
              slug: trSlug,
              metaTitle: collection.tr.metaTitle,
              metaDescription: collection.tr.metaDescription,
              ogTitle: collection.tr.metaTitle,
              ogDescription: collection.tr.metaDescription,
            },
          ],
        },
        items: {
          create: orderedPlaceIds.map((placeId, index) => ({ placeId, position: index })),
        },
      },
    });

    console.log(`created: ${article.id} — ${collection.en.title} (${orderedPlaceIds.length} places)`);
  }
  console.log(`done: ${COLLECTIONS.length} collections processed`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
