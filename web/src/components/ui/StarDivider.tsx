import type { CSSProperties } from "react";
import { Icon, type IconName } from "./Icon";
import styles from "./StarDivider.module.css";

export type StarDividerSymbol = "star" | "diamond" | "flourish" | "leaf";
export type StarDividerSpacing = "sm" | "md" | "lg";
export type StarVariantNumber = 1 | 2 | 3 | 4 | 5;

export interface StarDividerProps {
  symbol?: StarDividerSymbol;
  variant?: StarVariantNumber;
  spacing?: StarDividerSpacing;
  ornate?: boolean;
  size?: number | string;
  className?: string;
  style?: CSSProperties;
}

const SPACING_CLASS_MAP: Record<StarDividerSpacing, string> = {
  sm: styles.spacingSm,
  md: styles.spacingMd,
  lg: styles.spacingLg,
};

function resolveIconName(symbol: StarDividerSymbol, variant?: StarVariantNumber): IconName {
  switch (symbol) {
    case "diamond":
      return "diamond";
    case "flourish":
      return "star-flourish";
    case "leaf":
      return "rule-leaf";
    case "star":
    default:
      return variant ? (`star-four-${variant}` as IconName) : "star-four";
  }
}

/**
 * Horizontal engraved rule with a centered four-point star, diamond, or botanical flourish.
 */
export function StarDivider({
  symbol = "star",
  variant,
  spacing = "md",
  ornate = false,
  size = 18,
  className = "",
  style,
}: StarDividerProps) {
  const iconName = resolveIconName(symbol, variant);
  const spacingClass = SPACING_CLASS_MAP[spacing] || styles.spacingMd;

  return (
    <div
      className={`${styles.divider} ${spacingClass} ${ornate ? styles.ornate : ""} ${className}`.trim()}
      role="separator"
      aria-hidden="true"
      style={style}
    >
      <span className={styles.ruleLine} />
      <span className={styles.symbolSlot}>
        <Icon name={iconName} size={size} />
      </span>
      <span className={`${styles.ruleLine} ${styles.ruleLineRight}`} />
    </div>
  );
}
