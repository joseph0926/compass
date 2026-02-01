import { Command } from "commander";

export const specCommand = new Command("spec")
  .description("Manage specifications");

specCommand
  .command("new <title>")
  .description("Create a new specification with PIN")
  .option("--goal <goal>", "Goal description")
  .action(async (title: string, options: { goal?: string }) => {
    // TODO: MVP-1 구현
    console.log(`Creating spec: ${title}`);
    if (options.goal) {
      console.log(`Goal: ${options.goal}`);
    }
    console.log("TODO: implement spec new");
  });

specCommand
  .command("condense")
  .description("Condense current request into spec format")
  .action(async () => {
    // TODO: MVP-1 구현
    console.log("TODO: implement spec condense");
  });

specCommand
  .command("status")
  .description("Show active spec status")
  .action(async () => {
    // TODO: MVP-1 구현
    console.log("TODO: implement spec status");
  });
