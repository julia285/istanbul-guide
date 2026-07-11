import { prisma } from "@istanbul-guide/db";
import { slugify } from "@istanbul-guide/shared";

// One-off manual curation of 16 real, well-regarded Istanbul restaurants,
// same discipline as manual-publish-yabangee.ts: every fact below comes
// from real research (Michelin Guide, official sites, established local
// press — see conversation 2026-07-12/13), every description is original
// writing from those facts, never copied. Spans the categories the site
// owner asked for: fine dining (Michelin-starred), authentic/time-proven,
// real hidden gems, 2026 new openings — plus enough cuisine diversity
// (Turkish, Italian, Japanese, seafood) to back real cuisine collections.

const SITE_BASE_URL = process.env.SITE_BASE_URL ?? "http://localhost:3000";

interface ManualPlace {
  districtSlug: string;
  priceTier: "MODERATE" | "EXPENSIVE";
  tags: string[];
  addressText?: string;
  sourceUrl?: string;
  website?: string;
  en: { name: string; description: string; metaTitle: string; metaDescription: string; keywords: string[] };
  tr: { name: string; description: string; metaTitle: string; metaDescription: string; keywords: string[] };
}

const PLACES: ManualPlace[] = [
  {
    districtSlug: "beyoglu",
    priceTier: "EXPENSIVE",
    tags: ["fine-dining", "michelin-starred", "turkish-cuisine"],
    sourceUrl: "https://guide.michelin.com/us/en/istanbul-province/istanbul/restaurant/turk-fatih-tutak",
    en: {
      name: "TURK Fatih Tutak",
      description:
        "Chef Fatih Tutak holds Istanbul's only two Michelin stars for a tasting menu built entirely from Anatolian roots, reshaped into something unmistakably his own. Expect a multi-course journey through Turkish ingredients and technique — not a nod to any other cuisine.",
      metaTitle: "TURK Fatih Tutak — Istanbul's Only 2-Star Restaurant",
      metaDescription: "Chef Fatih Tutak's two-Michelin-star tasting menu, built entirely from Anatolian ingredients and technique.",
      keywords: ["TURK Fatih Tutak", "Michelin star Istanbul", "fine dining Istanbul", "Fatih Tutak"],
    },
    tr: {
      name: "TURK Fatih Tutak",
      description:
        "Şef Fatih Tutak, Anadolu köklerinden beslenip tamamen kendine özgü bir yoruma dönüştürdüğü tadım menüsüyle İstanbul'un tek iki Michelin yıldızını taşıyor. Türk malzemeleri ve tekniği üzerine kurulu, çok kurgulu bir yemek yolculuğu sizi bekliyor.",
      metaTitle: "TURK Fatih Tutak — İstanbul'un Tek 2 Yıldızlı Restoranı",
      metaDescription: "Şef Fatih Tutak'ın Anadolu köklerinden beslenen iki Michelin yıldızlı tadım menüsü.",
      keywords: ["TURK Fatih Tutak", "İstanbul Michelin yıldızı", "fine dining İstanbul"],
    },
  },
  {
    districtSlug: "beyoglu",
    priceTier: "EXPENSIVE",
    tags: ["fine-dining", "michelin-starred", "rooftop", "turkish-cuisine"],
    addressText: "SALT Galata, Karaköy",
    sourceUrl: "https://guide.michelin.com/us/en/istanbul-province/istanbul/restaurant/neolokal",
    en: {
      name: "Neolokal",
      description:
        "Chef Maksut Aşkar's Karaköy restaurant holds both a Michelin Star and a Green Star for a menu built on ingredients sourced directly from small producers across Turkey. The view over the Golden Horn from SALT Galata's top floor is part of the draw, but the plates are what keep it on every serious list.",
      metaTitle: "Neolokal — Michelin Star & Green Star, Karaköy",
      metaDescription: "Maksut Aşkar's Neolokal: Michelin Star and Green Star dining atop SALT Galata, Karaköy.",
      keywords: ["Neolokal Istanbul", "Maksut Aşkar", "Michelin Green Star", "Karaköy restaurant"],
    },
    tr: {
      name: "Neolokal",
      description:
        "Şef Maksut Aşkar'ın Karaköy'deki restoranı, Türkiye'nin dört bir yanındaki küçük üreticilerden gelen malzemelerle kurulan menüsüyle hem bir Michelin Yıldızı hem de Yeşil Yıldız taşıyor. SALT Galata'nın üst katından Haliç manzarası cazibesinin bir parçası, ama listelerde kalıcı olmasını sağlayan asıl şey tabaklar.",
      metaTitle: "Neolokal — Michelin Yıldızı ve Yeşil Yıldız, Karaköy",
      metaDescription: "Maksut Aşkar'ın Neolokal'ı: SALT Galata'da Michelin Yıldızı ve Yeşil Yıldız.",
      keywords: ["Neolokal İstanbul", "Maksut Aşkar", "Karaköy restoran"],
    },
  },
  {
    districtSlug: "beyoglu",
    priceTier: "EXPENSIVE",
    tags: ["fine-dining", "michelin-starred", "rooftop", "turkish-cuisine"],
    addressText: "Meşrutiyet Caddesi No:15, The Marmara Pera, 34430 Beyoğlu",
    sourceUrl: "https://www.miklarestaurant.com",
    website: "https://www.miklarestaurant.com",
    en: {
      name: "Mikla",
      description:
        "Perched atop The Marmara Pera with a rooftop view across the old city, Mikla has been a fixture of Istanbul's fine-dining scene since 2005 and holds a Michelin Star for its modern take on Turkish and Scandinavian influences. It's the kind of place people book weeks ahead for a reason.",
      metaTitle: "Mikla — Rooftop Fine Dining Since 2005",
      metaDescription: "Michelin-starred Mikla atop The Marmara Pera — modern Turkish-Scandinavian cuisine with an old-city view.",
      keywords: ["Mikla Istanbul", "Marmara Pera restaurant", "Michelin star Beyoğlu", "rooftop dining Istanbul"],
    },
    tr: {
      name: "Mikla",
      description:
        "The Marmara Pera'nın çatısında, tarihi yarımadaya bakan manzarasıyla Mikla, 2005'ten beri İstanbul'un üst düzey mutfak sahnesinin sabit bir noktası ve Türk ile İskandinav etkilerini modern bir yorumla birleştiren mönüsüyle bir Michelin Yıldızı taşıyor. İnsanların haftalar öncesinden rezervasyon yaptırmasının bir nedeni var.",
      metaTitle: "Mikla — 2005'ten Beri Çatı Katında Fine Dining",
      metaDescription: "Michelin yıldızlı Mikla, The Marmara Pera'nın çatısında modern Türk-İskandinav mutfağı sunuyor.",
      keywords: ["Mikla İstanbul", "Marmara Pera restoran", "çatı katı İstanbul"],
    },
  },
  {
    districtSlug: "uskudar",
    priceTier: "MODERATE",
    tags: ["authentic", "turkish-cuisine"],
    addressText: "Selmanipak Cad. No:9, Üsküdar",
    sourceUrl: "https://www.100tarihilokanta.com/kanaat-lokantasi/",
    en: {
      name: "Kanaat Lokantası",
      description:
        "Family-run since 1933, Kanaat is the kind of esnaf lokantası where the day's dishes are cooked that morning and gone by afternoon — generations of Üsküdar residents have their childhood memories tied to this dining room. The olive-oil dishes and desserts are the house pride, and the prices have stayed fair enough for regulars to eat here daily.",
      metaTitle: "Kanaat Lokantası — Family-Run Since 1933, Üsküdar",
      metaDescription: "Kanaat Lokantası: an Üsküdar institution since 1933, serving classic esnaf lokantası fare.",
      keywords: ["Kanaat Lokantası", "Üsküdar restaurant", "esnaf lokantası Istanbul", "historic Istanbul restaurant"],
    },
    tr: {
      name: "Kanaat Lokantası",
      description:
        "1933'ten beri aile işletmesi olan Kanaat, günün yemeklerinin sabahtan pişip öğleye kadar tükendiği klasik bir esnaf lokantası — kuşaklar boyu Üsküdarlının çocukluk anıları bu salona bağlı. Zeytinyağlılar ve tatlılar evin gururu, fiyatlar ise müdavimlerin her gün buradan yemek yiyebileceği kadar makul kaldı.",
      metaTitle: "Kanaat Lokantası — 1933'ten Beri Üsküdar'da",
      metaDescription: "Kanaat Lokantası: 1933'ten beri Üsküdar'da klasik esnaf lokantası lezzetleri.",
      keywords: ["Kanaat Lokantası", "Üsküdar lokanta", "esnaf lokantası"],
    },
  },
  {
    districtSlug: "kadikoy",
    priceTier: "MODERATE",
    tags: ["authentic", "hidden-gem", "turkish-cuisine"],
    addressText: "Caferağa Mah. Güneslibahçe Sk. No:43, Kadıköy",
    sourceUrl: "https://www.tripadvisor.com/Restaurant_Review-g293974-d776065-Reviews-Ciya_Sofrasi-Istanbul.html",
    en: {
      name: "Çiya Sofrası",
      description:
        "Chef Musa Dağdeviren has spent decades tracking down forgotten regional recipes from every corner of Turkey and reviving them, no-frills, at his restaurant in the heart of Kadıköy Market. It's widely considered one of the most important addresses in Istanbul for understanding what Anatolian food actually is, beyond the kebab-and-baklava version most visitors know.",
      metaTitle: "Çiya Sofrası — Forgotten Anatolian Recipes, Kadıköy",
      metaDescription: "Musa Dağdeviren's Çiya Sofrası revives forgotten regional Turkish recipes in Kadıköy Market.",
      keywords: ["Çiya Sofrası", "Kadıköy restaurant", "Musa Dağdeviren", "Anatolian food Istanbul"],
    },
    tr: {
      name: "Çiya Sofrası",
      description:
        "Şef Musa Dağdeviren, Türkiye'nin dört bir yanından unutulmuş yöresel tarifleri onlarca yıldır araştırıp Kadıköy Çarşısı'nın kalbindeki restoranında sade bir şekilde yeniden hayata geçiriyor. Çoğu ziyaretçinin bildiği kebap-baklava versiyonunun ötesinde, Anadolu mutfağının gerçekte ne olduğunu anlamak için İstanbul'un en önemli adreslerinden biri olarak kabul ediliyor.",
      metaTitle: "Çiya Sofrası — Unutulmuş Anadolu Tarifleri, Kadıköy",
      metaDescription: "Musa Dağdeviren'in Çiya Sofrası'ı, Kadıköy Çarşısı'nda unutulmuş yöresel tarifleri yaşatıyor.",
      keywords: ["Çiya Sofrası", "Kadıköy restoran", "Musa Dağdeviren"],
    },
  },
  {
    districtSlug: "fatih",
    priceTier: "MODERATE",
    tags: ["authentic", "turkish-cuisine"],
    addressText: "Rüstempaşa Mah., Mısır Çarşısı İçi No:1/2, Eminönü/Fatih",
    sourceUrl: "https://www.pandeli.com.tr/index-en.html",
    website: "https://www.pandeli.com.tr/index-en.html",
    en: {
      name: "Pandeli",
      description:
        "Opened in 1901 above the Spice Bazaar, Pandeli has fed everyone from Atatürk to generations of Istanbul writers and journalists under its blue-tiled ceilings. The kitchen still leans on Ottoman palace recipes, with lamb dishes as the long-standing house specialty.",
      metaTitle: "Pandeli — Ottoman Cuisine Since 1901, Spice Bazaar",
      metaDescription: "Pandeli: Ottoman palace recipes above the Spice Bazaar since 1901, under its famous blue-tiled ceilings.",
      keywords: ["Pandeli Istanbul", "Spice Bazaar restaurant", "Ottoman cuisine", "historic Istanbul restaurant"],
    },
    tr: {
      name: "Pandeli",
      description:
        "1901'de Mısır Çarşısı'nın üst katında açılan Pandeli, mavi çinili tavanlarının altında Atatürk'ten kuşaklar boyu İstanbullu yazar ve gazetecilere kadar herkesi ağırladı. Mutfak hâlâ Osmanlı saray mutfağı tariflerine dayanıyor, kuzu yemekleri ise uzun süredir evin klasiği.",
      metaTitle: "Pandeli — 1901'den Beri Osmanlı Mutfağı, Mısır Çarşısı",
      metaDescription: "Pandeli: 1901'den beri Mısır Çarşısı'nda, ünlü mavi çinili tavanları altında Osmanlı mutfağı.",
      keywords: ["Pandeli İstanbul", "Mısır Çarşısı restoran", "Osmanlı mutfağı"],
    },
  },
  {
    districtSlug: "beyoglu",
    priceTier: "MODERATE",
    tags: ["hidden-gem", "turkish-cuisine"],
    addressText: "İstiklal Cd., Bekar Sk. No:28, Beyoğlu",
    sourceUrl: "https://www.tripadvisor.com/Restaurant_Review-g293974-d1192712-Reviews-Zubeyir_Ocakbasi-Istanbul.html",
    en: {
      name: "Zübeyir Ocakbaşı",
      description:
        "Tucked down a side street off İstiklal, Zübeyir is an open-grill ocakbaşı that's earned its reputation the old-fashioned way — through the quality of the meat and the skill of the grill, not marketing. It's the kind of place locals steer visitors toward instead of the more obvious tourist-strip grills nearby.",
      metaTitle: "Zübeyir Ocakbaşı — Grill House Off İstiklal",
      metaDescription: "Zübeyir Ocakbaşı: a locally-loved open-grill restaurant tucked off İstiklal Street, Beyoğlu.",
      keywords: ["Zübeyir Ocakbaşı", "Istiklal Street restaurant", "Istanbul grill house", "Beyoğlu hidden gem"],
    },
    tr: {
      name: "Zübeyir Ocakbaşı",
      description:
        "İstiklal'in bir yan sokağında saklı olan Zübeyir, ününü pazarlamayla değil etin kalitesi ve ızgara ustalığıyla kazanmış bir ocakbaşı. Yerliler, ziyaretçileri yakındaki daha göze çarpan turistik ızgaracılar yerine buraya yönlendiriyor.",
      metaTitle: "Zübeyir Ocakbaşı — İstiklal Arkasında Bir Ocakbaşı",
      metaDescription: "Zübeyir Ocakbaşı: İstiklal Caddesi'nin arkasında, yerlilerin sevdiği bir ocakbaşı.",
      keywords: ["Zübeyir Ocakbaşı", "İstiklal restoran", "İstanbul ocakbaşı"],
    },
  },
  {
    districtSlug: "beyoglu",
    priceTier: "MODERATE",
    tags: ["hidden-gem", "turkish-cuisine", "seafood"],
    addressText: "Kemankeş Mah., Kemankeş Cd. No:57, Karaköy/Beyoğlu",
    sourceUrl: "https://guide.michelin.com/us/en/istanbul-province/istanbul/restaurant/karakoy-lokantas%C4%B1",
    en: {
      name: "Karaköy Lokantası",
      description:
        "A meyhane-style neighborhood restaurant in Karaköy that locals have quietly loved for years, serving seasonal mezze and fish alongside a well-worn wine list. It's Michelin-recommended without ever feeling like it's trying to impress anyone.",
      metaTitle: "Karaköy Lokantası — Neighborhood Meyhane, Karaköy",
      metaDescription: "Karaköy Lokantası: a quietly beloved meyhane-style restaurant with seasonal mezze and fish.",
      keywords: ["Karaköy Lokantası", "Karaköy restaurant", "meyhane Istanbul", "Michelin recommended Istanbul"],
    },
    tr: {
      name: "Karaköy Lokantası",
      description:
        "Karaköy'de yıllardır yerlilerin sessizce sevdiği, meyhane tarzı bir mahalle restoranı — mevsimlik mezeler ve balık, alışılmış bir şarap listesiyle sunuluyor. Kimseyi etkilemeye çalışıyor gibi hissettirmeden Michelin tarafından tavsiye ediliyor.",
      metaTitle: "Karaköy Lokantası — Mahalle Meyhanesi, Karaköy",
      metaDescription: "Karaköy Lokantası: yıllardır sevilen, meyhane tarzı bir Karaköy mahalle restoranı.",
      keywords: ["Karaköy Lokantası", "Karaköy restoran", "meyhane İstanbul"],
    },
  },
  {
    districtSlug: "kadikoy",
    priceTier: "EXPENSIVE",
    tags: ["new-opening", "michelin-starred", "turkish-cuisine"],
    sourceUrl: "https://guide.michelin.com/us/en/istanbul-province/istanbul/restaurant/araf-istanbul",
    en: {
      name: "Araf İstanbul",
      description:
        "A tiny 12-seat counter built around an open fire, Araf earned its first Michelin Star in the 2026 guide for chefs Kenan and Pınar Çetinkaya's offal-focused, no-compromise cooking. Seats are limited and the kitchen is right in front of you — book ahead.",
      metaTitle: "Araf İstanbul — New 2026 Michelin Star, Kadıköy",
      metaDescription: "Araf İstanbul: a 12-seat open-fire counter restaurant, newly Michelin-starred in 2026.",
      keywords: ["Araf Istanbul", "new Michelin star 2026", "Kadıköy restaurant", "Kenan Çetinkaya"],
    },
    tr: {
      name: "Araf İstanbul",
      description:
        "Açık ateş etrafına kurulmuş 12 kişilik minik bir tezgah olan Araf, şef Kenan ve Pınar Çetinkaya'nın sakatat ağırlıklı, ödün vermeyen mutfağıyla 2026 rehberinde ilk Michelin Yıldızı'nı kazandı. Yer sayısı sınırlı ve mutfak tam önünüzde — önceden rezervasyon şart.",
      metaTitle: "Araf İstanbul — 2026'nın Yeni Michelin Yıldızı, Kadıköy",
      metaDescription: "Araf İstanbul: açık ateş etrafında 12 kişilik, 2026'da yeni Michelin yıldızı almış bir restoran.",
      keywords: ["Araf İstanbul", "yeni Michelin yıldızı 2026", "Kadıköy restoran"],
    },
  },
  {
    districtSlug: "sisli",
    priceTier: "EXPENSIVE",
    tags: ["new-opening", "fine-dining", "turkish-cuisine"],
    addressText: "Hilton Istanbul Bosphorus, Harbiye/Şişli",
    en: {
      name: "Malva",
      description:
        "The signature Turkish fine-dining restaurant from the Hilton Istanbul Bosphorus's 2026 relaunch, Malva is one of five new dining concepts to open as part of the hotel's overhaul. It's a fresh, high-end addition to a stretch of the city that's been getting a lot of new hotel-restaurant energy this year.",
      metaTitle: "Malva — New Turkish Fine Dining at Hilton Bosphorus",
      metaDescription: "Malva: the new signature Turkish fine-dining restaurant from Hilton Istanbul Bosphorus's 2026 relaunch.",
      keywords: ["Malva Istanbul", "Hilton Istanbul Bosphorus restaurant", "new restaurant Istanbul 2026"],
    },
    tr: {
      name: "Malva",
      description:
        "Hilton Istanbul Bosphorus'un 2026'daki yenilenmesiyle açılan imza Türk fine-dining restoranı Malva, otelin yenilenme sürecinde açılan beş yeni mekândan biri. Bu yıl bölgede artan otel-restoran hareketliliğine taze ve üst düzey bir katkı.",
      metaTitle: "Malva — Hilton Bosphorus'ta Yeni Türk Fine Dining",
      metaDescription: "Malva: Hilton Istanbul Bosphorus'un 2026 yenilenmesiyle açılan yeni imza Türk restoranı.",
      keywords: ["Malva İstanbul", "Hilton Istanbul Bosphorus restoran", "yeni restoran İstanbul 2026"],
    },
  },
  // --- International cuisine, added to back real cuisine collections ---
  {
    districtSlug: "besiktas",
    priceTier: "EXPENSIVE",
    tags: ["authentic", "italian-cuisine"],
    addressText: "Nispetiye Cad., Dilhayat Sok. No:7, Etiler/Beşiktaş",
    sourceUrl: "https://www.damario.com.tr/",
    website: "https://www.damario.com.tr/",
    en: {
      name: "Da Mario",
      description:
        "Istanbul's first proper Italian restaurant, open in Etiler since 1993, still runs on the same rustic-but-elegant formula that made it a fixture for the city's Italian-food regulars decades before Istanbul's current Italian-dining boom. Simple, well-made pasta over trend-chasing.",
      metaTitle: "Da Mario — Istanbul's First Italian Restaurant, Since 1993",
      metaDescription: "Da Mario: Istanbul's original Italian restaurant, serving classic Italian cooking in Etiler since 1993.",
      keywords: ["Da Mario Istanbul", "Italian restaurant Istanbul", "Etiler restaurant", "Beşiktaş Italian food"],
    },
    tr: {
      name: "Da Mario",
      description:
        "İstanbul'un ilk gerçek İtalyan restoranı olan Da Mario, 1993'ten beri Etiler'de aynı sade ama zarif formülle hizmet veriyor — şehrin bugünkü İtalyan mutfağı patlamasından onlarca yıl önce müdavim kazanmış bir mekân. Trend kovalamak yerine sade, iyi yapılmış makarnaya odaklanıyor.",
      metaTitle: "Da Mario — 1993'ten Beri İstanbul'un İlk İtalyan Restoranı",
      metaDescription: "Da Mario: 1993'ten beri Etiler'de klasik İtalyan mutfağı sunan İstanbul'un ilk İtalyan restoranı.",
      keywords: ["Da Mario İstanbul", "İtalyan restoran İstanbul", "Etiler restoran"],
    },
  },
  {
    districtSlug: "besiktas",
    priceTier: "EXPENSIVE",
    tags: ["fine-dining", "italian-cuisine"],
    addressText: "Conrad İstanbul Bosphorus, Beşiktaş",
    sourceUrl: "https://guide.michelin.com/en/istanbul-province/istanbul/restaurant/monteverdi-ristorante",
    en: {
      name: "Monteverdi Ristorante",
      description:
        "Inside the Conrad Istanbul Bosphorus, chef Nicole Scandella's Monteverdi earned a spot in the Michelin Guide's recommended selection for handmade pastas and wood-fired Neapolitan pizza built on Lombardy's culinary traditions, reworked with a modern touch.",
      metaTitle: "Monteverdi Ristorante — Michelin-Recommended Italian, Beşiktaş",
      metaDescription: "Monteverdi Ristorante at the Conrad Istanbul Bosphorus: Michelin-recommended handmade pasta and Neapolitan pizza.",
      keywords: ["Monteverdi Ristorante", "Conrad Istanbul restaurant", "Italian restaurant Beşiktaş", "Michelin recommended Istanbul"],
    },
    tr: {
      name: "Monteverdi Ristorante",
      description:
        "Conrad İstanbul Bosphorus içinde yer alan, şef Nicole Scandella'nın yönettiği Monteverdi, Lombardiya mutfak geleneklerinden beslenip modern bir dokunuşla yeniden yorumlanan el yapımı makarnaları ve odun ateşinde Napoli usulü pizzalarıyla Michelin Rehberi'nin tavsiye listesine girdi.",
      metaTitle: "Monteverdi Ristorante — Michelin Tavsiyeli İtalyan, Beşiktaş",
      metaDescription: "Conrad İstanbul Bosphorus'taki Monteverdi Ristorante: Michelin tavsiyeli el yapımı makarna ve Napoli pizzası.",
      keywords: ["Monteverdi Ristorante", "Conrad İstanbul restoran", "İtalyan restoran Beşiktaş"],
    },
  },
  {
    districtSlug: "besiktas",
    priceTier: "EXPENSIVE",
    tags: ["fine-dining", "michelin-starred", "japanese-cuisine"],
    addressText: "Bebek, Cevdet Paşa Cd. No:34, 34342 Beşiktaş",
    sourceUrl: "https://guide.michelin.com/us/en/istanbul-province/istanbul/restaurant/sankai-by-nagaya",
    en: {
      name: "Sankai by Nagaya",
      description:
        "A 24-seat omakase counter on the third floor of Bebek Hotel, Sankai holds Istanbul's only Michelin star for Japanese cuisine, developed in collaboration with three-star chef Yoshizumi Nagaya. Two tasting menus, no à la carte, Bosphorus views included.",
      metaTitle: "Sankai by Nagaya — Istanbul's Only Michelin-Starred Japanese",
      metaDescription: "Sankai by Nagaya: a 24-seat omakase restaurant in Bebek holding Istanbul's only Michelin star for Japanese cuisine.",
      keywords: ["Sankai by Nagaya", "Michelin star Japanese Istanbul", "omakase Istanbul", "Bebek restaurant"],
    },
    tr: {
      name: "Sankai by Nagaya",
      description:
        "Bebek Hotel'in üçüncü katındaki 24 kişilik omakase tezgahı Sankai, üç yıldızlı şef Yoshizumi Nagaya işbirliğiyle geliştirilen mönüsüyle İstanbul'un Japon mutfağındaki tek Michelin yıldızını taşıyor. À la carte yok, iki tadım menüsü ve Boğaz manzarası var.",
      metaTitle: "Sankai by Nagaya — İstanbul'un Tek Michelin Yıldızlı Japon Restoranı",
      metaDescription: "Sankai by Nagaya: Bebek'te, İstanbul'un Japon mutfağındaki tek Michelin yıldızını taşıyan 24 kişilik omakase restoranı.",
      keywords: ["Sankai by Nagaya", "Michelin yıldızlı Japon İstanbul", "omakase İstanbul"],
    },
  },
  {
    districtSlug: "besiktas",
    priceTier: "EXPENSIVE",
    tags: ["fine-dining", "japanese-cuisine"],
    addressText: "Salhane Sk. No:7, Ortaköy/Beşiktaş",
    sourceUrl: "https://www.zumarestaurant.com/en/istanbul",
    website: "https://www.zumarestaurant.com/en/istanbul",
    en: {
      name: "Zuma Istanbul",
      description:
        "The Istanbul outpost of the international Zuma group sits on the water in Ortaköy, serving contemporary Japanese food across three separate kitchens — robata grill, sushi counter, and main kitchen. Bold, ingredient-driven, and consistently one of the city's most-booked tables.",
      metaTitle: "Zuma Istanbul — Contemporary Japanese, Ortaköy",
      metaDescription: "Zuma Istanbul: the Ortaköy branch of the global Zuma group, serving contemporary Japanese cuisine on the Bosphorus.",
      keywords: ["Zuma Istanbul", "Ortaköy restaurant", "Japanese restaurant Istanbul", "Bosphorus dining"],
    },
    tr: {
      name: "Zuma Istanbul",
      description:
        "Uluslararası Zuma grubunun İstanbul şubesi, Ortaköy'de suyun kenarında yer alıyor ve robata ızgarası, suşi tezgahı ve ana mutfak olmak üzere üç ayrı mutfakta çağdaş Japon mutfağı sunuyor. Cesur, malzeme odaklı ve şehrin en çok rezervasyon alan masalarından biri.",
      metaTitle: "Zuma Istanbul — Çağdaş Japon Mutfağı, Ortaköy",
      metaDescription: "Zuma Istanbul: küresel Zuma grubunun Ortaköy şubesi, Boğaz kıyısında çağdaş Japon mutfağı sunuyor.",
      keywords: ["Zuma İstanbul", "Ortaköy restoran", "Japon restoran İstanbul"],
    },
  },
  {
    districtSlug: "besiktas",
    priceTier: "EXPENSIVE",
    tags: ["seafood"],
    addressText: "Arnavutköy Cad. No:52, Arnavutköy/Beşiktaş",
    sourceUrl: "https://www.surbalik.com/en/arnavutkoy",
    website: "https://www.surbalik.com/en/arnavutkoy",
    en: {
      name: "Sur Balık",
      description:
        "A Bosphorus-front seafood restaurant in Arnavutköy pairing fresh catch with Mediterranean technique, popular enough with locals that reservations are worth making even on weeknights. The view across the water is as much a draw as the fish itself.",
      metaTitle: "Sur Balık — Bosphorus Seafood, Arnavutköy",
      metaDescription: "Sur Balık: fresh seafood on the Bosphorus waterfront in Arnavutköy, a local favorite.",
      keywords: ["Sur Balık Istanbul", "Arnavutköy restaurant", "seafood restaurant Istanbul", "Bosphorus fish restaurant"],
    },
    tr: {
      name: "Sur Balık",
      description:
        "Arnavutköy'de Boğaz kıyısında yer alan Sur Balık, taze balığı Akdeniz tekniğiyle birleştiriyor ve hafta içi akşamlarda bile rezervasyon yaptırmaya değecek kadar yerliler arasında popüler. Manzara, balık kadar cazibenin bir parçası.",
      metaTitle: "Sur Balık — Boğaz'da Deniz Ürünleri, Arnavutköy",
      metaDescription: "Sur Balık: Arnavutköy'de Boğaz kıyısında, yerlilerin gözdesi taze deniz ürünleri restoranı.",
      keywords: ["Sur Balık İstanbul", "Arnavutköy restoran", "deniz ürünleri İstanbul"],
    },
  },
  {
    districtSlug: "besiktas",
    priceTier: "MODERATE",
    tags: ["seafood", "authentic"],
    addressText: "Bebek Mah., Cevdet Paşa Cd. No:26/A, 34342 Beşiktaş",
    sourceUrl: "https://www.tripadvisor.com/Restaurant_Review-g293974-d812926-Reviews-Bebek_Balikci-Istanbul.html",
    en: {
      name: "Bebek Balıkçı",
      description:
        "A Bebek fish restaurant since 1998, small enough to still feel like a neighborhood spot despite sitting on one of the Bosphorus's most expensive stretches of real estate. Straightforward grilled and fried fish, done well, without a tasting menu in sight.",
      metaTitle: "Bebek Balıkçı — Neighborhood Fish Restaurant Since 1998",
      metaDescription: "Bebek Balıkçı: a Bebek seafood spot since 1998, known for simple, well-done grilled fish.",
      keywords: ["Bebek Balıkçı", "Bebek restaurant", "seafood Istanbul", "fish restaurant Bosphorus"],
    },
    tr: {
      name: "Bebek Balıkçı",
      description:
        "1998'den beri Bebek'te hizmet veren bu balık restoranı, Boğaz'ın en pahalı bölgelerinden birinde olmasına rağmen hâlâ bir mahalle mekânı hissi veriyor. Tadım menüsü yok, sade ve iyi yapılmış ızgara ve tava balığı var.",
      metaTitle: "Bebek Balıkçı — 1998'den Beri Mahalle Balıkçısı",
      metaDescription: "Bebek Balıkçı: 1998'den beri Bebek'te, sade ve iyi yapılmış ızgara balığıyla tanınan bir mekân.",
      keywords: ["Bebek Balıkçı", "Bebek restoran", "deniz ürünleri İstanbul"],
    },
  },
];

async function main(): Promise<void> {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: "restaurants" } });

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
              canonicalUrl: `${SITE_BASE_URL}/en/restaurants/${enSlug}`,
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
              canonicalUrl: `${SITE_BASE_URL}/tr/restaurants/${trSlug}`,
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
  console.log(`done: ${PLACES.length} restaurants processed`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
