import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { CurrentJson, HookOutput } from "../core/types.js";

/**
 * UserPromptSubmit hook: PIN을 additionalContext로 주입
 *
 * stdin: Claude Code Hook JSON
 * stdout: hookSpecificOutput JSON (PIN 있을 때만)
 * exit 0: 항상
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

  const pinPath = join(cwd, current.pin);
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
