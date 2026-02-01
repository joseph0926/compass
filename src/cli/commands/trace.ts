import { Command } from "commander";

export const traceCommand = new Command("trace")
  .description("View and analyze trace events (MVP-2)");

traceCommand
  .command("last [n]")
  .description("Show last N events")
  .action(async (n?: string) => {
    console.log(`TODO: show last ${n ?? 10} events`);
  });

traceCommand
  .command("why [event]")
  .description("Explain why automation was triggered")
  .action(async (event?: string) => {
    console.log(`TODO: explain ${event ?? "last event"}`);
  });

traceCommand
  .command("stats [period]")
  .description("Show statistics summary")
  .action(async (period?: string) => {
    console.log(`TODO: show stats for ${period ?? "last 7 days"}`);
  });
