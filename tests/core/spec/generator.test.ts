import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { generateSpec, toSlug, todayDate } from "../../../src/core/spec/generator.js";
import type { CurrentJson } from "../../../src/core/types.js";

describe("toSlug", () => {
  it("converts title to kebab-case slug", () => {
    expect(toSlug("MVP-1 구현")).toBe("mvp-1-구현");
  });

  it("trims and normalizes whitespace", () => {
    expect(toSlug("  Hello   World  ")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(toSlug("feat: add login!")).toBe("feat-add-login");
  });
});

describe("todayDate", () => {
  it("returns YYYYMMDD format", () => {
    const d = todayDate();
    expect(d).toMatch(/^\d{8}$/);
  });
});

describe("generateSpec", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "compass-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates SPEC, PIN, and current.json files", () => {
    const result = generateSpec(tmpDir, "Test Spec", "20260205");

    expect(result.specPath).toBe(".ai/specs/SPEC-20260205-test-spec.md");
    expect(result.pinPath).toBe(".ai/work/pin.md");
    expect(result.currentJsonPath).toBe(".ai/work/current.json");

    // SPEC 파일 존재 및 내용 확인
    const specContent = readFileSync(join(tmpDir, result.specPath), "utf-8");
    expect(specContent).toContain("# SPEC: Test Spec");
    expect(specContent).toContain("## Goal");
    expect(specContent).toContain("## Must-have");
    expect(specContent).toContain("## Acceptance Criteria");

    // PIN 파일 존재 및 내용 확인
    const pinContent = readFileSync(join(tmpDir, result.pinPath), "utf-8");
    expect(pinContent).toContain("# PIN");
    expect(pinContent).toContain("## Goal");
    expect(pinContent).toContain("## Must-have");
    expect(pinContent).toContain("## Constraints");
    expect(pinContent).toContain("## Acceptance Criteria");
    expect(pinContent).toContain("## Pointer");
    expect(pinContent).toContain(result.specPath);

    // current.json 존재 및 구조 확인
    const current: CurrentJson = JSON.parse(
      readFileSync(join(tmpDir, result.currentJsonPath), "utf-8"),
    );
    expect(current.active_spec).toBe(result.specPath);
    expect(current.pin).toBe(".ai/work/pin.md");
    expect(current.title).toBe("Test Spec");
    expect(current.tags).toEqual([]);
    expect(current.updated_at).toBeTruthy();
  });

  it("creates .ai directories if they don't exist", () => {
    generateSpec(tmpDir, "Auto Dir", "20260205");

    expect(existsSync(join(tmpDir, ".ai/specs"))).toBe(true);
    expect(existsSync(join(tmpDir, ".ai/work"))).toBe(true);
  });

  it("handles Korean titles in slug", () => {
    const result = generateSpec(tmpDir, "MVP-1 구현", "20260205");
    expect(result.specPath).toBe(".ai/specs/SPEC-20260205-mvp-1-구현.md");
  });
});
