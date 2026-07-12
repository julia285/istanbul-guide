import { prisma } from "@istanbul-guide/db";
import { Link } from "@/i18n/navigation";
import { setPlaceStatus } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-neutral-100 text-neutral-500",
  REVIEW: "bg-amber-100 text-amber-700",
  PUBLISHED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-neutral-100 text-neutral-400",
};

export default async function AdminRestaurantsPage() {
  const places = await prisma.place.findMany({
    where: { category: { slug: "restaurants" } },
    orderBy: { createdAt: "desc" },
    include: {
      translations: { where: { locale: "en" } },
      district: { include: { translations: { where: { locale: "en" } } } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-(--color-teal-900)">Restaurants</h1>
          <p className="mt-1 text-sm text-(--color-ink)/50">
            Everything published (or drafted) on the restaurants page.
          </p>
        </div>
        <Link
          href="/admin/restaurants/new"
          className="rounded-full bg-(--color-terracotta-500) px-4 py-2 text-sm font-semibold text-white transition hover:bg-(--color-terracotta-600)"
        >
          + Add restaurant
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {places.map((place) => {
          const translation = place.translations[0];
          const toggleStatus = place.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
          const toggleAction = setPlaceStatus.bind(null, place.id, toggleStatus);
          return (
            <div
              key={place.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-semibold text-(--color-teal-900)">
                    {translation?.name ?? place.id}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[place.status] ?? ""}`}
                  >
                    {place.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-(--color-ink)/40">
                  {place.district?.translations[0]?.name}
                  {place.addressText ? ` · ${place.addressText}` : ""}
                </p>
              </div>
              <form action={toggleAction}>
                <button
                  type="submit"
                  className="shrink-0 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-(--color-ink)/70 transition hover:bg-(--color-sand-50)"
                >
                  {place.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
