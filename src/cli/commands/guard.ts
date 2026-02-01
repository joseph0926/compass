import { Command } from "commander";

export const guardCommand = new Command("guard")
  .description("Quality governor (MVP-3)");

guardCommand
  .command("status")
  .description("Show gate status")
  .action(async () => {
    console.log("TODO: show gate status");
  });

guardCommand
  .command("run [level]")
  .description("Run quality gates manually")
  .action(async (level?: string) => {
    console.log(`TODO: run gates at level ${level ?? "default"}`);
  });
