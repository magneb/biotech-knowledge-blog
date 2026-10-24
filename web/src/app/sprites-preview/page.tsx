import {
  Icon,
  HandDrawnArrow,
  EtchedFrame,
  StarDivider,
  ElementalPill,
  CopperplateButton,
  EtchedFigure,
  type IconName,
} from "@/components/ui";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Victorian Design Folio & Asset Specimen | Oliver's Guide To Everything",
  description:
    "Comprehensive living design specimen showcasing copperplate etching illustrations, typography tokens, vector sprite sheet glyphs, and Victorian UI components.",
};

const ARROW_CUTS = [
  { variant: 1 as const, name: "Dip-Pen Feather", id: "arrow-right-1", desc: "Quill shaft with angled fletching and sharp barb." },
  { variant: 2 as const, name: "Arched Dart", id: "arrow-right-2", desc: "Arched trajectory with solid triangular head." },
  { variant: 3 as const, name: "Surveyor's Antique", id: "arrow-right-3", desc: "Double-feathered shaft with open barbed head." },
  { variant: 4 as const, name: "Organic Flick", id: "arrow-right-4", desc: "Hand-wobbled shaft with asymmetric barbs." },
  { variant: 5 as const, name: "Engraved Harpoon", id: "arrow-right-5", desc: "Heavy broadhead with notched fletching." },
];

const ALL_SPRITE_ICONS: Array<{ category: string; icons: IconName[] }> = [
  {
    category: "Stars & Dividers",
    icons: ["star-four", "star-four-1", "star-four-2", "star-four-3", "star-four-4", "star-four-5", "star-flourish", "diamond", "rule-leaf"],
  },
  {
    category: "Corner Flourishes",
    icons: ["corner-flourish", "corner-flourish-tl", "corner-flourish-tr", "corner-flourish-br", "corner-flourish-bl"],
  },
  {
    category: "Hand-Drawn Arrows",
    icons: ["arrow-right", "arrow-right-1", "arrow-right-2", "arrow-right-3", "arrow-right-4", "arrow-right-5"],
  },
  {
    category: "Insignias & Navigation",
    icons: ["cartouche-oval", "eye-insignia", "bookmark-ribbon", "search", "home", "gear", "menu", "close"],
  },
];

const CHAPTER_VIGNETTES = [
  {
    title: "Microscopy & Lenses",
    file: "/art/chapters/microscopy.svg",
    subtitle: "Achromatic optics, condenser iris & cellular mounts",
  },
  {
    title: "Chemical Reagents & Distillation",
    file: "/art/chapters/reagents.svg",
    subtitle: "Apothecary glassware, alembic retorts & spirit burners",
  },
  {
    title: "Biological Specimens",
    file: "/art/chapters/specimens.svg",
    subtitle: "Radiolaria morphology, herbarium branches & wing venation",
  },
  {
    title: "Laboratory Apparatus",
    file: "/art/chapters/apparatus.svg",
    subtitle: "Analytical balances, voltaic cells & gram weights",
  },
];

const MEDIA_VIGNETTES = [
  {
    name: "YouTube",
    file: "/art/media/projector.svg",
    badge: "Kinematograph",
    desc: "Vintage hand-crank brass cinematograph on wooden tripod.",
  },
  {
    name: "TikTok",
    file: "/art/media/pocket-lens.svg",
    badge: "Speculum",
    desc: "Victorian turned-horn pocket loupe with mitotic cell split.",
  },
  {
    name: "LinkedIn",
    file: "/art/media/leather-folio.svg",
    badge: "Tomi Academici",
    desc: "Illuminated compendiums with bookmark ribbon and quill.",
  },
];

export default function SpritesPreviewPage() {
  return (
    <article style={{ maxWidth: "72rem", margin: "0 auto", padding: "1.5rem 1rem 5rem" }}>
      {/* ─── Folio Header ─── */}
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <p className="paper-category" style={{ letterSpacing: "var(--tracking-widest)", color: "var(--rust)" }}>
          Compendium Archival Specimen &middot; Design Folio
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 4vw + 1rem, 2.75rem)", fontWeight: 700, margin: "0.25rem 0 0.75rem", letterSpacing: "0.02em", color: "var(--ink)" }}>
          Victorian Copperplate &amp; Component Specimen
        </h1>
        <p style={{ color: "var(--sepia-mid)", fontStyle: "italic", maxWidth: "46rem", margin: "0 auto", fontSize: "1.05rem", lineHeight: 1.6 }}>
          A living reference catalog of copperplate etchings, master vector glyphs, typography tokens, and reusable Victorian UI components powering Oliver&rsquo;s Guide To Everything.
        </p>

        <StarDivider symbol="star" variant={3} spacing="md" ornate size={22} />
      </header>

      {/* ─── Section 1: Master Identity & Banners ─── */}
      <section style={{ marginBottom: "4rem" }}>
        <h2 style={{ fontSize: "1.3rem", letterSpacing: "0.15em", textTransform: "uppercase", borderBottom: "2px solid var(--parchment-border)", paddingBottom: "0.5rem", marginBottom: "1.5rem", color: "var(--ink)" }}>
          1. Identity &amp; Architectural Emblems (`/art/brand/`)
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.75rem" }}>
          <div style={{ border: "1px solid var(--parchment-border)", padding: "1.25rem", background: "rgba(250, 246, 237, 0.7)", textAlign: "center" }}>
            <Image src="/art/brand/olivers-cartouche.svg" alt="Oliver's Cartouche" width={480} height={200} style={{ width: "100%", height: "auto" }} unoptimized priority />
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)", marginTop: "0.75rem" }}>Master Cartouche Oval Logo</div>
            <code style={{ fontSize: "0.75rem", color: "var(--sepia-faint)" }}>/art/brand/olivers-cartouche.svg</code>
          </div>

          <div style={{ border: "1px solid var(--parchment-border)", padding: "1.25rem", background: "rgba(250, 246, 237, 0.7)", textAlign: "center" }}>
            <Image src="/art/brand/scientific-motto-banner.svg" alt="Motto Banner" width={900} height={240} style={{ width: "100%", height: "auto" }} unoptimized />
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)", marginTop: "0.75rem" }}>Panoramic Scientific Motto Landscape</div>
            <code style={{ fontSize: "0.75rem", color: "var(--sepia-faint)" }}>/art/brand/scientific-motto-banner.svg</code>
          </div>
        </div>
      </section>

      {/* ─── Section 2: Chapter & Media Etchings ─── */}
      <section style={{ marginBottom: "4rem" }}>
        <h2 style={{ fontSize: "1.3rem", letterSpacing: "0.15em", textTransform: "uppercase", borderBottom: "2px solid var(--parchment-border)", paddingBottom: "0.5rem", marginBottom: "1.5rem", color: "var(--ink)" }}>
          2. Chapter &amp; Media Vignette Plates (`/art/chapters/` &middot; `/art/media/`)
        </h2>

        <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem", color: "var(--sepia-mid)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Chapter Vignettes
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
          {CHAPTER_VIGNETTES.map((art) => (
            <div key={art.file} style={{ border: "1px solid var(--parchment-shadow)", padding: "0.85rem", background: "rgba(250, 246, 237, 0.6)" }}>
              <Image src={art.file} alt={art.title} width={400} height={266} style={{ width: "100%", height: "auto", border: "1px solid var(--parchment-border)" }} unoptimized />
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)", marginTop: "0.5rem" }}>{art.title}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--sepia-mid)", marginTop: "0.2rem" }}>{art.subtitle}</div>
              <code style={{ fontSize: "0.75rem", color: "var(--sepia-faint)" }}>{art.file}</code>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem", color: "var(--sepia-mid)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          External Media Channels
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
          {MEDIA_VIGNETTES.map((m) => (
            <div key={m.file} style={{ border: "1px solid var(--parchment-shadow)", padding: "0.85rem", textAlign: "center", background: "rgba(250, 246, 237, 0.6)" }}>
              <Image src={m.file} alt={m.name} width={240} height={240} style={{ width: "100%", height: "auto", border: "1px solid var(--parchment-border)" }} unoptimized />
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--ink)", marginTop: "0.5rem" }}>{m.name}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--gold)", fontWeight: 600, textTransform: "uppercase" }}>{m.badge}</div>
              <p style={{ fontSize: "0.78rem", color: "var(--sepia-mid)", marginTop: "0.25rem", lineHeight: 1.35 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Section 3: Master Vector Sprite Sheet (All 28 Icons) ─── */}
      <section style={{ marginBottom: "4rem" }}>
        <h2 style={{ fontSize: "1.3rem", letterSpacing: "0.15em", textTransform: "uppercase", borderBottom: "2px solid var(--parchment-border)", paddingBottom: "0.5rem", marginBottom: "1.5rem", color: "var(--ink)" }}>
          3. Master Vector Sprite Sheet (28 Symbols &middot; `/sprites.svg`)
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {ALL_SPRITE_ICONS.map((group) => (
            <div key={group.category} style={{ border: "1px solid var(--parchment-border)", padding: "1.25rem", background: "rgba(250, 246, 237, 0.6)" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 1rem", color: "var(--sepia-mid)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {group.category}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.85rem" }}>
                {group.icons.map((iconName) => (
                  <div
                    key={iconName}
                    style={{
                      border: "1px solid var(--parchment-border)",
                      padding: "0.75rem 0.5rem",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.5rem",
                      background: "var(--parchment-light)",
                    }}
                  >
                    <Icon name={iconName} size={24} style={{ color: "var(--ink)" }} />
                    <code style={{ fontSize: "0.7rem", color: "var(--sepia-mid)", wordBreak: "break-all" }}>
                      #{iconName}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Section 4: Hand-Drawn Directional Arrows ─── */}
      <section style={{ marginBottom: "4rem" }}>
        <h2 style={{ fontSize: "1.3rem", letterSpacing: "0.15em", textTransform: "uppercase", borderBottom: "2px solid var(--parchment-border)", paddingBottom: "0.5rem", marginBottom: "1.5rem", color: "var(--ink)" }}>
          4. Hand-Drawn Arrow Cuts (1..5) &amp; Variance
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "1.25rem" }}>
          {ARROW_CUTS.map((item) => (
            <div
              key={item.variant}
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
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minHeight: "44px", color: "var(--rust)" }}>
                <HandDrawnArrow variant={item.variant} size={16} />
                <HandDrawnArrow variant={item.variant} size={24} />
                <HandDrawnArrow variant={item.variant} size={36} />
              </div>
              <div style={{ borderTop: "1px solid var(--parchment-shadow)", paddingTop: "0.5rem", width: "100%" }}>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)" }}>{item.name}</div>
                <code style={{ fontSize: "0.75rem", color: "var(--sepia-mid)" }}>#{item.id}</code>
                <p style={{ fontSize: "0.78rem", color: "var(--sepia-faint)", marginTop: "0.35rem", lineHeight: 1.35 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Section 5: Core Victorian Component Kit ─── */}
      <section style={{ marginBottom: "4rem" }}>
        <h2 style={{ fontSize: "1.3rem", letterSpacing: "0.15em", textTransform: "uppercase", borderBottom: "2px solid var(--parchment-border)", paddingBottom: "0.5rem", marginBottom: "1.5rem", color: "var(--ink)" }}>
          5. Core Victorian UI Component Library (`@/components/ui`)
        </h2>

        {/* EtchedFrame Containers */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem", color: "var(--sepia-mid)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            EtchedFrame Variants
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            <EtchedFrame variant="card" badge="Card Frame" cornerFlourishes>
              <h4 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.5rem" }}>Standard Card</h4>
              <p style={{ fontSize: "0.9rem", color: "var(--sepia-mid)", lineHeight: 1.6, margin: 0 }}>
                Double-rule hairline border with gilded corner flourishes for protocol summaries and listing cards.
              </p>
            </EtchedFrame>

            <EtchedFrame variant="hero" badge="Hero Feature" badgeAlign="center" cornerFlourishes>
              <h4 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.5rem", textAlign: "center" }}>Grand Engraved Frame</h4>
              <p style={{ fontSize: "0.9rem", color: "var(--sepia-mid)", lineHeight: 1.6, margin: 0, textAlign: "center" }}>
                Antique radial glow and outer rule for landing page hero showcases.
              </p>
            </EtchedFrame>

            <EtchedFrame variant="inset" badge="Inset Box">
              <h4 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.5rem" }}>Recessed Specimen Plate</h4>
              <p style={{ fontSize: "0.9rem", color: "var(--sepia-mid)", lineHeight: 1.6, margin: 0 }}>
                Sunken inner plate bevel for reagent lists, margin notes, and formula callouts.
              </p>
            </EtchedFrame>
          </div>
        </div>

        {/* StarDivider Variants */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem", color: "var(--sepia-mid)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            StarDivider Rules
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", background: "rgba(250, 246, 237, 0.6)", padding: "1.25rem", border: "1px solid var(--parchment-border)" }}>
            <div>
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--sepia-faint)", textTransform: "uppercase" }}>Star Four (Classic ✦) &bull; Ornate Double-Line</span>
              <StarDivider symbol="star" variant={1} spacing="sm" ornate size={20} />
            </div>
            <div>
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--sepia-faint)", textTransform: "uppercase" }}>Engraved Diamond (◆)</span>
              <StarDivider symbol="diamond" spacing="sm" size={16} />
            </div>
            <div>
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--sepia-faint)", textTransform: "uppercase" }}>Botanical Rule Leaf</span>
              <StarDivider symbol="leaf" spacing="sm" size={24} />
            </div>
          </div>
        </div>

        {/* ElementalPill & CopperplateButton */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.75rem" }}>
          {/* ElementalPills */}
          <div style={{ border: "1px solid var(--parchment-border)", padding: "1.25rem", background: "rgba(250, 246, 237, 0.6)" }}>
            <h3 style={{ fontSize: "1.05rem", margin: "0 0 0.75rem", color: "var(--sepia-mid)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Elemental Taxonomy Pills
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
              <ElementalPill symbol="All" active size="md" />
              <ElementalPill symbol="Ca" label="Cancer" size="md" />
              <ElementalPill symbol="Pr" label="Protocol" size="md" />
              <ElementalPill symbol="Ge" label="Genomics" size="md" />
              <ElementalPill symbol="Re" label="Reagents" size="md" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ElementalPill symbol="Sm" size="sm" />
              <ElementalPill symbol="Md" size="md" />
              <ElementalPill symbol="Lg" size="lg" />
            </div>
          </div>

          {/* CopperplateButton */}
          <div style={{ border: "1px solid var(--parchment-border)", padding: "1.25rem", background: "rgba(250, 246, 237, 0.6)" }}>
            <h3 style={{ fontSize: "1.05rem", margin: "0 0 0.75rem", color: "var(--sepia-mid)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Copperplate Action Buttons
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
              <CopperplateButton variant="primary" size="md">Read Article</CopperplateButton>
              <CopperplateButton variant="secondary" size="md">Explore Guide</CopperplateButton>
              <CopperplateButton variant="ghost" size="sm">Index Appendix</CopperplateButton>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 6: Scientific Figure & Plate Annotations ─── */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.3rem", letterSpacing: "0.15em", textTransform: "uppercase", borderBottom: "2px solid var(--parchment-border)", paddingBottom: "0.5rem", marginBottom: "1.5rem", color: "var(--ink)" }}>
          6. EtchedFigure Illustrations &amp; Leader Lines
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
          <div>
            <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem", color: "var(--sepia-mid)" }}>Classic Bottom Plate</h4>
            <EtchedFigure
              src="/art/chapters/microscopy.svg"
              alt="Achromatic Microscope"
              caption="Plate I &mdash; The Achromatic Compound Microscope with immersion lens."
              captionPosition="bottom-plate"
              aspectRatio="4/3"
              width={600}
              height={400}
            />
          </div>

          <div>
            <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem", color: "var(--sepia-mid)" }}>Callout Cartouche with Leader Line</h4>
            <EtchedFigure
              src="/art/chapters/reagents.svg"
              alt="Reagents and Alembic"
              caption="Distillation retort and receiving flask with alcohol flame."
              captionPosition="callout-bottom"
              leaderLine
              aspectRatio="4/3"
              width={600}
              height={400}
            />
          </div>
        </div>
      </section>

      {/* ─── Back Nav ─── */}
      <div style={{ textAlign: "center", marginTop: "3rem" }}>
        <Link href="/" className="back-link">
          <HandDrawnArrow variant={1} size={14} style={{ transform: "rotate(180deg)" }} />
          Return to Folio Frontispiece
        </Link>
      </div>
    </article>
  );
}
