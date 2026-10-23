import { PortableText, defineQuery, stegaClean } from "next-sanity";
import { notFound } from "next/navigation";
import Link from "next/link";
import { sanityFetch } from "@/sanity/live";
import { Icon } from "@/components/ui/Icon";
import { formatCategory, formatDate } from "@/lib/format";

const ARTICLES_SLUGS_QUERY = defineQuery(
  `*[_type == "article" && defined(slug.current)]{ "slug": slug.current }`
);

const ARTICLE_QUERY = defineQuery(
  `*[_type == "article" && slug.current == $slug][0]{
    _id, title, body, category, publishedAt
  }`
);

export async function generateStaticParams() {
  const { data: articles } = await sanityFetch({
    query: ARTICLES_SLUGS_QUERY,
    perspective: "published",
    stega: false,
  });
  // Static export / prerender fallback when dataset has no published articles yet.
  if (articles.length === 0) return [{ slug: "_" }];
  return articles.map((article) => ({ slug: article.slug }));
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: article } = await sanityFetch({
    query: ARTICLE_QUERY,
    params: { slug },
  });

  if (!article) return notFound();

  return (
    <>
      {/* ── Back navigation ── */}
      <nav className="back-nav">
        <Link href="/" className="back-link">
          <Icon name="arrow-right" size={13} style={{ transform: "rotate(180deg)" }} />
          Back to index
        </Link>
      </nav>

      {/* ── Paper ── */}
      <article className="paper">
        <header className="paper-header">
          {article.category && (
            <span className="paper-category">
              {formatCategory(stegaClean(article.category))}
            </span>
          )}

          <h1 className="paper-title">{article.title}</h1>

          {article.publishedAt && (
            <time className="paper-date">
              {formatDate(stegaClean(article.publishedAt), "long")}
            </time>
          )}
        </header>

        <div className="paper-body">
          {Array.isArray(article.body) && (
            <PortableText value={article.body} />
          )}
        </div>
      </article>
    </>
  );
}
