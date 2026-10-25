import { defineQuery, stegaClean } from "next-sanity";

export const SITE_SETTINGS_QUERY = defineQuery(
  `*[_type in ["aboutPage", "homePage"]]{
    _id,
    _type,
    siteTitle,
    authorName,
    authorAffiliation,
    publisher,
    siteDescription,
    canonicalDomain,
    contactEmail
  }`
);

export interface ResolvedSiteMetadata {
  siteTitle: string;
  authorName: string;
  authorAffiliation: string | null;
  publisher: string;
  siteDescription: string;
  canonicalDomain: string;
  contactEmail: string | null;
}

export const DEFAULT_SITE_METADATA: ResolvedSiteMetadata = {
  siteTitle: "Oliver's Guide To Everything",
  authorName: "Oliver",
  authorAffiliation: "Cancer Biology & Molecular Biotechnology",
  publisher: "Oliver's Guide To Everything",
  siteDescription:
    "A personal knowledge base for biotech and cancer research protocols.",
  canonicalDomain: "https://oliversguide.com",
  contactEmail: null,
};

/**
 * Resolves metadata settings prioritized from aboutPage, then homePage, with resilient defaults.
 * Allows Oliver to configure Dublin Core, Google Scholar, and citation fields from either page.
 */
export function resolveSiteMetadata(
  settings: Array<{
    _type: string;
    siteTitle?: string | null;
    authorName?: string | null;
    authorAffiliation?: string | null;
    publisher?: string | null;
    siteDescription?: string | null;
    canonicalDomain?: string | null;
    contactEmail?: string | null;
  }> | null | undefined
): ResolvedSiteMetadata {
  if (!Array.isArray(settings) || settings.length === 0) {
    return DEFAULT_SITE_METADATA;
  }

  const about = settings.find((s) => s._type === "aboutPage");
  const home = settings.find((s) => s._type === "homePage");

  const siteTitle =
    stegaClean(about?.siteTitle) ||
    stegaClean(home?.siteTitle) ||
    DEFAULT_SITE_METADATA.siteTitle;

  const authorName =
    stegaClean(about?.authorName) ||
    stegaClean(home?.authorName) ||
    DEFAULT_SITE_METADATA.authorName;

  const authorAffiliation =
    stegaClean(about?.authorAffiliation) ||
    stegaClean(home?.authorAffiliation) ||
    DEFAULT_SITE_METADATA.authorAffiliation;

  const publisher =
    stegaClean(about?.publisher) ||
    stegaClean(home?.publisher) ||
    DEFAULT_SITE_METADATA.publisher;

  const siteDescription =
    stegaClean(about?.siteDescription) ||
    stegaClean(home?.siteDescription) ||
    DEFAULT_SITE_METADATA.siteDescription;

  const canonicalDomain =
    stegaClean(about?.canonicalDomain) ||
    stegaClean(home?.canonicalDomain) ||
    DEFAULT_SITE_METADATA.canonicalDomain;

  const contactEmail =
    stegaClean(about?.contactEmail) ||
    stegaClean(home?.contactEmail) ||
    DEFAULT_SITE_METADATA.contactEmail;

  return {
    siteTitle,
    authorName,
    authorAffiliation,
    publisher,
    siteDescription,
    canonicalDomain: canonicalDomain.replace(/\/+$/, ""),
    contactEmail,
  };
}
