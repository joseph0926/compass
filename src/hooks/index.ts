import { runPinInject } from "./pin-inject.js";
import { runSpecSync } from "./spec-sync.js";

/**
 * Hook 라우터: compass hook <name>
 */
export function runHook(name: string | undefined, cwd: string): void {
  // stdin을 소비 (hook은 stdin으로 JSON을 받지만, 현재 구현에서는 cwd 기반으로 동작)
  // stdin이 닫힐 때까지 대기하지 않고 바로 실행

  switch (name) {
    case "pin-inject":
      runPinInject(cwd);
      break;

    case "spec-sync":
      runSpecSync(cwd);
      break;

    default:
      console.error(`Unknown hook: ${name ?? "(none)"}`);
      console.error("Available hooks: pin-inject, spec-sync");
      process.exitCode = 1;
  }
}
