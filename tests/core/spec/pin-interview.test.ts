import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  buildGoal,
  buildPinContent,
  parseListInput,
  resolvePinContext,
} from "../../../src/core/spec/pin-interview.js";

describe("resolvePinContext", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "compass-pin-interview-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns null when current.json is missing", () => {
    expect(resolvePinContext(tmpDir)).toBeNull();
  });

  it("returns parsed context from current.json", () => {
    mkdirSync(join(tmpDir, ".ai/work"), { recursive: true });
    writeFileSync(
      join(tmpDir, ".ai/work/current.json"),
      JSON.stringify(
        {
          active_spec: ".ai/specs/SPEC-20260206-home.md",
          pin: ".ai/work/pin.md",
          title: "Compass 홈페이지",
          tags: [],
          updated_at: "2026-02-06T00:00:00.000Z",
        },
        null,
        2,
      ),
      "utf-8",
    );

    const context = resolvePinContext(tmpDir);
    expect(context).toEqual({
      title: "Compass 홈페이지",
      specPath: ".ai/specs/SPEC-20260206-home.md",
      pinPath: ".ai/work/pin.md",
      currentJsonPath: ".ai/work/current.json",
    });
  });

  it("throws when required fields are invalid", () => {
    mkdirSync(join(tmpDir, ".ai/work"), { recursive: true });
    writeFileSync(
      join(tmpDir, ".ai/work/current.json"),
      JSON.stringify({ title: "", pin: ".ai/work/pin.md" }),
      "utf-8",
    );

    expect(() => resolvePinContext(tmpDir)).toThrow(
      "Invalid current.json: title/active_spec/pin is required",
    );
  });
});

describe("pin interview helpers", () => {
  it("buildGoal prefers explicit goal", () => {
    const goal = buildGoal({
      title: "Compass 홈페이지",
      goal: "Compass 공식 홈페이지를 구축한다.",
      targetUser: "개발자",
      primaryCta: "npx compass-ai 실행",
    });
    expect(goal).toBe("Compass 공식 홈페이지를 구축한다.");
  });

  it("buildGoal composes fallback goal", () => {
    const goal = buildGoal({
      title: "Compass 홈페이지",
      goal: "  ",
      targetUser: "초보 개발자",
      primaryCta: "설치 가이드 확인",
    });
    expect(goal).toContain("초보 개발자");
    expect(goal).toContain("설치 가이드 확인");
    expect(goal).toContain("Compass 홈페이지");
  });

  it("buildGoal avoids duplicated homepage suffix", () => {
    const goal = buildGoal({
      title: "Compass 홈페이지",
      goal: "",
      targetUser: "개발자",
      primaryCta: "설치 가이드 확인",
    });
    expect(goal).toContain("Compass 홈페이지를 구축한다");
    expect(goal).not.toContain("홈페이지 홈페이지");
  });

  it("parseListInput parses comma/newline and deduplicates", () => {
    const parsed = parseListInput(
      "A, B, a\n- C\n\n",
      ["fallback-1", "fallback-2"],
    );
    expect(parsed).toEqual(["A", "B", "C"]);
  });

  it("parseListInput uses fallback when input is empty", () => {
    const fallback = ["X", "Y"];
    expect(parseListInput("   ", fallback)).toEqual(fallback);
  });

  it("buildPinContent renders all sections", () => {
    const content = buildPinContent({
      goal: "Goal line",
      mustHave: ["A", "B"],
      constraints: ["C"],
      acceptanceCriteria: ["D"],
      specPath: ".ai/specs/SPEC-20260206-home.md",
    });
    expect(content).toContain("# PIN");
    expect(content).toContain("## Goal");
    expect(content).toContain("- A");
    expect(content).toContain("## Pointer");
    expect(content).toContain(".ai/specs/SPEC-20260206-home.md");
  });
});
