"use client";

import { useSyncExternalStore, useState, useCallback } from "react";
import { Icon } from "@/components/ui/Icon";
import styles from "./WipBanner.module.css";

function hashText(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return `wip_dismissed_${Math.abs(hash)}`;
}

const emptySubscribe = () => () => {};

export function WipBannerClient({ text }: { text: string }) {
  const [manuallyDismissed, setManuallyDismissed] = useState(false);
  const storageKey = hashText(text);

  // Returns false during SSR & initial hydration, true once mounted on client
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Checks sessionStorage on client; defaults to true on server
  const isDismissed = useSyncExternalStore(
    emptySubscribe,
    useCallback(() => {
      try {
        return sessionStorage.getItem(storageKey) === "1";
      } catch {
        return false;
      }
    }, [storageKey]),
    () => true
  );

  // Step 3B: Render null on server and initial hydration, or when dismissed
  if (!isMounted || isDismissed || manuallyDismissed) {
    return null;
  }

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // Ignore sessionStorage write errors
    }
    setManuallyDismissed(true);
  };

  return (
    <aside
      className={styles.bannerContainer}
      role="region"
      aria-label="Work in Progress Notice"
    >
      <div className={styles.innerContent}>
        <span className={styles.finial} aria-hidden="true">
          <Icon name="star-four-1" size={12} />
        </span>
        <p className={styles.text}>{text}</p>
        <button
          type="button"
          onClick={handleDismiss}
          className={styles.dismissButton}
          aria-label="Dismiss notice for this session"
        >
          <Icon name="close" size={12} />
        </button>
      </div>
    </aside>
  );
}
