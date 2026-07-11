import { prisma } from "@istanbul-guide/db";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  SUCCESS: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  RUNNING: "bg-amber-100 text-amber-700",
};

function formatWhen(date: Date): string {
  return date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export default async function ParserStatusPage() {
  const runs = await prisma.parserRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 30,
    include: { source: { select: { name: true, slug: true } } },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-(--color-teal-900)">Collection status</h1>
      <p className="mt-1 text-sm text-(--color-ink)/50">
        The last {runs.length} times a source was checked for new content.
      </p>

      {runs.length === 0 ? (
        <p className="mt-8 text-sm text-(--color-ink)/50">No runs recorded yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 text-xs text-(--color-ink)/40">
              <tr>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Discovered</th>
                <th className="px-4 py-3 font-medium">New</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Started</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-(--color-ink)/80">{run.source.name}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[run.status]}`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-(--color-ink)/60">{run.discoveredCount}</td>
                  <td className="px-4 py-3 text-(--color-ink)/60">{run.newCount}</td>
                  <td className="px-4 py-3 text-(--color-ink)/60">{run.updatedCount}</td>
                  <td className="px-4 py-3 text-(--color-ink)/60">
                    {run.durationMs !== null ? `${(run.durationMs / 1000).toFixed(1)}s` : "—"}
                  </td>
                  <td className="px-4 py-3 text-(--color-ink)/60">{formatWhen(run.startedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
