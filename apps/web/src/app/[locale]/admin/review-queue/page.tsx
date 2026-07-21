import { prisma } from "@istanbul-guide/db";
import { resolveReviewItem } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminReviewQueuePage() {
  const items = await prisma.reviewQueueItem.findMany({
    where: { status: "PENDING", entityType: "event" },
    orderBy: { createdAt: "asc" },
  });

  const events = await prisma.event.findMany({
    where: { id: { in: items.map((item) => item.entityId) } },
    include: {
      translations: { where: { locale: "en" } },
      category: { include: { translations: { where: { locale: "en" } } } },
      district: { include: { translations: { where: { locale: "en" } } } },
    },
  });
  const eventById = new Map(events.map((event) => [event.id, event]));

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-(--color-teal-900)">Needs your review</h1>
      <p className="mt-1 text-sm text-(--color-ink)/50">
        Events the pipeline wasn&rsquo;t confident enough to auto-publish. Approve or reject each one.
      </p>

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-(--color-ink)/50">Nothing waiting on review right now.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => {
            const event = eventById.get(item.entityId);
            const translation = event?.translations[0];
            const publishAction = resolveReviewItem.bind(null, item.id, item.entityId, "PUBLISHED");
            const rejectAction = resolveReviewItem.bind(null, item.id, item.entityId, "REJECTED");
            return (
              <div key={item.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="font-display text-base font-semibold text-(--color-teal-900)">
                      {translation?.name ?? `(missing event ${item.entityId})`}
                    </span>
                    <p className="mt-1 text-xs text-(--color-ink)/40">
                      {event?.category.translations[0]?.name}
                      {event?.district?.translations[0] ? ` · ${event.district.translations[0].name}` : ""}
                      {event ? ` · ${new Date(event.startAt).toLocaleDateString("en-GB")}` : ""}
                      {typeof item.confidenceScore === "number"
                        ? ` · score ${item.confidenceScore.toFixed(2)}`
                        : ""}
                    </p>
                    <p className="mt-2 text-sm text-(--color-ink)/70">{item.reason}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <form action={publishAction}>
                      <button
                        type="submit"
                        className="rounded-full bg-(--color-terracotta-500) px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-(--color-terracotta-600)"
                      >
                        Publish
                      </button>
                    </form>
                    <form action={rejectAction}>
                      <button
                        type="submit"
                        className="rounded-full border border-black/10 px-4 py-1.5 text-xs font-medium text-(--color-ink)/70 transition hover:bg-(--color-sand-50)"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
