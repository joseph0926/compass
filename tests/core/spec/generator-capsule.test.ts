import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { generateSpec } from "../../../src/core/spec/generator.js";

describe("generateSpec capsule auto-heal", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "compass-capsule-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates capsule files when they don't exist", () => {
    generateSpec(tmpDir, "Test", "20260205");

    expect(existsSync(join(tmpDir, ".ai/capsule/PROJECT.md"))).toBe(true);
    expect(existsSync(join(tmpDir, ".ai/capsule/CONVENTIONS.md"))).toBe(true);
    expect(existsSync(join(tmpDir, ".ai/capsule/STATUS.md"))).toBe(true);

    const project = readFileSync(join(tmpDir, ".ai/capsule/PROJECT.md"), "utf-8");
    expect(project).toContain("# Project Overview");
  });

  it("does not overwrite existing capsule files", () => {
    // Create a custom capsule file first
    const { mkdirSync, writeFileSync } = require("node:fs");
    mkdirSync(join(tmpDir, ".ai/capsule"), { recursive: true });
    writeFileSync(join(tmpDir, ".ai/capsule/PROJECT.md"), "# Custom Content", "utf-8");

    generateSpec(tmpDir, "Test", "20260205");

    const project = readFileSync(join(tmpDir, ".ai/capsule/PROJECT.md"), "utf-8");
    expect(project).toBe("# Custom Content");
  });
});
