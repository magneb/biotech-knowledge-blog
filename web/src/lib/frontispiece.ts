import { stegaClean } from "next-sanity";
import type { HOME_PAGE_QUERY_RESULT } from "../../sanity.types";
import { formatRomanNumeral } from "@/lib/format";
import {
  getArticleEtching,
  getChapterVignette,
} from "@/sanity/image";

export type HomeDocument = NonNullable<HOME_PAGE_QUERY_RESULT>["home"];
export type ArticleEntry = NonNullable<HOME_PAGE_QUERY_RESULT>["articles"][number];
export type ChapterEntry = NonNullable<HOME_PAGE_QUERY_RESULT>["chapters"][number];
export type MediaChannelEntry = NonNullable<NonNullable<HomeDocument>["mediaChannels"]>[number];

export interface HeroSlot {
  id: string;
  badge: string;
  title: string;
  summary: string;
  href: string;
  ctaLabel: string;
  etchingSrc: string;
  etchingAlt: string;
}

export interface CategoryTarotCard {
  id: string;
  eyebrow?: string;
  title: string;
  href: string;
  vignetteSrc: string;
  vignetteAlt: string;
}

export const DEFAULT_HERO_SLOTS: HeroSlot[] = [
  {
    id: "fallback-hero-new",
    badge: "New",
    title: "Cellular Imaging & Achromatic Microscopy",
    summary:
      "Explore practical bench techniques, optical calibration, and specimen preparation for high-contrast cellular observation.",
    href: "/contents?scope=article",
    ctaLabel: "Read Article",
    etchingSrc: "/art/chapters/microscopy.svg",
    etchingAlt: "Achromatic compound microscope copperplate engraving",
  },
  {
    id: "fallback-hero-guide",
    badge: "Featured Guide",
    title: "The Scientific Method & Bench Protocols",
    summary:
      "A clear, systematic guide to experimental design, reagent validation, and reproducible oncology research workflows.",
    href: "/contents?scope=guide",
    ctaLabel: "Explore Guide",
    etchingSrc: "/art/chapters/apparatus.svg",
    etchingAlt: "Laboratory apparatus and analytical balance engraving",
  },
];

export const DEFAULT_CATEGORY_CARDS: CategoryTarotCard[] = [
  {
    id: "cat-protocols",
    eyebrow: "Format",
    title: "Protocols",
    href: "/contents?scope=protocol",
    vignetteSrc: "/art/chapters/reagents.svg",
    vignetteAlt: "Laboratory protocols flask and alembic engraving",
  },
  {
    id: "cat-reagents",
    eyebrow: "Compounds",
    title: "Reagents",
    href: "/contents?q=reagent",
    vignetteSrc: "/art/chapters/reagents.svg",
    vignetteAlt: "Chemical reagents apothecary bottle engraving",
  },
  {
    id: "cat-equipment",
    eyebrow: "Apparatus",
    title: "Equipment",
    href: "/contents?q=micro",
    vignetteSrc: "/art/chapters/microscopy.svg",
    vignetteAlt: "Compound microscope and optical instruments engraving",
  },
  {
    id: "cat-specimens",
    eyebrow: "Biology",
    title: "Specimens",
    href: "/contents?q=cell",
    vignetteSrc: "/art/chapters/specimens.svg",
    vignetteAlt: "Biological specimens and cellular morphology engraving",
  },
  {
    id: "cat-analysis",
    eyebrow: "Notes",
    title: "Data & Analysis",
    href: "/contents?scope=research-note",
    vignetteSrc: "/art/chapters/apparatus.svg",
    vignetteAlt: "Analytical balances and measurement instruments engraving",
  },
  {
    id: "cat-guides",
    eyebrow: "Treatises",
    title: "Guides",
    href: "/contents?scope=guide",
    vignetteSrc: "/art/chapters/microscopy.svg",
    vignetteAlt: "Scientific guides compendium engraving",
  },
];

export const DEFAULT_MEDIA_CHANNELS: Array<{
  _key: string;
  platform: "youtube" | "tiktok" | "linkedin";
  title: string;
  description: string;
  url: string;
}> = [
  {
    _key: "default-youtube",
    platform: "youtube",
    title: "YouTube",
    description: "Explainers, experiments and behind-the-scenes from the lab.",
    url: "https://www.youtube.com",
  },
  {
    _key: "default-tiktok",
    platform: "tiktok",
    title: "TikTok",
    description: "Short science, big ideas in under a minute.",
    url: "https://www.tiktok.com",
  },
  {
    _key: "default-linkedin",
    platform: "linkedin",
    title: "LinkedIn",
    description: "Updates, articles and professional resources.",
    url: "https://www.linkedin.com",
  },
];

export function toHeroSlot(
  article: ArticleEntry,
  slotIndex: number,
  explicitBadge?: string
): HeroSlot {
  const cleanType = stegaClean(article.contentType || "article").toLowerCase();
  const slug = stegaClean(article.slug?.current || "");
  const badge =
    explicitBadge ||
    (slotIndex === 0
      ? "New"
      : cleanType === "protocol"
      ? "Featured Protocol"
      : cleanType === "guide"
      ? "Featured Guide"
      : "Featured Entry");

  const ctaLabel =
    cleanType === "guide"
      ? "Explore Guide"
      : cleanType === "protocol"
      ? "Read Protocol"
      : "Read Article";

  const etching = getArticleEtching(
    article,
    { width: 480, height: 340, quality: 82 },
    slotIndex
  );

  return {
    id: article._id,
    badge,
    title: article.title || "Untitled Inscription",
    summary:
      article.summary ||
      "A detailed treatise from Oliver's laboratory compendium.",
    href: slug ? `/${slug}` : "/contents",
    ctaLabel,
    etchingSrc: etching.src,
    etchingAlt: etching.alt,
  };
}

export function buildHeroSlots(
  home: HomeDocument | null,
  allArticles: ArticleEntry[]
): HeroSlot[] {
  const curated = (home?.featuredArticles ?? []).filter(
    (a): a is ArticleEntry => Boolean(a && a._id)
  );

  const selectedArticles: ArticleEntry[] = [];
  for (const item of curated) {
    if (selectedArticles.length < 2 && !selectedArticles.some((s) => s._id === item._id)) {
      selectedArticles.push(item);
    }
  }

  if (selectedArticles.length === 0 && allArticles.length > 0) {
    selectedArticles.push(allArticles[0]);
  }

  if (selectedArticles.length === 1 && allArticles.length > 1) {
    const secondCandidate =
      allArticles.find(
        (a) =>
          a._id !== selectedArticles[0]._id &&
          (a.featured ||
            stegaClean(a.contentType) === "guide" ||
            stegaClean(a.contentType) === "protocol")
      ) ?? allArticles.find((a) => a._id !== selectedArticles[0]._id);

    if (secondCandidate) {
      selectedArticles.push(secondCandidate);
    }
  }

  const slots = selectedArticles.map((art, idx) => toHeroSlot(art, idx));

  while (slots.length < 2) {
    slots.push(DEFAULT_HERO_SLOTS[slots.length]);
  }

  return slots.slice(0, 2);
}

export function buildCategoryTarotCards(chapters: ChapterEntry[]): CategoryTarotCard[] {
  const fromChapters: CategoryTarotCard[] = chapters.map((ch) => {
    const vignette = getChapterVignette(ch, { width: 240, height: 240 });
    const roman =
      typeof ch.number === "number" ? `Ch. ${formatRomanNumeral(ch.number)}` : undefined;
    return {
      id: ch._id,
      eyebrow: roman,
      title: ch.title || "Chapter",
      href: `/contents#ch-${ch._id}`,
      vignetteSrc: vignette.src,
      vignetteAlt: vignette.alt,
    };
  });

  if (fromChapters.length >= 6) {
    return fromChapters;
  }

  const existingTitles = new Set(
    fromChapters.map((c) => stegaClean(c.title).toLowerCase())
  );
  const filler = DEFAULT_CATEGORY_CARDS.filter(
    (d) => !existingTitles.has(d.title.toLowerCase())
  );

  return [...fromChapters, ...filler].slice(0, 6);
}
