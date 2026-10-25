"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  formatApa7Citation,
  formatBibtexCitation,
  getVersionPermalink,
} from "@/lib/citation";
import styles from "./CitationModal.module.css";

export interface CitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  author?: string;
  publishedAt?: string | null;
  versionNumber?: number | null;
  slug: string;
}

export function CitationModal({
  isOpen,
  onClose,
  title,
  author = "Oliver",
  publishedAt,
  versionNumber = 1,
  slug,
}: CitationModalProps) {
  const [activeTab, setActiveTab] = useState<"apa" | "bibtex" | "link">("apa");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const citationParams = {
    title,
    author,
    publishedAt,
    versionNumber,
    slug,
  };

  const apaCitation = formatApa7Citation(citationParams);
  const bibtexCitation = formatBibtexCitation(citationParams);
  const permalink = getVersionPermalink(slug, versionNumber || 1);

  const currentTextToCopy =
    activeTab === "apa"
      ? apaCitation
      : activeTab === "bibtex"
        ? bibtexCitation
        : permalink;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentTextToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="citation-title"
    >
      <div className={styles.modal}>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close citation modal"
        >
          <Icon name="close" size={16} />
        </button>

        <header className={styles.header}>
          <span className={styles.badge}>
            Scholarly Citation • Edition v{versionNumber || 1}
          </span>
          <h2 id="citation-title" className={styles.title}>
            Cite this Protocol
          </h2>
          <p className={styles.subtitle}>
            Archival reference metadata for academic papers, lab folios, and bibliographies.
          </p>
        </header>

        <div className={styles.tabList} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "apa"}
            className={`${styles.tabButton} ${activeTab === "apa" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("apa")}
          >
            APA 7th Edition
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "bibtex"}
            className={`${styles.tabButton} ${activeTab === "bibtex" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("bibtex")}
          >
            BibTeX
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "link"}
            className={`${styles.tabButton} ${activeTab === "link" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("link")}
          >
            Permanent URL
          </button>
        </div>

        {activeTab === "apa" && (
          <div className={styles.citationBox}>
            {apaCitation}
          </div>
        )}

        {activeTab === "bibtex" && (
          <pre className={`${styles.citationBox} ${styles.citationBoxMono}`}>
            <code>{bibtexCitation}</code>
          </pre>
        )}

        {activeTab === "link" && (
          <div className={styles.citationBox}>
            <a href={permalink} target="_blank" rel="noreferrer">
              {permalink}
            </a>
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.copyButton} ${copied ? styles.copyButtonCopied : ""}`}
            onClick={handleCopy}
          >
            <Icon name={copied ? "star-four" : "bookmark-ribbon"} size={14} />
            {copied ? "Copied to Clipboard!" : "Copy Reference"}
          </button>
        </div>

        <div className={styles.permalinkInfo}>
          <Icon name="diamond" size={10} />
          <span>
            Targeting permanent archival edition: <code>/v{versionNumber || 1}/</code>
          </span>
        </div>
      </div>
    </div>
  );
}
