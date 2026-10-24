import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  CSSProperties,
  MouseEvent,
  ReactNode,
} from "react";
import Link from "next/link";
import { HandDrawnArrow, type VariantNumber } from "./Icon";
import styles from "./CopperplateButton.module.css";

export type CopperplateButtonVariant = "primary" | "secondary" | "ghost";
export type CopperplateButtonSize = "sm" | "md" | "lg";
export type CopperplateButtonArrowPosition = "right" | "left" | "none";

interface CommonProps {
  variant?: CopperplateButtonVariant;
  size?: CopperplateButtonSize;
  arrowPosition?: CopperplateButtonArrowPosition;
  arrowVariant?: VariantNumber;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export type CopperplateButtonAsLinkProps = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

export type CopperplateButtonAsButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

export type CopperplateButtonProps =
  | CopperplateButtonAsLinkProps
  | CopperplateButtonAsButtonProps;

const VARIANT_CLASS_MAP: Record<CopperplateButtonVariant, string> = {
  primary: styles.variantPrimary,
  secondary: styles.variantSecondary,
  ghost: styles.variantGhost,
};

const SIZE_CLASS_MAP: Record<CopperplateButtonSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

/**
 * Ornate Victorian action button with engraved typography and hand-drawn direction arrows.
 */
export function CopperplateButton(props: CopperplateButtonProps) {
  const {
    variant = "primary",
    size = "md",
    arrowPosition = "right",
    arrowVariant = 1,
    children,
    className = "",
    style,
    ...rest
  } = props;

  const variantClass = VARIANT_CLASS_MAP[variant] || styles.variantPrimary;
  const sizeClass = SIZE_CLASS_MAP[size] || styles.sizeMd;
  const combinedClassName = `${styles.button} ${variantClass} ${sizeClass} ${className}`.trim();

  const arrowSize = size === "sm" ? 13 : size === "lg" ? 18 : 15;

  const arrowElement = arrowPosition !== "none" && (
    <span
      className={`${styles.arrow} ${
        arrowPosition === "left" ? styles.arrowLeft : styles.arrowRight
      }`}
    >
      <HandDrawnArrow
        variant={arrowVariant}
        size={arrowSize}
        style={arrowPosition === "left" ? { transform: "rotate(180deg)" } : undefined}
      />
    </span>
  );

  const content = (
    <>
      {arrowPosition === "left" && arrowElement}
      <span>{children}</span>
      {arrowPosition === "right" && arrowElement}
    </>
  );

  if ("href" in props && typeof props.href === "string") {
    const { href, target, rel, onClick } = props as CopperplateButtonAsLinkProps;
    return (
      <Link
        href={href}
        className={combinedClassName}
        style={style}
        target={target}
        rel={rel}
        onClick={onClick as (e: MouseEvent<HTMLAnchorElement>) => void}
      >
        {content}
      </Link>
    );
  }

  const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      type={buttonRest.type || "button"}
      className={combinedClassName}
      style={style}
      disabled={buttonRest.disabled}
      {...buttonRest}
    >
      {content}
    </button>
  );
}
