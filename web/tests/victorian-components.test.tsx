import fs from "node:fs";
import path from "node:path";
import { render, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  EtchedFrame,
  StarDivider,
  ElementalPill,
  CopperplateButton,
  EtchedFigure,
} from "@/components/ui";

import etchedFrameStyles from "@/components/ui/EtchedFrame.module.css";
import starDividerStyles from "@/components/ui/StarDivider.module.css";
import elementalPillStyles from "@/components/ui/ElementalPill.module.css";
import copperplateButtonStyles from "@/components/ui/CopperplateButton.module.css";
import etchedFigureStyles from "@/components/ui/EtchedFigure.module.css";

const WEB_ROOT = path.resolve(__dirname, "..");

describe("EtchedFrame Component", () => {
  it("renders as a custom element tag and applies variant classes", () => {
    const { container } = render(
      <EtchedFrame as="article" variant="hero" className="custom-class">
        <p>Hero Content</p>
      </EtchedFrame>
    );

    const articleEl = container.querySelector("article");
    expect(articleEl).not.toBeNull();
    expect(articleEl?.className).toContain(etchedFrameStyles.variantHero);
    expect(articleEl?.className).toContain("custom-class");
    expect(articleEl?.textContent).toContain("Hero Content");
  });

  it("renders badge with alignment class", () => {
    const { container } = render(
      <EtchedFrame badge="Featured Protocol" badgeAlign="center">
        <p>Content</p>
      </EtchedFrame>
    );

    const badgeContainer = container.querySelector(`.${etchedFrameStyles.badgeContainer}`);
    expect(badgeContainer).not.toBeNull();
    expect(badgeContainer?.className).toContain(etchedFrameStyles.badgeAlignCenter);
    expect(container.textContent).toContain("Featured Protocol");
  });

  it("renders corner flourishes when cornerFlourishes is true", () => {
    const { container: withFlourishes } = render(
      <EtchedFrame cornerFlourishes>
        <p>Flourished Box</p>
      </EtchedFrame>
    );

    const icons = withFlourishes.querySelectorAll("svg.icon");
    expect(icons).toHaveLength(4);

    const { container: withoutFlourishes } = render(
      <EtchedFrame cornerFlourishes={false}>
        <p>Plain Box</p>
      </EtchedFrame>
    );
    expect(withoutFlourishes.querySelectorAll("svg.icon")).toHaveLength(0);
  });
});

describe("StarDivider Component", () => {
  it("renders horizontal separator with default star-four icon", () => {
    const { container } = render(<StarDivider />);
    const separator = container.querySelector("[role='separator']");
    expect(separator).not.toBeNull();

    const useEl = container.querySelector("use");
    expect(useEl?.getAttribute("href")).toBe("/sprites.svg#star-four");
  });

  it("resolves symbol types (diamond, flourish, leaf) and star cut variants (1..5)", () => {
    const { container: cut3 } = render(<StarDivider symbol="star" variant={3} />);
    expect(cut3.querySelector("use")?.getAttribute("href")).toBe(
      "/sprites.svg#star-four-3"
    );

    const { container: diamond } = render(<StarDivider symbol="diamond" />);
    expect(diamond.querySelector("use")?.getAttribute("href")).toBe(
      "/sprites.svg#diamond"
    );

    const { container: flourish } = render(<StarDivider symbol="flourish" />);
    expect(flourish.querySelector("use")?.getAttribute("href")).toBe(
      "/sprites.svg#star-flourish"
    );

    const { container: leaf } = render(<StarDivider symbol="leaf" />);
    expect(leaf.querySelector("use")?.getAttribute("href")).toBe(
      "/sprites.svg#rule-leaf"
    );
  });

  it("applies spacing and ornate double-line classes", () => {
    const { container } = render(<StarDivider spacing="lg" ornate />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain(starDividerStyles.spacingLg);
    expect(div.className).toContain(starDividerStyles.ornate);
  });
});

describe("ElementalPill Component", () => {
  it("formats 2-letter uppercase symbol inside brackets and renders label", () => {
    const { container } = render(<ElementalPill symbol="ca" label="Cancer" />);
    expect(container.textContent).toContain("[CA]");
    expect(container.textContent).toContain("Cancer");
  });

  it("renders as a Next.js Link when href is provided", () => {
    const { container } = render(
      <ElementalPill symbol="Te" label="Tech" href="/topic/tech" active />
    );
    const link = container.querySelector("a");
    expect(link).not.toBeNull();
    expect(link?.getAttribute("href")).toBe("/topic/tech");
    expect(link?.className).toContain(elementalPillStyles.active);
  });

  it("renders as button when onClick is passed and triggers handler", () => {
    const handleClick = vi.fn();
    const { container } = render(
      <ElementalPill symbol="Pr" onClick={handleClick} />
    );

    const button = container.querySelector("button");
    expect(button).not.toBeNull();
    fireEvent.click(button!);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders as static span when neither href nor onClick is passed", () => {
    const { container } = render(<ElementalPill symbol="Na" />);
    const span = container.querySelector("span");
    expect(span).not.toBeNull();
    expect(container.querySelector("button")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
  });
});

describe("CopperplateButton Component", () => {
  it("renders as a native button with children and right-aligned arrow by default", () => {
    const { container } = render(
      <CopperplateButton variant="primary">Read Article</CopperplateButton>
    );

    const button = container.querySelector("button");
    expect(button).not.toBeNull();
    expect(button?.textContent).toContain("Read Article");
    expect(button?.className).toContain(copperplateButtonStyles.variantPrimary);

    const arrow = container.querySelector("use");
    expect(arrow?.getAttribute("href")).toContain("/sprites.svg#arrow-right-1");
  });

  it("renders as Next.js Link when href is provided", () => {
    const { container } = render(
      <CopperplateButton href="/protocols/crispr" variant="secondary" arrowVariant={3}>
        Explore Protocol
      </CopperplateButton>
    );

    const link = container.querySelector("a");
    expect(link).not.toBeNull();
    expect(link?.getAttribute("href")).toBe("/protocols/crispr");
    expect(link?.className).toContain(copperplateButtonStyles.variantSecondary);

    const arrow = container.querySelector("use");
    expect(arrow?.getAttribute("href")).toBe("/sprites.svg#arrow-right-3");
  });

  it("supports arrowPosition='left' and arrowPosition='none'", () => {
    const { container: leftArrow } = render(
      <CopperplateButton arrowPosition="left">Back</CopperplateButton>
    );
    expect(leftArrow.querySelector(`.${copperplateButtonStyles.arrowLeft}`)).not.toBeNull();

    const { container: noArrow } = render(
      <CopperplateButton arrowPosition="none">Plain</CopperplateButton>
    );
    expect(noArrow.querySelector("svg")).toBeNull();
  });

  it("handles click and disabled state on button", () => {
    const handleClick = vi.fn();
    const { container } = render(
      <CopperplateButton disabled onClick={handleClick}>
        Disabled
      </CopperplateButton>
    );

    const button = container.querySelector("button");
    expect(button?.disabled).toBe(true);
    fireEvent.click(button!);
    expect(handleClick).not.toHaveBeenCalled();
  });
});

describe("EtchedFigure Component", () => {
  it("renders figure with Next Image and classic bottom plate caption", () => {
    const { container } = render(
      <EtchedFigure
        src="/art/chapters/microscopy.svg"
        alt="Microscope"
        caption="Fig. 1 — Optical Achromatic Microscope"
        captionPosition="bottom-plate"
        aspectRatio="4/3"
      />
    );

    const figure = container.querySelector("figure");
    expect(figure).not.toBeNull();

    const img = container.querySelector("img");
    expect(img?.getAttribute("alt")).toBe("Microscope");
    expect(container.querySelector(`.${etchedFigureStyles.ratio43}`)).not.toBeNull();

    const caption = container.querySelector("figcaption");
    expect(caption?.className).toContain(etchedFigureStyles.captionBottomPlate);
    expect(caption?.textContent).toContain("Fig. 1 — Optical Achromatic Microscope");
  });

  it("renders callout cartouche with leader line SVG pointer when configured", () => {
    const { container } = render(
      <EtchedFigure
        src="/art/chapters/reagents.svg"
        alt="Reagents"
        caption="Alembic condenser connection"
        captionPosition="callout-bottom"
        leaderLine
      />
    );

    expect(container.querySelector(`.${etchedFigureStyles.captionCallout}`)).not.toBeNull();
    expect(container.querySelector(`.${etchedFigureStyles.leaderSvg}`)).not.toBeNull();
  });
});

describe("Victorian Art Library Asset Integrity", () => {
  const expectedArtFiles = [
    "art/chapters/microscopy.svg",
    "art/chapters/reagents.svg",
    "art/chapters/specimens.svg",
    "art/chapters/apparatus.svg",
    "art/media/projector.svg",
    "art/media/pocket-lens.svg",
    "art/media/leather-folio.svg",
    "art/brand/olivers-cartouche.svg",
    "art/brand/scientific-motto-banner.svg",
  ];

  for (const artFile of expectedArtFiles) {
    it(`verifies existence and valid XML/SVG structure of public/${artFile}`, () => {
      const fullPath = path.join(WEB_ROOT, "public", artFile);
      expect(fs.existsSync(fullPath)).toBe(true);

      const content = fs.readFileSync(fullPath, "utf-8");
      expect(content).toContain("<svg");
      expect(content).toContain("</svg>");
      expect(content.length).toBeGreaterThan(500);
    });
  }
});
