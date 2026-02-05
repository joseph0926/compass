import { describe, it, expect } from "vitest";
import {
  buildCapsulePrompt,
  determineSectionUpdates,
} from "../../../src/core/capsule/prompt-builder.js";
import type { DiffSignal, CapsuleFiles } from "../../../src/core/types.js";

const emptyCapsule: CapsuleFiles = {
  project: null,
  conventions: null,
  status: null,
};

const baseDiff: DiffSignal = {
  changed_files: [
    { status: "M", path: "src/index.ts", category: "source" },
  ],
  new_deps: [],
  config_changed: false,
  structure_changed: false,
  has_changes: true,
};

describe("determineSectionUpdates", () => {
  it("always includes STATUS.md when there are changes", () => {
    const updates = determineSectionUpdates(baseDiff, null);
    expect(updates.some((u) => u.file === "STATUS.md")).toBe(true);
  });

  it("includes PROJECT.md Tech Stack when new deps exist", () => {
    const diff: DiffSignal = {
      ...baseDiff,
      new_deps: ["express"],
      changed_files: [
        { status: "M", path: "package.json", category: "package" },
      ],
    };
    const updates = determineSectionUpdates(diff, null);
    expect(updates.some((u) => u.file === "PROJECT.md" && u.section === "Tech Stack")).toBe(true);
  });

  it("includes CONVENTIONS.md when config changed", () => {
    const diff: DiffSignal = { ...baseDiff, config_changed: true };
    const updates = determineSectionUpdates(diff, null);
    expect(updates.some((u) => u.file === "CONVENTIONS.md")).toBe(true);
  });

  it("includes PROJECT.md Structure when structure changed", () => {
    const diff: DiffSignal = { ...baseDiff, structure_changed: true };
    const updates = determineSectionUpdates(diff, null);
    expect(
      updates.some(
        (u) => u.file === "PROJECT.md" && u.section === "Structure",
      ),
    ).toBe(true);
  });
});

describe("buildCapsulePrompt", () => {
  it("returns no-changes message when no diff", () => {
    const diff: DiffSignal = {
      changed_files: [],
      new_deps: [],
      config_changed: false,
      structure_changed: false,
      has_changes: false,
    };
    const result = buildCapsulePrompt({ diff, capsule: emptyCapsule, pin: null });
    expect(result).toContain("No changes detected");
  });

  it("includes PIN in prompt when provided", () => {
    const pin = "# PIN\n\n## Goal\nBuild MVP";
    const result = buildCapsulePrompt({
      diff: baseDiff,
      capsule: emptyCapsule,
      pin,
    });
    expect(result).toContain("Active PIN");
    expect(result).toContain("Build MVP");
    expect(result).toContain("relevant to the PIN");
  });

  it("lists changed files in prompt", () => {
    const result = buildCapsulePrompt({
      diff: baseDiff,
      capsule: emptyCapsule,
      pin: null,
    });
    expect(result).toContain("[M] src/index.ts");
  });

  it("includes existing capsule contents", () => {
    const capsule: CapsuleFiles = {
      project: "# Project\nExisting content",
      conventions: null,
      status: "# Status\nCurrent status",
    };
    const result = buildCapsulePrompt({
      diff: baseDiff,
      capsule,
      pin: null,
    });
    expect(result).toContain("Existing content");
    expect(result).toContain("Current status");
  });

  it("includes new deps in prompt", () => {
    const diff: DiffSignal = {
      ...baseDiff,
      new_deps: ["express", "zod"],
      changed_files: [
        { status: "M", path: "package.json", category: "package" },
      ],
    };
    const result = buildCapsulePrompt({
      diff,
      capsule: emptyCapsule,
      pin: null,
    });
    expect(result).toContain("express, zod");
  });
});
