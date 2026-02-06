import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync,
  rmSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runInit } from "../../src/cli/commands/init.js";

describe("runInit CLAUDE.md handling", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "compass-init-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates CLAUDE.md when missing and inserts PIN import", () => {
    runInit(tmpDir);

    const claudePath = join(tmpDir, "CLAUDE.md");
    expect(existsSync(claudePath)).toBe(true);

    const content = readFileSync(claudePath, "utf-8");
    expect(content.startsWith("@.ai/work/pin.md\n")).toBe(true);
    expect(content).toContain("# Project Memory (CLAUDE.md)");
  });

  it("patches existing CLAUDE.md by adding PIN import at top", () => {
    const claudePath = join(tmpDir, "CLAUDE.md");
    writeFileSync(claudePath, "## Existing Content\n", "utf-8");

    runInit(tmpDir);

    const content = readFileSync(claudePath, "utf-8");
    expect(content.startsWith("@.ai/work/pin.md\n")).toBe(true);
    expect(content).toContain("## Existing Content");
  });

  it("does not duplicate PIN import when already present", () => {
    const claudePath = join(tmpDir, "CLAUDE.md");
    writeFileSync(
      claudePath,
      "# Header\n@.ai/work/pin.md\n## Body\n",
      "utf-8",
    );

    runInit(tmpDir);

    const content = readFileSync(claudePath, "utf-8");
    const occurrences = content
      .split("\n")
      .filter((line) => line.trim() === "@.ai/work/pin.md").length;
    expect(occurrences).toBe(1);
  });

  it("is idempotent across repeated init runs", () => {
    runInit(tmpDir);
    const claudePath = join(tmpDir, "CLAUDE.md");
    const first = readFileSync(claudePath, "utf-8");

    runInit(tmpDir);
    const second = readFileSync(claudePath, "utf-8");

    expect(second).toBe(first);
  });
});
