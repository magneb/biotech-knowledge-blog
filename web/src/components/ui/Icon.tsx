import type { SVGProps } from "react";

export type IconName =
  | "star-four"
  | "star-flourish"
  | "diamond"
  | "corner-flourish"
  | "corner-flourish-tl"
  | "corner-flourish-tr"
  | "corner-flourish-br"
  | "corner-flourish-bl"
  | "arrow-right"
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
