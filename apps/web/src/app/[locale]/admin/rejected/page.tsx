import { prisma } from "@istanbul-guide/db";

export const dynamic = "force-dynamic";

export default async function AdminRejectedPage() {
  const [events, places] = await Promise.all([
    prisma.event.findMany({
      where: { status: "REJECTED" },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        translations: { where: { locale: "en" } },
        category: { include: { translations: { where: { locale: "en" } } } },
      },
    }),
    prisma.place.findMany({
      where: { status: "REJECTED" },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { translations: { where: { locale: "en" } } },
    }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-(--color-teal-900)">Not published</h1>
      <p className="mt-1 text-sm text-(--color-ink)/50">
        Events and places the pipeline or a reviewer rejected — kept for reference, not shown on the site.
      </p>

      {events.length === 0 && places.length === 0 ? (
        <p className="mt-8 text-sm text-(--color-ink)/50">Nothing has been rejected.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {events.map((event) => (
            <div key={event.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-semibold text-(--color-teal-900)">
                  {event.translations[0]?.name ?? event.id}
                </span>
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                  Event
                </span>
              </div>
              <p className="mt-1 text-xs text-(--color-ink)/40">
                {event.category.translations[0]?.name}
                {event.confidenceScore != null ? ` · score ${event.confidenceScore.toFixed(2)}` : ""}
              </p>
            </div>
          ))}
          {places.map((place) => (
            <div key={place.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-semibold text-(--color-teal-900)">
                  {place.translations[0]?.name ?? place.id}
                </span>
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                  Place
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
