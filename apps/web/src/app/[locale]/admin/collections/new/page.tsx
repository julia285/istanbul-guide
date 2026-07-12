import { prisma } from "@istanbul-guide/db";
import { Link } from "@/i18n/navigation";
import { createCollection } from "../actions";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  "missing-fields": "Please fill in both English and Turkish title and intro text.",
  "no-restaurants": "Pick at least one restaurant to include.",
  "duplicate-slug": "A collection with that title (in that language) already exists.",
};

const inputClass =
  "mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-(--color-ink) focus:border-(--color-teal-500) focus:outline-none";
const labelClass = "text-xs font-semibold uppercase tracking-wide text-(--color-ink)/50";

export default async function NewCollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const restaurants = await prisma.place.findMany({
    where: { status: "PUBLISHED", category: { slug: "restaurants" } },
    orderBy: { createdAt: "desc" },
    include: { translations: { where: { locale: "en" } } },
  });

  return (
    <div>
      <Link href="/admin/collections" className="text-sm font-medium text-(--color-teal-700) hover:underline">
        ← Collections
      </Link>
      <h1 className="font-display mt-3 text-2xl font-semibold text-(--color-teal-900)">Add a collection</h1>
      <p className="mt-1 text-sm text-(--color-ink)/50">
        Pick which restaurants belong in this list and the order they appear in.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-(--color-terracotta-100) px-4 py-2 text-sm text-(--color-terracotta-700)">
          {ERROR_MESSAGES[error] ?? "Something went wrong."}
        </p>
      )}

      <form action={createCollection} className="mt-6 max-w-2xl space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClass}>Title (English)</span>
            <input name="titleEn" required className={inputClass} placeholder="Best Italian Restaurants in Istanbul" />
          </label>
          <label>
            <span className={labelClass}>Title (Turkish)</span>
            <input name="titleTr" required className={inputClass} />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClass}>Intro text (English)</span>
            <textarea name="bodyEn" required rows={4} className={inputClass} />
          </label>
          <label>
            <span className={labelClass}>Intro text (Turkish)</span>
            <textarea name="bodyTr" required rows={4} className={inputClass} />
          </label>
        </div>

        <fieldset>
          <legend className={labelClass}>Restaurants (check to include, number sets the order)</legend>
          {restaurants.length === 0 ? (
            <p className="mt-2 text-sm text-(--color-ink)/50">
              No published restaurants yet — add one first.
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {restaurants.map((place, index) => {
                const name = place.translations[0]?.name ?? place.id;
                return (
                  <div
                    key={place.id}
                    className="flex items-center gap-3 rounded-lg border border-black/10 bg-white px-3 py-2"
                  >
                    <input type="checkbox" name="placeId" value={place.id} id={`place-${place.id}`} />
                    <label htmlFor={`place-${place.id}`} className="flex-1 text-sm text-(--color-ink)/80">
                      {name}
                    </label>
                    <input
                      type="number"
                      name={`position_${place.id}`}
                      defaultValue={index}
                      min={0}
                      className="w-16 rounded-md border border-black/10 px-2 py-1 text-sm"
                      aria-label={`Position for ${name}`}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </fieldset>

        <label className="flex items-center gap-2 text-sm text-(--color-ink)/70">
          <input type="checkbox" name="publishNow" defaultChecked />
          Publish immediately (otherwise saved as a draft)
        </label>

        <button
          type="submit"
          className="rounded-full bg-(--color-terracotta-500) px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-(--color-terracotta-600)"
        >
          Save collection
        </button>
      </form>
    </div>
  );
}
