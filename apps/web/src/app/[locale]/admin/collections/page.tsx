import { prisma } from "@istanbul-guide/db";
import { Link } from "@/i18n/navigation";
import { setArticleStatus } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-neutral-100 text-neutral-500",
  REVIEW: "bg-amber-100 text-amber-700",
  PUBLISHED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-neutral-100 text-neutral-400",
};

export default async function AdminCollectionsPage() {
  const articles = await prisma.article.findMany({
    where: { type: "LISTICLE" },
    orderBy: { createdAt: "desc" },
    include: {
      translations: { where: { locale: "en" } },
      items: { select: { id: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-(--color-teal-900)">Collections</h1>
          <p className="mt-1 text-sm text-(--color-ink)/50">
            &ldquo;Best Of&rdquo; lists shown at the top of the restaurants page.
          </p>
        </div>
        <Link
          href="/admin/collections/new"
          className="rounded-full bg-(--color-terracotta-500) px-4 py-2 text-sm font-semibold text-white transition hover:bg-(--color-terracotta-600)"
        >
          + Add collection
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {articles.map((article) => {
          const translation = article.translations[0];
          const toggleStatus = article.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
          const toggleAction = setArticleStatus.bind(null, article.id, toggleStatus);
          return (
            <div
              key={article.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-semibold text-(--color-teal-900)">
                    {translation?.title ?? article.id}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[article.status] ?? ""}`}
                  >
                    {article.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-(--color-ink)/40">{article.items.length} restaurants</p>
              </div>
              <form action={toggleAction}>
                <button
                  type="submit"
                  className="shrink-0 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-(--color-ink)/70 transition hover:bg-(--color-sand-50)"
                >
                  {article.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
