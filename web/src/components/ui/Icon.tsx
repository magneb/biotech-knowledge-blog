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
  | "bookmark-ribbon"
  | "search"
  | "home"
  | "gear"
  | "menu"
  | "close";

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
  index?: number;
  size?: number | string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Renders a hand-drawn Victorian arrow.
 * If `variant` (1-5) or `index` is passed, renders exactly that single SVG.
 * If omitted, renders a slot where CSS switches between cuts.
 */
export function HandDrawnArrow({
  variant,
  index,
  size = 16,
  className = "",
  style,
}: HandDrawnArrowProps) {
  const resolvedVariant: VariantNumber =
    variant ??
    (index !== undefined
      ? (((Math.abs(index) % 5) + 1) as VariantNumber)
      : 1);

  return (
    <Icon
      name={`arrow-right-${resolvedVariant}` as IconName}
      size={size}
      className={`hand-drawn-arrow ${className}`.trim()}
      style={style}
    />
  );
}
