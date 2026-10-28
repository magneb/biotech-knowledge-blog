"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { ElementalPill } from "@/components/ui/ElementalPill";
import { formatDate } from "@/lib/format";
import { useBookmarks } from "@/lib/bookmarks";
import styles from "./BookmarksDrawer.module.css";

export interface BookmarksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BookmarksDrawer({ isOpen, onClose }: BookmarksDrawerProps) {
  const {
    bookmarks,
    count,
    removeBookmark,
    clearAllBookmarks,
    exportAsMarkdown,
    exportAsJson,
  } = useBookmarks();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleClear = () => {
    if (window.confirm("Are you sure you wish to clear all saved protocols from your reading folio?")) {
      clearAllBookmarks();
    }
  };

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Personal Reading Folio"
    >
      <div className={styles.panel}>
        {/* ── Header ── */}
        <header className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <Icon name="bookmark-ribbon" size={17} style={{ color: "var(--rust)" }} />
            <h2 className={styles.title}>Reading Folio</h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close reading folio"
          >
            <Icon name="close" size={14} />
          </button>
        </header>

        {/* ── Subtitle Ribbon ── */}
        <div className={styles.subtitle}>
          <span>Field Protocols &amp; Offline Treatises</span>
          <span>
            {count} {count === 1 ? "Protocol" : "Protocols"}
          </span>
        </div>

        {/* ── Action Bar ── */}
        {count > 0 && (
          <div className={styles.actionBar}>
            <div className={styles.exportButtons}>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={exportAsMarkdown}
                title="Download personal folio as a Markdown file"
              >
                <Icon name="diamond" size={10} style={{ color: "var(--rust)" }} />
                Export MD
              </button>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={exportAsJson}
                title="Download personal folio as JSON data"
              >
                <Icon name="star-four" size={10} style={{ color: "var(--gold)" }} />
                Export JSON
              </button>
            </div>

            <button
              type="button"
              className={styles.clearBtn}
              onClick={handleClear}
              title="Clear all saved protocols"
            >
              Clear Folio
            </button>
          </div>
        )}

        {/* ── Scrollable Body ── */}
        <div className={styles.body}>
          {count === 0 ? (
            <div className={styles.emptyState}>
              <Icon name="bookmark-ribbon" size={38} className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>Your Folio is Empty</h3>
              <p className={styles.emptyText}>
                Select &ldquo;Bookmark Protocol&rdquo; or the ribbon icon on any treatise to
                preserve essential protocols for offline and bench consultation.
              </p>
            </div>
          ) : (
            <ul className={styles.list}>
              {bookmarks.map((item) => (
                <li key={item.slug} className={styles.card}>
                  <div className={styles.cardTop}>
                    <Link
                      href={`/${item.slug}`}
                      className={styles.cardTitle}
                      onClick={onClose}
                    >
                      {item.title}
                    </Link>
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeBookmark(item.slug)}
                      aria-label={`Remove ${item.title} from folio`}
                      title="Remove from folio"
                    >
                      <Icon name="close" size={12} />
                    </button>
                  </div>

                  <div className={styles.cardMeta}>
                    {item.contentType && (
                      <span className={styles.categoryBadge}>
                        [{item.contentType}]
                      </span>
                    )}
                    {item.versionNumber && (
                      <span className={styles.versionBadge}>
                        v{item.versionNumber}
                      </span>
                    )}
                    {item.publishedAt && (
                      <span>{formatDate(item.publishedAt, "short")}</span>
                    )}
                  </div>

                  {item.summary && (
                    <p className={styles.cardSummary}>{item.summary}</p>
                  )}

                  <div className={styles.cardFooter}>
                    <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                      {item.topics?.map((topic, idx) =>
                        topic.symbol ? (
                          <ElementalPill
                            key={idx}
                            symbol={topic.symbol}
                            size="sm"
                          />
                        ) : null
                      )}
                    </div>
                    <span>Saved {formatDate(item.savedAt, "short")}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
