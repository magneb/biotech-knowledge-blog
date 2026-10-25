import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText, defineQuery, stegaClean } from "next-sanity";
import type { ARTICLE_QUERY_RESULT } from "../../../sanity.types";
import { sanityFetch } from "@/sanity/live";
import { Icon } from "@/components/ui/Icon";
import { StarDivider } from "@/components/ui/StarDivider";
import { formatCategory, formatDate } from "@/lib/format";
import { formatApa7Citation, getVersionPermalink } from "@/lib/citation";
import { extractTocHeadings } from "@/lib/toc";
import { buildSanityImageUrl } from "@/sanity/image";
import { resolveSiteMetadata } from "@/sanity/siteSettings";
import { ArticleClientLayout } from "@/components/ArticleClientLayout";
import { ArticleUtilities } from "@/components/ArticleUtilities";
import { scholarlyPortableTextComponents } from "@/components/PortableTextComponents";
import { PrintHeader, PrintFooter } from "@/components/PrintFolio";
import styles from "./article.module.css";

const ARTICLES_SLUGS_QUERY = defineQuery(
  `*[_type == "article" && defined(slug.current)]{ "slug": slug.current }`
);

const ARTICLE_QUERY = defineQuery(
  `{
    "article": *[_type == "article" && slug.current == $slug][0]{
      _id,
      title,
      "slug": slug.current,
      contentType,
      summary,
      versionNumber,
      publishedAt,
      coverEtching {
        alt,
        caption,
        asset->
      },
      downloadablePdfs[] {
        title,
        description,
        file {
          asset->{
            url,
            size
          }
        }
      },
      chapter->{
        title,
        "slug": slug.current,
        number
      },
      topics[]->{
        name,
        symbol,
        "slug": slug.current
      },
      body[]{
        ...,
        markDefs[]{
          ...,
          _type == "internalLink" && linkType == "resolved" => {
            "doc": @.reference->{
              _type,
              "slug": slug.current,
              title
            }
          }
        }
      }
    },
    "settings": *[_type in ["aboutPage", "homePage"]]{
      _type,
      siteTitle,
      authorName,
      authorAffiliation,
      publisher,
      siteDescription,
      canonicalDomain,
      contactEmail
    }
  }`
);

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
  const cleanTitle = stegaClean(article.title) || "Protocol";
  const cleanSummary = stegaClean(article.summary) || siteMeta.siteDescription;
  const version = article.versionNumber || 1;
  const publishedDate = article.publishedAt
    ? stegaClean(article.publishedAt)
    : undefined;
  const canonicalUrl = `${siteMeta.canonicalDomain}/${slug}/`;
  const permalink = getVersionPermalink(slug, version, siteMeta.canonicalDomain);

  return {
    title: `${cleanTitle} (Edition v${version}) — ${siteMeta.siteTitle}`,
    description: cleanSummary,
    alternates: {
      canonical: canonicalUrl,
    },
    other: {
      // ── Dublin Core Metadata ──
      "DC.title": cleanTitle,
      "DC.creator": siteMeta.authorName,
      ...(publishedDate && { "DC.date": publishedDate }),
      ...(cleanSummary && { "DC.description": cleanSummary }),
      "DC.type": article.contentType
        ? `Text.${formatCategory(stegaClean(article.contentType))}`
        : "Text.Protocol",
      "DC.identifier": permalink,
      "DC.relation.isVersionOf": canonicalUrl,
      "DC.publisher": siteMeta.publisher,
      "DC.language": "en",

      // ── Google Scholar / Highwire Press Metadata ──
      "citation_title": cleanTitle,
      "citation_author": siteMeta.authorName,
      ...(publishedDate && {
        "citation_publication_date": publishedDate.split("T")[0],
      }),
      "citation_journal_title": siteMeta.siteTitle,
      "citation_technical_report_number": `Version ${version}`,
    },
  };
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
  const headings = Array.isArray(article.body)
    ? extractTocHeadings(article.body)
    : [];

  const version = article.versionNumber || 1;
  const articleTitle = article.title || "Untitled Protocol";
  const coverUrl = buildSanityImageUrl(article.coverEtching, {
    width: 900,
    quality: 85,
  });

  const apaCitation = formatApa7Citation({
    title: articleTitle,
    author: siteMeta.authorName,
    publishedAt: article.publishedAt,
    versionNumber: version,
    slug,
    baseUrl: siteMeta.canonicalDomain,
  });

  const permalink = getVersionPermalink(slug, version, siteMeta.canonicalDomain);

  return (
    <div className={styles.container}>
      {/* ── Screen Back Navigation ── */}
      <nav className={styles.backNav} aria-label="Breadcrumb navigation">
        <Link href="/" className={styles.backLink}>
          <Icon
            name="arrow-right"
            size={12}
            style={{ transform: "rotate(180deg)" }}
          />
          Return to Frontispiece
        </Link>
      </nav>

      {/* ── 2-Column Responsive Reader with Collapsible Contents ── */}
      <ArticleClientLayout headings={headings} hasReferences>
        <main className={styles.reader}>
          {/* Print Masthead (visible only in @media print) */}
          <PrintHeader
            title={articleTitle}
            author={siteMeta.authorName}
            contentType={article.contentType}
            publishedAt={article.publishedAt}
            versionNumber={version}
            slug={slug}
          />

          {/* ── Top Section: Title, Subtitle, Summary & Unified Third Column ── */}
          <section className={styles.topSection}>
            <div className={styles.mainHeaderCol}>
              <header className={`${styles.header} paper-header`}>
                <h1 className={`${styles.title} paper-title`}>{articleTitle}</h1>

                <div className={styles.subtitleRow}>
                  {article.contentType && (
                    <span className={`${styles.categoryBadge} paper-category`}>
                      {formatCategory(stegaClean(article.contentType))}
                    </span>
                  )}
                  <span className={styles.glyphFlourish}>✦</span>
                  <span className={styles.versionBadge}>Edition v{version}</span>
                  <span className={styles.metaAuthor}>
                    — Penned by <strong>{siteMeta.authorName}</strong>
                  </span>
                  {article.publishedAt && (
                    <span className={styles.metaDate}>
                      &bull; Recorded on{" "}
                      <time className="paper-date" dateTime={article.publishedAt}>
                        {formatDate(stegaClean(article.publishedAt), "long")}
                      </time>
                    </span>
                  )}
                </div>

                <div className={styles.headerRule} />

                {/* Summary section positioned right beside the third column box */}
                {article.summary && (
                  <div className={styles.summaryLead}>
                    <p style={{ margin: 0 }}>{article.summary}</p>
                  </div>
                )}
              </header>
            </div>

            {/* Single Unified Third Column Box */}
            <div className={styles.thirdColumn}>
              <ArticleUtilities
                title={articleTitle}
                author={siteMeta.authorName}
                publishedAt={article.publishedAt}
                versionNumber={version}
                slug={slug}
                chapter={article.chapter}
                topics={article.topics}
                downloadablePdfs={article.downloadablePdfs}
              />
            </div>
          </section>

          {/* ── Cover Etching (Full measure / Centered) ── */}
          {coverUrl && (
            <div className={styles.coverContainer}>
              <div className={styles.coverBox}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverUrl}
                  alt={
                    article.coverEtching?.alt ||
                    article.coverEtching?.caption ||
                    articleTitle
                  }
                  className={styles.coverImage}
                  loading="lazy"
                />
                {article.coverEtching?.caption && (
                  <div className={styles.coverCaption}>
                    {article.coverEtching.caption}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Article Body (Spans Full Width across the Reading Folio) ── */}
          <div className={`${styles.body} paper-body`}>
            {Array.isArray(article.body) && (
              <PortableText
                value={article.body}
                components={scholarlyPortableTextComponents}
              />
            )}
          </div>

          {/* ── Reader Footer & Full-Width References & SNL Audit ── */}
          <footer className={styles.footer}>
            <StarDivider variant={1} />

            {/* Store Norske Leksikon-style audit line */}
            <div className={styles.auditSection}>
              <div>
                <span>Sist oppdatert / Recorded: </span>
                <strong>
                  {article.publishedAt
                    ? formatDate(stegaClean(article.publishedAt), "long")
                    : "Archival edition"}
                </strong>
                <span> &bull; Penned by {siteMeta.authorName} &bull; Edition v{version}</span>
              </div>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <Link
                  href={`/${slug}/versions/`}
                  className={styles.auditLink}
                  title="View Store Norske Leksikon-style edition timeline and visual diffs"
                >
                  History &amp; Diffs &rarr;
                </Link>
                <a
                  href={permalink}
                  className={styles.auditLink}
                  title="Permanent link to this archival edition"
                >
                  Archival Permalink (v{version}) &rarr;
                </a>
              </div>
            </div>

            {/* References Section */}
            <section
              id="references"
              className={styles.referencesSection}
              aria-labelledby="references-heading"
            >
              <h3 id="references-heading" className={styles.referencesTitle}>
                References &amp; Archival Citations
              </h3>
              <ol className={styles.referencesList}>
                <li>{apaCitation}</li>
              </ol>
            </section>
          </footer>

          {/* Print Footer (visible only in @media print) */}
          <PrintFooter
            title={articleTitle}
            author={siteMeta.authorName}
            publishedAt={article.publishedAt}
            versionNumber={version}
            slug={slug}
          />
        </main>
      </ArticleClientLayout>
    </div>
  );
}
