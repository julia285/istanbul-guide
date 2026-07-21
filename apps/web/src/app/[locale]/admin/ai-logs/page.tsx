import { prisma } from "@istanbul-guide/db";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  ok: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
};

export default async function AdminAiLogsPage() {
  const logs = await prisma.aiLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-(--color-teal-900)">Activity log</h1>
      <p className="mt-1 text-sm text-(--color-ink)/50">
        The last 100 steps the AI pipeline ran, most recent first.
      </p>

      {logs.length === 0 ? (
        <p className="mt-8 text-sm text-(--color-ink)/50">
          No pipeline activity yet — nothing has run through the automated pipeline.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase tracking-wide text-(--color-ink)/40">
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Score</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-2.5 text-xs text-(--color-ink)/50">
                    {log.createdAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-(--color-teal-900)">{log.agentName}</td>
                  <td className="px-4 py-2.5 text-xs text-(--color-ink)/50">
                    {log.entityType}:{log.entityId.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[log.status] ?? ""}`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-(--color-ink)/50">
                    {typeof log.confidenceScore === "number" ? log.confidenceScore.toFixed(2) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
