import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ARTICLE_QUERY_RESULT } from "../../../sanity.types";
import { sanityFetch } from "@/sanity/live";
import { resolveSiteMetadata } from "@/sanity/siteSettings";
import { buildTreatiseMetadata } from "@/lib/scholarlyMetadata";
import { TreatiseReader } from "@/components/TreatiseReader";
import { ARTICLE_QUERY, ARTICLES_SLUGS_QUERY } from "@/sanity/queries";

export { ARTICLE_QUERY, ARTICLES_SLUGS_QUERY };

export async function generateStaticParams() {
  try {
    const { data: articles } = await sanityFetch({
      query: ARTICLES_SLUGS_QUERY,
      perspective: "published",
      stega: false,
    });
    if (!articles || articles.length === 0) return [{ slug: "_" }];
    return articles.map((article) => ({ slug: article.slug }));
  } catch {
    return [{ slug: "_" }];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await sanityFetch({
    query: ARTICLE_QUERY,
    params: { slug },
    stega: false,
  }).catch(() => ({ data: null }));

  type ArticleData = NonNullable<ARTICLE_QUERY_RESULT["article"]>;
  const article: ArticleData | null =
    data && "article" in data
      ? (data.article as ArticleData | null)
      : data && "_id" in data
        ? (data as unknown as ArticleData)
        : null;
  if (!article) {
    return {
      title: "Treatise Not Found — Oliver's Guide To Everything",
    };
  }

  const siteMeta = resolveSiteMetadata(data?.settings);
  return buildTreatiseMetadata({
    slug,
    title: article.title,
    summary: article.summary,
    contentType: article.contentType,
    publishedAt: article.publishedAt,
    versionNumber: article.versionNumber || 1,
    siteMeta,
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data } = await sanityFetch({
    query: ARTICLE_QUERY,
    params: { slug },
  }).catch((err) => {
    console.warn("Unable to fetch article from Sanity:", err);
    return { data: null };
  });

  type ArticleData = NonNullable<ARTICLE_QUERY_RESULT["article"]>;
  const article: ArticleData | null =
    data && "article" in data
      ? (data.article as ArticleData | null)
      : data && "_id" in data
        ? (data as unknown as ArticleData)
        : null;
  if (!article) return notFound();

  const siteMeta = resolveSiteMetadata(data?.settings);

  return (
    <TreatiseReader
      slug={slug}
      versionNumber={article.versionNumber || 1}
      title={article.title}
      contentType={article.contentType}
      summary={article.summary}
      publishedAt={article.publishedAt}
      coverEtching={article.coverEtching}
      body={article.body}
      chapter={article.chapter}
      topics={article.topics}
      downloadablePdfs={article.downloadablePdfs}
      siteMeta={siteMeta}
      backNav={{
        href: "/",
        label: "Return to Frontispiece",
      }}
    />
  );
}
