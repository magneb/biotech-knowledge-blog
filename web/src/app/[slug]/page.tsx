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
    _id, title, body, contentType, publishedAt
  }`
);

export async function generateStaticParams() {
  try {
    const { data: articles } = await sanityFetch({
      query: ARTICLES_SLUGS_QUERY,
      perspective: "published",
      stega: false,
    });
    // Static export / prerender fallback when dataset has no published articles yet.
    if (!articles || articles.length === 0) return [{ slug: "_" }];
    return articles.map((article) => ({ slug: article.slug }));
  } catch {
    return [{ slug: "_" }];
  }
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
  }).catch((err) => {
    console.warn("Unable to fetch article from Sanity:", err);
    return { data: null };
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
          {article.contentType && (
            <span className="paper-category">
              {formatCategory(stegaClean(article.contentType))}
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
