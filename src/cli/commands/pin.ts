import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import {
  PIN_INTERVIEW_DEFAULTS,
  buildGoal,
  buildPinContent,
  parseListInput,
  resolvePinContext,
} from "../../core/spec/pin-interview.js";

export async function runPin(cwd: string, args: string[]): Promise<void> {
  const subcommand = args[0];

  if (subcommand !== "interview") {
    console.error(`Unknown pin subcommand: ${subcommand ?? "(none)"}`);
    console.error("Usage: compass pin interview");
    process.exitCode = 1;
    return;
  }

  const context = resolvePinContext(cwd);
  if (!context) {
    console.error(
      "Missing .ai/work/current.json. Run `compass spec new \"<title>\"` first.",
    );
    process.exitCode = 1;
    return;
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error("`compass pin interview` requires an interactive terminal (TTY).");
    process.exitCode = 1;
    return;
  }

  const defaultGoal = buildGoal({
    title: context.title,
    goal: "",
    targetUser: PIN_INTERVIEW_DEFAULTS.targetUser,
    primaryCta: PIN_INTERVIEW_DEFAULTS.primaryCta,
  });
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    console.log("PIN Interview (6 questions)");
    console.log(`  Title:   ${context.title}`);
    console.log(`  Pointer: ${context.specPath}`);
    console.log("");

    const goalInput = await askWithDefault(
      rl,
      "1) 홈페이지의 1문장 목표를 입력하세요.",
      defaultGoal,
    );
    const targetUser = await askWithDefault(
      rl,
      "2) 핵심 타겟 사용자를 입력하세요.",
      PIN_INTERVIEW_DEFAULTS.targetUser,
    );
    const primaryCta = await askWithDefault(
      rl,
      "3) 핵심 CTA 1개를 입력하세요.",
      PIN_INTERVIEW_DEFAULTS.primaryCta,
    );
    const mustHaveRaw = await askWithDefault(
      rl,
      "4) Must-have(3~5개)를 쉼표(,)로 입력하세요.",
      PIN_INTERVIEW_DEFAULTS.mustHave.join(", "),
    );
    const constraintsRaw = await askWithDefault(
      rl,
      "5) Constraints를 쉼표(,)로 입력하세요.",
      PIN_INTERVIEW_DEFAULTS.constraints.join(", "),
    );
    const acceptanceRaw = await askWithDefault(
      rl,
      "6) Acceptance Criteria(3~5개)를 쉼표(,)로 입력하세요.",
      PIN_INTERVIEW_DEFAULTS.acceptanceCriteria.join(", "),
    );

    const goal = buildGoal({
      title: context.title,
      goal: goalInput,
      targetUser,
      primaryCta,
    });
    const mustHave = parseListInput(mustHaveRaw, PIN_INTERVIEW_DEFAULTS.mustHave);
    const constraints = parseListInput(
      constraintsRaw,
      PIN_INTERVIEW_DEFAULTS.constraints,
    );
    const acceptanceCriteria = parseListInput(
      acceptanceRaw,
      PIN_INTERVIEW_DEFAULTS.acceptanceCriteria,
    );

    const pinContent = buildPinContent({
      goal,
      mustHave,
      constraints,
      acceptanceCriteria,
      specPath: context.specPath,
    });

    console.log("");
    console.log("Preview:");
    console.log("---------");
    console.log(pinContent);
    const confirm = await rl.question(
      "이 내용으로 .ai/work/pin.md를 저장할까요? [y/N]: ",
    );

    if (!isConfirmed(confirm)) {
      console.log("Cancelled. pin.md was not changed.");
      return;
    }

    writeFileSync(join(cwd, context.pinPath), pinContent, "utf-8");
    console.log("✔ PIN updated");
    console.log(`  PIN: ${context.pinPath}`);
    console.log(`  Pointer: ${context.specPath}`);
    console.log("  Next: continue development and run `compass capsule sync` at milestones");
  } finally {
    rl.close();
  }
}

async function askWithDefault(
  rl: ReturnType<typeof createInterface>,
  question: string,
  defaultValue: string,
): Promise<string> {
  const answer = await rl.question(`${question}\n   default: ${defaultValue}\n> `);
  const normalized = answer.trim();
  return normalized.length > 0 ? normalized : defaultValue;
}

function isConfirmed(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "y" || normalized === "yes";
}
