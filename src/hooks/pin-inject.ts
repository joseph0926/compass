import { readFileSync, existsSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import type { CurrentJson, HookOutput } from "../core/types.js";

/**
 * 경로가 cwd/.ai/ 하위인지 검증 (path traversal + symlink 방어)
 *
 * 1) resolve()로 논리 경로가 .ai/ 하위인지 확인
 * 2) 파일이 존재하면 realpathSync()로 symlink 해석 후 실제 경로도 .ai/ 하위인지 재확인
 */
export function isSafePath(cwd: string, relPath: string): boolean {
  const resolved = resolve(cwd, relPath);
  const aiRoot = resolve(cwd, ".ai");

  // 1) 논리 경로 검증
  if (!resolved.startsWith(aiRoot + "/") && resolved !== aiRoot) {
    return false;
  }

  // 2) 실제 경로 검증 (symlink 해석)
  if (existsSync(resolved)) {
    try {
      const real = realpathSync(resolved);
      const realAiRoot = realpathSync(aiRoot);
      if (!real.startsWith(realAiRoot + "/") && real !== realAiRoot) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}

/**
 * UserPromptSubmit hook: PIN을 additionalContext로 주입
 *
 * stdin: Claude Code Hook JSON (파싱은 runHook에서 수행)
 * stdout: hookSpecificOutput JSON (PIN 있을 때만)
 */
export function runPinInject(cwd: string): void {
  const currentPath = join(cwd, ".ai/work/current.json");
  if (!existsSync(currentPath)) return;

  let current: CurrentJson;
  try {
    current = JSON.parse(readFileSync(currentPath, "utf-8"));
  } catch {
    return;
  }

  // P0: 경로 traversal 방어
  if (!isSafePath(cwd, current.pin)) return;

  const pinPath = resolve(cwd, current.pin);
  if (!existsSync(pinPath)) return;

  const pinContent = readFileSync(pinPath, "utf-8").trim();
  if (!pinContent) return;

  const output: HookOutput = {
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext: `<compass-pin>\n${pinContent}\n</compass-pin>`,
    },
  };

  process.stdout.write(JSON.stringify(output));
}
