// Starter taxonomy for the MVP (Events-only) phase. Seeded into the DB by
// scripts/seed-taxonomy.ts and used here to constrain the Category Agent's
// structured output to values that actually exist as rows. Extend this list
// (and re-run the seed script) as new content types/sections come online —
// see architecture doc section 1, "Sections become taxonomy filters."

export const CATEGORIES = [
  { slug: "concerts", en: "Concerts", tr: "Konserler" },
  { slug: "festivals", en: "Festivals", tr: "Festivaller" },
  { slug: "exhibitions", en: "Exhibitions", tr: "Sergiler" },
  { slug: "nightlife", en: "Nightlife", tr: "Gece Hayatı" },
  { slug: "theater", en: "Theater & Performance", tr: "Tiyatro ve Performans" },
  { slug: "comedy", en: "Comedy", tr: "Komedi" },
  { slug: "family-activities", en: "Family Activities", tr: "Aile Etkinlikleri" },
  { slug: "markets", en: "Markets", tr: "Pazarlar" },
  { slug: "workshops", en: "Workshops", tr: "Atölyeler" },
] as const;

export const DISTRICTS = [
  { slug: "beyoglu", en: "Beyoğlu", tr: "Beyoğlu" },
  { slug: "kadikoy", en: "Kadıköy", tr: "Kadıköy" },
  { slug: "sisli", en: "Şişli", tr: "Şişli" },
  { slug: "besiktas", en: "Beşiktaş", tr: "Beşiktaş" },
  { slug: "uskudar", en: "Üsküdar", tr: "Üsküdar" },
  { slug: "sariyer", en: "Sarıyer", tr: "Sarıyer" },
  { slug: "fatih", en: "Fatih", tr: "Fatih" },
  { slug: "bakirkoy", en: "Bakırköy", tr: "Bakırköy" },
  { slug: "atasehir", en: "Ataşehir", tr: "Ataşehir" },
  { slug: "kartal", en: "Kartal", tr: "Kartal" },
] as const;

export const TAGS = [
  { slug: "free", en: "Free", tr: "Ücretsiz" },
  { slug: "indoor", en: "Indoor", tr: "Kapalı Mekan" },
  { slug: "outdoor", en: "Outdoor", tr: "Açık Hava" },
  { slug: "family-friendly", en: "Family-Friendly", tr: "Aileler İçin Uygun" },
  { slug: "hidden-gem", en: "Hidden Gem", tr: "Gizli Mekan" },
  { slug: "rooftop", en: "Rooftop", tr: "Çatı Katı" },
  { slug: "live-music", en: "Live Music", tr: "Canlı Müzik" },
  { slug: "weekend", en: "Weekend", tr: "Hafta Sonu" },
  { slug: "tourist-friendly", en: "Tourist-Friendly", tr: "Turistlere Uygun" },
  { slug: "expat-friendly", en: "Expat-Friendly", tr: "Yabancılara Uygun" },
] as const;

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);
export const DISTRICT_SLUGS = DISTRICTS.map((d) => d.slug);
export const TAG_SLUGS = TAGS.map((t) => t.slug);

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];
export type DistrictSlug = (typeof DISTRICT_SLUGS)[number];
export type TagSlug = (typeof TAG_SLUGS)[number];
