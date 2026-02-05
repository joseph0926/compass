import { readCapsuleFiles, readPin } from "../../core/capsule/reader.js";
import { collectDiff } from "../../core/capsule/diff-collector.js";
import { buildCapsulePrompt } from "../../core/capsule/prompt-builder.js";
import type { HookOutput } from "../../core/types.js";

export function runCapsule(cwd: string, args: string[]): void {
  const subcommand = args[0];

  if (subcommand !== "sync") {
    console.error(`Unknown capsule subcommand: ${subcommand ?? "(none)"}`);
    console.error("Usage: compass capsule sync [--hook]");
    process.exitCode = 1;
    return;
  }

  const isHookMode = args.includes("--hook");
  const diff = collectDiff(cwd);
  const capsule = readCapsuleFiles(cwd);
  const pin = readPin(cwd);

  const prompt = buildCapsulePrompt({ diff, capsule, pin });

  if (isHookMode) {
    const output: HookOutput = {
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: prompt,
      },
    };
    process.stdout.write(JSON.stringify(output));
  } else {
    console.log(prompt);
  }
}
