import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { stegaClean } from "next-sanity";
import type { ARTICLE_VERSIONS_QUERY_RESULT } from "../../../../sanity.types";
import { sanityFetch } from "@/sanity/live";
import { Icon } from "@/components/ui/Icon";
import { StarDivider } from "@/components/ui/StarDivider";
import { formatCategory } from "@/lib/format";
import { resolveSiteMetadata } from "@/sanity/siteSettings";
import {
  VersionHistoryDiffViewer,
  type EditionRecord,
} from "@/components/VersionHistoryDiffViewer";
import { ARTICLE_VERSIONS_QUERY, VERSIONS_SLUGS_QUERY } from "@/sanity/queries";
import styles from "./versions.module.css";

export { ARTICLE_VERSIONS_QUERY, VERSIONS_SLUGS_QUERY };

export async function generateStaticParams() {
  try {
    const { data: articles } = await sanityFetch({
      query: VERSIONS_SLUGS_QUERY,
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
    query: ARTICLE_VERSIONS_QUERY,
    params: { slug },
    stega: false,
  }).catch(() => ({ data: null }));

  const raw = data as ARTICLE_VERSIONS_QUERY_RESULT | null;
  const article = raw?.article;
  if (!article) {
    return { title: "Treatise History Not Found — Oliver's Guide To Everything" };
  }

  const siteMeta = resolveSiteMetadata(raw?.settings);
  const cleanTitle = stegaClean(article.title) || "Treatise";
  const canonicalUrl = `${siteMeta.canonicalDomain}/${slug}/versions/`;

  return {
    title: `Version History & Archival Diffs: ${cleanTitle} — ${siteMeta.siteTitle}`,
    description: `Complete official version timeline, editorial changelogs, and visual text diffs for "${cleanTitle}".`,
    alternates: {
      canonical: canonicalUrl,
    },
    other: {
      "DC.title": `Edition History: ${cleanTitle}`,
      "DC.creator": siteMeta.authorName,
      "DC.type": "Text.Protocol.History",
      "DC.relation.isVersionOf": `${siteMeta.canonicalDomain}/${slug}/`,
      "DC.publisher": siteMeta.publisher,
      "DC.language": "en",
    },
  };
}

export default async function ArticleVersionsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data } = await sanityFetch({
    query: ARTICLE_VERSIONS_QUERY,
    params: { slug },
  }).catch((err) => {
    console.warn("Unable to fetch article versions from Sanity:", err);
    return { data: null };
  });

  const raw = data as ARTICLE_VERSIONS_QUERY_RESULT | null;
  const article = raw?.article;
  if (!article) return notFound();

  const siteMeta = resolveSiteMetadata(raw?.settings);
  const snapshots = raw?.snapshots || [];

  // Synthesize unified list of editions
  const editionMap = new Map<number, EditionRecord>();

  // 1. First add all recorded snapshots
  for (const snap of snapshots) {
    if (typeof snap.versionNumber === "number") {
      editionMap.set(snap.versionNumber, {
        versionNumber: snap.versionNumber,
        publishedAt: snap.publishedAt,
        changeSummary: snap.changeSummary,
        title: snap.snapshotTitle || article.title,
        contentType: snap.snapshotContentType || article.contentType,
        summary: snap.snapshotSummary || article.summary,
        body: snap.snapshotBody || article.body,
        isCurrentActive: snap.versionNumber === (article.versionNumber || 1),
      });
    }
  }

  // 2. Ensure all editions from 1 up to liveVersion are represented
  const liveVersion = article.versionNumber || 1;
  for (let v = 1; v <= liveVersion; v++) {
    if (!editionMap.has(v)) {
      editionMap.set(v, {
        versionNumber: v,
        publishedAt: v === liveVersion ? article.publishedAt : undefined,
        changeSummary:
          v === liveVersion
            ? article.versionChangelog || "Initial publication or active edition."
            : `Edition v${v} archival record.`,
        title: article.title,
        contentType: article.contentType,
        summary: article.summary,
        body: article.body,
        isCurrentActive: v === liveVersion,
      });
    }
  }

  // 3. Mark the active live edition
  const activeRecord = editionMap.get(liveVersion);
  if (activeRecord) {
    activeRecord.isCurrentActive = true;
  }

  const editions: EditionRecord[] = Array.from(editionMap.values()).sort(
    (a, b) => b.versionNumber - a.versionNumber
  );

  const cleanTitle = article.title || "Untitled Protocol";

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

      {/* ── Page Header ── */}
      <header className={styles.header}>
        <div className={styles.topMetaRow}>
          <span className={styles.categoryBadge}>
            {article.contentType
              ? formatCategory(stegaClean(article.contentType))
              : "Protocol"}
          </span>
          <span className={styles.glyphFlourish}>✦</span>
          <span className={styles.versionCountBadge}>
            {editions.length} Recorded {editions.length === 1 ? "Edition" : "Editions"}
          </span>
          <span className={styles.authorBadge}>
            — Penned by <strong>{siteMeta.authorName}</strong>
          </span>
        </div>

        <h1 className={styles.title}>Version History &amp; Archival Diffs</h1>
        <p className={styles.subtitle}>
          Chronological record of official scientific editions for{" "}
          <strong>&ldquo;{cleanTitle}&rdquo;</strong>.
        </p>

        <div className={styles.headerRule} />
      </header>

      {/* ── Interactive Version Timeline & Visual Diff Viewer ── */}
      <VersionHistoryDiffViewer
        slug={slug}
        author={siteMeta.authorName}
        editions={editions}
      />

      {/* ── Page Footer ── */}
      <footer className={styles.footer}>
        <StarDivider variant={2} />
        <div className={styles.footerAudit}>
          <span>Permanent Archival Record</span>
          <span>&bull;</span>
          <span>Immutable Permanent Edge Archival</span>
          <span>&bull;</span>
          <Link href={`/${slug}`} className={styles.footerLink}>
            Return to Active Treatise &rarr;
          </Link>
        </div>
      </footer>
    </div>
  );
}
