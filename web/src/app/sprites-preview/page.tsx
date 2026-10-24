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

const CHAPTER_ART = [
  {
    title: "Microscopy & Lenses",
    file: "/art/chapters/microscopy.svg",
    subtitle: "Achromatic optics, condenser iris & cellular mounts",
  },
  {
    title: "Chemical Reagents & Distillation",
    file: "/art/chapters/reagents.svg",
    subtitle: "Apothecary glass, alembic retorts & spirit burners",
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

const MEDIA_ART = [
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
    <div style={{ maxWidth: "68rem", margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>
      {/* ─── Header ─── */}
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <p className="paper-category">Work Package 5 Showcase</p>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", letterSpacing: "0.02em" }}>
          Victorian Component Kit &amp; Copperplate Art
        </h1>
        <p style={{ color: "var(--sepia-mid)", fontStyle: "italic", maxWidth: "42rem", margin: "0 auto", fontSize: "1.05rem" }}>
          Reusable React components styled via scoped CSS Modules and master 19th-century vector etching illustrations for scientific protocols.
        </p>

        <StarDivider symbol="star" variant={3} spacing="md" ornate size={22} />
      </header>

      {/* ─── Section 1: EtchedFrame ─── */}
      <section style={{ marginBottom: "3.5rem" }}>
        <h2 style={{ fontSize: "1.4rem", letterSpacing: "0.15em", textTransform: "uppercase", borderBottom: "2px solid var(--parchment-border)", paddingBottom: "0.5rem", marginBottom: "1.5rem", color: "var(--ink)" }}>
          1. EtchedFrame Container (`web/src/components/ui/EtchedFrame.tsx`)
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.75rem" }}>
          {/* Card Variant */}
          <EtchedFrame variant="card" badge="Card Frame" cornerFlourishes>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 0.5rem" }}>Standard Card Container</h3>
            <p style={{ fontSize: "0.95rem", color: "var(--sepia-mid)", lineHeight: 1.6, margin: 0 }}>
              Double-rule hairline borders with gilded corner flourishes. Perfect for article grids, protocol summaries, and listing feeds.
            </p>
            <div style={{ marginTop: "1rem" }}>
              <CopperplateButton size="sm" variant="secondary">View Protocol</CopperplateButton>
            </div>
          </EtchedFrame>

          {/* Hero Variant */}
          <EtchedFrame variant="hero" badge="Hero Feature" badgeAlign="center" cornerFlourishes>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 0.5rem", textAlign: "center" }}>Grand Engraved Frame</h3>
            <p style={{ fontSize: "0.95rem", color: "var(--sepia-mid)", lineHeight: 1.6, margin: 0, textAlign: "center" }}>
              Radial antique paper glow, dashed inner guideline, and heavy outer rule for landing page hero showcases.
            </p>
            <div style={{ marginTop: "1rem", textAlign: "center" }}>
              <CopperplateButton size="sm" variant="primary">Read Article</CopperplateButton>
            </div>
          </EtchedFrame>

          {/* Inset Variant */}
          <EtchedFrame variant="inset" badge="Inset Box">
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 0.5rem" }}>Recessed Specimen Sunk</h3>
            <p style={{ fontSize: "0.95rem", color: "var(--sepia-mid)", lineHeight: 1.6, margin: 0 }}>
              Inner bevel drop-shadow simulating an engraved sunken paper plate for reagent formulae, annotations, or callout notes.
            </p>
          </EtchedFrame>

          {/* Panel Variant */}
          <EtchedFrame variant="panel" badge="Panel Box" badgeAlign="right">
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 0.5rem" }}>Scholarly Panel Box</h3>
            <p style={{ fontSize: "0.95rem", color: "var(--sepia-mid)", lineHeight: 1.6, margin: 0 }}>
              Heavy double border styled for sidebar elements such as PDF downloads trays, table of contents, or citation indices.
            </p>
          </EtchedFrame>
        </div>
      </section>

      {/* ─── Section 2: StarDivider ─── */}
      <section style={{ marginBottom: "3.5rem" }}>
        <h2 style={{ fontSize: "1.4rem", letterSpacing: "0.15em", textTransform: "uppercase", borderBottom: "2px solid var(--parchment-border)", paddingBottom: "0.5rem", marginBottom: "1.5rem", color: "var(--ink)" }}>
          2. StarDivider Rules (`web/src/components/ui/StarDivider.tsx`)
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", background: "rgba(250, 246, 237, 0.5)", padding: "1.5rem", border: "1px solid var(--parchment-border)" }}>
          <div>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--sepia-faint)", textTransform: "uppercase" }}>Symbol: 4-Point Star (Classic ✦)</span>
            <StarDivider symbol="star" variant={1} spacing="sm" />
          </div>

          <div>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--sepia-faint)", textTransform: "uppercase" }}>Symbol: Radiant Cross Star (Cut 3) &bull; Ornate Double-Line</span>
            <StarDivider symbol="star" variant={3} spacing="sm" ornate size={22} />
          </div>

          <div>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--sepia-faint)", textTransform: "uppercase" }}>Symbol: Engraved Diamond (◆)</span>
            <StarDivider symbol="diamond" spacing="sm" size={16} />
          </div>

          <div>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--sepia-faint)", textTransform: "uppercase" }}>Symbol: Botanical Rule Leaf</span>
            <StarDivider symbol="leaf" spacing="sm" size={24} />
          </div>
        </div>
      </section>

      {/* ─── Section 3: ElementalPill ─── */}
      <section style={{ marginBottom: "3.5rem" }}>
        <h2 style={{ fontSize: "1.4rem", letterSpacing: "0.15em", textTransform: "uppercase", borderBottom: "2px solid var(--parchment-border)", paddingBottom: "0.5rem", marginBottom: "1.5rem", color: "var(--ink)" }}>
          3. ElementalPill Taxonomy Badges (`web/src/components/ui/ElementalPill.tsx`)
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", background: "rgba(250, 246, 237, 0.5)", padding: "1.5rem", border: "1px solid var(--parchment-border)" }}>
          <div>
            <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", color: "var(--sepia-mid)" }}>A. Navigation Filter Row (Periodic Table Style)</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              <ElementalPill symbol="All" active size="md" href="/sprites-preview" />
              <ElementalPill symbol="Ca" label="Cancer" size="md" href="/sprites-preview" />
              <ElementalPill symbol="Te" label="Technology" size="md" href="/sprites-preview" />
              <ElementalPill symbol="Go" label="Genomics" size="md" href="/sprites-preview" />
              <ElementalPill symbol="Ri" label="Reagents" size="md" href="/sprites-preview" />
              <ElementalPill symbol="Es" label="Assays" size="md" href="/sprites-preview" />
              <ElementalPill symbol="Na" label="Nano" size="md" href="/sprites-preview" />
              <ElementalPill symbol="Sc" label="Spectrometry" size="md" href="/sprites-preview" />
            </div>
          </div>

          <div>
            <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", color: "var(--sepia-mid)" }}>B. Size Scale (sm &bull; md &bull; lg)</h4>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <ElementalPill symbol="Pr" label="Small" size="sm" />
              <ElementalPill symbol="Pr" label="Medium" size="md" />
              <ElementalPill symbol="Pr" label="Large" size="lg" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 4: CopperplateButton ─── */}
      <section style={{ marginBottom: "3.5rem" }}>
        <h2 style={{ fontSize: "1.4rem", letterSpacing: "0.15em", textTransform: "uppercase", borderBottom: "2px solid var(--parchment-border)", paddingBottom: "0.5rem", marginBottom: "1.5rem", color: "var(--ink)" }}>
          4. CopperplateButton (`web/src/components/ui/CopperplateButton.tsx`)
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", background: "rgba(250, 246, 237, 0.5)", padding: "1.5rem", border: "1px solid var(--parchment-border)" }}>
          <div>
            <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", color: "var(--sepia-mid)" }}>A. Button Variants</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
              <CopperplateButton variant="primary" arrowVariant={1}>Read Article</CopperplateButton>
              <CopperplateButton variant="secondary" arrowVariant={2}>Explore Guide</CopperplateButton>
              <CopperplateButton variant="ghost" arrowVariant={3}>View All Protocols</CopperplateButton>
            </div>
          </div>

          <div>
            <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", color: "var(--sepia-mid)" }}>B. Arrow Positions &amp; Hand-Drawn Cuts (1..5)</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
              <CopperplateButton variant="secondary" arrowPosition="left" arrowVariant={1}>Previous Plate</CopperplateButton>
              <CopperplateButton variant="secondary" arrowPosition="right" arrowVariant={4}>Next Plate</CopperplateButton>
              <CopperplateButton variant="secondary" arrowPosition="none">Action Without Arrow</CopperplateButton>
            </div>
          </div>

          <div>
            <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", color: "var(--sepia-mid)" }}>C. Size Scale</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
              <CopperplateButton size="sm" variant="primary">Small Action</CopperplateButton>
              <CopperplateButton size="md" variant="primary">Standard Action</CopperplateButton>
              <CopperplateButton size="lg" variant="primary">Featured Action</CopperplateButton>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 5: EtchedFigure ─── */}
      <section style={{ marginBottom: "3.5rem" }}>
        <h2 style={{ fontSize: "1.4rem", letterSpacing: "0.15em", textTransform: "uppercase", borderBottom: "2px solid var(--parchment-border)", paddingBottom: "0.5rem", marginBottom: "1.5rem", color: "var(--ink)" }}>
          5. EtchedFigure Illustrations (`web/src/components/ui/EtchedFigure.tsx`)
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
          {/* Classic Bottom-Plate Caption */}
          <div>
            <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem", color: "var(--sepia-mid)" }}>A. Classic Specimen Bottom Plate</h4>
            <EtchedFigure
              src="/art/chapters/microscopy.svg"
              alt="The Achromatic Compound Microscope"
              caption="Fig. 1 — The Achromatic Compound Microscope with iris condenser."
              captionPosition="bottom-plate"
              aspectRatio="4/3"
              width={600}
              height={400}
            />
          </div>

          {/* Callout Cartouche with Leader Line */}
          <div>
            <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem", color: "var(--sepia-mid)" }}>B. Leader Line Pointer to Cartouche Plate</h4>
            <EtchedFigure
              src="/art/chapters/reagents.svg"
              alt="Reagents and Distillation Retort"
              caption="Tubulure distillation retort with receiver flask and spirit burner."
              captionPosition="callout-bottom"
              leaderLine
              aspectRatio="4/3"
              width={600}
              height={400}
            />
          </div>
        </div>
      </section>

      {/* ─── Section 6: Master Etched Art Gallery ─── */}
      <section style={{ marginBottom: "3.5rem" }}>
        <h2 style={{ fontSize: "1.4rem", letterSpacing: "0.15em", textTransform: "uppercase", borderBottom: "2px solid var(--parchment-border)", paddingBottom: "0.5rem", marginBottom: "1.5rem", color: "var(--ink)" }}>
          6. Master Etched Art Library (`web/public/art/`)
        </h2>

        {/* Brand Cartouche & Motto Banner */}
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem", color: "var(--sepia-mid)" }}>A. Identity &amp; Motto Banners</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            <div style={{ border: "1px solid var(--parchment-border)", padding: "1rem", background: "rgba(250, 246, 237, 0.6)", textAlign: "center" }}>
              <Image src="/art/brand/olivers-cartouche.svg" alt="Oliver's Cartouche" width={480} height={200} style={{ width: "100%", height: "auto" }} unoptimized />
              <div style={{ fontSize: "0.85rem", color: "var(--sepia-faint)", marginTop: "0.5rem" }}>Master Cartouche Oval Emblem (`olivers-cartouche.svg`)</div>
            </div>

            <div style={{ border: "1px solid var(--parchment-border)", padding: "1rem", background: "rgba(250, 246, 237, 0.6)", textAlign: "center" }}>
              <Image src="/art/brand/scientific-motto-banner.svg" alt="Motto Banner" width={900} height={240} style={{ width: "100%", height: "auto" }} unoptimized />
              <div style={{ fontSize: "0.85rem", color: "var(--sepia-faint)", marginTop: "0.5rem" }}>Panoramic Motto Landscape Banner (`scientific-motto-banner.svg`)</div>
            </div>
          </div>
        </div>

        {/* Chapter Banners */}
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem", color: "var(--sepia-mid)" }}>B. Chapter Plates (1..4)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            {CHAPTER_ART.map((art) => (
              <div key={art.file} className="variant-card" style={{ border: "1px solid var(--parchment-shadow)", padding: "0.75rem", background: "rgba(250, 246, 237, 0.5)" }}>
                <Image src={art.file} alt={art.title} width={400} height={266} style={{ width: "100%", height: "auto", border: "1px solid var(--parchment-border)" }} unoptimized />
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)", marginTop: "0.5rem" }}>{art.title}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--sepia-mid)", marginTop: "0.2rem" }}>{art.subtitle}</div>
                <code style={{ fontSize: "0.75rem", color: "var(--sepia-faint)" }}>{art.file}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Media Vignettes */}
        <div>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem", color: "var(--sepia-mid)" }}>C. Media Channel Vignettes</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.25rem" }}>
            {MEDIA_ART.map((m) => (
              <div key={m.file} className="variant-card" style={{ border: "1px solid var(--parchment-shadow)", padding: "0.75rem", textAlign: "center", background: "rgba(250, 246, 237, 0.5)" }}>
                <Image src={m.file} alt={m.name} width={240} height={240} style={{ width: "100%", height: "auto", border: "1px solid var(--parchment-border)" }} unoptimized />
                <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--ink)", marginTop: "0.5rem" }}>{m.name}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--gold)", fontWeight: 600, textTransform: "uppercase" }}>{m.badge}</div>
                <p style={{ fontSize: "0.78rem", color: "var(--sepia-mid)", marginTop: "0.25rem", lineHeight: 1.35 }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section 7: Vector Sprites & Hand-Drawn Variance ─── */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.4rem", letterSpacing: "0.15em", textTransform: "uppercase", borderBottom: "2px solid var(--parchment-border)", paddingBottom: "0.5rem", marginBottom: "1.5rem", color: "var(--ink)" }}>
          7. Hand-Drawn Arrow &amp; Star Variants (`/sprites.svg`)
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.25rem" }}>
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
