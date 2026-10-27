import type { Metadata } from "next";
import { stegaClean } from "next-sanity";
import { formatCategory } from "@/lib/format";
import { getVersionPermalink } from "@/lib/citation";
import type { ResolvedSiteMetadata } from "@/sanity/siteSettings";

export interface BuildTreatiseMetadataOptions {
  slug: string;
  title?: string | null;
  summary?: string | null;
  contentType?: string | null;
  publishedAt?: string | null;
  versionNumber: number;
  siteMeta: ResolvedSiteMetadata;
  isArchival?: boolean;
}

export function buildTreatiseMetadata({
  slug,
  title,
  summary,
  contentType,
  publishedAt,
  versionNumber,
  siteMeta,
  isArchival = false,
}: BuildTreatiseMetadataOptions): Metadata {
  const cleanTitle = stegaClean(title) || "Protocol";
  const cleanSummary = stegaClean(summary) || siteMeta.siteDescription;
  const publishedDate = publishedAt ? stegaClean(publishedAt) : undefined;
  const canonicalUrl = `${siteMeta.canonicalDomain}/${slug}/`;
  const permalink = getVersionPermalink(slug, versionNumber, siteMeta.canonicalDomain);

  const pageTitle = isArchival
    ? `${cleanTitle} (Edition v${versionNumber} Archival Record) — ${siteMeta.siteTitle}`
    : `${cleanTitle} (Edition v${versionNumber}) — ${siteMeta.siteTitle}`;

  const dcTitle = isArchival ? `${cleanTitle} (Edition v${versionNumber})` : cleanTitle;
  const dcType = isArchival
    ? "Text.Protocol.Archival"
    : contentType
      ? `Text.${formatCategory(stegaClean(contentType))}`
      : "Text.Protocol";

  return {
    title: pageTitle,
    description: cleanSummary,
    alternates: {
      canonical: canonicalUrl,
    },
    ...(isArchival && {
      robots: {
        index: true,
        follow: true,
      },
    }),
    other: {
      // ── Dublin Core Metadata ──
      "DC.title": dcTitle,
      "DC.creator": siteMeta.authorName,
      ...(publishedDate && { "DC.date": publishedDate }),
      ...(cleanSummary && { "DC.description": cleanSummary }),
      "DC.type": dcType,
      "DC.identifier": permalink,
      "DC.relation.isVersionOf": canonicalUrl,
      "DC.publisher": siteMeta.publisher,
      "DC.language": "en",

      // ── Google Scholar / Highwire Press Metadata ──
      citation_title: cleanTitle,
      citation_author: siteMeta.authorName,
      ...(publishedDate && {
        citation_publication_date: publishedDate.split("T")[0],
      }),
      citation_journal_title: siteMeta.siteTitle,
      citation_technical_report_number: `Version ${versionNumber}`,
    },
  };
}
