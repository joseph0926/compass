import { Command } from "commander";

export const coachCommand = new Command("coach")
  .description("Personal automation coach (MVP-3)");

coachCommand
  .command("scan")
  .description("Scan for automation candidates")
  .option("--top <n>", "Number of candidates to show", "3")
  .action(async (options: { top: string }) => {
    console.log(`TODO: scan and show top ${options.top} candidates`);
  });

coachCommand
  .command("apply <id>")
  .description("Apply automation candidate")
  .action(async (id: string) => {
    console.log(`TODO: apply candidate ${id}`);
  });

coachCommand
  .command("rollback <id>")
  .description("Rollback applied automation")
  .action(async (id: string) => {
    console.log(`TODO: rollback ${id}`);
  });

coachCommand
  .command("report [period]")
  .description("Show effectiveness report")
  .action(async (period?: string) => {
    console.log(`TODO: show report for ${period ?? "last 7 days"}`);
  });

coachCommand
  .command("mode <level>")
  .description("Set coach mode (simple|pro|lab)")
  .action(async (level: string) => {
    console.log(`TODO: set mode to ${level}`);
  });
