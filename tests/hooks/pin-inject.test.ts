import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { isSafePath } from "../../src/hooks/pin-inject.js";

describe("isSafePath", () => {
  const cwd = "/project";

  it("allows paths inside .ai/", () => {
    expect(isSafePath(cwd, ".ai/work/pin.md")).toBe(true);
    expect(isSafePath(cwd, ".ai/specs/SPEC-20260205-test.md")).toBe(true);
  });

  it("rejects path traversal (../)", () => {
    expect(isSafePath(cwd, "../secret.txt")).toBe(false);
    expect(isSafePath(cwd, ".ai/../../etc/passwd")).toBe(false);
  });

  it("rejects paths outside .ai/", () => {
    expect(isSafePath(cwd, "src/index.ts")).toBe(false);
    expect(isSafePath(cwd, "/etc/passwd")).toBe(false);
  });

  it("rejects .ai prefix tricks (e.g. .ai-fake/)", () => {
    expect(isSafePath(cwd, ".ai-fake/evil.md")).toBe(false);
  });

  it("allows .ai root itself", () => {
    expect(isSafePath(cwd, ".ai")).toBe(true);
  });
});

describe("isSafePath symlink defense", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "compass-symlink-test-"));
    mkdirSync(join(tmpDir, ".ai/work"), { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("rejects symlink inside .ai/ pointing outside", () => {
    // Create a file outside .ai/
    const secretPath = join(tmpDir, "secret.txt");
    writeFileSync(secretPath, "SECRET DATA", "utf-8");

    // Create a symlink inside .ai/ pointing to the secret file
    const linkPath = join(tmpDir, ".ai/work/pin.md");
    symlinkSync(secretPath, linkPath);

    // isSafePath should reject this because realpath resolves outside .ai/
    expect(isSafePath(tmpDir, ".ai/work/pin.md")).toBe(false);
  });

  it("allows regular file inside .ai/", () => {
    const pinPath = join(tmpDir, ".ai/work/pin.md");
    writeFileSync(pinPath, "# PIN", "utf-8");

    expect(isSafePath(tmpDir, ".ai/work/pin.md")).toBe(true);
  });

  it("allows path to non-existent file inside .ai/ (not yet created)", () => {
    // File doesn't exist yet, only logical check applies
    expect(isSafePath(tmpDir, ".ai/work/future.md")).toBe(true);
  });
});
