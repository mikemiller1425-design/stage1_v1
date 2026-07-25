import { describe, expect, it } from "vitest";
import {
  buildApprovedPackage,
  getApprovedPackageFilename,
} from "@/lib/approved-package";

describe("buildApprovedPackage", () => {
  it("builds a clean Stage 1 package with required sections", () => {
    const content = buildApprovedPackage({
      filename: "product-notes.md",
      originalMarkdown: "  # Hello\n\nBody  ",
      analysis: "  ## Core intent\n\nSolve intake.  ",
      model: "claude-sonnet-5",
    });

    expect(content.startsWith("# Approved Stage 1 Package — product-notes.md\n")).toBe(
      true,
    );
    expect(content).toContain("**Source file:** `product-notes.md`");
    expect(content).toContain("**Analysis model:** claude-sonnet-5");
    expect(content).toContain("**Status:** Approved for Stage 3");
    expect(content).toContain("## Original Markdown\n\n# Hello\n\nBody");
    expect(content).toContain(
      "## Intent Analysis (from Claude)\n\n## Core intent\n\nSolve intake.",
    );
    expect(content).not.toMatch(/Original Markdown\n\n  # Hello/);
  });

  it("defaults analysis model label to Claude when missing", () => {
    const content = buildApprovedPackage({
      filename: "a.md",
      originalMarkdown: "x",
      analysis: "y",
      model: null,
    });

    expect(content).toContain("**Analysis model:** Claude");
  });

  it("preserves unicode and fenced code in both sections", () => {
    const content = buildApprovedPackage({
      filename: "idée.md",
      originalMarkdown: "# Café\n\n```ts\nconst x = 1;\n```",
      analysis: "Résumé\n\n- risk ✓",
      model: "claude-sonnet-5",
    });

    expect(content).toContain("# Approved Stage 1 Package — idée.md");
    expect(content).toContain("const x = 1;");
    expect(content).toContain("risk ✓");
  });
});

describe("getApprovedPackageFilename", () => {
  it.each([
    ["product-notes.md", "product-notes-approved-stage1.md"],
    ["Product.Notes.MD", "Product.Notes-approved-stage1.md"],
    ["no-extension", "no-extension-approved-stage1.md"],
    ["already.md.md", "already.md-approved-stage1.md"],
  ])("%s => %s", (input, expected) => {
    expect(getApprovedPackageFilename(input)).toBe(expected);
  });
});
