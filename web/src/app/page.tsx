import { client } from "@/sanity/client";
import { sanityFetch } from "@/sanity/live";
import { createImageUrlBuilder } from "@sanity/image-url";
import { PortableText, defineQuery, stegaClean } from "next-sanity";
import Link from "next/link";
import Image from "next/image";

import { HandDrawnArrow, StarDivider } from "@/components/ui";
import { formatCategory, formatDate } from "@/lib/format";

const builder = createImageUrlBuilder(client);

const HOME_QUERY = defineQuery(
  `*[_id == "homePage"][0]{ heading, subheading, intro, logo }`
);

const ARTICLES_QUERY = defineQuery(
  `*[_type == "article" && defined(slug.current)] | order(publishedAt desc){
    _id, title, slug, summary, contentType, publishedAt,
    topics[]->{ _id, name, symbol, slug }
  }`
);

interface HomePageProps {
  searchParams?: Promise<{
    topic?: string;
  }>;
}

export default async function HomePage(props: HomePageProps = {}) {
  const resolvedParams = props.searchParams ? await props.searchParams : {};
  const activeTopic = stegaClean(resolvedParams.topic?.trim() || "");

  const [{ data: home }, { data: allArticles }] = await Promise.all([
    sanityFetch({ query: HOME_QUERY }).catch((err) => {
      console.warn("Unable to fetch home data from Sanity:", err);
      return { data: null };
    }),
    sanityFetch({ query: ARTICLES_QUERY }).catch((err) => {
      console.warn("Unable to fetch articles data from Sanity:", err);
      return { data: null };
    }),
  ]);

  const articles = activeTopic
    ? (allArticles ?? []).filter((art) =>
        art.topics?.some((t) => stegaClean(t?.slug?.current) === activeTopic)
      )
    : allArticles ?? [];

  // Identify active topic object for banner display
  const activeTopicObj = activeTopic
    ? allArticles
        ?.flatMap((a) => a.topics ?? [])
        .find((t) => stegaClean(t?.slug?.current) === activeTopic)
    : null;

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
          <Image
            src={logoUrl}
            alt={
              stegaClean(home?.heading) ||
              "Oliver's Guide To Everything emblem"
            }
            className="landing-logo"
            width={320}
            height={320}
            unoptimized={logoUrl.endsWith(".svg")}
            priority
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
      <StarDivider symbol="star" variant={1} spacing="md" />

      {/* ── Articles ── */}
      <section className="articles-section">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
          <h2 className="articles-heading" style={{ margin: 0 }}>
            {activeTopic ? "Filtered Inscriptions" : "Articles"}
          </h2>
          {activeTopic && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "var(--text-sm)", color: "var(--sepia-mid)" }}>
              <span>Taxonomy:</span>
              <strong style={{ color: "var(--rust)" }}>
                {activeTopicObj?.symbol ? `[ ${activeTopicObj.symbol} ] ` : ""}
                {activeTopicObj?.name || activeTopic}
              </strong>
              <Link
                href="/"
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--sepia-muted)",
                  textDecoration: "underline",
                  marginLeft: "0.5rem",
                }}
              >
                [ Clear Filter ✕ ]
              </Link>
            </div>
          )}
        </div>

        {articles.length === 0 ? (
          <p className="empty-state">
            {activeTopic
              ? "No articles found matching this topic taxonomy."
              : "No articles yet — add some in the Studio."}
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
