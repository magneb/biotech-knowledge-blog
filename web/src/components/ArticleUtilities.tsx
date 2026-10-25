"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { ElementalPill } from "@/components/ui/ElementalPill";
import { NoticeToast, type NoticeToastData } from "@/components/ui/NoticeToast";
import { CitationModal } from "@/components/CitationModal";
import { formatDate } from "@/lib/format";
import styles from "./ArticleUtilities.module.css";

export interface PdfAttachment {
  title?: string | null;
  description?: string | null;
  file?: {
    asset?: {
      url?: string | null;
      size?: number | null;
    } | null;
  } | null;
}

export interface TopicInfo {
  name?: string | null;
  symbol?: string | null;
  slug?: string | null;
}

export interface ChapterInfo {
  title?: string | null;
  slug?: string | null;
  number?: number | null;
}

export interface ArticleUtilitiesProps {
  title: string;
  author?: string;
  publishedAt?: string | null;
  versionNumber?: number | null;
  slug: string;
  chapter?: ChapterInfo | null;
  topics?: TopicInfo[] | null;
  downloadablePdfs?: PdfAttachment[] | null;
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ArticleUtilities({
  title,
  author = "Oliver",
  publishedAt,
  versionNumber = 1,
  slug,
  chapter,
  topics,
  downloadablePdfs,
}: ArticleUtilitiesProps) {
  const [isCitationOpen, setIsCitationOpen] = useState(false);
  const [notice, setNotice] = useState<NoticeToastData | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleBookmark = () => {
    setNotice({
      title: "Protocol Bookmarked",
      message: `"${title}" has been saved to your browser reading folio.`,
    });
  };

  const hasPdfs = Array.isArray(downloadablePdfs) && downloadablePdfs.length > 0;
  const hasTopics = Array.isArray(topics) && topics.length > 0;

  return (
    <>
      {/* ── Single Unified Third-Column Victorian Card ── */}
      <aside className={styles.card} aria-label="Scholarly actions and compendium entry">
        {/* ── Optional Downloadable PDFs Section ── */}
        {hasPdfs && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Icon name="bookmark-ribbon" size={13} />
              PDFs
            </h3>

            <ul className={styles.pdfList}>
              {downloadablePdfs.map((pdf, idx) => {
                const url = pdf?.file?.asset?.url;
                if (!url) return null;
                const sizeStr = formatFileSize(pdf?.file?.asset?.size);

                return (
                  <li key={idx} className={styles.pdfItem}>
                    <div className={styles.pdfMeta}>
                      <span className={styles.pdfTitle}>{pdf.title || "Protocol PDF"}</span>
                      {sizeStr && <span className={styles.pdfSubtitle}>PDF • {sizeStr}</span>}
                      {pdf.description && (
                        <p className={styles.pdfDescription}>{pdf.description}</p>
                      )}
                    </div>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.pdfDownloadBtn}
                      title={`Download ${pdf.title || "PDF"}`}
                      download
                    >
                      <Icon name="arrow-right" size={12} style={{ transform: "rotate(90deg)" }} />
                    </a>
                  </li>
                );
              })}
            </ul>

            <div className={styles.cardDivider} />
          </div>
        )}

        {/* ── Folio Actions Section ── */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Icon name="gear" size={13} />
            Folio Actions
          </h3>

          <div className={styles.actionButtons}>
            <button
              type="button"
              className={styles.actionButton}
              onClick={() => setIsCitationOpen(true)}
            >
              <Icon name="bookmark-ribbon" size={14} />
              Cite Protocol (APA7)
            </button>

            <button
              type="button"
              className={styles.actionButton}
              onClick={handlePrint}
            >
              <Icon name="star-four" size={13} />
              Save as PDF Folio
            </button>

            <button
              type="button"
              className={styles.actionButton}
              onClick={handleBookmark}
            >
              <Icon name="cartouche-oval" size={14} />
              Bookmark Protocol
            </button>
          </div>
        </div>

        <div className={styles.cardDivider} />

        {/* ── Compendium Entry & Taxonomy Section ── */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Icon name="diamond" size={11} />
            Compendium Entry
          </h3>

          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Edition:</span>
            <span className={styles.metaValue}>v{versionNumber || 1} (Official)</span>
          </div>

          {publishedAt && (
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Recorded:</span>
              <span className={styles.metaValue}>{formatDate(publishedAt, "short")}</span>
            </div>
          )}

          {chapter && (
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Chapter:</span>
              <span className={styles.metaValue}>
                <Link
                  href={`/contents?chapter=${chapter.slug}`}
                  style={{ color: "inherit", textDecoration: "underline" }}
                >
                  {chapter.title}
                </Link>
              </span>
            </div>
          )}

          {hasTopics && (
            <div className={styles.topicsBlock}>
              <span className={styles.metaLabel}>Topics:</span>
              <div className={styles.pillsRow}>
                {topics.map((t, idx) => (
                  <ElementalPill
                    key={idx}
                    symbol={t.symbol || "Tx"}
                    label={t.name || undefined}
                    href={t.slug ? `/contents?topic=${t.slug}` : undefined}
                    size="sm"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── APA7 / BibTeX Citation Modal ── */}
      <CitationModal
        isOpen={isCitationOpen}
        onClose={() => setIsCitationOpen(false)}
        title={title}
        author={author}
        publishedAt={publishedAt}
        versionNumber={versionNumber}
        slug={slug}
      />

      {/* ── Toast Feedback Notification ── */}
      <NoticeToast
        notice={notice}
        onDismiss={() => setNotice(null)}
      />
    </>
  );
}
