import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import styles from "./EtchedFigure.module.css";

export type EtchedFigureAspectRatio = "1/1" | "4/3" | "16/9" | "auto";
export type EtchedFigureCaptionPosition =
  | "bottom-plate"
  | "callout-bottom"
  | "callout-right";

export interface EtchedFigureProps {
  src: string;
  alt: string;
  caption?: ReactNode;
  captionPosition?: EtchedFigureCaptionPosition;
  leaderLine?: boolean;
  aspectRatio?: EtchedFigureAspectRatio;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
}

const RATIO_CLASS_MAP: Record<EtchedFigureAspectRatio, string> = {
  "1/1": styles.ratio11,
  "4/3": styles.ratio43,
  "16/9": styles.ratio169,
  auto: styles.ratioAuto,
};

/**
 * Scientific etching illustration figure with engraved double-rule frame,
 * optional antique caption cartouche, and leader-line pointer.
 */
export function EtchedFigure({
  src,
  alt,
  caption,
  captionPosition = "bottom-plate",
  leaderLine = false,
  aspectRatio = "auto",
  width = 600,
  height = 400,
  priority = false,
  className = "",
  style,
}: EtchedFigureProps) {
  const ratioClass = RATIO_CLASS_MAP[aspectRatio] || styles.ratioAuto;
  const isSvg = src.endsWith(".svg");

  return (
    <figure className={`${styles.figure} ${className}`.trim()} style={style}>
      <div className={`${styles.imageContainer} ${ratioClass}`}>
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          unoptimized={isSvg}
          className={styles.image}
        />
      </div>

      {caption && (
        <div className={styles.caption}>
          {leaderLine && captionPosition === "callout-bottom" && (
            <div className={styles.leaderContainer} aria-hidden="true">
              <svg className={styles.leaderSvg} viewBox="0 0 200 32" preserveAspectRatio="none">
                {/* Pointer dot at bottom center of the image */}
                <circle cx="100" cy="4" r="3" />
                {/* Diagonal-to-vertical leader line */}
                <line x1="100" y1="7" x2="100" y2="32" />
              </svg>
            </div>
          )}

          {captionPosition === "bottom-plate" ? (
            <figcaption className={styles.captionBottomPlate}>{caption}</figcaption>
          ) : (
            <figcaption className={styles.captionCallout}>{caption}</figcaption>
          )}
        </div>
      )}
    </figure>
  );
}
