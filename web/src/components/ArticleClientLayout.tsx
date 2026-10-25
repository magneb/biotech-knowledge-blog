"use client";

import { useState } from "react";
import type { TocHeading } from "@/lib/toc";
import { ArticleToc } from "@/components/ArticleToc";
import styles from "@/app/[slug]/article.module.css";

export interface ArticleClientLayoutProps {
  headings: TocHeading[];
  hasReferences?: boolean;
  children: React.ReactNode;
}

export function ArticleClientLayout({
  headings,
  hasReferences = false,
  children,
}: ArticleClientLayoutProps) {
  const [isTocCollapsed, setIsTocCollapsed] = useState(false);
  const hasToc = headings.length > 0 || hasReferences;

  const layoutClassName = [
    styles.layout,
    !hasToc ? styles.layoutNoToc : "",
    isTocCollapsed ? styles.layoutTocCollapsed : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={layoutClassName}>
      {hasToc && (
        <ArticleToc
          headings={headings}
          hasReferences={hasReferences}
          isCollapsed={isTocCollapsed}
          onToggle={() => setIsTocCollapsed((prev) => !prev)}
        />
      )}
      {children}
    </div>
  );
}
