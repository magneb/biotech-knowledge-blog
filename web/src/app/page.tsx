import { client } from "@/sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import { PortableText, defineQuery, type SanityDocument } from "next-sanity";
import Link from "next/link";

const builder = createImageUrlBuilder(client);

const HOME_QUERY = defineQuery(
  `*[_id == "homePage"][0]{ heading, subheading, intro, logo }`
);

const ARTICLES_QUERY = defineQuery(
  `*[_type == "article" && defined(slug.current)] | order(publishedAt desc){
    _id, title, slug, summary, category, publishedAt
  }`
);

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCategory(cat: string) {
  return cat
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function HomePage() {
  const [home, articles] = await Promise.all([
    client.fetch<SanityDocument | null>(HOME_QUERY),
    client.fetch<SanityDocument[]>(ARTICLES_QUERY),
  ]);

  // Build logo URL if available
  const logoUrl = home?.logo
    ? builder
        .image(home.logo as Record<string, unknown>)
        .width(640)
        .auto("format")
        .url()
    : null;

  return (
    <>
      {/* ── Hero ── */}
      <section className="landing-hero">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={
              (home?.heading as string) || "Oliver's Guide To Everything emblem"
            }
            className="landing-logo"
            width={320}
            height={320}
          />
        ) : (
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: 700,
              color: "var(--ink)",
              letterSpacing: "0.04em",
            }}
          >
            {(home?.heading as string) || "Oliver\u2019s Guide To Everything"}
          </h1>
        )}

        {(home?.subheading || !home) && (
          <p className="landing-tagline">
            {(home?.subheading as string) ||
              "Biotech & cancer research protocols"}
          </p>
        )}

        {home?.intro && Array.isArray(home.intro) && (
          <div
            style={{
              maxWidth: "32rem",
              marginTop: "1.5rem",
              fontSize: "0.95rem",
              color: "var(--sepia-light)",
              lineHeight: 1.7,
              textAlign: "center",
            }}
          >
            <PortableText value={home.intro} />
          </div>
        )}
      </section>

      {/* ── Ornamental divider ── */}
      <div className="ornament" aria-hidden="true">
        ✦
      </div>

      {/* ── Articles ── */}
      <section className="articles-section">
        <h2 className="articles-heading">Articles</h2>

        {articles.length === 0 ? (
          <p className="empty-state">
            No articles yet — add some in the Studio.
          </p>
        ) : (
          <nav>
            {articles.map((article) => (
              <Link
                key={article._id}
                href={`/${(article.slug as { current?: string })?.current}`}
                className="article-card"
              >
                <span className="article-card-title">
                  {article.title as string}
                </span>

                <span className="article-card-meta">
                  {article.category && (
                    <span className="article-card-category">
                      {formatCategory(article.category as string)}
                    </span>
                  )}
                  {article.publishedAt && (
                    <span>{formatDate(article.publishedAt as string)}</span>
                  )}
                </span>

                {article.summary && (
                  <span className="article-card-summary">
                    {article.summary as string}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        )}
      </section>

      {/* ── Footer ── */}
      <footer className="site-footer">
        Oliver&rsquo;s Guide To Everything
      </footer>
    </>
  );
}
