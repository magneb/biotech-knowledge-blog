"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import styles from "./GlobalHeader.module.css";

interface NoticeState {
  title: string;
  message: string;
}

export function HeaderUtilities() {
  const [notice, setNotice] = useState<NoticeState | null>(null);

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
          className={styles.utilityBtn}
          title="Saved Bookmarks (Work Package WP-10)"
          aria-label="Saved Bookmarks"
          onClick={() =>
            showNotice(
              "Personal Bookmarks Tray",
              "Client-side protocol and guide saving is staged for implementation in Work Package WP-10."
            )
          }
        >
          <Icon name="bookmark-ribbon" size={16} />
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

      {notice && (
        <div className={styles.noticeModal} role="status">
          <button
            type="button"
            className={styles.noticeDismiss}
            onClick={() => setNotice(null)}
            aria-label="Dismiss notice"
          >
            ✕
          </button>
          <div className={styles.noticeTitle}>
            <Icon name="star-four" size={13} style={{ color: "var(--gold)" }} />
            <span>{notice.title}</span>
          </div>
          <p className={styles.noticeBody}>{notice.message}</p>
        </div>
      )}
    </>
  );
}
