import type { CSSProperties, MouseEvent, ReactNode } from "react";
import Link from "next/link";
import styles from "./ElementalPill.module.css";

export type ElementalPillSize = "sm" | "md" | "lg";

export interface ElementalPillProps {
  symbol: string;
  label?: ReactNode;
  href?: string;
  active?: boolean;
  size?: ElementalPillSize;
  onClick?: (event: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
}

const SIZE_CLASS_MAP: Record<ElementalPillSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

/**
 * Periodic-table inspired taxonomy badge with antique framing and hover/active states.
 */
export function ElementalPill({
  symbol,
  label,
  href,
  active = false,
  size = "md",
  onClick,
  className = "",
  style,
  "aria-label": ariaLabel,
}: ElementalPillProps) {
  const sizeClass = SIZE_CLASS_MAP[size] || styles.sizeMd;
  const isInteractive = Boolean(href || onClick);

  const classes = [
    styles.pill,
    sizeClass,
    active ? styles.active : "",
    !isInteractive ? styles.staticPill : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span className={styles.symbol}>
        [{symbol.toUpperCase().padStart(2, " ")}]
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        style={style}
        onClick={onClick}
        aria-label={ariaLabel || (typeof label === "string" ? `${symbol}: ${label}` : symbol)}
        aria-pressed={active ? true : undefined}
      >
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        className={classes}
        style={style}
        onClick={onClick}
        aria-label={ariaLabel || (typeof label === "string" ? `${symbol}: ${label}` : symbol)}
        aria-pressed={active}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      className={classes}
      style={style}
      aria-label={ariaLabel || (typeof label === "string" ? `${symbol}: ${label}` : symbol)}
    >
      {content}
    </span>
  );
}
