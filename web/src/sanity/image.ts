import { createImageUrlBuilder } from "@sanity/image-url";
import { stegaClean } from "next-sanity";
import { client } from "./client";

const builder = createImageUrlBuilder(client);

export interface SanityImageLike {
  asset?: {
    _ref?: string;
    _id?: string;
    url?: string | null;
    metadata?: {
      lqip?: string | null;
      dimensions?: {
        width?: number | null;
        height?: number | null;
      } | null;
    } | null;
  } | null;
  alt?: string | null;
  caption?: string | null;
  hotspot?: {
    x?: number;
    y?: number;
    height?: number;
    width?: number;
  } | null;
  crop?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  } | null;
}

export interface ImageUrlOptions {
  width: number;
  height?: number;
  quality?: number;
  fit?: "crop" | "clip" | "fill" | "max" | "min" | "scale";
}

/**
 * Raw Sanity image URL builder instance for custom transformations.
 */
export function urlForImage(source: SanityImageLike | Record<string, unknown>) {
  return builder.image(source);
}

/**
 * Builds an optimized Sanity CDN URL with exact dimensions, auto WebP/AVIF format,
 * hotspot-aware cropping, and automatic quality. Returns null if no valid asset is present.
 */
export function buildSanityImageUrl(
  source: SanityImageLike | null | undefined,
  options: ImageUrlOptions
): string | null {
  if (!source?.asset) return null;

  const assetUrl = source.asset.url;
  if (assetUrl && assetUrl.endsWith(".svg")) {
    return assetUrl;
  }

  try {
    let img = builder
      .image(source as Record<string, unknown>)
      .width(options.width)
      .auto("format")
      .quality(options.quality ?? 80);

    if (options.height) {
      img = img.height(options.height).fit(options.fit ?? "crop");
    }

    return img.url();
  } catch {
    return assetUrl ?? null;
  }
}

export const DEFAULT_CHAPTER_VIGNETTES = [
  { url: "/art/chapters/microscopy.svg", alt: "Microscopy & lenses engraving" },
  { url: "/art/chapters/specimens.svg", alt: "Biological specimens engraving" },
  { url: "/art/chapters/reagents.svg", alt: "Chemical reagents & distillation engraving" },
  { url: "/art/chapters/apparatus.svg", alt: "Laboratory apparatus engraving" },
] as const;

/**
 * Resolves a chapter's vignette image URL (from Sanity CDN if uploaded, or a
 * deterministic copperplate etching fallback based on chapter title/slug/number).
 */
export function getChapterVignette(
  chapter: {
    title?: string | null;
    number?: number | null;
    slug?: { current?: string | null } | null;
    vignette?: SanityImageLike | null;
  },
  options: ImageUrlOptions = { width: 240, height: 240 }
): { src: string; alt: string; lqip?: string } {
  const sanityUrl = buildSanityImageUrl(chapter.vignette, options);
  if (sanityUrl) {
    return {
      src: sanityUrl,
      alt:
        stegaClean(chapter.vignette?.alt) ||
        `${stegaClean(chapter.title) || "Chapter"} vignette`,
      lqip: chapter.vignette?.asset?.metadata?.lqip ?? undefined,
    };
  }

  const slug = stegaClean(chapter.slug?.current || "").toLowerCase();
  const title = stegaClean(chapter.title || "").toLowerCase();
  const cleanTitle = stegaClean(chapter.title || "Chapter");

  if (
    slug.includes("micro") ||
    title.includes("micro") ||
    slug.includes("optic") ||
    title.includes("optic") ||
    slug.includes("lens") ||
    title.includes("lens")
  ) {
    return {
      src: "/art/chapters/microscopy.svg",
      alt: `${cleanTitle} microscopy engraving`,
    };
  }
  if (
    slug.includes("specimen") ||
    title.includes("specimen") ||
    slug.includes("bio") ||
    title.includes("bio") ||
    slug.includes("cell") ||
    title.includes("cell") ||
    slug.includes("tissue") ||
    title.includes("tissue") ||
    slug.includes("animal") ||
    title.includes("animal")
  ) {
    return {
      src: "/art/chapters/specimens.svg",
      alt: `${cleanTitle} specimens engraving`,
    };
  }
  if (
    slug.includes("reagent") ||
    title.includes("reagent") ||
    slug.includes("chem") ||
    title.includes("chem") ||
    slug.includes("buffer") ||
    title.includes("buffer") ||
    slug.includes("distill") ||
    title.includes("distill") ||
    slug.includes("protocol") ||
    title.includes("protocol")
  ) {
    return {
      src: "/art/chapters/reagents.svg",
      alt: `${cleanTitle} reagents engraving`,
    };
  }
  if (
    slug.includes("apparatus") ||
    title.includes("apparatus") ||
    slug.includes("device") ||
    title.includes("device") ||
    slug.includes("tool") ||
    title.includes("tool") ||
    slug.includes("lab") ||
    title.includes("lab") ||
    slug.includes("equip") ||
    title.includes("equip")
  ) {
    return {
      src: "/art/chapters/apparatus.svg",
      alt: `${cleanTitle} laboratory apparatus engraving`,
    };
  }

  const idx =
    typeof chapter.number === "number" && chapter.number > 0
      ? (chapter.number - 1) % DEFAULT_CHAPTER_VIGNETTES.length
      : 0;
  const fallback = DEFAULT_CHAPTER_VIGNETTES[idx];

  return {
    src: fallback.url,
    alt: `${cleanTitle} illustration etching`,
  };
}

/**
 * Resolves an article's cover etching URL (from Sanity CDN with exact dimensions,
 * or a matching copperplate etching fallback).
 */
export function getArticleEtching(
  article: {
    title?: string | null;
    contentType?: string | null;
    coverEtching?: SanityImageLike | null;
  },
  options: ImageUrlOptions = { width: 480, height: 320 },
  fallbackIndex = 0
): { src: string; alt: string; lqip?: string } {
  const sanityUrl = buildSanityImageUrl(article.coverEtching, options);
  const cleanTitle = stegaClean(article.title || "Scientific Entry");

  if (sanityUrl) {
    return {
      src: sanityUrl,
      alt: stegaClean(article.coverEtching?.alt) || cleanTitle,
      lqip: article.coverEtching?.asset?.metadata?.lqip ?? undefined,
    };
  }

  const titleLower = cleanTitle.toLowerCase();
  const typeLower = stegaClean(article.contentType || "").toLowerCase();

  if (
    titleLower.includes("micro") ||
    titleLower.includes("optic") ||
    titleLower.includes("blot") ||
    titleLower.includes("imaging")
  ) {
    return {
      src: "/art/chapters/microscopy.svg",
      alt: `${cleanTitle} copperplate engraving`,
    };
  }
  if (
    typeLower === "protocol" ||
    titleLower.includes("reagent") ||
    titleLower.includes("pcr") ||
    titleLower.includes("assay") ||
    titleLower.includes("buffer")
  ) {
    return {
      src: "/art/chapters/reagents.svg",
      alt: `${cleanTitle} copperplate engraving`,
    };
  }
  if (
    titleLower.includes("cell") ||
    titleLower.includes("crispr") ||
    titleLower.includes("specimen") ||
    titleLower.includes("tissue")
  ) {
    return {
      src: "/art/chapters/specimens.svg",
      alt: `${cleanTitle} copperplate engraving`,
    };
  }
  if (typeLower === "guide") {
    return {
      src: "/art/chapters/apparatus.svg",
      alt: `${cleanTitle} copperplate engraving`,
    };
  }

  const fallback =
    DEFAULT_CHAPTER_VIGNETTES[
      Math.abs(fallbackIndex) % DEFAULT_CHAPTER_VIGNETTES.length
    ];
  return {
    src: fallback.url,
    alt: `${cleanTitle} copperplate engraving`,
  };
}

/**
 * Maps a media platform identifier to its bespoke Victorian copperplate vignette.
 */
export function getMediaVignette(platform?: string | null): {
  src: string;
  alt: string;
  badge: string;
  actionLabel: string;
} {
  const clean = stegaClean(platform || "").toLowerCase();
  switch (clean) {
    case "youtube":
      return {
        src: "/art/media/projector.svg",
        alt: "Vintage brass cinematograph projector engraving",
        badge: "YouTube",
        actionLabel: "Watch on YouTube",
      };
    case "tiktok":
      return {
        src: "/art/media/pocket-lens.svg",
        alt: "Victorian pocket magnifying lens and specimen engraving",
        badge: "TikTok",
        actionLabel: "Follow on TikTok",
      };
    case "linkedin":
      return {
        src: "/art/media/leather-folio.svg",
        alt: "Stacked leather-bound academic folios engraving",
        badge: "LinkedIn",
        actionLabel: "Connect on LinkedIn",
      };
    default:
      return {
        src: "/art/chapters/apparatus.svg",
        alt: "Scientific laboratory apparatus engraving",
        badge: "Dispatch",
        actionLabel: "Visit Channel",
      };
  }
}
