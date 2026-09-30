import { PortableText, defineQuery, type SanityDocument } from "next-sanity";
import { notFound } from "next/navigation";
import Link from "next/link";
import { client } from "@/sanity/client";

const ARTICLES_SLUGS_QUERY = defineQuery(
  `*[_type == "article" && defined(slug.current)]{ "slug": slug.current }`
);

const ARTICLE_QUERY = defineQuery(
  `*[_type == "article" && slug.current == $slug][0]{
    _id, title, body, category, publishedAt
  }`
);

export async function generateStaticParams() {
  const articles = await client.fetch<{ slug: string }[]>(
    ARTICLES_SLUGS_QUERY
  );
  // Static export requires at least one param. Use a placeholder that 404s via notFound().
  if (articles.length === 0) return [{ slug: "_" }];
  return articles.map((article) => ({ slug: article.slug }));
}

function formatCategory(cat: string) {
  return cat
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await client.fetch<SanityDocument | null>(ARTICLE_QUERY, {
    slug,
  });

  if (!article) return notFound();

  return (
    <>
      {/* ── Back navigation ── */}
      <nav className="back-nav">
        <Link href="/" className="back-link">
          ← Back to index
        </Link>
      </nav>

      {/* ── Paper ── */}
      <article className="paper">
        <header className="paper-header">
          {article.category && (
            <span className="paper-category">
              {formatCategory(article.category as string)}
            </span>
          )}

          <h1 className="paper-title">{article.title as string}</h1>

          {article.publishedAt && (
            <time className="paper-date">
              {new Date(article.publishedAt as string).toLocaleDateString(
                "en-US",
                { year: "numeric", month: "long", day: "numeric" }
              )}
            </time>
          )}
        </header>

        <div className="paper-body">
          {Array.isArray(article.body) && (
            <PortableText value={article.body} />
          )}
        </div>
      </article>

      {/* ── Ornamental end ── */}
      <div className="ornament" aria-hidden="true">
        ✦
      </div>

      <footer className="site-footer">
        Oliver&rsquo;s Guide To Everything
      </footer>
    </>
  );
}
