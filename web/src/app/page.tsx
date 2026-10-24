import { client } from "@/sanity/client";
import { sanityFetch } from "@/sanity/live";
import { createImageUrlBuilder } from "@sanity/image-url";
import { PortableText, defineQuery, stegaClean } from "next-sanity";
import Link from "next/link";

import { Icon, HandDrawnArrow } from "@/components/ui/Icon";
import { formatCategory, formatDate } from "@/lib/format";

const builder = createImageUrlBuilder(client);

const HOME_QUERY = defineQuery(
  `*[_id == "homePage"][0]{ heading, subheading, intro, logo }`
);

const ARTICLES_QUERY = defineQuery(
  `*[_type == "article" && defined(slug.current)] | order(publishedAt desc){
    _id, title, slug, summary, contentType, publishedAt
  }`
);

export default async function HomePage() {
  const [{ data: home }, { data: articles }] = await Promise.all([
    sanityFetch({ query: HOME_QUERY }),
    sanityFetch({ query: ARTICLES_QUERY }),
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
              stegaClean(home?.heading) ||
              "Oliver's Guide To Everything emblem"
            }
            className="landing-logo"
            width={320}
            height={320}
          />
        ) : (
          <h1
            style={{
              fontSize: "clamp(1.9rem, 6vw + 0.5rem, 2.5rem)",
              fontWeight: 700,
              color: "var(--ink)",
              letterSpacing: "0.04em",
            }}
          >
            {home?.heading || "Oliver\u2019s Guide To Everything"}
          </h1>
        )}

        {(home?.subheading || !home) && (
          <p className="landing-tagline">
            {home?.subheading || "Biotech & cancer research protocols"}
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
        <Icon name="star-four" size={18} />
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
            {articles.map((article, index) => (
              <Link
                key={article._id}
                href={`/${stegaClean(article.slug?.current)}`}
                className="article-card"
              >
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem" }}>
                  <span className="article-card-title">
                    {article.title}
                  </span>
                  <HandDrawnArrow index={index} size={15} style={{ color: "var(--rust)" }} />
                </div>

                <span className="article-card-meta">
                  {article.contentType && (
                    <span className="article-card-category">
                      {formatCategory(stegaClean(article.contentType))}
                    </span>
                  )}
                  {article.publishedAt && (
                    <span>{formatDate(stegaClean(article.publishedAt))}</span>
                  )}
                </span>

                {article.summary && (
                  <span className="article-card-summary">
                    {article.summary}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        )}
      </section>
    </>
  );
}
