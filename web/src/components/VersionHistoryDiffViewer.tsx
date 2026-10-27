"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { formatDate } from "@/lib/format";
import {
  diffTreatiseEditions,
  type DiffToken,
  type TreatiseDiffResult,
  type EditionRecord,
} from "@/lib/diff";
import styles from "./VersionHistoryDiffViewer.module.css";

export type { EditionRecord };

export interface VersionHistoryDiffViewerProps {
  slug: string;
  author: string;
  editions: EditionRecord[];
}

export function VersionHistoryDiffViewer({
  slug,
  author,
  editions,
}: VersionHistoryDiffViewerProps) {
  // Sort editions descending by versionNumber
  const sortedEditions = useMemo(() => {
    return [...editions].sort((a, b) => b.versionNumber - a.versionNumber);
  }, [editions]);

  // Default to comparing the latest edition with the previous edition (if available)
  const defaultTarget = sortedEditions[0]?.versionNumber || 1;
  const defaultBase = sortedEditions[1]?.versionNumber || sortedEditions[0]?.versionNumber || 1;

  const [baseVersion, setBaseVersion] = useState<number>(defaultBase);
  const [targetVersion, setTargetVersion] = useState<number>(defaultTarget);
  const [viewMode, setViewMode] = useState<"inline" | "sideBySide">("inline");

  const editionA = useMemo(
    () => sortedEditions.find((e) => e.versionNumber === baseVersion) || sortedEditions[0],
    [sortedEditions, baseVersion]
  );

  const editionB = useMemo(
    () => sortedEditions.find((e) => e.versionNumber === targetVersion) || sortedEditions[0],
    [sortedEditions, targetVersion]
  );

  const diffResult: TreatiseDiffResult = useMemo(() => {
    if (!editionA || !editionB) {
      return {
        titleDiff: [],
        summaryDiff: [],
        sections: [],
        stats: { wordsAdded: 0, wordsRemoved: 0, wordsUnchanged: 0 },
        hasChanges: false,
      };
    }
    return diffTreatiseEditions(editionA, editionB);
  }, [editionA, editionB]);

  const handleSelectCompare = (baseV: number, targetV: number) => {
    setBaseVersion(baseV);
    setTargetVersion(targetV);
    const element = document.getElementById("diff-viewer");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSwap = () => {
    setBaseVersion(targetVersion);
    setTargetVersion(baseVersion);
  };

  return (
    <div className={styles.container}>
      {/* ── 1. Official Timeline of All Editions ── */}
      <section className={styles.timelineSection} aria-labelledby="timeline-heading">
        <h2 id="timeline-heading" className={styles.timelineHeading}>
          <Icon name="diamond" size={13} />
          Treatise Edition Timeline &amp; Changelogs
        </h2>
        <p className={styles.timelineIntro}>
          Substantive scientific revisions are permanently frozen as immutable editions to maintain
          reproducible citations in wet-lab research. Minor typographic adjustments remain active in-place.
        </p>

        <ol className={styles.timelineList}>
          {sortedEditions.map((ed, idx) => {
            const isLatest = ed.isCurrentActive || idx === 0;
            const previousEdition = sortedEditions[idx + 1];

            return (
              <li key={ed.versionNumber} className={styles.timelineItem}>
                <div
                  className={`${styles.timelineDot} ${
                    isLatest ? styles.timelineDotActive : ""
                  }`}
                />
                <div className={styles.editionCard}>
                  <div className={styles.editionCardHeader}>
                    <div className={styles.editionMetaTitle}>
                      <span className={styles.editionVersionBadge}>
                        Edition v{ed.versionNumber}
                      </span>
                      {isLatest && <span className={styles.activeTag}>Current Active</span>}
                      <span className={styles.editionDate}>
                        &bull; Recorded on{" "}
                        {ed.publishedAt
                          ? formatDate(ed.publishedAt, "long")
                          : "Archival record"}{" "}
                        by <strong>{author}</strong>
                      </span>
                    </div>

                    <div className={styles.editionActions}>
                      <Link
                        href={`/${slug}/v${ed.versionNumber}/`}
                        className={`${styles.editionButton} ${
                          isLatest ? styles.editionButtonPrimary : ""
                        }`}
                      >
                        <Icon name="arrow-right" size={11} />
                        View Edition v{ed.versionNumber}
                      </Link>

                      {previousEdition && (
                        <button
                          type="button"
                          className={styles.editionButton}
                          onClick={() =>
                            handleSelectCompare(
                              previousEdition.versionNumber,
                              ed.versionNumber
                            )
                          }
                          title={`Compare Edition v${previousEdition.versionNumber} with v${ed.versionNumber}`}
                        >
                          <Icon name="diamond" size={11} />
                          Diff with v{previousEdition.versionNumber}
                        </button>
                      )}
                    </div>
                  </div>

                  {ed.changeSummary && (
                    <p className={styles.changelogText}>
                      <strong>Edition Changelog: </strong>
                      {ed.changeSummary}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ── 2. Interactive Visual Diff Viewer ── */}
      <section
        id="diff-viewer"
        className={styles.diffViewerSection}
        aria-labelledby="diff-viewer-heading"
      >
        <div className={styles.diffHeader}>
          <h2 id="diff-viewer-heading" className={styles.diffTitle}>
            Visual Edition Diff (v{baseVersion} &rarr; v{targetVersion})
          </h2>

          <div className={styles.viewModeToggle} role="group" aria-label="View mode">
            <button
              type="button"
              className={`${styles.viewModeBtn} ${
                viewMode === "inline" ? styles.viewModeBtnActive : ""
              }`}
              onClick={() => setViewMode("inline")}
            >
              Inline Diff
            </button>
            <button
              type="button"
              className={`${styles.viewModeBtn} ${
                viewMode === "sideBySide" ? styles.viewModeBtnActive : ""
              }`}
              onClick={() => setViewMode("sideBySide")}
            >
              Side by Side
            </button>
          </div>
        </div>

        {/* Edition Selection Controls Bar */}
        <div className={styles.diffControlsBar}>
          <div className={styles.selectorGroup}>
            <label htmlFor="base-select" className={styles.selectorLabel}>
              Base Edition (Prior):
            </label>
            <select
              id="base-select"
              className={styles.selectInput}
              value={baseVersion}
              onChange={(e) => setBaseVersion(parseInt(e.target.value, 10))}
            >
              {sortedEditions.map((e) => (
                <option key={`base-${e.versionNumber}`} value={e.versionNumber}>
                  Edition v{e.versionNumber}{" "}
                  {e.publishedAt ? `(${formatDate(e.publishedAt, "short")})` : ""}
                </option>
              ))}
            </select>

            <button
              type="button"
              className={styles.swapButton}
              onClick={handleSwap}
              title="Swap comparison order"
              aria-label="Swap comparison order"
            >
              ⇄
            </button>

            <label htmlFor="target-select" className={styles.selectorLabel}>
              Target Edition (Subsequent):
            </label>
            <select
              id="target-select"
              className={styles.selectInput}
              value={targetVersion}
              onChange={(e) => setTargetVersion(parseInt(e.target.value, 10))}
            >
              {sortedEditions.map((e) => (
                <option key={`target-${e.versionNumber}`} value={e.versionNumber}>
                  Edition v{e.versionNumber}{" "}
                  {e.publishedAt ? `(${formatDate(e.publishedAt, "short")})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.editionActions}>
            <Link
              href={`/${slug}/v${targetVersion}/`}
              className={styles.editionButton}
            >
              Open v{targetVersion} Reader &rarr;
            </Link>
          </div>
        </div>

        {/* Diff Metrics Bar */}
        <div className={styles.metricsBar} role="status">
          <span className={styles.metricBadgeAdded}>
            +{diffResult.stats.wordsAdded} words added
          </span>
          <span>&bull;</span>
          <span className={styles.metricBadgeRemoved}>
            -{diffResult.stats.wordsRemoved} words removed
          </span>
          <span>&bull;</span>
          <span className={styles.metricBadgeNeutral}>
            {diffResult.stats.wordsUnchanged} words unchanged across{" "}
            {diffResult.sections.length} sections
          </span>
        </div>

        {/* Diff Content Canvas */}
        <div className={styles.diffCanvas}>
          {!diffResult.hasChanges ? (
            <p className={styles.noChangesNote}>
              No textual changes recorded between Edition v{baseVersion} and Edition v
              {targetVersion}.
            </p>
          ) : viewMode === "inline" ? (
            /* ── Inline Diff Mode ── */
            <div>
              {/* Title Diff */}
              {diffResult.titleDiff.length > 0 && (
                <div className={styles.diffSectionBlock}>
                  <h3 className={styles.diffSectionHeading}>Title</h3>
                  <div className={styles.diffContentParagraph}>
                    {diffResult.titleDiff.map((tok, i) => (
                      <DiffTokenSpan key={i} token={tok} />
                    ))}
                  </div>
                </div>
              )}

              {/* Summary Diff */}
              {diffResult.summaryDiff.length > 0 && (
                <div className={styles.diffSectionBlock}>
                  <h3 className={styles.diffSectionHeading}>Summary Lead</h3>
                  <div className={styles.diffContentParagraph}>
                    {diffResult.summaryDiff.map((tok, i) => (
                      <DiffTokenSpan key={i} token={tok} />
                    ))}
                  </div>
                </div>
              )}

              {/* Sections Diff */}
              {diffResult.sections.map((sec) => (
                <div key={sec.id} className={styles.diffSectionBlock}>
                  {sec.title?.trim() && (
                    <h3 className={styles.diffSectionHeading}>
                      {sec.titleDiff && sec.titleDiff.some((t) => t.type !== "unchanged")
                        ? sec.titleDiff.map((tok, i) => (
                            <DiffTokenSpan key={i} token={tok} />
                          ))
                        : sec.title}
                    </h3>
                  )}
                  <div className={styles.diffContentParagraph}>
                    {sec.tokens.map((tok, i) => (
                      <DiffTokenSpan key={i} token={tok} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── Side by Side Diff Mode ── */
            <div className={styles.sideBySideGrid}>
              {/* Base Column */}
              <div className={styles.sideColumn}>
                <div className={styles.sideColumnHeader}>
                  <span>Base: Edition v{baseVersion}</span>
                  {editionA?.publishedAt && (
                    <span>{formatDate(editionA.publishedAt, "short")}</span>
                  )}
                </div>

                <div className={styles.diffSectionBlock}>
                  <h3 className={styles.diffSectionHeading}>Title</h3>
                  <p className={styles.diffContentParagraph}>
                    {editionA?.title || "Untitled"}
                  </p>
                </div>

                {editionA?.summary && (
                  <div className={styles.diffSectionBlock}>
                    <h3 className={styles.diffSectionHeading}>Summary</h3>
                    <p className={styles.diffContentParagraph}>{editionA.summary}</p>
                  </div>
                )}

                {diffResult.sections.map((sec) => {
                  const baseTokens = sec.tokens.filter(
                    (t) => t.type === "unchanged" || t.type === "removed"
                  );
                  return (
                    <div key={`side-base-${sec.id}`} className={styles.diffSectionBlock}>
                      {sec.title?.trim() && (
                        <h3 className={styles.diffSectionHeading}>{sec.title}</h3>
                      )}
                      <div className={styles.diffContentParagraph}>
                        {baseTokens.map((tok, i) => (
                          <DiffTokenSpan key={i} token={tok} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Target Column */}
              <div className={styles.sideColumn}>
                <div className={styles.sideColumnHeader}>
                  <span>Target: Edition v{targetVersion}</span>
                  {editionB?.publishedAt && (
                    <span>{formatDate(editionB.publishedAt, "short")}</span>
                  )}
                </div>

                <div className={styles.diffSectionBlock}>
                  <h3 className={styles.diffSectionHeading}>Title</h3>
                  <p className={styles.diffContentParagraph}>
                    {editionB?.title || "Untitled"}
                  </p>
                </div>

                {editionB?.summary && (
                  <div className={styles.diffSectionBlock}>
                    <h3 className={styles.diffSectionHeading}>Summary</h3>
                    <p className={styles.diffContentParagraph}>{editionB.summary}</p>
                  </div>
                )}

                {diffResult.sections.map((sec) => {
                  const targetTokens = sec.tokens.filter(
                    (t) => t.type === "unchanged" || t.type === "added"
                  );
                  return (
                    <div key={`side-target-${sec.id}`} className={styles.diffSectionBlock}>
                      {sec.title?.trim() && (
                        <h3 className={styles.diffSectionHeading}>{sec.title}</h3>
                      )}
                      <div className={styles.diffContentParagraph}>
                        {targetTokens.map((tok, i) => (
                          <DiffTokenSpan key={i} token={tok} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function DiffTokenSpan({ token }: { token: DiffToken }) {
  if (token.type === "added") {
    return <ins className={styles.diffTokenAdded}>{token.value}</ins>;
  }
  if (token.type === "removed") {
    return <del className={styles.diffTokenRemoved}>{token.value}</del>;
  }
  return <span className={styles.diffTokenUnchanged}>{token.value}</span>;
}
