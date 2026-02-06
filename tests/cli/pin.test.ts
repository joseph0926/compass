import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runPin } from "../../src/cli/commands/pin.js";

describe("runPin", () => {
  let tmpDir: string;
  let originalExitCode: number | undefined;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "compass-pin-cli-test-"));
    originalExitCode = process.exitCode;
    process.exitCode = undefined;
  });

  afterEach(() => {
    process.exitCode = originalExitCode;
    rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("returns usage error for unknown subcommand", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await runPin(tmpDir, ["unknown"]);

    expect(process.exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith("Usage: compass pin interview");
  });

  it("fails when current.json is missing", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await runPin(tmpDir, ["interview"]);

    expect(process.exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(
      "Missing .ai/work/current.json. Run `compass spec new \"<title>\"` first.",
    );
  });

  it("fails in non-interactive shell (non-TTY)", async () => {
    mkdirSync(join(tmpDir, ".ai/work"), { recursive: true });
    writeFileSync(
      join(tmpDir, ".ai/work/current.json"),
      JSON.stringify({
        active_spec: ".ai/specs/SPEC-20260206-home.md",
        pin: ".ai/work/pin.md",
        title: "Compass 홈페이지",
        tags: [],
        updated_at: "2026-02-06T00:00:00.000Z",
      }),
      "utf-8",
    );

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await runPin(tmpDir, ["interview"]);

    expect(process.exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(
      "`compass pin interview` requires an interactive terminal (TTY).",
    );
  });
});
