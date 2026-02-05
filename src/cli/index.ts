#!/usr/bin/env node

import { parseArgs } from "node:util";
import { runInit } from "./commands/init.js";
import { runSpec } from "./commands/spec.js";
import { runHook } from "../hooks/index.js";
import { runCapsule } from "./commands/capsule.js";

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    printUsage();
    return;
  }

  const cwd = process.cwd();

  switch (command) {
    case "init":
      runInit(cwd);
      break;

    case "spec":
      runSpec(cwd, args.slice(1));
      break;

    case "hook":
      runHook(args[1], cwd);
      break;

    case "capsule":
      runCapsule(cwd, args.slice(1));
      break;

    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exitCode = 1;
  }
}

function printUsage(): void {
  console.log(`Usage: compass <command>

Commands:
  init                    Initialize .ai/ skeleton & capsule templates
  spec new <title>        Create a new SPEC + PIN + current.json
  hook pin-inject         [Hook] Inject PIN into context (UserPromptSubmit)
  hook spec-sync          [Hook] Sync PIN on compact (PreCompact)
  capsule sync            Generate capsule update prompt from diff + PIN
  capsule sync --hook     Same, but output as hook JSON
`);
}

main();
