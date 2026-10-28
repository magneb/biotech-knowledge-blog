"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { NoticeToast, type NoticeToastData } from "@/components/ui/NoticeToast";
import { BookmarksDrawer } from "@/components/BookmarksDrawer";
import { useBookmarks } from "@/lib/bookmarks";
import styles from "./GlobalHeader.module.css";

export function HeaderUtilities() {
  const [notice, setNotice] = useState<NoticeToastData | null>(null);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const { count } = useBookmarks();

  const showNotice = (title: string, message: string) => {
    setNotice({ title, message });
  };

  return (
    <>
      <div className={styles.utilitiesGroup} role="toolbar" aria-label="Utility shortcuts">
        <Link href="/" className={styles.utilityBtn} title="Home — Folio Frontispiece">
          <Icon name="home" size={17} />
        </Link>

        <button
          type="button"
          className={`${styles.utilityBtn} ${styles.utilityBtnBookmark}`}
          title={count > 0 ? `Saved Bookmarks (${count})` : "Saved Bookmarks (Reading Folio)"}
          aria-label={count > 0 ? `Saved Bookmarks (${count})` : "Saved Bookmarks"}
          onClick={() => setIsBookmarksOpen(true)}
        >
          <Icon
            name="bookmark-ribbon"
            size={16}
            style={count > 0 ? { color: "var(--rust)" } : undefined}
          />
          {count > 0 && (
            <span className={styles.badgeCount} aria-hidden="true">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </button>

        <button
          type="button"
          className={styles.utilityBtn}
          title="Scholarly Preferences"
          aria-label="Scholarly Preferences"
          onClick={() =>
            showNotice(
              "Reader Preferences",
              "Display typography, margin annotations, and citation formatting preferences will be customizable here."
            )
          }
        >
          <Icon name="gear" size={16} />
        </button>

        <span className={styles.authDivider} aria-hidden="true" />

        <button
          type="button"
          className={styles.loginLink}
          onClick={() =>
            showNotice(
              "Fellowship & Member Access",
              "Social and Patreon member authentication is scheduled for Work Package WP-12."
            )
          }
        >
          Log in
        </button>
      </div>

      <BookmarksDrawer
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
      />

      <NoticeToast notice={notice} onDismiss={() => setNotice(null)} />
    </>
  );
}
