import * as fs from "node:fs/promises";
import * as path from "node:path";
import { CAPSULE_TEMPLATES } from "./templates.js";
import { SETTINGS_TEMPLATE } from "./settings-template.js";

export interface InitOptions {
  force: boolean;
  skipClaudeMd: boolean;
  cwd: string;
}

export interface InitResult {
  success: true;
  created: string[];
  skipped: string[];
  warnings: string[];
}

export interface InitError {
  success: false;
  error: string;
}

export async function runInit(
  options: InitOptions,
): Promise<InitResult | InitError> {
  const { force, skipClaudeMd, cwd } = options;

  const created: string[] = [];
  const skipped: string[] = [];
  const warnings: string[] = [];

  try {
    const aiDirs = [".ai/specs", ".ai/work", ".ai/trace", ".ai/capsule"];

    for (const dir of aiDirs) {
      const fullPath = path.join(cwd, dir);
      await fs.mkdir(fullPath, { recursive: true });
    }

    for (const [filename, content] of Object.entries(CAPSULE_TEMPLATES)) {
      const filePath = path.join(cwd, ".ai/capsule", filename);
      const exists = await fileExists(filePath);

      if (exists && !force) {
        skipped.push(`.ai/capsule/${filename}`);
      } else {
        await fs.writeFile(filePath, content, "utf-8");
        created.push(`.ai/capsule/${filename}`);
      }
    }

    const claudeDirs = [
      ".claude/skills/spec",
      ".claude/skills/trace",
      ".claude/skills/coach",
      ".claude/skills/guard",
    ];

    for (const dir of claudeDirs) {
      const fullPath = path.join(cwd, dir);
      await fs.mkdir(fullPath, { recursive: true });
    }

    const settingsPath = path.join(cwd, ".claude/settings.local.json");
    const settingsResult = await patchSettings(settingsPath, force);

    if (settingsResult.action === "created") {
      created.push(".claude/settings.local.json");
    } else if (settingsResult.action === "hooks_added") {
      created.push(".claude/settings.local.json (hooks added)");
    } else if (settingsResult.action === "skipped") {
      skipped.push(".claude/settings.local.json");
      if (settingsResult.warning) {
        warnings.push(settingsResult.warning);
      }
    }

    if (!skipClaudeMd) {
      const claudeMdResult = await patchClaudeMd(cwd, force);
      if (claudeMdResult.patched) {
        created.push("CLAUDE.md (patched)");
      } else if (claudeMdResult.skipped) {
        skipped.push("CLAUDE.md (already has import)");
      }
    }

    return { success: true, created, skipped, warnings };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

interface SettingsResult {
  action: "created" | "hooks_added" | "skipped";
  warning?: string;
}

async function patchSettings(
  settingsPath: string,
  force: boolean,
): Promise<SettingsResult> {
  const exists = await fileExists(settingsPath);

  if (!exists) {
    await fs.writeFile(settingsPath, SETTINGS_TEMPLATE, "utf-8");
    return { action: "created" };
  }

  if (force) {
    await fs.writeFile(settingsPath, SETTINGS_TEMPLATE, "utf-8");
    return { action: "created" };
  }

  try {
    const content = await fs.readFile(settingsPath, "utf-8");
    const existing = JSON.parse(content) as Record<string, unknown>;
    const compassHooks = JSON.parse(SETTINGS_TEMPLATE) as {
      hooks: Record<string, unknown>;
    };

    if (!existing.hooks) {
      existing.hooks = compassHooks.hooks;
      await fs.writeFile(
        settingsPath,
        JSON.stringify(existing, null, 2),
        "utf-8",
      );
      return { action: "hooks_added" };
    }

    const hasCompassHooks = JSON.stringify(existing.hooks).includes(
      "compass hook",
    );

    if (hasCompassHooks) {
      return { action: "skipped" };
    }

    return {
      action: "skipped",
      warning:
        "settings.local.json에 hooks가 있지만 Compass 훅이 없습니다. " +
        "수동으로 추가하거나 --force로 덮어쓰세요.",
    };
  } catch {
    return {
      action: "skipped",
      warning:
        "settings.local.json 파싱 실패. 수동으로 확인하거나 --force로 덮어쓰세요.",
    };
  }
}

interface PatchResult {
  patched: boolean;
  skipped: boolean;
}

async function patchClaudeMd(
  cwd: string,
  _force: boolean,
): Promise<PatchResult> {
  const claudeMdPath = path.join(cwd, "CLAUDE.md");
  const pinImport = "@.ai/work/pin.md";

  try {
    const content = await fs.readFile(claudeMdPath, "utf-8");

    if (content.includes(pinImport)) {
      return { patched: false, skipped: true };
    }

    const newContent = `${pinImport}\n\n${content}`;
    await fs.writeFile(claudeMdPath, newContent, "utf-8");

    return { patched: true, skipped: false };
  } catch {
    return { patched: false, skipped: false };
  }
}
