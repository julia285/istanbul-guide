import { prisma } from "@istanbul-guide/db";

export const dynamic = "force-dynamic";

const PRIORITY_LABELS: Record<number, string> = {
  0: "Official venue/organizer",
  1: "Official ticket seller",
  2: "Aggregator",
  3: "Editorial/community",
};

const HEALTH_STYLES: Record<string, string> = {
  HEALTHY: "bg-green-100 text-green-700",
  DEGRADED: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700",
};

function formatWhen(date: Date | null): string {
  if (!date) return "never";
  return date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminSourcesPage() {
  const sources = await prisma.source.findMany({ orderBy: [{ priority: "asc" }, { name: "asc" }] });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-(--color-teal-900)">Data sources</h1>
      <p className="mt-1 text-sm text-(--color-ink)/50">
        What&rsquo;s actively being collected from, and whether it&rsquo;s healthy.
      </p>

      <div className="mt-6 space-y-3">
        {sources.map((source) => (
          <div key={source.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-display text-lg font-semibold text-(--color-teal-900)">
                  {source.name}
                </span>
                <span className="ml-2 text-xs text-(--color-ink)/40">{source.baseUrl}</span>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  source.healthStatus ? HEALTH_STYLES[source.healthStatus] : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {source.healthStatus ?? "UNKNOWN"}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-(--color-ink)/40">Priority</dt>
                <dd className="text-(--color-ink)/70">{PRIORITY_LABELS[source.priority] ?? source.priority}</dd>
              </div>
              <div>
                <dt className="text-xs text-(--color-ink)/40">Runs every</dt>
                <dd className="text-(--color-ink)/70">{source.intervalMinutes} min</dd>
              </div>
              <div>
                <dt className="text-xs text-(--color-ink)/40">Auto-publish</dt>
                <dd className={source.autoPublishEnabled ? "text-(--color-ink)/70" : "font-semibold text-(--color-terracotta-600)"}>
                  {source.autoPublishEnabled ? "On" : "Off (needs review)"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-(--color-ink)/40">Consecutive failures</dt>
                <dd className="text-(--color-ink)/70">{source.consecutiveFailures}</dd>
              </div>
              <div>
                <dt className="text-xs text-(--color-ink)/40">Last run</dt>
                <dd className="text-(--color-ink)/70">{formatWhen(source.lastRunAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-(--color-ink)/40">Last success</dt>
                <dd className="text-(--color-ink)/70">{formatWhen(source.lastSuccessAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-(--color-ink)/40">Last failure</dt>
                <dd className="text-(--color-ink)/70">{formatWhen(source.lastFailureAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-(--color-ink)/40">Status</dt>
                <dd className="text-(--color-ink)/70">{source.active ? "Active" : "Disabled"}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
