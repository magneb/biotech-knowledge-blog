"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { TocHeading } from "@/lib/toc";
import styles from "./ArticleToc.module.css";

export interface ArticleTocProps {
  headings: TocHeading[];
  hasReferences?: boolean;
}

export function ArticleToc({ headings, hasReferences = false }: ArticleTocProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headings.length === 0) return;
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Find visible headings
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          setActiveId(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0,
      }
    );

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });

    if (hasReferences) {
      const refEl = document.getElementById("references");
      if (refEl) observer.observe(refEl);
    }

    return () => observer.disconnect();
  }, [headings, hasReferences]);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
      window.history.replaceState(null, "", `#${id}`);
    }
  };

  if (headings.length === 0 && !hasReferences) {
    return null;
  }

  return (
    <aside className={styles.wrapper} aria-label="Table of contents">
      <div className={styles.header}>
        <h3 className={styles.title}>
          <Icon name="bookmark-ribbon" size={13} />
          Contents
        </h3>
      </div>

      <nav className={styles.nav}>
        <ol className={styles.list}>
          {headings.map((heading) => {
            const isActive = activeId === heading.id;
            return (
              <li
                key={heading.id}
                className={`${styles.item} ${heading.level === 3 ? styles.itemH3 : ""}`}
              >
                <a
                  href={`#${heading.id}`}
                  className={`${styles.link} ${isActive ? styles.linkActive : ""}`}
                  onClick={(e) => handleScrollTo(e, heading.id)}
                >
                  <span className={styles.indicator}>{isActive ? "◆" : "◇"}</span>
                  <span>{heading.text}</span>
                </a>
              </li>
            );
          })}

          {hasReferences && (
            <li className={styles.item}>
              <a
                href="#references"
                className={`${styles.link} ${activeId === "references" ? styles.linkActive : ""}`}
                onClick={(e) => handleScrollTo(e, "references")}
              >
                <span className={styles.indicator}>{activeId === "references" ? "◆" : "◇"}</span>
                <span>References &amp; Citations</span>
              </a>
            </li>
          )}
        </ol>
      </nav>
    </aside>
  );
}
