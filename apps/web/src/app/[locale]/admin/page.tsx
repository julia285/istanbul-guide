import { prisma } from "@istanbul-guide/db";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin");
  const [placesByStatus, eventsByStatus, reviewQueueCount, sourceCount, needsAttentionCount] =
    await Promise.all([
      prisma.place.groupBy({ by: ["status"], _count: true }),
      prisma.event.groupBy({ by: ["status"], _count: true }),
      prisma.reviewQueueItem.count({ where: { status: "PENDING" } }),
      prisma.source.count({ where: { active: true } }),
      prisma.source.count({ where: { active: true, autoPublishEnabled: false } }),
    ]);

  const countFor = (
    rows: Array<{ status: string; _count: number }>,
    status: string,
  ) => rows.find((r) => r.status === status)?._count ?? 0;

  const stats = [
    {
      label: t("published"),
      value: countFor(placesByStatus, "PUBLISHED") + countFor(eventsByStatus, "PUBLISHED"),
    },
    { label: t("reviewQueue"), value: reviewQueueCount },
    { label: "Collecting from", value: sourceCount, suffix: sourceCount === 1 ? "source" : "sources" },
    { label: "Sources needing attention", value: needsAttentionCount },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-(--color-teal-900)">
        {t("dashboard")}
      </h1>
      <p className="mt-1 text-sm text-(--color-ink)/50">
        A quick look at what&rsquo;s live on your site right now.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
          >
            <div className="font-display text-3xl font-semibold text-(--color-teal-900)">
              {stat.value}
              {stat.suffix && (
                <span className="ml-1.5 text-sm font-normal text-(--color-ink)/40">{stat.suffix}</span>
              )}
            </div>
            <div className="mt-1 text-sm text-(--color-ink)/50">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
