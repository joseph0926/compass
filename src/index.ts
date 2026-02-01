// Core exports
export { runInit, type InitOptions, type InitResult, type InitError } from "./core/init/index.js";

// Hook exports
export { runPinInject } from "./hooks/pin-inject.js";
export { runSpecSync } from "./hooks/spec-sync.js";
export { runQualityGate } from "./hooks/quality-gate.js";

// Hook utility exports
export type { HookInput } from "./hooks/utils/stdin.js";
export type {
  HookOutput,
  UserPromptSubmitOutput,
  PreToolUseOutput,
  StopBlockOutput,
} from "./hooks/utils/stdout.js";
