#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { specCommand } from "./commands/spec.js";
import { hookCommand } from "./commands/hook.js";
import { traceCommand } from "./commands/trace.js";
import { coachCommand } from "./commands/coach.js";
import { guardCommand } from "./commands/guard.js";

const program = new Command();

program
  .name("compass")
  .description("Closed-loop operations layer for Claude Code")
  .version("0.1.0");

program.addCommand(initCommand);
program.addCommand(specCommand);
program.addCommand(hookCommand);
program.addCommand(traceCommand);
program.addCommand(coachCommand);
program.addCommand(guardCommand);

program.parse();
