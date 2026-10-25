import type { ComponentProps } from "react";
import { PortableText, defineQuery, stegaClean } from "next-sanity";
import Image from "next/image";
import Link from "next/link";

import { HomeCarousel } from "@/components/HomeCarousel";
import {
  CopperplateButton,
  ElementalPill,
  EtchedFrame,
  HandDrawnArrow,
  Icon,
} from "@/components/ui";
import {
  formatCategory,
  formatDate,
  formatRomanNumeral,
} from "@/lib/format";
import {
  buildSanityImageUrl,
  getArticleEtching,
  getChapterVignette,
  getMediaVignette,
  type SanityImageLike,
} from "@/sanity/image";
import { sanityFetch } from "@/sanity/live";
import styles from "./home.module.css";

export const HOME_PAGE_QUERY = defineQuery(/* groq */ `{
  "home": *[_id == "homePage"][0]{
    heading,
    subheading,
    intro,
    logo {
      asset->{
        _id,
        url,
        metadata {
          lqip,
          dimensions
        }
      },
      hotspot,
      crop
    },
    mottoBanner,
    featuredArticles[]->{
      _id,
      title,
      slug,
      summary,
      contentType,
      featured,
      publishedAt,
      coverEtching {
        asset->{
          _id,
          url,
          metadata {
            lqip,
            dimensions
          }
        },
        alt,
        caption,
        hotspot,
        crop
      },
      topics[]->{
        _id,
        name,
        symbol,
        slug
      }
    },
    mediaChannels[]{
      _key,
      platform,
      title,
      description,
      url
    }
  },
  "chapters": *[_type == "chapter"] | order(number asc){
    _id,
    title,
    number,
    slug,
    summary,
    vignette {
      asset->{
        _id,
        url,
        metadata {
          lqip,
          dimensions
        }
      },
      alt,
      hotspot,
      crop
    }
  },
  "articles": *[_type == "article" && defined(slug.current)] | order(publishedAt desc){
    _id,
    title,
    slug,
    summary,
    contentType,
    featured,
    publishedAt,
    coverEtching {
      asset->{
        _id,
        url,
        metadata {
          lqip,
          dimensions
        }
      },
      alt,
      caption,
      hotspot,
      crop
    },
    topics[]->{
      _id,
      name,
      symbol,
      slug
    }
  }
}`);

interface ArticleEntry {
  _id: string;
  title?: string | null;
  slug?: { current?: string | null } | null;
  summary?: string | null;
  contentType?: string | null;
  featured?: boolean | null;
  publishedAt?: string | null;
  coverEtching?: SanityImageLike | null;
  topics?: Array<{
    _id: string;
    name?: string | null;
    symbol?: string | null;
    slug?: { current?: string | null } | null;
  } | null> | null;
}

interface ChapterEntry {
  _id: string;
  title?: string | null;
  number?: number | null;
  slug?: { current?: string | null } | null;
  summary?: string | null;
  vignette?: SanityImageLike | null;
}

interface MediaChannelEntry {
  _key?: string;
  platform?: string | null;
  title?: string | null;
  description?: string | null;
  url?: string | null;
}

interface HomeDocument {
  heading?: string | null;
  subheading?: string | null;
  intro?: ComponentProps<typeof PortableText>["value"] | null;
  logo?: SanityImageLike | null;
  mottoBanner?: string | null;
  featuredArticles?: Array<ArticleEntry | null> | null;
  mediaChannels?: Array<MediaChannelEntry | null> | null;
}

interface HeroSlot {
  id: string;
  badge: string;
  title: string;
  summary: string;
  href: string;
  ctaLabel: string;
  etchingSrc: string;
  etchingAlt: string;
}

interface CategoryTarotCard {
  id: string;
  eyebrow?: string;
  title: string;
  href: string;
  vignetteSrc: string;
  vignetteAlt: string;
}

const DEFAULT_HERO_SLOTS: HeroSlot[] = [
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

const DEFAULT_CATEGORY_CARDS: CategoryTarotCard[] = [
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

const DEFAULT_MEDIA_CHANNELS: Array<{
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

function toHeroSlot(
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

function buildHeroSlots(
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

function buildCategoryTarotCards(chapters: ChapterEntry[]): CategoryTarotCard[] {
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

interface HomePageProps {
  searchParams?: Promise<{
    topic?: string;
  }>;
}

export default async function HomePage(props: HomePageProps = {}) {
  const resolvedParams = props.searchParams ? await props.searchParams : {};
  const activeTopic = stegaClean(resolvedParams.topic?.trim() || "");

  const { data } = await sanityFetch({ query: HOME_PAGE_QUERY }).catch(
    (err) => {
      console.warn("Unable to fetch home page data from Sanity:", err);
      return { data: null };
    }
  );

  const home: HomeDocument | null = data?.home ?? null;
  const allChapters: ChapterEntry[] = data?.chapters ?? [];
  const allArticles: ArticleEntry[] = data?.articles ?? [];

  const filteredArticles = activeTopic
    ? allArticles.filter((art) =>
        art.topics?.some((t) => stegaClean(t?.slug?.current) === activeTopic)
      )
    : allArticles;

  const activeTopicObj = activeTopic
    ? allArticles
        .flatMap((a) => a.topics ?? [])
        .find((t) => stegaClean(t?.slug?.current) === activeTopic)
    : null;

  const heroSlots = buildHeroSlots(home, allArticles);
  const categoryCards = buildCategoryTarotCards(allChapters);

  const configuredMedia = (home?.mediaChannels ?? []).filter(
    (m): m is MediaChannelEntry => Boolean(m && m.title && m.url)
  );
  const mediaItems =
    configuredMedia.length > 0 ? configuredMedia : DEFAULT_MEDIA_CHANNELS;

  const logoUrl = buildSanityImageUrl(home?.logo, { width: 480, quality: 85 });
  const mottoHeading =
    home?.mottoBanner || "Knowledge for a More Curious World";
  const mottoSubtitle =
    home?.subheading ||
    "Practical guides, clear explanations, and real-world knowledge for curious minds everywhere.";

  return (
    <div className={styles.homePage}>
      {/* ── Masthead Strip (Maintains Semantic h1 & Tagline) ── */}
      <header className={styles.mastheadBar}>
        {logoUrl && (
          <Image
            src={logoUrl}
            alt={
              stegaClean(home?.heading) ||
              "Oliver's Guide To Everything emblem"
            }
            className={styles.mastheadLogo}
            width={240}
            height={120}
            unoptimized={logoUrl.endsWith(".svg")}
            priority
          />
        )}
        <h1 className={styles.mastheadTitle}>
          {home?.heading || "Oliver\u2019s Guide To Everything"}
        </h1>
        <p className={`landing-tagline ${styles.mastheadTagline}`}>
          {home?.subheading || "Biotech & cancer research protocols"}
        </p>
      </header>

      {/* ── Active Topic Filter Status Ribbon ── */}
      {activeTopic && (
        <aside className={styles.filterRibbon} aria-label="Active topic filter">
          <div className={styles.filterRibbonInfo}>
            <span>Filtered by Taxonomy:</span>
            <strong style={{ color: "var(--rust)" }}>
              {activeTopicObj?.symbol ? `[ ${activeTopicObj.symbol} ] ` : ""}
              {activeTopicObj?.name || activeTopic}
            </strong>
          </div>
          <Link href="/" className={styles.filterRibbonClear}>
            [ Clear Filter ✕ ]
          </Link>
        </aside>
      )}

      {/* ── Section 1: Dual Hero Feature Grid (unfiltered frontispiece view) ── */}
      {!activeTopic && (
        <section
          className={styles.heroSection}
          aria-label="Featured Compendium Dispatches"
        >
          <div className={styles.heroGrid}>
            {heroSlots.map((slot, index) => (
              <EtchedFrame
                key={slot.id}
                as="article"
                variant="hero"
                cornerFlourishes
                className={styles.heroCard}
              >
                <div className={styles.heroCardInner}>
                  <div className={styles.heroCardContent}>
                    <div>
                      <span className={styles.heroBadgeRibbon}>{slot.badge}</span>
                      <h2 className={styles.heroCardTitle}>
                        <Link
                          href={slot.href}
                          className={styles.heroCardTitleLink}
                        >
                          {slot.title}
                        </Link>
                      </h2>
                      <p className={styles.heroCardSummary}>{slot.summary}</p>
                    </div>

                    <div className={styles.heroCardCta}>
                      <CopperplateButton
                        href={slot.href}
                        variant="secondary"
                        size="md"
                        arrowVariant={index === 0 ? 1 : 2}
                      >
                        {slot.ctaLabel}
                      </CopperplateButton>
                    </div>
                  </div>

                  <div className={styles.heroCardArtwork}>
                    <Image
                      src={slot.etchingSrc}
                      alt={slot.etchingAlt}
                      width={240}
                      height={210}
                      className={styles.heroEtchingImg}
                      unoptimized={slot.etchingSrc.endsWith(".svg")}
                      priority={index === 0}
                    />
                  </div>
                </div>
              </EtchedFrame>
            ))}
          </div>
        </section>
      )}

      {/* ── Section 2: Popular Categories Carousel ── */}
      <section
        className={styles.sectionBlock}
        aria-labelledby="popular-categories-heading"
      >
        <header className={styles.sectionHeader}>
          <span className={styles.sectionOrnamentLeft} aria-hidden="true">
            <Icon name="diamond" size={11} />
          </span>
          <h2 id="popular-categories-heading" className={styles.sectionTitle}>
            Popular{" "}
            <span className={styles.sectionTitleItalic}>Categories</span>
          </h2>
          <div className={styles.sectionRule} aria-hidden="true" />
          <CopperplateButton
            href="/contents"
            variant="secondary"
            size="sm"
            arrowVariant={1}
          >
            View All
          </CopperplateButton>
          <span className={styles.sectionOrnamentRight} aria-hidden="true">
            <Icon name="diamond" size={11} />
          </span>
        </header>

        <HomeCarousel ariaLabel="Popular Categories" dotCount={4} scrollStepPx={340}>
          <div className={styles.categoriesTrack}>
            {categoryCards.map((card) => (
              <Link
                key={card.id}
                href={card.href}
                className={styles.categoryCard}
              >
                <div className={styles.categoryMedallion}>
                  <Image
                    src={card.vignetteSrc}
                    alt={card.vignetteAlt}
                    width={120}
                    height={120}
                    className={styles.categoryMedallionImg}
                    unoptimized={card.vignetteSrc.endsWith(".svg")}
                  />
                </div>
                {card.eyebrow && (
                  <span className={styles.categoryEyebrow}>{card.eyebrow}</span>
                )}
                <span className={styles.categoryCardTitle}>{card.title}</span>
              </Link>
            ))}
          </div>
        </HomeCarousel>
      </section>

      {/* ── Section 3: Mid-Page Decorative Motto Banner ── */}
      <section
        className={styles.mottoBannerSection}
        aria-label="Publication Motto"
      >
        <div className={styles.mottoBannerFrame}>
          <div className={styles.mottoBannerContent}>
            <div className={styles.mottoTitleRow}>
              <Icon
                name="star-four"
                size={16}
                className={styles.mottoFlankStar}
              />
              <h2 className={styles.mottoHeading}>{mottoHeading}</h2>
              <Icon
                name="star-four"
                size={16}
                className={styles.mottoFlankStar}
              />
            </div>

            <div className={styles.mottoDivider} aria-hidden="true">
              <span className={styles.mottoDividerDot} />
            </div>

            <p className={styles.mottoSubtext}>{mottoSubtitle}</p>

            {home?.intro && Array.isArray(home.intro) && home.intro.length > 0 && (
              <div className={styles.mottoIntro}>
                <PortableText value={home.intro} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Section 4: Popular Media Section ── */}
      <section
        className={styles.sectionBlock}
        aria-labelledby="popular-media-heading"
      >
        <header className={styles.sectionHeader}>
          <span className={styles.sectionOrnamentLeft} aria-hidden="true">
            <Icon name="diamond" size={11} />
          </span>
          <h2 id="popular-media-heading" className={styles.sectionTitle}>
            Popular Media
          </h2>
          <div className={styles.sectionRule} aria-hidden="true" />
          <CopperplateButton
            href="/contents"
            variant="secondary"
            size="sm"
            arrowVariant={2}
          >
            View All
          </CopperplateButton>
          <span className={styles.sectionOrnamentRight} aria-hidden="true">
            <Icon name="diamond" size={11} />
          </span>
        </header>

        <HomeCarousel ariaLabel="Popular Media" dotCount={4} scrollStepPx={360}>
          <div className={styles.mediaTrack}>
            {mediaItems.map((channel, index) => {
              const platformClean = stegaClean(
                channel.platform || "other"
              ).toLowerCase();
              const vignette = getMediaVignette(platformClean);

              const badgeClass =
                platformClean === "youtube"
                  ? styles.platformYoutube
                  : platformClean === "tiktok"
                  ? styles.platformTiktok
                  : platformClean === "linkedin"
                  ? styles.platformLinkedin
                  : styles.platformOther;

              const badgeGlyph =
                platformClean === "youtube"
                  ? "▶"
                  : platformClean === "tiktok"
                  ? "♪"
                  : platformClean === "linkedin"
                  ? "in"
                  : "✦";

              return (
                <a
                  key={channel._key || `${platformClean}-${index}`}
                  href={stegaClean(channel.url || "#")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.mediaCard}
                >
                  <div className={styles.mediaArtwork}>
                    <Image
                      src={vignette.src}
                      alt={vignette.alt}
                      width={112}
                      height={112}
                      className={styles.mediaArtworkImg}
                      unoptimized
                    />
                  </div>

                  <div className={styles.mediaContent}>
                    <div>
                      <div className={styles.mediaHeaderRow}>
                        <span
                          className={`${styles.platformBadge} ${badgeClass}`}
                          aria-hidden="true"
                        >
                          {badgeGlyph}
                        </span>
                        <h3 className={styles.mediaTitle}>{channel.title}</h3>
                      </div>

                      {channel.description && (
                        <p className={styles.mediaDescription}>
                          {channel.description}
                        </p>
                      )}
                    </div>

                    <span className={styles.mediaAction}>
                      <span>{vignette.actionLabel}</span>
                      <HandDrawnArrow
                        index={index}
                        size={14}
                        style={{ color: "var(--rust)" }}
                      />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </HomeCarousel>
      </section>

      {/* ── Section 5: "New & Recent" Chronicle Feed ── */}
      <section
        className={styles.sectionBlock}
        aria-labelledby="chronicle-feed-heading"
      >
        <header className={styles.sectionHeader}>
          <span className={styles.sectionOrnamentLeft} aria-hidden="true">
            <Icon name="diamond" size={11} />
          </span>
          <h2 id="chronicle-feed-heading" className={styles.sectionTitle}>
            {activeTopic ? "Filtered Inscriptions" : "New"}
          </h2>
          <div className={styles.sectionRule} aria-hidden="true" />
          <CopperplateButton
            href="/contents"
            variant="secondary"
            size="sm"
            arrowVariant={3}
          >
            View All
          </CopperplateButton>
          <span className={styles.sectionOrnamentRight} aria-hidden="true">
            <Icon name="diamond" size={11} />
          </span>
        </header>

        {filteredArticles.length === 0 ? (
          <p className="empty-state">
            {activeTopic
              ? "No articles found matching this topic taxonomy."
              : "No articles yet — add some in the Studio."}
          </p>
        ) : (
          <nav
            className={styles.chronicleContainer}
            aria-label="Recent Compendium Entries"
          >
            {filteredArticles.map((article, index) => {
              const thumb = getArticleEtching(
                article,
                { width: 224, height: 136, quality: 80 },
                index
              );

              return (
                <Link
                  key={article._id}
                  href={`/${stegaClean(article.slug?.current)}`}
                  className={`article-card ${styles.chronicleRow}`}
                >
                  <div className={styles.chronicleThumb}>
                    <Image
                      src={thumb.src}
                      alt={thumb.alt}
                      width={112}
                      height={68}
                      className={styles.chronicleThumbImg}
                      unoptimized={thumb.src.endsWith(".svg")}
                    />
                  </div>

                  <div className={styles.chronicleMain}>
                    <span
                      className={`article-card-title ${styles.chronicleTitle}`}
                    >
                      {article.title}
                    </span>

                    {article.summary && (
                      <span
                        className={`article-card-summary ${styles.chronicleSummary}`}
                      >
                        {article.summary}
                      </span>
                    )}

                    {article.topics && article.topics.length > 0 && (
                      <div className={styles.chronicleTopics}>
                        {article.topics.map((t) =>
                          t?.symbol ? (
                            <ElementalPill
                              key={t._id}
                              symbol={t.symbol}
                              size="sm"
                            />
                          ) : null
                        )}
                      </div>
                    )}
                  </div>

                  <span className={`article-card-meta ${styles.chronicleMeta}`}>
                    {article.contentType && (
                      <span
                        className={`article-card-category ${styles.chronicleTypeBadge}`}
                      >
                        <span
                          className={styles.chronicleDocGlyph}
                          aria-hidden="true"
                        />
                        {formatCategory(stegaClean(article.contentType))}
                      </span>
                    )}
                    {article.publishedAt && (
                      <span className={styles.chronicleDate}>
                        {formatDate(stegaClean(article.publishedAt))}
                      </span>
                    )}
                    <HandDrawnArrow
                      index={index}
                      size={15}
                      style={{ color: "var(--rust)" }}
                    />
                  </span>
                </Link>
              );
            })}
          </nav>
        )}
      </section>
    </div>
  );
}
