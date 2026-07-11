import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@istanbul-guide/db";
import { EmptyState } from "@/components/empty-state";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("collections");

  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED", type: "LISTICLE" },
    orderBy: { publishedAt: "desc" },
    include: {
      translations: { where: { locale } },
      items: { select: { id: true } },
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <h1 className="font-display text-3xl font-semibold text-(--color-teal-900)">{t("title")}</h1>
      <p className="mt-2 text-(--color-ink)/60">{t("subtitle")}</p>

      {articles.length === 0 ? (
        <EmptyState title={t("empty")} detail="" />
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {articles.map((article) => {
            const translation = article.translations[0];
            if (!translation) return null;
            return (
              <li
                key={article.id}
                className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <Link href={`/collections/${translation.slug}`}>
                  <h2 className="font-display text-lg font-semibold text-(--color-teal-900)">
                    {translation.title}
                  </h2>
                  <p className="mt-1.5 line-clamp-2 text-sm text-(--color-ink)/60">{translation.body}</p>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-(--color-terracotta-500)">
                    {article.items.length} {t("viewAll")}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
