import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import type { CurrentJson, HookOutput } from "../core/types.js";
import { isSafePath } from "./pin-inject.js";

/**
 * PreCompact hook: compact 전에 PIN/SPEC 갱신 지시 주입
 *
 * stdin: Claude Code Hook JSON (파싱은 runHook에서 수행)
 * stdout: hookSpecificOutput JSON (활성 스펙 있을 때만)
 */
export function runSpecSync(cwd: string): void {
  const currentPath = join(cwd, ".ai/work/current.json");
  if (!existsSync(currentPath)) return;

  let current: CurrentJson;
  try {
    current = JSON.parse(readFileSync(currentPath, "utf-8"));
  } catch {
    return;
  }

  // P0: 경로 traversal 방어
  if (!isSafePath(cwd, current.pin) || !isSafePath(cwd, current.active_spec)) return;

  const pinPath = resolve(cwd, current.pin);
  const specPath = resolve(cwd, current.active_spec);

  if (!existsSync(pinPath) || !existsSync(specPath)) return;

  const instruction = [
    "<compass-spec-sync>",
    "Before compacting, update the following files to reflect this session's progress:",
    "",
    `1. PIN (${current.pin}):`,
    "   - Update Goal/Must-have/Constraints/Acceptance Criteria if decisions were made",
    "   - Keep it concise (PIN must stay ≤30 lines)",
    "",
    `2. SPEC (${current.active_spec}):`,
    "   - Add a Change Log entry with today's date and a summary of what was decided/implemented",
    "   - Update any Must-have/Nice-to-have items that were completed or changed",
    "",
    "Only update if meaningful changes occurred. Do not add noise.",
    "</compass-spec-sync>",
  ].join("\n");

  const output: HookOutput = {
    hookSpecificOutput: {
      hookEventName: "PreCompact",
      additionalContext: instruction,
    },
  };

  process.stdout.write(JSON.stringify(output));
}
