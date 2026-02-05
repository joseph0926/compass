import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { CapsuleFiles } from "../types.js";

/**
 * .ai/capsule/*.md + .ai/work/pin.md 읽기
 */
export function readCapsuleFiles(cwd: string): CapsuleFiles {
  return {
    project: readSafe(join(cwd, ".ai/capsule/PROJECT.md")),
    conventions: readSafe(join(cwd, ".ai/capsule/CONVENTIONS.md")),
    status: readSafe(join(cwd, ".ai/capsule/STATUS.md")),
  };
}

export function readPin(cwd: string): string | null {
  return readSafe(join(cwd, ".ai/work/pin.md"));
}

function readSafe(path: string): string | null {
  if (!existsSync(path)) return null;
  try {
    const content = readFileSync(path, "utf-8").trim();
    return content || null;
  } catch {
    return null;
  }
}
