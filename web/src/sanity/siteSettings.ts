import { defineQuery, stegaClean } from "next-sanity";

export const SITE_SETTINGS_QUERY = defineQuery(
  `*[_type in ["siteSettings", "aboutPage", "homePage"]]{
    _id,
    _type,
    siteTitle,
    authorName,
    authorAffiliation,
    publisher,
    siteDescription,
    canonicalDomain,
    contactEmail,
    maintenanceMode,
    maintenanceTitle,
    maintenanceMessage,
    wipBannerEnabled,
    wipBannerText
  }`
);

export const WIP_BANNER_QUERY = defineQuery(
  `*[_type == "siteSettings"][0]{ wipBannerEnabled, wipBannerText }`
);

export interface ResolvedSiteMetadata {
  siteTitle: string;
  authorName: string;
  authorAffiliation: string | null;
  publisher: string;
  siteDescription: string;
  canonicalDomain: string;
  contactEmail: string | null;
  maintenanceMode: boolean;
  maintenanceTitle: string;
  maintenanceMessage: string;
  wipBannerEnabled: boolean;
  wipBannerText: string;
}

export const DEFAULT_SITE_METADATA: ResolvedSiteMetadata = {
  siteTitle: "Oliver's Guide To Everything",
  authorName: "Oliver",
  authorAffiliation: "Cancer Biology & Molecular Biotechnology",
  publisher: "Oliver's Guide To Everything",
  siteDescription:
    "A personal knowledge base for biotech and cancer research protocols.",
  canonicalDomain: "https://oliversguidetoeverything.com",
  contactEmail: null,
  maintenanceMode: false,
  maintenanceTitle: "Undergoing Scholarly Revision",
  maintenanceMessage:
    "The compendium is temporarily closed for cataloguing, binding, and archival preservation. Please return shortly.",
  wipBannerEnabled: true,
  wipBannerText:
    "Work in Progress — Oliver's Guide is actively being penned and curated. Protocols may undergo revision.",
};

/**
 * Resolves metadata settings prioritized from siteSettings, then aboutPage, then homePage.
 * Allows Oliver to configure Dublin Core, Google Scholar, citation, and operational fields centrally.
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
    maintenanceMode?: boolean | null;
    maintenanceTitle?: string | null;
    maintenanceMessage?: string | null;
    wipBannerEnabled?: boolean | null;
    wipBannerText?: string | null;
  }> | null | undefined
): ResolvedSiteMetadata {
  if (!Array.isArray(settings) || settings.length === 0) {
    return DEFAULT_SITE_METADATA;
  }

  const site = settings.find((s) => s._type === "siteSettings");
  const about = settings.find((s) => s._type === "aboutPage");
  const home = settings.find((s) => s._type === "homePage");

  const siteTitle =
    stegaClean(site?.siteTitle) ||
    stegaClean(about?.siteTitle) ||
    stegaClean(home?.siteTitle) ||
    DEFAULT_SITE_METADATA.siteTitle;

  const authorName =
    stegaClean(site?.authorName) ||
    stegaClean(about?.authorName) ||
    stegaClean(home?.authorName) ||
    DEFAULT_SITE_METADATA.authorName;

  const authorAffiliation =
    stegaClean(site?.authorAffiliation) ||
    stegaClean(about?.authorAffiliation) ||
    stegaClean(home?.authorAffiliation) ||
    DEFAULT_SITE_METADATA.authorAffiliation;

  const publisher =
    stegaClean(site?.publisher) ||
    stegaClean(about?.publisher) ||
    stegaClean(home?.publisher) ||
    DEFAULT_SITE_METADATA.publisher;

  const siteDescription =
    stegaClean(site?.siteDescription) ||
    stegaClean(about?.siteDescription) ||
    stegaClean(home?.siteDescription) ||
    DEFAULT_SITE_METADATA.siteDescription;

  const canonicalDomain =
    stegaClean(site?.canonicalDomain) ||
    stegaClean(about?.canonicalDomain) ||
    stegaClean(home?.canonicalDomain) ||
    DEFAULT_SITE_METADATA.canonicalDomain;

  const contactEmail =
    stegaClean(site?.contactEmail) ||
    stegaClean(about?.contactEmail) ||
    stegaClean(home?.contactEmail) ||
    DEFAULT_SITE_METADATA.contactEmail;

  const maintenanceMode =
    site?.maintenanceMode ?? DEFAULT_SITE_METADATA.maintenanceMode;

  const maintenanceTitle =
    stegaClean(site?.maintenanceTitle) || DEFAULT_SITE_METADATA.maintenanceTitle;

  const maintenanceMessage =
    stegaClean(site?.maintenanceMessage) || DEFAULT_SITE_METADATA.maintenanceMessage;

  const wipBannerEnabled =
    site?.wipBannerEnabled ?? DEFAULT_SITE_METADATA.wipBannerEnabled;

  const wipBannerText =
    stegaClean(site?.wipBannerText) || DEFAULT_SITE_METADATA.wipBannerText;

  return {
    siteTitle,
    authorName,
    authorAffiliation,
    publisher,
    siteDescription,
    canonicalDomain: canonicalDomain.replace(/\/+$/, ""),
    contactEmail,
    maintenanceMode,
    maintenanceTitle,
    maintenanceMessage,
    wipBannerEnabled,
    wipBannerText,
  };
}
