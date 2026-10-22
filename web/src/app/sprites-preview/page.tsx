import { Icon, type IconName } from "@/components/ui/Icon";
import Link from "next/link";

const ICONS: { name: IconName; label: string; description: string }[] = [
  {
    name: "star-four",
    label: "Four-Point Star (✦)",
    description: "Tapered engraved star for section dividers and rule centerpieces.",
  },
  {
    name: "star-flourish",
    label: "Compass Star / Radiant Flourish",
    description: "Ornate radiant star with inner ring and diagonal ray accents.",
  },
  {
    name: "diamond",
    label: "Engraved Diamond (◆)",
    description: "Faceted alchemical diamond indicator for lists and metadata badges.",
  },
  {
    name: "corner-flourish",
    label: "Corner Filigree (Generic)",
    description: "Single corner scrollwork for boxed cards and engraved borders.",
  },
  {
    name: "corner-flourish-tl",
    label: "Corner Filigree (Top-Left)",
    description: "Ornate Victorian top-left corner scroll.",
  },
  {
    name: "corner-flourish-tr",
    label: "Corner Filigree (Top-Right)",
    description: "Mirrored Victorian top-right corner scroll.",
  },
  {
    name: "corner-flourish-br",
    label: "Corner Filigree (Bottom-Right)",
    description: "Mirrored Victorian bottom-right corner scroll.",
  },
  {
    name: "corner-flourish-bl",
    label: "Corner Filigree (Bottom-Left)",
    description: "Mirrored Victorian bottom-left corner scroll.",
  },
  {
    name: "arrow-right",
    label: "Engraved Feathered Arrow (→)",
    description: "Antique drafting arrow with feather fletching and sharp barb.",
  },
  {
    name: "rule-leaf",
    label: "Botanical Acorn / Leaf",
    description: "Engraved botanical sprig for rule ends and section breaks.",
  },
  {
    name: "cartouche-oval",
    label: "Cartouche Oval Medallion",
    description: "Victorian engraved oval frame with laurel leaves and terminal nodes.",
  },
  {
    name: "eye-insignia",
    label: "Eye of Inquiry / Arcane Insignia",
    description: "Radiant engraved eye motif for master headers and brand vignettes.",
  },
  {
    name: "bookmark-ribbon",
    label: "Bookmark Ribbon",
    description: "Notched heraldic ribbon for saved protocols and quick-save buttons.",
  },
];

export default function SpritesPreviewPage() {
  return (
    <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "2rem 1rem" }}>
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <p className="paper-category">Asset Showcase</p>
        <h1 style={{ fontSize: "2.4rem", marginBottom: "0.5rem" }}>
          Victorian Vector Sprite Sheet
        </h1>
        <p style={{ color: "var(--sepia-mid)", fontStyle: "italic" }}>
          All symbols from <code>/sprites.svg</code> inheriting <code>currentColor</code> in the design system.
        </p>

        <div className="ornament" aria-hidden="true" style={{ marginTop: "1rem" }}>
          <Icon name="star-flourish" size={24} />
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {ICONS.map((item) => (
          <div
            key={item.name}
            className="variant-card"
            style={{
              border: "1px solid var(--parchment-shadow)",
              padding: "1.5rem",
              borderRadius: "2px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "1rem",
              background: "rgba(250, 246, 237, 0.6)",
            }}
          >
            {/* Display rendered icon at multiple scales */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "1.25rem",
                minHeight: "64px",
                padding: "0.5rem",
                color: "var(--ink)",
              }}
            >
              <Icon name={item.name} size={20} />
              <Icon name={item.name} size={32} />
              <Icon name={item.name} size={48} />
            </div>

            <div style={{ width: "100%", borderTop: "1px solid var(--parchment-shadow)", paddingTop: "0.75rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--ink)" }}>
                {item.label}
              </h2>
              <code
                style={{
                  display: "inline-block",
                  fontSize: "0.8rem",
                  color: "var(--rust)",
                  marginTop: "0.25rem",
                }}
              >
                #{item.name}
              </code>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--sepia-mid)",
                  marginTop: "0.5rem",
                  lineHeight: 1.4,
                }}
              >
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: "3rem" }}>
        <Link href="/" className="back-link">
          <Icon name="arrow-right" size={13} style={{ transform: "rotate(180deg)" }} />
          Back to Index
        </Link>
      </div>
    </div>
  );
}
