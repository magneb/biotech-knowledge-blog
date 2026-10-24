import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";
import { Icon } from "./Icon";
import styles from "./EtchedFrame.module.css";

export type EtchedFrameVariant = "card" | "hero" | "inset" | "panel";
export type EtchedFrameBadgeAlign = "left" | "center" | "right";

export interface EtchedFrameProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  variant?: EtchedFrameVariant;
  cornerFlourishes?: boolean;
  badge?: ReactNode;
  badgeAlign?: EtchedFrameBadgeAlign;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const VARIANT_CLASS_MAP: Record<EtchedFrameVariant, string> = {
  card: styles.variantCard,
  hero: styles.variantHero,
  inset: styles.variantInset,
  panel: styles.variantPanel,
};

const BADGE_ALIGN_CLASS_MAP: Record<EtchedFrameBadgeAlign, string> = {
  left: styles.badgeAlignLeft,
  center: styles.badgeAlignCenter,
  right: styles.badgeAlignRight,
};

/**
 * Ornate Victorian container with engraved borders, optional corner flourishes,
 * and header badge.
 */
export function EtchedFrame({
  as: Component = "div",
  variant = "card",
  cornerFlourishes = false,
  badge,
  badgeAlign = "left",
  children,
  className = "",
  style,
  ...rest
}: EtchedFrameProps) {
  const variantClass = VARIANT_CLASS_MAP[variant] || styles.variantCard;
  const badgeAlignClass = BADGE_ALIGN_CLASS_MAP[badgeAlign] || styles.badgeAlignLeft;

  return (
    <Component
      className={`${styles.frame} ${variantClass} ${className}`.trim()}
      style={style}
      {...rest}
    >
      {badge && (
        <div className={`${styles.badgeContainer} ${badgeAlignClass}`}>
          <div className={styles.badge}>
            {badge}
          </div>
        </div>
      )}

      {cornerFlourishes && (
        <>
          <Icon name="corner-flourish-tl" size={14} className={styles.cornerTL} aria-hidden="true" />
          <Icon name="corner-flourish-tr" size={14} className={styles.cornerTR} aria-hidden="true" />
          <Icon name="corner-flourish-bl" size={14} className={styles.cornerBL} aria-hidden="true" />
          <Icon name="corner-flourish-br" size={14} className={styles.cornerBR} aria-hidden="true" />
        </>
      )}

      {children}
    </Component>
  );
}
