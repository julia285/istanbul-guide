import { prisma } from "@istanbul-guide/db";
import { Link } from "@/i18n/navigation";
import { createRestaurant } from "../actions";

export const dynamic = "force-dynamic";

const CUISINE_TAGS = [
  { slug: "turkish-cuisine", label: "Turkish" },
  { slug: "italian-cuisine", label: "Italian" },
  { slug: "japanese-cuisine", label: "Japanese" },
  { slug: "seafood", label: "Seafood" },
];

const STYLE_TAGS = [
  { slug: "fine-dining", label: "Fine dining" },
  { slug: "authentic", label: "Authentic & time-proven" },
  { slug: "hidden-gem", label: "Hidden gem" },
  { slug: "new-opening", label: "New opening" },
  { slug: "michelin-starred", label: "Michelin-starred" },
  { slug: "rooftop", label: "Rooftop" },
];

const ERROR_MESSAGES: Record<string, string> = {
  "missing-fields": "Please fill in both English and Turkish name and description.",
  "duplicate-slug": "A restaurant with that name (in that language) already exists.",
};

const inputClass =
  "mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-(--color-ink) focus:border-(--color-teal-500) focus:outline-none";
const labelClass = "text-xs font-semibold uppercase tracking-wide text-(--color-ink)/50";

export default async function NewRestaurantPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const districts = await prisma.district.findMany({
    include: { translations: { where: { locale: "en" } } },
    orderBy: { slug: "asc" },
  });

  return (
    <div>
      <Link href="/admin/restaurants" className="text-sm font-medium text-(--color-teal-700) hover:underline">
        ← Restaurants
      </Link>
      <h1 className="font-display mt-3 text-2xl font-semibold text-(--color-teal-900)">Add a restaurant</h1>
      <p className="mt-1 text-sm text-(--color-ink)/50">
        Enter real, verified facts — this goes straight onto the public site.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-(--color-terracotta-100) px-4 py-2 text-sm text-(--color-terracotta-700)">
          {ERROR_MESSAGES[error] ?? "Something went wrong."}
        </p>
      )}

      <form action={createRestaurant} className="mt-6 max-w-2xl space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClass}>Name (English)</span>
            <input name="nameEn" required className={inputClass} />
          </label>
          <label>
            <span className={labelClass}>Name (Turkish)</span>
            <input name="nameTr" required className={inputClass} />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClass}>Description (English)</span>
            <textarea name="descriptionEn" required rows={4} className={inputClass} />
          </label>
          <label>
            <span className={labelClass}>Description (Turkish)</span>
            <textarea name="descriptionTr" required rows={4} className={inputClass} />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClass}>District</span>
            <select name="districtId" className={inputClass}>
              <option value="">Not specified</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.translations[0]?.name ?? district.slug}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={labelClass}>Price tier</span>
            <select name="priceTier" className={inputClass}>
              <option value="">Not specified</option>
              <option value="BUDGET">$ Budget</option>
              <option value="MODERATE">$$ Moderate</option>
              <option value="EXPENSIVE">$$$ Expensive</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className={labelClass}>Street address</span>
          <input name="addressText" className={inputClass} placeholder="e.g. İstiklal Cd. No:1, Beyoğlu" />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClass}>Source link (attribution)</span>
            <input name="sourceUrl" type="url" className={inputClass} placeholder="https://..." />
          </label>
          <label>
            <span className={labelClass}>Restaurant website</span>
            <input name="website" type="url" className={inputClass} placeholder="https://..." />
          </label>
        </div>

        <fieldset>
          <legend className={labelClass}>Cuisine</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {CUISINE_TAGS.map((tag) => (
              <label key={tag.slug} className="flex items-center gap-1.5 text-sm text-(--color-ink)/70">
                <input type="checkbox" name="tags" value={tag.slug} />
                {tag.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className={labelClass}>Style</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {STYLE_TAGS.map((tag) => (
              <label key={tag.slug} className="flex items-center gap-1.5 text-sm text-(--color-ink)/70">
                <input type="checkbox" name="tags" value={tag.slug} />
                {tag.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex items-center gap-2 text-sm text-(--color-ink)/70">
          <input type="checkbox" name="publishNow" defaultChecked />
          Publish immediately (otherwise saved as a draft)
        </label>

        <button
          type="submit"
          className="rounded-full bg-(--color-terracotta-500) px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-(--color-terracotta-600)"
        >
          Save restaurant
        </button>
      </form>
    </div>
  );
}
