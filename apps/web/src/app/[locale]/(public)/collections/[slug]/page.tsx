import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@istanbul-guide/db";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

async function getArticle(locale: string, slug: string) {
  const translation = await prisma.articleTranslation.findUnique({
    where: { locale_slug: { locale, slug } },
    include: {
      article: {
        include: {
          items: {
            orderBy: { position: "asc" },
            include: {
              place: {
                include: {
                  translations: { where: { locale } },
                  district: { include: { translations: { where: { locale } } } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!translation) return null;
  if (translation.article.status !== "PUBLISHED") return null;
  return translation;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const translation = await getArticle(locale, slug);
  if (!translation) return {};

  return {
    title: translation.metaTitle ?? translation.title,
    description: translation.metaDescription ?? undefined,
    openGraph: {
      title: translation.ogTitle ?? translation.metaTitle ?? translation.title,
      description: translation.ogDescription ?? translation.metaDescription ?? undefined,
    },
  };
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const translation = await getArticle(locale, slug);
  if (!translation) notFound();

  const { article } = translation;
  const t = await getTranslations("collections");

  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <Link href="/collections" className="text-sm font-medium text-(--color-teal-700) hover:underline">
        ← {t("title")}
      </Link>

      <h1 className="font-display mt-4 text-3xl font-semibold text-(--color-teal-900) sm:text-4xl">
        {translation.title}
      </h1>

      <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-(--color-ink)/80">
        {translation.body}
      </p>

      <ol className="mt-10 flex flex-col gap-4">
        {article.items.map((item, index) => {
          if (!item.place) return null;
          const placeTranslation = item.place.translations[0];
          if (!placeTranslation) return null;
          const card = (
            <>
              <div className="flex items-baseline gap-3">
                <span className="font-display text-xl font-semibold text-(--color-terracotta-500)">
                  {index + 1}
                </span>
                <h2 className="font-display text-lg font-semibold text-(--color-teal-900)">
                  {placeTranslation.name}
                </h2>
              </div>
              {placeTranslation.description && (
                <p className="mt-1.5 line-clamp-2 text-sm text-(--color-ink)/60">
                  {placeTranslation.description}
                </p>
              )}
              {(item.place.addressText || item.place.district?.translations[0]) && (
                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-(--color-ink)/40">
                  {item.place.addressText ?? item.place.district?.translations[0]?.name}
                </p>
              )}
            </>
          );
          return (
            <li
              key={item.id}
              className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              {placeTranslation.slug ? (
                <Link href={`/restaurants/${placeTranslation.slug}`}>{card}</Link>
              ) : (
                card
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
