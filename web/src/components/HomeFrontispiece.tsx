"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { PortableText, stegaClean } from "next-sanity";

import type { HOME_PAGE_QUERY_RESULT } from "../../sanity.types";
import { HomeCarousel } from "@/components/HomeCarousel";
import { BookmarkButton } from "@/components/BookmarkButton";
import {
  CopperplateButton,
  ElementalPill,
  EtchedFrame,
  HandDrawnArrow,
  Icon,
} from "@/components/ui";
import { formatCategory, formatDate } from "@/lib/format";
import {
  buildHeroSlots,
  buildCategoryTarotCards,
  DEFAULT_MEDIA_CHANNELS,
  type ArticleEntry,
  type ChapterEntry,
  type HomeDocument,
  type MediaChannelEntry,
} from "@/lib/frontispiece";
import { getArticleEtching, getMediaVignette } from "@/sanity/image";
import styles from "@/app/home.module.css";

export interface HomeFrontispieceProps {
  data: HOME_PAGE_QUERY_RESULT | null;
  activeTopic?: string;
}

export function HomeFrontispieceView({ data, activeTopic = "" }: HomeFrontispieceProps) {
  const home: HomeDocument | null = data?.home ?? null;
  const allChapters: ChapterEntry[] = data?.chapters ?? [];
  const allArticles: ArticleEntry[] = data?.articles ?? [];

  const cleanActiveTopic = stegaClean(activeTopic.trim());

  const filteredArticles = cleanActiveTopic
    ? allArticles.filter((art) =>
        art.topics?.some((t) => stegaClean(t?.slug?.current) === cleanActiveTopic)
      )
    : allArticles;

  const activeTopicObj = cleanActiveTopic
    ? allArticles
        .flatMap((a) => a.topics ?? [])
        .find((t) => stegaClean(t?.slug?.current) === cleanActiveTopic)
    : null;

  const heroSlots = buildHeroSlots(home, allArticles);
  const categoryCards = buildCategoryTarotCards(allChapters);

  const configuredMedia = (home?.mediaChannels ?? []).filter(
    (m): m is MediaChannelEntry => Boolean(m && m.title && m.url)
  );
  const mediaItems =
    configuredMedia.length > 0 ? configuredMedia : DEFAULT_MEDIA_CHANNELS;

  const mottoHeading =
    home?.mottoBanner || "Knowledge for a More Curious World";
  const mottoSubtitle =
    home?.subheading ||
    "Practical guides, clear explanations, and real-world knowledge for curious minds everywhere.";

  return (
    <div className={styles.homePage}>
      {/* ── Accessible Semantic Heading (Visual header provided by GlobalHeader Cartouche) ── */}
      <h1 className="sr-only">
        {home?.heading || "Oliver\u2019s Guide To Everything"}
      </h1>
      <p className="sr-only">
        {home?.subheading || "Biotech & cancer research protocols"}
      </p>

      {/* ── Active Topic Filter Status Ribbon ── */}
      {cleanActiveTopic && (
        <aside className={styles.filterRibbon} aria-label="Active topic filter">
          <div className={styles.filterRibbonInfo}>
            <span>Filtered by Taxonomy:</span>
            <strong style={{ color: "var(--rust)" }}>
              {activeTopicObj?.symbol ? `[ ${activeTopicObj.symbol} ] ` : ""}
              {activeTopicObj?.name || cleanActiveTopic}
            </strong>
          </div>
          <Link href="/" className={styles.filterRibbonClear}>
            [ Clear Filter ✕ ]
          </Link>
        </aside>
      )}

      {/* ── Section 1: Dual Hero Feature Grid (unfiltered frontispiece view) ── */}
      {!cleanActiveTopic && (
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
            {cleanActiveTopic ? "Filtered Inscriptions" : "New"}
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
            {cleanActiveTopic
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
                <div key={article._id} className={styles.chronicleItem}>
                  <Link
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

                  <div className={styles.chronicleBookmark}>
                    <BookmarkButton
                      variant="row"
                      article={{
                        slug: stegaClean(article.slug?.current) || "",
                        title: article.title || "Untitled",
                        summary: article.summary,
                        contentType: stegaClean(article.contentType),
                        publishedAt: stegaClean(article.publishedAt),
                        topics: article.topics,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </nav>
        )}
      </section>
    </div>
  );
}

function HomeFrontispieceWithParams({ data }: { data: HOME_PAGE_QUERY_RESULT | null }) {
  const searchParams = useSearchParams();
  const topic = searchParams?.get("topic") || "";
  return <HomeFrontispieceView data={data} activeTopic={topic} />;
}

export function HomeFrontispiece({
  data,
  initialTopic,
}: {
  data: HOME_PAGE_QUERY_RESULT | null;
  initialTopic?: string;
}) {
  if (typeof initialTopic === "string") {
    return <HomeFrontispieceView data={data} activeTopic={initialTopic} />;
  }

  return (
    <Suspense fallback={<HomeFrontispieceView data={data} activeTopic="" />}>
      <HomeFrontispieceWithParams data={data} />
    </Suspense>
  );
}
