import { Command } from "commander";
import { runPinInject } from "../../hooks/pin-inject.js";
import { runSpecSync } from "../../hooks/spec-sync.js";
import { runQualityGate } from "../../hooks/quality-gate.js";

export const hookCommand = new Command("hook")
  .description("Hook handlers for Claude Code");

hookCommand
  .command("pin-inject")
  .description("UserPromptSubmit hook: inject PIN context")
  .action(async () => {
    await runPinInject();
  });

hookCommand
  .command("spec-sync")
  .description("PreCompact hook: sync PIN/SPEC files")
  .action(async () => {
    await runSpecSync();
  });

hookCommand
  .command("quality-gate")
  .description("Stop hook: run quality gates")
  .action(async () => {
    await runQualityGate();
  });
