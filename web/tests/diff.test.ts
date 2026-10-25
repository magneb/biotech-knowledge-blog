import { describe, expect, it } from "vitest";
import {
  calculateDiffStats,
  diffTreatiseEditions,
  diffWords,
  extractBlockSections,
  tokenizeWords,
} from "@/lib/diff";

describe("Victorian Protocol Diff Engine (web/src/lib/diff.ts)", () => {
  describe("tokenizeWords", () => {
    it("splits text into alternating words and non-word separators", () => {
      const tokens = tokenizeWords("Incubate at 37°C for 45 min.");
      expect(tokens).toEqual([
        "Incubate",
        " ",
        "at",
        " ",
        "37",
        "°",
        "C",
        " ",
        "for",
        " ",
        "45",
        " ",
        "min",
        ".",
      ]);
    });

    it("handles empty or blank string gracefully", () => {
      expect(tokenizeWords("")).toEqual([]);
    });
  });

  describe("diffWords", () => {
    it("returns single unchanged token when strings are identical", () => {
      const { tokens, stats } = diffWords(
        "Standard buffer dilution protocol",
        "Standard buffer dilution protocol"
      );
      expect(tokens).toEqual([
        { type: "unchanged", value: "Standard buffer dilution protocol" },
      ]);
      expect(stats.wordsAdded).toBe(0);
      expect(stats.wordsRemoved).toBe(0);
      expect(stats.wordsUnchanged).toBe(4);
    });

    it("correctly identifies additions in target text", () => {
      const { tokens, stats } = diffWords(
        "Incubate at 37°C for 30 minutes.",
        "Incubate at 37°C with gentle shaking for 30 minutes."
      );

      const added = tokens.filter((t) => t.type === "added");
      expect(added.map((t) => t.value.trim())).toContain("with gentle shaking");
      expect(stats.wordsAdded).toBe(3);
      expect(stats.wordsRemoved).toBe(0);
    });

    it("correctly identifies deletions in target text", () => {
      const { tokens, stats } = diffWords(
        "Prepare 50 mM Tris-HCl buffer with 10% glycerol.",
        "Prepare 50 mM Tris-HCl buffer."
      );

      const removed = tokens.filter((t) => t.type === "removed");
      expect(removed.map((t) => t.value.trim())).toContain("with 10% glycerol");
      expect(stats.wordsRemoved).toBe(3);
      expect(stats.wordsAdded).toBe(0);
    });

    it("handles mixed substitutions cleanly", () => {
      const { tokens, stats } = diffWords(
        "Centrifuge at 12,000 rpm for 10 min.",
        "Centrifuge at 14,000 rpm for 15 min."
      );

      expect(stats.wordsAdded).toBeGreaterThan(0);
      expect(stats.wordsRemoved).toBeGreaterThan(0);
      expect(tokens.some((t) => t.type === "added")).toBe(true);
      expect(tokens.some((t) => t.type === "removed")).toBe(true);
      expect(tokens.some((t) => t.type === "unchanged")).toBe(true);
    });

    it("handles completely new target text from empty base", () => {
      const { tokens, stats } = diffWords("", "New protocol section.");
      expect(tokens).toEqual([{ type: "added", value: "New protocol section." }]);
      expect(stats.wordsAdded).toBe(3);
      expect(stats.wordsRemoved).toBe(0);
    });
  });

  describe("calculateDiffStats", () => {
    it("accurately counts words across token types", () => {
      const stats = calculateDiffStats([
        { type: "unchanged", value: "First paragraph " },
        { type: "removed", value: "old reagent " },
        { type: "added", value: "new fresh reagent " },
      ]);
      expect(stats.wordsUnchanged).toBe(2);
      expect(stats.wordsRemoved).toBe(2);
      expect(stats.wordsAdded).toBe(3);
    });
  });

  describe("extractBlockSections & diffTreatiseEditions", () => {
    const v1Blocks = [
      {
        _type: "block",
        style: "h2",
        children: [{ text: "Preparation of Reagents" }],
      },
      {
        _type: "block",
        style: "normal",
        children: [
          { text: "Dissolve 5g sodium chloride in 500 mL ultrapure water." },
        ],
      },
      {
        _type: "formulaReagents",
        title: "Reagents Required",
        formulaNote: "Store at room temperature",
        items: [
          { name: "NaCl", quantity: "5g", note: "Analytical Grade" },
          { name: "H2O", quantity: "500 mL", note: "Milli-Q" },
        ],
      },
    ];

    const v2Blocks = [
      {
        _type: "block",
        style: "h2",
        children: [{ text: "Preparation of Reagents & Buffer" }],
      },
      {
        _type: "block",
        style: "normal",
        children: [
          {
            text: "Dissolve 5g sodium chloride and 2g potassium chloride in 500 mL ultrapure water.",
          },
        ],
      },
      {
        _type: "formulaReagents",
        title: "Reagents Required",
        formulaNote: "Store at 4°C in dark amber bottle",
        items: [
          { name: "NaCl", quantity: "5g", note: "Analytical Grade" },
          { name: "KCl", quantity: "2g", note: "BioUltra" },
          { name: "H2O", quantity: "500 mL", note: "Milli-Q" },
        ],
      },
    ];

    it("extracts structured sections from Portable Text blocks", () => {
      const sections = extractBlockSections(v1Blocks);
      expect(sections).toHaveLength(3);
      expect(sections[0].type).toBe("heading");
      expect(sections[0].text).toBe("Preparation of Reagents");
      expect(sections[1].type).toBe("paragraph");
      expect(sections[2].type).toBe("reagents");
      expect(sections[2].text).toContain("NaCl: 5g");
    });

    it("computes end-to-end treatise diff between Version 1 and Version 2", () => {
      const diffResult = diffTreatiseEditions(
        {
          title: "Buffer Dilution Protocol",
          summary: "First draft summary of buffer procedure.",
          contentType: "protocol",
          body: v1Blocks,
        },
        {
          title: "Buffer Dilution Protocol (Revised)",
          summary: "Revised standard procedure including potassium chloride.",
          contentType: "protocol",
          body: v2Blocks,
        }
      );

      expect(diffResult.hasChanges).toBe(true);
      expect(diffResult.stats.wordsAdded).toBeGreaterThan(0);
      expect(diffResult.stats.wordsRemoved).toBeGreaterThan(0);

      // Title changed
      expect(diffResult.titleDiff.some((t) => t.type === "added" && t.value.includes("Revised"))).toBe(true);

      // Section diffs include both paragraph changes and reagents changes
      expect(diffResult.sections.length).toBeGreaterThanOrEqual(3);
      const reagentDiff = diffResult.sections.find((s) => s.type === "reagents");
      expect(reagentDiff).toBeDefined();
      expect(reagentDiff?.tokens.some((t) => t.type === "added" && t.value.includes("KCl"))).toBe(true);
    });

    it("returns hasChanges: false when comparing identical treatises", () => {
      const diffResult = diffTreatiseEditions(
        {
          title: "Constant Protocol",
          summary: "No change here.",
          contentType: "guide",
          body: v1Blocks,
        },
        {
          title: "Constant Protocol",
          summary: "No change here.",
          contentType: "guide",
          body: v1Blocks,
        }
      );

      expect(diffResult.hasChanges).toBe(false);
      expect(diffResult.stats.wordsAdded).toBe(0);
      expect(diffResult.stats.wordsRemoved).toBe(0);
    });
  });
});
