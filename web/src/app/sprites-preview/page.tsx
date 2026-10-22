import { Icon, HandDrawnArrow, type IconName } from "@/components/ui/Icon";
import Link from "next/link";

const ARROW_VARIANTS = [
  {
    variant: 1 as const,
    name: "Dip-Pen Feather",
    id: "#arrow-right-1",
    desc: "Slender quill shaft with angled feather fletchings and sharp barb.",
  },
  {
    variant: 2 as const,
    name: "Arched Dart",
    id: "#arrow-right-2",
    desc: "Arched flight trajectory with solid triangular spearhead and tail node.",
  },
  {
    variant: 3 as const,
    name: "Surveyor's Antique",
    id: "#arrow-right-3",
    desc: "Double-feathered surveyor arrow with open barbed head.",
  },
  {
    variant: 4 as const,
    name: "Organic Flick",
    id: "#arrow-right-4",
    desc: "Hand-wobbled shaft with asymmetric barbs and quill ink deposit.",
  },
  {
    variant: 5 as const,
    name: "Engraved Harpoon",
    id: "#arrow-right-5",
    desc: "Heavy broadhead with swallowtail notched fletching.",
  },
];

const STAR_VARIANTS = [
  { name: "star-four-1" as IconName, label: "Star 1: Classic Concave (✦)" },
  { name: "star-four-2" as IconName, label: "Star 2: Inked Organic Pinprick" },
  { name: "star-four-3" as IconName, label: "Star 3: Compass Radiant Cross" },
  { name: "star-four-4" as IconName, label: "Star 4: Botanical Floral Lobe" },
  { name: "star-four-5" as IconName, label: "Star 5: Diamond Cross Facet" },
];

export default function SpritesPreviewPage() {
  return (
    <div style={{ maxWidth: "60rem", margin: "0 auto", padding: "1rem" }}>
      <header style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <p className="paper-category">Asset Showcase</p>
        <h1 style={{ fontSize: "2.4rem", marginBottom: "0.5rem" }}>
          Victorian Vector Sprite Sheet &amp; Hand-Drawn Variants
        </h1>
        <p style={{ color: "var(--sepia-mid)", fontStyle: "italic", maxWidth: "38rem", margin: "0 auto" }}>
          Distinct vector cuts providing natural, pseudorandom human variance across rows and cards without layout shift.
        </p>

        <div className="ornament" aria-hidden="true" style={{ marginTop: "1rem" }}>
          <Icon name="star-four-3" size={24} />
        </div>
      </header>

      {/* ─── 1. Arrow Variants ─── */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.3rem", letterSpacing: "0.15em", textTransform: "uppercase", borderBottom: "2px solid var(--parchment-border)", paddingBottom: "0.5rem", marginBottom: "1.25rem", color: "var(--ink)" }}>
          1. Hand-Drawn Arrow Variants (Cuts 1 &ndash; 5)
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {ARROW_VARIANTS.map((item) => (
            <div
              key={item.variant}
              className="variant-card"
              style={{
                border: "1px solid var(--parchment-shadow)",
                padding: "1.25rem 1rem",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.75rem",
                background: "rgba(250, 246, 237, 0.6)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", minHeight: "48px", color: "var(--rust)" }}>
                <HandDrawnArrow variant={item.variant} size={18} />
                <HandDrawnArrow variant={item.variant} size={28} />
                <HandDrawnArrow variant={item.variant} size={40} />
              </div>
              <div style={{ borderTop: "1px solid var(--parchment-shadow)", paddingTop: "0.5rem", width: "100%" }}>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)" }}>{item.name}</div>
                <code style={{ fontSize: "0.75rem", color: "var(--sepia-mid)" }}>{item.id}</code>
                <p style={{ fontSize: "0.8rem", color: "var(--sepia-faint)", marginTop: "0.4rem", lineHeight: 1.35 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 2. Star & Flourish Variants ─── */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.3rem", letterSpacing: "0.15em", textTransform: "uppercase", borderBottom: "2px solid var(--parchment-border)", paddingBottom: "0.5rem", marginBottom: "1.25rem", color: "var(--ink)" }}>
          2. Star &amp; Flourish Variants (1 &ndash; 5)
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {STAR_VARIANTS.map((star) => (
            <div
              key={star.name}
              className="variant-card"
              style={{
                border: "1px solid var(--parchment-shadow)",
                padding: "1.25rem 1rem",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.75rem",
                background: "rgba(250, 246, 237, 0.6)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", minHeight: "48px", color: "var(--ink)" }}>
                <Icon name={star.name} size={18} />
                <Icon name={star.name} size={28} />
                <Icon name={star.name} size={40} />
              </div>
              <div style={{ borderTop: "1px solid var(--parchment-shadow)", paddingTop: "0.5rem", width: "100%" }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--ink)" }}>{star.label}</div>
                <code style={{ fontSize: "0.75rem", color: "var(--sepia-mid)" }}>#{star.name}</code>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <Link href="/" className="back-link">
          <HandDrawnArrow variant={1} size={14} style={{ transform: "rotate(180deg)" }} />
          Back to Index
        </Link>
      </div>
    </div>
  );
}
