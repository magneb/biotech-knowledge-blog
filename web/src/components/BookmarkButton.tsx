"use client";

import type { MouseEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { useBookmarks, type BookmarkTopic } from "@/lib/bookmarks";
import styles from "./BookmarkButton.module.css";

export interface BookmarkButtonArticle {
  slug: string;
  title: string;
  summary?: string | null;
  contentType?: string | null;
  publishedAt?: string | null;
  versionNumber?: number | null;
  topics?: BookmarkTopic[] | null;
}

export interface BookmarkButtonProps {
  article: BookmarkButtonArticle;
  variant?: "header" | "row" | "compact";
  showLabel?: boolean;
  className?: string;
  onToggleNotice?: (isSaved: boolean, title: string) => void;
}

export function BookmarkButton({
  article,
  variant = "row",
  showLabel,
  className = "",
  onToggleNotice,
}: BookmarkButtonProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const saved = isBookmarked(article.slug);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const result = toggleBookmark({
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      contentType: article.contentType,
      publishedAt: article.publishedAt,
      versionNumber: article.versionNumber,
      topics: article.topics,
    });

    if (onToggleNotice) {
      onToggleNotice(result.isSaved, article.title);
    }
  };

  const isHeader = variant === "header";
  const shouldShowLabel = showLabel ?? isHeader;

  const variantClass =
    variant === "header"
      ? styles.variantHeader
      : variant === "compact"
      ? styles.variantCompact
      : styles.variantRow;

  const tooltip = saved
    ? `Remove "${article.title}" from reading folio`
    : `Bookmark "${article.title}" in reading folio`;

  const ariaLabel = saved
    ? `Remove bookmark for ${article.title}`
    : `Bookmark ${article.title}`;

  return (
    <button
      type="button"
      className={`${styles.btn} ${variantClass} ${saved ? styles.btnActive : ""} ${className}`.trim()}
      onClick={handleClick}
      title={tooltip}
      aria-label={ariaLabel}
      aria-pressed={saved}
    >
      <Icon
        name="bookmark-ribbon"
        size={variant === "compact" ? 13 : variant === "header" ? 15 : 14}
        style={saved ? { color: "var(--rust)" } : undefined}
      />
      {shouldShowLabel && (
        <span>{saved ? "Bookmarked in Folio" : "Bookmark this Guide"}</span>
      )}
    </button>
  );
}
