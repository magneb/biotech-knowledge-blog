import Link from "next/link";
import { PortableText, stegaClean } from "next-sanity";
import type { ComponentProps } from "react";
import { Icon } from "@/components/ui/Icon";
import { StarDivider } from "@/components/ui/StarDivider";
import { formatCategory, formatDate } from "@/lib/format";
import { formatApa7Citation, getVersionPermalink } from "@/lib/citation";
import { extractTocHeadings } from "@/lib/toc";
import { buildSanityImageUrl } from "@/sanity/image";
import type { ResolvedSiteMetadata } from "@/sanity/siteSettings";
import { ArticleClientLayout } from "@/components/ArticleClientLayout";
import {
  ArticleUtilities,
  type ChapterInfo,
  type PdfAttachment,
  type TopicInfo,
} from "@/components/ArticleUtilities";
import { scholarlyPortableTextComponents } from "@/components/PortableTextComponents";
import { PrintHeader, PrintFooter } from "@/components/PrintFolio";
import styles from "@/app/[slug]/article.module.css";

export interface TreatiseReaderProps {
  slug: string;
  versionNumber: number;
  title?: string | null;
  contentType?: string | null;
  summary?: string | null;
  publishedAt?: string | null;
  coverEtching?: Parameters<typeof buildSanityImageUrl>[0];
  body?: ComponentProps<typeof PortableText>["value"];
  chapter?: ChapterInfo | null;
  topics?: Array<TopicInfo | null> | null;
  downloadablePdfs?: Array<PdfAttachment | null> | null;
  siteMeta: ResolvedSiteMetadata;
  backNav: {
    href: string;
    label: string;
  };
  archivalNotice?: {
    versionNumber: number;
    currentLiveVersion: number;
    publishedAt?: string | null;
    changeSummary?: string | null;
  };
}

export function TreatiseReader({
  slug,
  versionNumber,
  title,
  contentType,
  summary,
  publishedAt,
  coverEtching,
  body,
  chapter,
  topics,
  downloadablePdfs,
  siteMeta,
  backNav,
  archivalNotice,
}: TreatiseReaderProps) {
  const isArchival = Boolean(archivalNotice);
  const headings = Array.isArray(body) ? extractTocHeadings(body) : [];
  const articleTitle = title || "Untitled Protocol";
  const coverUrl = buildSanityImageUrl(coverEtching, {
    width: 900,
    quality: 85,
  });

  const apaCitation = formatApa7Citation({
    title: articleTitle,
    author: siteMeta.authorName,
    publishedAt,
    versionNumber,
    slug,
    baseUrl: siteMeta.canonicalDomain,
  });

  const permalink = getVersionPermalink(slug, versionNumber, siteMeta.canonicalDomain);

  const isCurrentActive = archivalNotice
    ? archivalNotice.currentLiveVersion === archivalNotice.versionNumber
    : true;

  const cleanedTopics = topics
    ? (topics.filter(Boolean) as TopicInfo[])
    : null;
  const cleanedPdfs = downloadablePdfs
    ? (downloadablePdfs.filter(Boolean) as PdfAttachment[])
    : null;

  return (
    <div className={styles.container}>
      {/* ── Screen Back Navigation ── */}
      <nav className={styles.backNav} aria-label="Breadcrumb navigation">
        <Link href={backNav.href} className={styles.backLink}>
          <Icon
            name="arrow-right"
            size={12}
            style={{ transform: "rotate(180deg)" }}
          />
          {backNav.label}
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
            versionNumber={versionNumber}
            slug={slug}
          />

          {/* ── Archival Edition Alert Banner (when viewing /v{N}) ── */}
          {archivalNotice && (
            <div className={styles.archivalBanner} role="status">
              <div className={styles.archivalBannerIcon}>📜</div>
              <div className={styles.archivalBannerContent}>
                <div className={styles.archivalBannerTitle}>
                  <span>Archival Edition Record</span>
                  <span className={styles.archivalVersionTag}>
                    Version {archivalNotice.versionNumber}
                  </span>
                </div>
                <p className={styles.archivalBannerText}>
                  You are reading an immutable historical edition recorded on{" "}
                  <strong>
                    {archivalNotice.publishedAt
                      ? formatDate(stegaClean(archivalNotice.publishedAt), "long")
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
                        Return to current active edition (v{archivalNotice.currentLiveVersion}) &rarr;
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

                {archivalNotice.changeSummary && (
                  <div className={styles.archivalChangelogBox}>
                    <strong>Changelog Notes: </strong>
                    {archivalNotice.changeSummary}
                  </div>
                )}
              </div>
            </div>
          )}

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
                  <span className={styles.versionBadge}>
                    Edition v{versionNumber}
                    {isArchival ? " (Archival)" : ""}
                  </span>
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

                {/* Summary section positioned right beside the third column box */}
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
                versionNumber={versionNumber}
                slug={slug}
                chapter={chapter}
                topics={cleanedTopics}
                downloadablePdfs={cleanedPdfs}
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
                <span> &bull; Penned by {siteMeta.authorName} &bull; Edition v{versionNumber}</span>
              </div>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <Link
                  href={`/${slug}/versions/`}
                  className={styles.auditLink}
                  title="View edition timeline and visual diffs"
                >
                  History &amp; Diffs &rarr;
                </Link>
                <a
                  href={permalink}
                  className={styles.auditLink}
                  title="Permanent link to this archival edition"
                >
                  Archival Permalink (v{versionNumber}) &rarr;
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
            versionNumber={versionNumber}
            slug={slug}
          />
        </main>
      </ArticleClientLayout>
    </div>
  );
}
