import { prisma } from "@istanbul-guide/db";

export const dynamic = "force-dynamic";

export default async function AdminPublishedPage() {
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { startAt: "asc" },
    take: 100,
    include: {
      translations: { where: { locale: "en" } },
      category: { include: { translations: { where: { locale: "en" } } } },
      district: { include: { translations: { where: { locale: "en" } } } },
    },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-(--color-teal-900)">Live listings</h1>
      <p className="mt-1 text-sm text-(--color-ink)/50">
        Every published event, soonest first. Restaurants and collections have their own screens.
      </p>

      {events.length === 0 ? (
        <p className="mt-8 text-sm text-(--color-ink)/50">Nothing published yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {events.map((event) => (
            <div key={event.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <span className="font-display text-base font-semibold text-(--color-teal-900)">
                {event.translations[0]?.name ?? event.id}
              </span>
              <p className="mt-1 text-xs text-(--color-ink)/40">
                {new Date(event.startAt).toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
                {event.category.translations[0]?.name ? ` · ${event.category.translations[0].name}` : ""}
                {event.district?.translations[0]?.name ? ` · ${event.district.translations[0].name}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
