"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { CopperplateButton } from "@/components/ui/CopperplateButton";
import { ElementalPill } from "@/components/ui/ElementalPill";
import { formatRomanNumeral } from "@/lib/format";
import styles from "./GlobalHeader.module.css";
import type { TopicItem } from "./HeaderTopicPills";

export interface DrawerArticle {
  _id: string;
  title?: string | null;
  slug?: { current?: string; source?: string } | null;
  contentType?: string | null;
}

export interface DrawerChapter {
  _id: string;
  title?: string | null;
  number?: number | null;
  slug?: { current?: string; source?: string } | null;
  articles?: DrawerArticle[] | null;
}

interface HeaderDrawerProps {
  chapters?: DrawerChapter[];
  topics?: TopicItem[];
}

export function HeaderDrawer({ chapters = [], topics = [] }: HeaderDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openDrawer = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Keyboard navigation: Escape key closes the drawer
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeDrawer]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className={styles.drawerTrigger}
        onClick={openDrawer}
        aria-label="Open Table of Contents navigation drawer"
        aria-expanded={isOpen}
        aria-controls="book-navigation-drawer"
      >
        <Icon name="menu" size={18} />
      </button>

      {isOpen && (
        <div
          id="book-navigation-drawer"
          className={styles.drawerBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeDrawer();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Book Table of Contents"
        >
          <div className={styles.drawerPanel}>
            <header className={styles.drawerHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Icon name="star-four" size={14} style={{ color: "var(--gold)" }} />
                <h2 className={styles.drawerTitle}>Compendium Index</h2>
              </div>
              <button
                type="button"
                className={styles.drawerCloseBtn}
                onClick={closeDrawer}
                aria-label="Close Table of Contents drawer"
              >
                <Icon name="close" size={16} />
              </button>
            </header>

            <div className={styles.drawerContent}>
              {/* Full Table of Contents CTA */}
              <div style={{ marginBottom: "1.75rem" }}>
                <CopperplateButton
                  href="/contents"
                  size="sm"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={closeDrawer}
                >
                  Open Full Book Table of Contents
                </CopperplateButton>
              </div>

              {/* Numbered Chapters with nested articles */}
              {chapters.length > 0 && (
                <section className={styles.drawerSection} aria-label="Book Chapters">
                  <h3 className={styles.drawerSectionTitle}>Chapters</h3>
                  <ul className={styles.drawerChapterList}>
                    {chapters.map((chapter) => (
                      <li key={chapter._id} className={styles.drawerChapterItem}>
                        <div className={styles.drawerChapterTitle}>
                          {chapter.number != null && (
                            <span className={styles.drawerChapterNumeral}>
                              Cap. {formatRomanNumeral(chapter.number)}:
                            </span>
                          )}
                          <span>{chapter.title}</span>
                        </div>

                        {chapter.articles && chapter.articles.length > 0 && (
                          <ul className={styles.drawerArticleList}>
                            {chapter.articles.map((art) => (
                              <li key={art._id}>
                                <Link
                                  href={`/${art.slug?.current || ""}`}
                                  className={styles.drawerArticleLink}
                                  onClick={closeDrawer}
                                >
                                  {art.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Elemental Topic Quick Filter Pills */}
              {topics.length > 0 && (
                <section className={styles.drawerSection} aria-label="Topic Index">
                  <h3 className={styles.drawerSectionTitle}>Elemental Taxonomies</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {topics.map((topic) => (
                      <ElementalPill
                        key={topic._id}
                        symbol={topic.symbol || "??"}
                        label={topic.name || undefined}
                        size="sm"
                        href={`/contents?topic=${encodeURIComponent(topic.slug?.current || "")}`}
                        onClick={closeDrawer}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>

            <footer className={styles.drawerFooter}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "1rem" }}>
                <Link
                  href="/"
                  className={styles.drawerArticleLink}
                  style={{ fontSize: "var(--text-xs)", color: "var(--sepia-faint)" }}
                  onClick={closeDrawer}
                >
                  Oliver&rsquo;s Guide &middot; Frontispiece
                </Link>
                <Link
                  href="/sprites-preview"
                  className={styles.drawerArticleLink}
                  style={{ fontSize: "var(--text-xs)", color: "var(--gold)" }}
                  onClick={closeDrawer}
                >
                  Design Folio ✦
                </Link>
              </div>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
