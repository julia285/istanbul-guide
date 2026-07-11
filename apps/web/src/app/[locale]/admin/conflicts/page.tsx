import { prisma } from "@istanbul-guide/db";

export const dynamic = "force-dynamic";

export default async function ConflictsPage() {
  // Non-primary EventSource rows are the ones that could have recorded a
  // disagreement with the canonical event (the primary source IS the
  // canonical values) — see event-source-merge.ts.
  const candidates = await prisma.eventSource.findMany({
    where: { isPrimary: false },
    include: {
      source: { select: { name: true } },
      event: { include: { translations: { where: { locale: "en" } } } },
    },
    orderBy: { lastSeenAt: "desc" },
  });

  const conflicts = candidates.filter(
    (row) => row.conflictingFields && Object.keys(row.conflictingFields as object).length > 0,
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-(--color-teal-900)">Data conflicts</h1>
      <p className="mt-1 text-sm text-(--color-ink)/50">
        When two sources report the same event with different facts, the higher-priority source
        wins automatically — these are the disagreements, in case something needs a second look.
      </p>

      {conflicts.length === 0 ? (
        <p className="mt-8 text-sm text-(--color-ink)/50">
          No conflicts right now — either only one source has reported each event so far, or
          every source that reported the same event agreed on the facts.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {conflicts.map((row) => (
            <li key={row.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <p className="font-display font-semibold text-(--color-teal-900)">
                {row.event.translations[0]?.name ?? row.eventId}
              </p>
              <p className="mt-1 text-xs text-(--color-ink)/50">
                {row.source.name} reports different values than the current primary source:
              </p>
              <dl className="mt-3 space-y-1">
                {Object.entries(row.conflictingFields as Record<string, unknown>).map(([field, value]) => (
                  <div key={field} className="flex gap-2 text-sm">
                    <dt className="font-medium text-(--color-terracotta-600)">{field}:</dt>
                    <dd className="text-(--color-ink)/70">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
