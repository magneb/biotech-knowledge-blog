"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { stegaClean } from "next-sanity";

import type { CONTENTS_PAGE_QUERY_RESULT } from "../../sanity.types";
import { getChapterVignette } from "@/sanity/image";
import { StarDivider } from "@/components/ui/StarDivider";
import { HandDrawnArrow } from "@/components/ui/Icon";
import { ElementalPill } from "@/components/ui/ElementalPill";
import { formatCategory, formatDate, formatRomanNumeral } from "@/lib/format";
import styles from "@/app/contents/contents.module.css";

export interface ContentsFilterParams {
  q?: string;
  scope?: string;
  topic?: string;
}

export interface ContentsCompendiumProps {
  data: CONTENTS_PAGE_QUERY_RESULT | null;
  filterParams?: ContentsFilterParams;
}

export function ContentsCompendiumView({
  data,
  filterParams = {},
}: ContentsCompendiumProps) {
  const queryParam = stegaClean(filterParams.q?.trim() || "");
  const scopeParam = stegaClean(filterParams.scope?.trim() || "all");
  const topicParam = stegaClean(filterParams.topic?.trim() || "");

  const allChapters = data?.chapters ?? [];
  const standaloneArticles = data?.standaloneArticles ?? [];
  const allTopics = data?.topics ?? [];

  const isFiltered = Boolean(
    queryParam || (scopeParam && scopeParam !== "all") || topicParam
  );

  // Filter predicate for article entries
  const matchesFilter = (article: {
    contentType?: string | null;
    topics?: Array<{ slug?: { current?: string } | null } | null> | null;
    title?: string | null;
    summary?: string | null;
  }) => {
    // 1. Content type scope
    if (scopeParam && scopeParam !== "all") {
      const artType = stegaClean(article.contentType);
      if (artType !== scopeParam) return false;
    }

    // 2. Elemental topic taxonomy
    if (topicParam) {
      const hasTopic = article.topics?.some(
        (t) => stegaClean(t?.slug?.current) === topicParam
      );
      if (!hasTopic) return false;
    }

    // 3. Search query
    if (queryParam) {
      const q = queryParam.toLowerCase();
      const titleMatch = article.title?.toLowerCase().includes(q);
      const summaryMatch = article.summary?.toLowerCase().includes(q);
      if (!titleMatch && !summaryMatch) return false;
    }

    return true;
  };

  // Build filtered chapters view
  const filteredChapters = allChapters
    .map((chapter) => {
      const filteredArticles = (chapter.articles ?? []).filter(matchesFilter);
      return {
        ...chapter,
        articles: filteredArticles,
      };
    })
    .filter((ch) => !isFiltered || ch.articles.length > 0);

  const filteredStandalone = standaloneArticles.filter(matchesFilter);

  // Compute total matched entries count
  const totalMatches =
    filteredChapters.reduce((acc, ch) => acc + ch.articles.length, 0) +
    filteredStandalone.length;

  const activeTopicObj = topicParam
    ? allTopics.find((t) => stegaClean(t.slug?.current) === topicParam)
    : null;

  return (
    <article className={styles.contentsPage}>
      {/* ── Header Title Block ── */}
      <header className={styles.headerBlock}>
        <div className={styles.contentsEyebrow}>Systematic Compendium</div>
        <h1 className={styles.contentsTitle}>Master Table of Contents</h1>
        <p className={styles.contentsSubtitle}>
          An ordered compendium of experimental protocols, laboratory treatises, and scientific notes.
        </p>
      </header>

      <StarDivider symbol="diamond" variant={2} spacing="md" />

      {/* ── Active Filter Bar (when search, scope, or topic is active) ── */}
      {isFiltered && (
        <aside className={styles.filterStatusBar} aria-label="Filter status">
          <div className={styles.filterStatusText}>
            <span>Showing results for:</span>
            {activeTopicObj && (
              <span className={styles.filterBadge}>
                [{activeTopicObj.symbol}] {activeTopicObj.name}
              </span>
            )}
            {queryParam && (
              <span className={styles.filterBadge}>&ldquo;{queryParam}&rdquo;</span>
            )}
            {scopeParam && scopeParam !== "all" && (
              <span className={styles.filterBadge}>({formatCategory(scopeParam)})</span>
            )}
            <span>
              &mdash; {totalMatches} {totalMatches === 1 ? "entry" : "entries"} found
            </span>
          </div>

          <Link href="/contents" className={styles.clearFilterBtn}>
            Clear all filters ✕
          </Link>
        </aside>
      )}

      {/* ── Empty Filter State ── */}
      {isFiltered && totalMatches === 0 && (
        <section className={styles.emptyState}>
          <h2 className={styles.emptyStateTitle}>No Inscriptions Found</h2>
          <p className={styles.emptyStateText}>
            No articles match the current filter query. Try adjusting your search term or exploring all topics.
          </p>
          <Link href="/contents" className={styles.clearFilterBtn}>
            View Entire Compendium ✕
          </Link>
        </section>
      )}

      {/* ── Chapter List ── */}
      {filteredChapters.map((chapter) => {
        const chapterNum =
          chapter.number != null ? formatRomanNumeral(chapter.number) : null;
        const vignette = getChapterVignette(chapter);

        return (
          <section
            key={chapter._id}
            className={styles.chapterBlock}
            aria-labelledby={`ch-${chapter._id}`}
          >
            <header className={styles.chapterHeader}>
              <div className={styles.chapterMeta}>
                {chapterNum && (
                  <div className={styles.chapterNumeral}>Chapter {chapterNum}</div>
                )}
                <h2 id={`ch-${chapter._id}`} className={styles.chapterTitle}>
                  {chapter.title}
                </h2>
                {chapter.summary && (
                  <p className={styles.chapterSummary}>{chapter.summary}</p>
                )}
              </div>

              <div className={styles.chapterVignette}>
                <Image
                  src={vignette.src}
                  alt={vignette.alt}
                  width={90}
                  height={90}
                  unoptimized
                />
              </div>
            </header>

            {chapter.articles && chapter.articles.length > 0 ? (
              <ul className={styles.articlesList}>
                {chapter.articles.map((article, index) => (
                  <li key={article._id}>
                    <Link
                      href={`/${stegaClean(article.slug?.current)}`}
                      className={styles.articleRow}
                    >
                      <div className={styles.articleRowTop}>
                        <div style={{ display: "flex", alignItems: "baseline" }}>
                          {article.chapterOrder != null && (
                            <span className={styles.articleOrder}>
                              &sect; {article.chapterOrder}
                            </span>
                          )}
                          <span className={styles.articleTitle}>{article.title}</span>
                        </div>
                        <HandDrawnArrow
                          index={index}
                          size={15}
                          style={{ color: "var(--rust)" }}
                        />
                      </div>

                      <div className={styles.articleMeta}>
                        {article.contentType && (
                          <span className={styles.contentTypeBadge}>
                            [{formatCategory(stegaClean(article.contentType))}]
                          </span>
                        )}
                        {article.publishedAt && (
                          <span>{formatDate(stegaClean(article.publishedAt))}</span>
                        )}
                        {article.topics && article.topics.length > 0 && (
                          <div
                            style={{
                              display: "inline-flex",
                              gap: "0.3rem",
                              marginLeft: "0.25rem",
                            }}
                          >
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

                      {article.summary && (
                        <p className={styles.articleSummary}>{article.summary}</p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p
                style={{
                  fontStyle: "italic",
                  color: "var(--sepia-faint)",
                  fontSize: "var(--text-sm)",
                }}
              >
                No published entries in this chapter yet.
              </p>
            )}
          </section>
        );
      })}

      {/* ── Standalone / Appendix Entries ── */}
      {filteredStandalone.length > 0 && (
        <section
          className={styles.chapterBlock}
          aria-labelledby="appendix-heading"
        >
          <header className={styles.chapterHeader}>
            <div className={styles.chapterMeta}>
              <div className={styles.chapterNumeral}>Appendix &amp; Addenda</div>
              <h2 id="appendix-heading" className={styles.chapterTitle}>
                Independent Treatises
              </h2>
              <p className={styles.chapterSummary}>
                Protocols and research notes published independently or awaiting chapter binding.
              </p>
            </div>
          </header>

          <ul className={styles.articlesList}>
            {filteredStandalone.map((article, index) => (
              <li key={article._id}>
                <Link
                  href={`/${stegaClean(article.slug?.current)}`}
                  className={styles.articleRow}
                >
                  <div className={styles.articleRowTop}>
                    <span className={styles.articleTitle}>{article.title}</span>
                    <HandDrawnArrow
                      index={index}
                      size={15}
                      style={{ color: "var(--rust)" }}
                    />
                  </div>

                  <div className={styles.articleMeta}>
                    {article.contentType && (
                      <span className={styles.contentTypeBadge}>
                        [{formatCategory(stegaClean(article.contentType))}]
                      </span>
                    )}
                    {article.publishedAt && (
                      <span>{formatDate(stegaClean(article.publishedAt))}</span>
                    )}
                  </div>

                  {article.summary && (
                    <p className={styles.articleSummary}>{article.summary}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function ContentsCompendiumWithParams({
  data,
}: {
  data: CONTENTS_PAGE_QUERY_RESULT | null;
}) {
  const searchParams = useSearchParams();
  const filterParams: ContentsFilterParams = {
    q: searchParams?.get("q") || undefined,
    scope: searchParams?.get("scope") || undefined,
    topic: searchParams?.get("topic") || undefined,
  };
  return <ContentsCompendiumView data={data} filterParams={filterParams} />;
}

export function ContentsCompendium({
  data,
  initialParams,
}: {
  data: CONTENTS_PAGE_QUERY_RESULT | null;
  initialParams?: ContentsFilterParams;
}) {
  if (initialParams) {
    return <ContentsCompendiumView data={data} filterParams={initialParams} />;
  }

  return (
    <Suspense fallback={<ContentsCompendiumView data={data} filterParams={{}} />}>
      <ContentsCompendiumWithParams data={data} />
    </Suspense>
  );
}
