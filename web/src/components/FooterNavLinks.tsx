"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import styles from "./GlobalHeader.module.css";

interface FooterNavLinksProps {
  contactEmail?: string | null;
}

interface FooterNotice {
  title: string;
  message: string;
}

export function FooterNavLinks({ contactEmail }: FooterNavLinksProps) {
  const [notice, setNotice] = useState<FooterNotice | null>(null);

  return (
    <>
      <nav aria-label="Folio Navigation">
        <ul className="site-footer-links">
          <li>
            <button
              type="button"
              className="site-footer-btn"
              onClick={() =>
                setNotice({
                  title: "Scholarly Guild Registration",
                  message:
                    "Patreon supporter authentication and protocol download registration will be enabled in Work Package WP-12.",
                })
              }
            >
              Register
            </button>
          </li>
          <li>
            <Link href="/contents">Table of Contents</Link>
          </li>
          {contactEmail && (
            <li>
              <a href={`mailto:${contactEmail}`}>Contact</a>
            </li>
          )}
          <li>
            <button
              type="button"
              className="site-footer-btn"
              onClick={() =>
                setNotice({
                  title: "Inquiry & QnA Dispatches",
                  message:
                    "The community discussion and laboratory protocol Q&A forum is currently in development.",
                })
              }
            >
              QnA
            </button>
          </li>
          <li>
            <button
              type="button"
              className="site-footer-btn"
              onClick={() =>
                setNotice({
                  title: "About Oliver's Laboratory",
                  message:
                    "Oliver's Guide To Everything is an independent, open repository of wet-lab protocols, oncology research methodologies, and biotech treatises.",
                })
              }
            >
              About
            </button>
          </li>
        </ul>
      </nav>

      {notice && (
        <div className={styles.noticeModal} role="status">
          <button
            type="button"
            className={styles.noticeDismiss}
            onClick={() => setNotice(null)}
            aria-label="Dismiss message"
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
