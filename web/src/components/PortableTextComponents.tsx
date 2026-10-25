import Link from "next/link";
import { stegaClean, type PortableTextComponents } from "next-sanity";
import { slugifyHeading } from "@/lib/toc";
import { buildSanityImageUrl } from "@/sanity/image";
import styles from "./PortableTextComponents.module.css";

function getNodeText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(getNodeText).join("");
  if (children && typeof children === "object" && "props" in children) {
    const props = (children as { props?: { children?: React.ReactNode } }).props;
    if (props?.children) return getNodeText(props.children);
  }
  return "";
}

export const scholarlyPortableTextComponents: PortableTextComponents = {
  block: {
    h2: ({ children }) => {
      const text = getNodeText(children);
      const clean = stegaClean(text);
      const id = slugifyHeading(clean) || "section";
      return (
        <h2 id={id} className={styles.heading2}>
          <a href={`#${id}`} className={styles.anchorLink} aria-label="Direct anchor link">
            §
          </a>
          {children}
        </h2>
      );
    },
    h3: ({ children }) => {
      const text = getNodeText(children);
      const clean = stegaClean(text);
      const id = slugifyHeading(clean) || "subsection";
      return (
        <h3 id={id} className={styles.heading3}>
          <a href={`#${id}`} className={styles.anchorLink} aria-label="Direct anchor link">
            §
          </a>
          {children}
        </h3>
      );
    },
    blockquote: ({ children }) => {
      return <blockquote className={styles.blockquote}>{children}</blockquote>;
    },
    normal: ({ children, index }) => {
      const isFirst = index === 0;
      return (
        <p
          className={`${styles.paragraph} ${
            isFirst ? `${styles.firstParagraph} first-paragraph` : ""
          }`}
        >
          {children}
        </p>
      );
    },
  },
  marks: {
    link: ({ children, value }) => {
      const href = value?.href ?? "#";
      const isExternal = /^https?:\/\//.test(href);
      return (
        <a
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className={styles.externalLink}
        >
          {children}
          {isExternal && " ↗"}
        </a>
      );
    },
    internalLink: ({ children, value }) => {
      if (value?.linkType === "resolved" && value?.doc) {
        const doc = value.doc;
        let href = `/${doc.slug}`;
        if (doc._type === "chapter") {
          href = `/contents?chapter=${doc.slug}`;
        } else if (doc._type === "topic") {
          href = `/contents?topic=${doc.slug}`;
        }

        return (
          <Link href={href} className={styles.internalLink}>
            {children}
          </Link>
        );
      }

      // Planned treatise ("Redlink")
      const title =
        value?.plannedNote ||
        (value?.plannedTitle
          ? `Treatise in preparation: ${value.plannedTitle}`
          : "Treatise in preparation by Oliver");

      return (
        <span className={styles.plannedLink} title={title}>
          {children}
          <sup className={styles.plannedGlyph}>✦</sup>
        </span>
      );
    },
    annotatedTerm: ({ children, value }) => {
      return (
        <abbr
          className={styles.annotatedTerm}
          title={value?.definition || ""}
          data-symbol={value?.symbol}
        >
          {children}
        </abbr>
      );
    },
  },
  types: {
    figureCallout: ({ value }) => {
      const imgUrl = buildSanityImageUrl(value?.image, {
        width: 800,
        quality: 85,
      });

      return (
        <figure className={styles.figureContainer}>
          <div className={styles.figureBox}>
            {imgUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgUrl}
                alt={value?.alt || value?.caption || "Scientific Figure"}
                className={styles.figureImage}
                loading="lazy"
              />
            ) : (
              <div style={{ padding: "2rem", fontStyle: "italic", color: "#8c7860" }}>
                [ Scientific Figure Plate ]
              </div>
            )}
            {(value?.figureNumber || value?.caption) && (
              <figcaption className={styles.figureCaption}>
                {value?.figureNumber && (
                  <span className={styles.figureLabel}>{value.figureNumber}:</span>
                )}
                {value?.caption}
                {value?.credit && (
                  <div className={styles.figureCredit}>Source: {value.credit}</div>
                )}
              </figcaption>
            )}
          </div>
        </figure>
      );
    },
    formulaReagents: ({ value }) => {
      const items = Array.isArray(value?.items) ? value.items : [];

      return (
        <div className={styles.reagentsContainer}>
          <div className={styles.reagentsHeader}>
            <h4 className={styles.reagentsTitle}>
              {value?.title || "Reagents & Apparatus"}
            </h4>
          </div>

          {value?.formulaNote && (
            <p className={styles.reagentsNote}>{value.formulaNote}</p>
          )}

          {items.length > 0 && (
            <ul className={styles.reagentsList}>
              {items.map((item: { name: string; quantity?: string; note?: string }, idx: number) => (
                <li key={idx} className={styles.reagentItem}>
                  <span className={styles.reagentName}>{item.name}</span>
                  {item.quantity && (
                    <span className={styles.reagentQuantity}>&bull; {item.quantity}</span>
                  )}
                  {item.note && (
                    <span className={styles.reagentItemNote}>{item.note}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    },
  },
};
