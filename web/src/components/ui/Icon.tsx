import type { CSSProperties, SVGProps } from "react";

export type IconName =
  | "star-four"
  | "star-four-1"
  | "star-four-2"
  | "star-four-3"
  | "star-four-4"
  | "star-four-5"
  | "star-flourish"
  | "diamond"
  | "corner-flourish"
  | "corner-flourish-tl"
  | "corner-flourish-tr"
  | "corner-flourish-br"
  | "corner-flourish-bl"
  | "arrow-right"
  | "arrow-right-1"
  | "arrow-right-2"
  | "arrow-right-3"
  | "arrow-right-4"
  | "arrow-right-5"
  | "rule-leaf"
  | "cartouche-oval"
  | "eye-insignia"
  | "bookmark-ribbon";

export interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number | string;
  className?: string;
}

/**
 * Renders an SVG icon from the master `/sprites.svg` sheet.
 * Inherits `currentColor` automatically for effortless Victorian styling.
 */
export function Icon({
  name,
  size = 20,
  className = "",
  style,
  ...props
}: IconProps) {
  return (
    <svg
      className={`icon icon-${name} ${className}`.trim()}
      width={size}
      height={size}
      aria-hidden="true"
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0,
        ...style,
      }}
      {...props}
    >
      <use href={`/sprites.svg#${name}`} />
    </svg>
  );
}

export type VariantNumber = 1 | 2 | 3 | 4 | 5;

export interface HandDrawnArrowProps {
  variant?: VariantNumber;
  size?: number | string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Renders a hand-drawn Victorian arrow.
 * If `variant` is specified (1-5), renders that specific hand-drawn cut.
 * If omitted, renders a multi-slot container where the CSS `:nth-child(5n + x)`
 * rule automatically displays a distinct hand-drawn arrow variant per row without JS.
 */
export function HandDrawnArrow({
  variant,
  size = 16,
  className = "",
  style,
}: HandDrawnArrowProps) {
  if (variant) {
    return (
      <Icon
        name={`arrow-right-${variant}` as IconName}
        size={size}
        className={className}
        style={style}
      />
    );
  }

  return (
    <span className={`variant-arrow-slot ${className}`.trim()} style={style}>
      <Icon name="arrow-right-1" size={size} className="arrow-v1" />
      <Icon name="arrow-right-2" size={size} className="arrow-v2" />
      <Icon name="arrow-right-3" size={size} className="arrow-v3" />
      <Icon name="arrow-right-4" size={size} className="arrow-v4" />
      <Icon name="arrow-right-5" size={size} className="arrow-v5" />
    </span>
  );
}
