"use client";

import { useRef, useState, type ReactNode } from "react";
import styles from "./HomeCarousel.module.css";

export interface HomeCarouselProps {
  ariaLabel: string;
  dotCount?: number;
  scrollStepPx?: number;
  children: ReactNode;
}

/**
 * Victorian horizontal carousel frame with engraved left/right stepper buttons
 * and pagination indicator dots matching the client frontispiece mockup.
 */
export function HomeCarousel({
  ariaLabel,
  dotCount = 4,
  scrollStepPx = 320,
  children,
}: HomeCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [activeDot, setActiveDot] = useState(0);

  const handleStep = (direction: -1 | 1) => {
    const nextDot = (activeDot + direction + dotCount) % dotCount;
    setActiveDot(nextDot);

    const el = viewportRef.current;
    if (el && typeof el.scrollBy === "function") {
      el.scrollBy({ left: direction * scrollStepPx, behavior: "smooth" });
    }
  };

  const handleDotSelect = (index: number) => {
    setActiveDot(index);
    const el = viewportRef.current;
    if (el && typeof el.scrollTo === "function") {
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      const target =
        dotCount > 1 ? (maxScroll * index) / (dotCount - 1) : 0;
      el.scrollTo({ left: target, behavior: "smooth" });
    }
  };

  return (
    <div className={styles.carouselWrapper} role="region" aria-label={ariaLabel}>
      <div className={styles.trackContainer}>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => handleStep(-1)}
          aria-label={`Previous ${ariaLabel}`}
        >
          &#x2039;
        </button>

        <div ref={viewportRef} className={styles.viewport}>
          {children}
        </div>

        <button
          type="button"
          className={styles.navButton}
          onClick={() => handleStep(1)}
          aria-label={`Next ${ariaLabel}`}
        >
          &#x203A;
        </button>
      </div>

      {dotCount > 1 && (
        <div className={styles.dotsRow} role="tablist" aria-label={`${ariaLabel} pages`}>
          {Array.from({ length: dotCount }).map((_, idx) => {
            const isActive = idx === activeDot;
            return (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`${ariaLabel} page ${idx + 1}`}
                className={`${styles.dot} ${isActive ? styles.dotActive : ""}`.trim()}
                onClick={() => handleDotSelect(idx)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
