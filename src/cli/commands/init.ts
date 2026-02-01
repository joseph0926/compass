import { Command } from "commander";
import { runInit } from "../../core/init/index.js";

export const initCommand = new Command("init")
  .description("Initialize Compass in current project")
  .option("--force", "Overwrite existing files")
  .option("--skip-claude-md", "Skip CLAUDE.md modification")
  .option("--cwd <path>", "Target directory (default: current directory)")
  .action(
    async (options: {
      force?: boolean;
      skipClaudeMd?: boolean;
      cwd?: string;
    }) => {
      const result = await runInit({
        force: options.force ?? false,
        skipClaudeMd: options.skipClaudeMd ?? false,
        cwd: options.cwd ?? process.cwd(),
      });

    if (result.success) {
      console.log("✓ Compass initialized successfully");
      console.log("");
      console.log("Created:");
      for (const file of result.created) {
        console.log(`  ${file}`);
      }
      if (result.skipped.length > 0) {
        console.log("");
        console.log("Skipped (already exists):");
        for (const file of result.skipped) {
          console.log(`  ${file}`);
        }
      }
    } else {
      console.error("✗ Initialization failed:", result.error);
      process.exit(1);
    }
  });
