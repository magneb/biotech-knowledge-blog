import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { HISTORICAL_ARTICLE_QUERY_RESULT } from "../../../../sanity.types";
import { sanityFetch } from "@/sanity/live";
import { resolveSiteMetadata } from "@/sanity/siteSettings";
import { buildTreatiseMetadata } from "@/lib/scholarlyMetadata";
import { TreatiseReader } from "@/components/TreatiseReader";
import { HISTORICAL_ARTICLE_QUERY, HISTORICAL_PARAMS_QUERY } from "@/sanity/queries";

export { HISTORICAL_ARTICLE_QUERY, HISTORICAL_PARAMS_QUERY };

export const revalidate = 604800;

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
  const publishedDate = snapshot?.publishedAt || article?.publishedAt || undefined;

  return buildTreatiseMetadata({
    slug,
    title,
    summary,
    contentType: snapshot?.snapshotContentType || article?.contentType,
    publishedAt: publishedDate,
    versionNumber: versionNum,
    siteMeta,
    isArchival: true,
  });
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

  return (
    <TreatiseReader
      slug={slug}
      versionNumber={versionNum}
      title={articleTitle}
      contentType={contentType}
      summary={summary}
      publishedAt={publishedAt}
      coverEtching={coverEtching}
      body={body}
      chapter={article?.chapter}
      topics={article?.topics}
      downloadablePdfs={article?.downloadablePdfs}
      siteMeta={siteMeta}
      backNav={{
        href: `/${slug}`,
        label: "Return to Live Treatise",
      }}
      archivalNotice={{
        versionNumber: versionNum,
        currentLiveVersion,
        publishedAt,
        changeSummary,
      }}
    />
  );
}
