import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText, defineQuery, stegaClean } from "next-sanity";
import type { HISTORICAL_ARTICLE_QUERY_RESULT } from "../../../../sanity.types";
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
import styles from "../article.module.css";

const HISTORICAL_PARAMS_QUERY = defineQuery(
  `*[_type == "article" && defined(slug.current)]{
    "slug": slug.current,
    versionNumber,
    "snapshots": *[_type == "articleVersion" && article._ref == ^._id]{ versionNumber }
  }`
);

const HISTORICAL_ARTICLE_QUERY = defineQuery(
  `{
    "article": *[_type == "article" && slug.current == $slug][0]{
      _id,
      title,
      "slug": slug.current,
      contentType,
      summary,
      versionNumber,
      publishedAt,
      versionChangelog,
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
    "snapshot": *[_type == "articleVersion" && article->slug.current == $slug && versionNumber == $versionNumber][0]{
      _id,
      versionNumber,
      publishedAt,
      changeSummary,
      snapshotTitle,
      snapshotContentType,
      snapshotSummary,
      snapshotCoverEtching {
        alt,
        caption,
        asset->
      },
      snapshotBody[]{
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
    "versionCount": count(*[_type == "articleVersion" && article->slug.current == $slug]),
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

function parseVersionParam(param: string): number | null {
  const match = /^v(\d+)$/.exec(param);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  return Number.isFinite(num) && num > 0 ? num : null;
}

export async function generateStaticParams() {
  try {
    const { data: articles } = await sanityFetch({
      query: HISTORICAL_PARAMS_QUERY,
      perspective: "published",
      stega: false,
    });
    if (!articles || articles.length === 0) {
      return [{ slug: "_", version: "v1" }];
    }

    const params: Array<{ slug: string; version: string }> = [];
    for (const art of articles) {
      if (!art.slug) continue;
      const versions = new Set<number>();
      if (typeof art.versionNumber === "number") {
        versions.add(art.versionNumber);
      } else {
        versions.add(1);
      }
      if (Array.isArray(art.snapshots)) {
        for (const snap of art.snapshots) {
          if (typeof snap?.versionNumber === "number") {
            versions.add(snap.versionNumber);
          }
        }
      }
      for (const v of versions) {
        params.push({ slug: art.slug, version: `v${v}` });
      }
    }

    return params.length > 0 ? params : [{ slug: "_", version: "v1" }];
  } catch {
    return [{ slug: "_", version: "v1" }];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; version: string }>;
}): Promise<Metadata> {
  const { slug, version } = await params;
  const versionNum = parseVersionParam(version);
  if (!versionNum) {
    return { title: "Treatise Not Found — Oliver's Guide To Everything" };
  }

  const { data } = await sanityFetch({
    query: HISTORICAL_ARTICLE_QUERY,
    params: { slug, versionNumber: versionNum },
    stega: false,
  }).catch(() => ({ data: null }));

  const rawData = data as HISTORICAL_ARTICLE_QUERY_RESULT | null;
  const article = rawData?.article;
  const snapshot = rawData?.snapshot;

  if (!article && !snapshot) {
    return { title: "Archival Edition Not Found — Oliver's Guide To Everything" };
  }

  const siteMeta = resolveSiteMetadata(rawData?.settings);
  const title = snapshot?.snapshotTitle || article?.title || "Archival Treatise";
  const summary = snapshot?.snapshotSummary || article?.summary || siteMeta.siteDescription;
  const cleanTitle = stegaClean(title);
  const cleanSummary = stegaClean(summary);

  const publishedDate = snapshot?.publishedAt || article?.publishedAt || undefined;
  const canonicalUrl = `${siteMeta.canonicalDomain}/${slug}/`;
  const permalink = getVersionPermalink(slug, versionNum, siteMeta.canonicalDomain);

  return {
    title: `${cleanTitle} (Edition v${versionNum} Archival Record) — ${siteMeta.siteTitle}`,
    description: cleanSummary,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
    other: {
      "DC.title": `${cleanTitle} (Edition v${versionNum})`,
      "DC.creator": siteMeta.authorName,
      ...(publishedDate && { "DC.date": stegaClean(publishedDate) }),
      ...(cleanSummary && { "DC.description": cleanSummary }),
      "DC.type": "Text.Protocol.Archival",
      "DC.identifier": permalink,
      "DC.relation.isVersionOf": canonicalUrl,
      "DC.publisher": siteMeta.publisher,
      "DC.language": "en",

      "citation_title": cleanTitle,
      "citation_author": siteMeta.authorName,
      ...(publishedDate && {
        "citation_publication_date": stegaClean(publishedDate).split("T")[0],
      }),
      "citation_journal_title": siteMeta.siteTitle,
      "citation_technical_report_number": `Version ${versionNum}`,
    },
  };
}

export default async function HistoricalArticlePage({
  params,
}: {
  params: Promise<{ slug: string; version: string }>;
}) {
  const { slug, version } = await params;
  const versionNum = parseVersionParam(version);
  if (!versionNum) return notFound();

  const { data } = await sanityFetch({
    query: HISTORICAL_ARTICLE_QUERY,
    params: { slug, versionNumber: versionNum },
  }).catch((err) => {
    console.warn("Unable to fetch archival edition from Sanity:", err);
    return { data: null };
  });

  const rawData = data as HISTORICAL_ARTICLE_QUERY_RESULT | null;
  const article = rawData?.article;
  const snapshot = rawData?.snapshot;

  const currentLiveVersion = article?.versionNumber || 1;
  const isCurrentActive = currentLiveVersion === versionNum;

  // If neither a frozen snapshot exists nor does the article exist with versionNum <= currentLiveVersion, 404
  if (!snapshot && (!article || versionNum > currentLiveVersion)) {
    return notFound();
  }

  const siteMeta = resolveSiteMetadata(rawData?.settings);

  // Synthesize article data favoring frozen snapshot over live article
  const articleTitle = snapshot?.snapshotTitle || article?.title || "Untitled Protocol";
  const contentType = snapshot?.snapshotContentType || article?.contentType || "protocol";
  const summary = snapshot?.snapshotSummary || article?.summary || "";
  const body = snapshot?.snapshotBody || article?.body;
  const coverEtching = snapshot?.snapshotCoverEtching || article?.coverEtching;
  const publishedAt = snapshot?.publishedAt || (isCurrentActive ? article?.publishedAt : undefined);
  const changeSummary =
    snapshot?.changeSummary ||
    (isCurrentActive
      ? article?.versionChangelog
      : `Archival record for Edition v${versionNum}.`);

  const headings = Array.isArray(body) ? extractTocHeadings(body) : [];
  const coverUrl = buildSanityImageUrl(coverEtching, {
    width: 900,
    quality: 85,
  });

  const apaCitation = formatApa7Citation({
    title: articleTitle,
    author: siteMeta.authorName,
    publishedAt,
    versionNumber: versionNum,
    slug,
    baseUrl: siteMeta.canonicalDomain,
  });

  const permalink = getVersionPermalink(slug, versionNum, siteMeta.canonicalDomain);

  return (
    <div className={styles.container}>
      {/* ── Screen Back Navigation ── */}
      <nav className={styles.backNav} aria-label="Breadcrumb navigation">
        <Link href={`/${slug}`} className={styles.backLink}>
          <Icon
            name="arrow-right"
            size={12}
            style={{ transform: "rotate(180deg)" }}
          />
          Return to Live Treatise
        </Link>
      </nav>

      {/* ── 2-Column Responsive Reader with Collapsible Contents ── */}
      <ArticleClientLayout headings={headings} hasReferences>
        <main className={styles.reader}>
          {/* Print Masthead (visible only in @media print) */}
          <PrintHeader
            title={articleTitle}
            author={siteMeta.authorName}
            contentType={contentType}
            publishedAt={publishedAt}
            versionNumber={versionNum}
            slug={slug}
          />

          {/* ── Archival Edition Alert Banner ── */}
          <div className={styles.archivalBanner} role="status">
            <div className={styles.archivalBannerIcon}>📜</div>
            <div className={styles.archivalBannerContent}>
              <div className={styles.archivalBannerTitle}>
                <span>Archival Edition Record</span>
                <span className={styles.archivalVersionTag}>Version {versionNum}</span>
              </div>
              <p className={styles.archivalBannerText}>
                You are reading an immutable historical edition recorded on{" "}
                <strong>
                  {publishedAt
                    ? formatDate(stegaClean(publishedAt), "long")
                    : "Archival date"}
                </strong>
                . This text is permanently preserved for wet-lab citation fidelity.
                {isCurrentActive ? (
                  <span>
                    {" "}
                    (This is currently the active edition of the treatise).
                  </span>
                ) : (
                  <span>
                    {" "}
                    A newer edition is available:
                    <Link href={`/${slug}`} className={styles.archivalBannerLink}>
                      Return to current active edition (v{currentLiveVersion}) &rarr;
                    </Link>
                  </span>
                )}
                {" • "}
                <Link
                  href={`/${slug}/versions`}
                  className={styles.archivalBannerLink}
                >
                  View full edition timeline &amp; diffs &rarr;
                </Link>
              </p>

              {changeSummary && (
                <div className={styles.archivalChangelogBox}>
                  <strong>Changelog Notes: </strong>
                  {changeSummary}
                </div>
              )}
            </div>
          </div>

          {/* ── Top Section: Title, Subtitle, Summary & Unified Third Column ── */}
          <section className={styles.topSection}>
            <div className={styles.mainHeaderCol}>
              <header className={`${styles.header} paper-header`}>
                <h1 className={`${styles.title} paper-title`}>{articleTitle}</h1>

                <div className={styles.subtitleRow}>
                  {contentType && (
                    <span className={`${styles.categoryBadge} paper-category`}>
                      {formatCategory(stegaClean(contentType))}
                    </span>
                  )}
                  <span className={styles.glyphFlourish}>✦</span>
                  <span className={styles.versionBadge}>Edition v{versionNum} (Archival)</span>
                  <span className={styles.metaAuthor}>
                    — Penned by <strong>{siteMeta.authorName}</strong>
                  </span>
                  {publishedAt && (
                    <span className={styles.metaDate}>
                      &bull; Recorded on{" "}
                      <time className="paper-date" dateTime={publishedAt}>
                        {formatDate(stegaClean(publishedAt), "long")}
                      </time>
                    </span>
                  )}
                </div>

                <div className={styles.headerRule} />

                {summary && (
                  <div className={styles.summaryLead}>
                    <p style={{ margin: 0 }}>{summary}</p>
                  </div>
                )}
              </header>
            </div>

            {/* Single Unified Third Column Box */}
            <div className={styles.thirdColumn}>
              <ArticleUtilities
                title={articleTitle}
                author={siteMeta.authorName}
                publishedAt={publishedAt}
                versionNumber={versionNum}
                slug={slug}
                chapter={article?.chapter}
                topics={article?.topics}
                downloadablePdfs={article?.downloadablePdfs}
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
                    coverEtching?.alt ||
                    coverEtching?.caption ||
                    articleTitle
                  }
                  className={styles.coverImage}
                  loading="lazy"
                />
                {coverEtching?.caption && (
                  <div className={styles.coverCaption}>
                    {coverEtching.caption}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Article Body (Spans Full Width across the Reading Folio) ── */}
          <div className={`${styles.body} paper-body`}>
            {Array.isArray(body) && (
              <PortableText
                value={body}
                components={scholarlyPortableTextComponents}
              />
            )}
          </div>

          {/* ── Reader Footer & Full-Width References & Archival Audit ── */}
          <footer className={styles.footer}>
            <StarDivider variant={1} />

            {/* Archival audit record */}
            <div className={styles.auditSection}>
              <div>
                <span>Archival Record &amp; Last Revised: </span>
                <strong>
                  {publishedAt
                    ? formatDate(stegaClean(publishedAt), "long")
                    : "Archival edition"}
                </strong>
                <span> &bull; Penned by {siteMeta.authorName} &bull; Edition v{versionNum}</span>
              </div>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <Link
                  href={`/${slug}/versions`}
                  className={styles.auditLink}
                  title="View complete version history and text diffs"
                >
                  History &amp; Diffs &rarr;
                </Link>
                <a
                  href={permalink}
                  className={styles.auditLink}
                  title="Permanent link to this archival edition"
                >
                  Archival Permalink (v{versionNum}) &rarr;
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
            publishedAt={publishedAt}
            versionNumber={versionNum}
            slug={slug}
          />
        </main>
      </ArticleClientLayout>
    </div>
  );
}
