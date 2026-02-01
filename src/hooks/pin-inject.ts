import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parseStdin, type HookInput } from "./utils/stdin.js";
import { writeOutput, type UserPromptSubmitOutput } from "./utils/stdout.js";

/**
 * UserPromptSubmit hook: PIN 내용을 additionalContext로 주입
 *
 * stdin: Claude Code hook JSON
 * stdout: { hookSpecificOutput: { ... } }
 */
export async function runPinInject(): Promise<void> {
  try {
    const input = await parseStdin<HookInput>();

    if (!input) {
      // stdin이 없으면 조용히 종료 (테스트 모드)
      process.exit(0);
    }

    const projectDir = process.env["CLAUDE_PROJECT_DIR"] ?? process.cwd();
    const pinPath = path.join(projectDir, ".ai/work/pin.md");

    let pinContent: string | null = null;

    try {
      pinContent = await fs.readFile(pinPath, "utf-8");
    } catch {
      // PIN 파일이 없으면 조용히 종료
      process.exit(0);
    }

    if (!pinContent || pinContent.trim() === "") {
      process.exit(0);
    }

    const output: UserPromptSubmitOutput = {
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext: `[Compass PIN]\n${pinContent.trim()}`,
      },
    };

    writeOutput(output);
    process.exit(0);
  } catch (error) {
    // 에러는 stderr로, 종료 코드 1
    console.error("pin-inject error:", error);
    process.exit(1);
  }
}
