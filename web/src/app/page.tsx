import { client } from "@/sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import { PortableText, defineQuery, type SanityDocument } from "next-sanity";
import Link from "next/link";

import { Icon, HandDrawnArrow } from "@/components/ui/Icon";
import { formatCategory, formatDate } from "@/lib/format";

const builder = createImageUrlBuilder(client);

const HOME_QUERY = defineQuery(
  `*[_id == "homePage"][0]{ heading, subheading, intro, logo }`
);

const ARTICLES_QUERY = defineQuery(
  `*[_type == "article" && defined(slug.current)] | order(publishedAt desc){
    _id, title, slug, summary, category, publishedAt
  }`
);

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
              fontSize: "clamp(1.9rem, 6vw + 0.5rem, 2.5rem)",
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
                href={`/${(article.slug as { current?: string })?.current}`}
                className="article-card"
              >
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem" }}>
                  <span className="article-card-title">
                    {article.title as string}
                  </span>
                  <HandDrawnArrow index={index} size={15} style={{ color: "var(--rust)" }} />
                </div>

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
    </>
  );
}
