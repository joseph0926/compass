import { generateSpec } from "../../core/spec/generator.js";

export function runSpec(cwd: string, args: string[]): void {
  const subcommand = args[0];

  if (subcommand === "new") {
    const title = args.slice(1).join(" ");
    if (!title) {
      console.error('Usage: compass spec new <title>');
      process.exitCode = 1;
      return;
    }

    const result = generateSpec(cwd, title);
    console.log("✔ Spec created");
    console.log(`  SPEC: ${result.specPath}`);
    console.log(`  PIN:  ${result.pinPath}`);
    console.log(`  PTR:  ${result.currentJsonPath}`);
    return;
  }

  console.error(`Unknown spec subcommand: ${subcommand ?? "(none)"}`);
  console.error("Usage: compass spec new <title>");
  process.exitCode = 1;
}
