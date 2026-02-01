/**
 * UserPromptSubmit hook 출력
 */
export interface UserPromptSubmitOutput {
  hookSpecificOutput: {
    hookEventName: "UserPromptSubmit";
    additionalContext: string;
  };
}

/**
 * PreToolUse hook 출력
 */
export interface PreToolUseOutput {
  hookSpecificOutput: {
    hookEventName: "PreToolUse";
    permissionDecision: "allow" | "deny" | "ask";
    permissionDecisionReason?: string;
    updatedInput?: Record<string, unknown>;
    additionalContext?: string;
  };
}

/**
 * Stop hook 블록 출력
 */
export interface StopBlockOutput {
  decision: "block";
  reason: string;
}

export type HookOutput =
  | UserPromptSubmitOutput
  | PreToolUseOutput
  | StopBlockOutput;

/**
 * stdout으로 JSON 출력
 */
export function writeOutput(output: HookOutput): void {
  console.log(JSON.stringify(output));
}
