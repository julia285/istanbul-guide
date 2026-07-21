import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

// NOTE: gated by a shared-password Basic Auth check in middleware.ts as a
// stopgap — replace with real per-person Supabase Auth (architecture doc
// section 9) before this has more than one admin user or exposes actions
// beyond read-only stats.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("admin");
  const links: Array<[string, string]> = [
    ["/admin", t("dashboard")],
    ["/admin/published", t("published")],
    ["/admin/review-queue", t("reviewQueue")],
    ["/admin/rejected", t("rejected")],
    ["/admin/restaurants", t("restaurants")],
    ["/admin/cafes", t("cafes")],
    ["/admin/collections", t("collections")],
    ["/admin/sources", t("sources")],
    ["/admin/parser-status", t("parserStatus")],
    ["/admin/conflicts", t("conflicts")],
    ["/admin/ai-logs", t("aiLogs")],
  ];

  return (
    <div className="min-h-screen bg-(--color-sand-50)">
      <div className="mx-auto grid max-w-5xl grid-cols-[200px_1fr] gap-10 px-5 py-10">
        <aside>
          <p className="mb-4 px-3 font-display text-sm font-semibold text-(--color-teal-900)">
            Site manager
          </p>
          <nav className="space-y-0.5">
            {links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="block rounded-lg px-3 py-2 text-sm text-(--color-ink)/70 transition hover:bg-white hover:text-(--color-teal-900)"
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
