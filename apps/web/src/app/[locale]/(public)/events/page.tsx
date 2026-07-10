import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@istanbul-guide/db";
import { EmptyState } from "@/components/empty-state";

// Published events change whenever the AI pipeline publishes/updates one;
// on-demand revalidation (revalidatePath, called by the Quality Agent at
// publish time) supersedes a time-based window here — see architecture
// doc section 10 (SEO Strategy).
export const dynamic = "force-dynamic";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("events");

  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { startAt: "asc" },
    take: 24,
    include: {
      translations: { where: { locale } },
      district: { include: { translations: { where: { locale } } } },
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <h1 className="font-display text-3xl font-semibold text-(--color-teal-900)">{t("title")}</h1>
      <p className="mt-2 text-(--color-ink)/60">{t("subtitle")}</p>

      {events.length === 0 ? (
        <EmptyState title={t("empty")} detail={t("emptyDetail")} />
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {events.map((event) => {
            const translation = event.translations[0];
            return (
              <li
                key={event.id}
                className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <h2 className="font-display text-lg font-semibold text-(--color-teal-900)">
                  {translation?.name ?? event.id}
                </h2>
                {translation?.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-(--color-ink)/60">
                    {translation.description}
                  </p>
                )}
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-(--color-terracotta-500)">
                  {new Date(event.startAt).toLocaleDateString(locale, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                  {event.district?.translations[0] ? ` · ${event.district.translations[0].name}` : ""}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
