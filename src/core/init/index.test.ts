import { describe, test, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { runInit } from "./index.js";

describe("runInit", () => {
  let tempDir: string;

  beforeEach(async () => {
    // Arrange: 임시 디렉토리 생성
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "compass-test-"));
  });

  afterEach(async () => {
    // Cleanup: 임시 디렉토리 삭제
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test("should create .ai/ directory structure", async () => {
    // Act
    const result = await runInit({
      force: false,
      skipClaudeMd: true,
      cwd: tempDir,
    });

    // Assert
    expect(result.success).toBe(true);
    if (!result.success) return;

    const aiDirs = [".ai/specs", ".ai/work", ".ai/trace", ".ai/capsule"];
    for (const dir of aiDirs) {
      const stat = await fs.stat(path.join(tempDir, dir));
      expect(stat.isDirectory()).toBe(true);
    }
  });

  test("should create capsule template files", async () => {
    // Act
    const result = await runInit({
      force: false,
      skipClaudeMd: true,
      cwd: tempDir,
    });

    // Assert
    expect(result.success).toBe(true);
    if (!result.success) return;

    const expectedFiles = ["PROJECT.md", "CONVENTIONS.md", "STATUS.md"];
    for (const file of expectedFiles) {
      const content = await fs.readFile(
        path.join(tempDir, ".ai/capsule", file),
        "utf-8"
      );
      expect(content).toContain("##");
    }

    expect(result.created).toContain(".ai/capsule/PROJECT.md");
    expect(result.created).toContain(".ai/capsule/CONVENTIONS.md");
    expect(result.created).toContain(".ai/capsule/STATUS.md");
  });

  test("should create .claude/settings.local.json with hooks", async () => {
    // Act
    const result = await runInit({
      force: false,
      skipClaudeMd: true,
      cwd: tempDir,
    });

    // Assert
    expect(result.success).toBe(true);
    if (!result.success) return;

    const settingsPath = path.join(tempDir, ".claude/settings.local.json");
    const content = await fs.readFile(settingsPath, "utf-8");
    const settings = JSON.parse(content) as { hooks: unknown };

    expect(settings.hooks).toBeDefined();
    expect(result.created).toContain(".claude/settings.local.json");
  });

  test("should skip existing files without --force", async () => {
    // Arrange: 먼저 한번 실행
    await runInit({
      force: false,
      skipClaudeMd: true,
      cwd: tempDir,
    });

    // Act: 두 번째 실행
    const result = await runInit({
      force: false,
      skipClaudeMd: true,
      cwd: tempDir,
    });

    // Assert
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.skipped).toContain(".ai/capsule/PROJECT.md");
    expect(result.skipped).toContain(".claude/settings.local.json");
  });

  test("should overwrite existing files with --force", async () => {
    // Arrange: 먼저 한번 실행
    await runInit({
      force: false,
      skipClaudeMd: true,
      cwd: tempDir,
    });

    // Act: --force로 두 번째 실행
    const result = await runInit({
      force: true,
      skipClaudeMd: true,
      cwd: tempDir,
    });

    // Assert
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.created).toContain(".ai/capsule/PROJECT.md");
    expect(result.skipped.length).toBe(0);
  });

  test("should patch CLAUDE.md with PIN import", async () => {
    // Arrange: CLAUDE.md 생성
    const claudeMdPath = path.join(tempDir, "CLAUDE.md");
    await fs.writeFile(claudeMdPath, "# Project\n\nSome content", "utf-8");

    // Act
    const result = await runInit({
      force: false,
      skipClaudeMd: false,
      cwd: tempDir,
    });

    // Assert
    expect(result.success).toBe(true);
    if (!result.success) return;

    const content = await fs.readFile(claudeMdPath, "utf-8");
    expect(content).toContain("@.ai/work/pin.md");
    expect(result.created).toContain("CLAUDE.md (patched)");
  });

  test("should skip CLAUDE.md if already has import", async () => {
    // Arrange: 이미 import가 있는 CLAUDE.md
    const claudeMdPath = path.join(tempDir, "CLAUDE.md");
    await fs.writeFile(
      claudeMdPath,
      "@.ai/work/pin.md\n\n# Project",
      "utf-8"
    );

    // Act
    const result = await runInit({
      force: false,
      skipClaudeMd: false,
      cwd: tempDir,
    });

    // Assert
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.skipped).toContain("CLAUDE.md (already has import)");
  });

  describe("patchSettings", () => {
    test("should add hooks to existing settings without hooks key", async () => {
      // Arrange: hooks 없는 settings.local.json 생성
      const claudeDir = path.join(tempDir, ".claude");
      await fs.mkdir(claudeDir, { recursive: true });
      await fs.writeFile(
        path.join(claudeDir, "settings.local.json"),
        JSON.stringify({ permissions: { allow: ["Read"] } }, null, 2),
        "utf-8"
      );

      // Act
      const result = await runInit({
        force: false,
        skipClaudeMd: true,
        cwd: tempDir,
      });

      // Assert
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.created).toContain(
        ".claude/settings.local.json (hooks added)"
      );

      const content = await fs.readFile(
        path.join(claudeDir, "settings.local.json"),
        "utf-8"
      );
      const settings = JSON.parse(content) as {
        permissions: unknown;
        hooks: unknown;
      };

      // 기존 설정 보존 확인
      expect(settings.permissions).toEqual({ allow: ["Read"] });
      // hooks 추가 확인
      expect(settings.hooks).toBeDefined();
    });

    test("should warn when hooks exist but no Compass hooks", async () => {
      // Arrange: Compass 훅 없는 hooks가 있는 settings.local.json
      const claudeDir = path.join(tempDir, ".claude");
      await fs.mkdir(claudeDir, { recursive: true });
      await fs.writeFile(
        path.join(claudeDir, "settings.local.json"),
        JSON.stringify(
          {
            hooks: {
              UserPromptSubmit: [{ matcher: "", commands: ["echo test"] }],
            },
          },
          null,
          2
        ),
        "utf-8"
      );

      // Act
      const result = await runInit({
        force: false,
        skipClaudeMd: true,
        cwd: tempDir,
      });

      // Assert
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.skipped).toContain(".claude/settings.local.json");
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("hooks가 있지만 Compass 훅이 없습니다");
    });

    test("should warn on invalid JSON in settings", async () => {
      // Arrange: 잘못된 JSON
      const claudeDir = path.join(tempDir, ".claude");
      await fs.mkdir(claudeDir, { recursive: true });
      await fs.writeFile(
        path.join(claudeDir, "settings.local.json"),
        "{ invalid json }",
        "utf-8"
      );

      // Act
      const result = await runInit({
        force: false,
        skipClaudeMd: true,
        cwd: tempDir,
      });

      // Assert
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.skipped).toContain(".claude/settings.local.json");
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("파싱 실패");
    });

    test("should silently skip when Compass hooks already exist", async () => {
      // Arrange: Compass 훅이 이미 있는 settings.local.json
      const claudeDir = path.join(tempDir, ".claude");
      await fs.mkdir(claudeDir, { recursive: true });
      await fs.writeFile(
        path.join(claudeDir, "settings.local.json"),
        JSON.stringify(
          {
            hooks: {
              UserPromptSubmit: [
                {
                  matcher: "",
                  commands: ["echo 'compass hook: pin-inject'"],
                },
              ],
            },
          },
          null,
          2
        ),
        "utf-8"
      );

      // Act
      const result = await runInit({
        force: false,
        skipClaudeMd: true,
        cwd: tempDir,
      });

      // Assert
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.skipped).toContain(".claude/settings.local.json");
      expect(result.warnings.length).toBe(0);
    });
  });
});
