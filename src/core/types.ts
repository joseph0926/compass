/**
 * Compass Core Types
 */

/** current.json — 활성 스펙 포인터 */
export interface CurrentJson {
  active_spec: string; // e.g. ".ai/specs/SPEC-20260205-mvp-1.md"
  pin: string; // e.g. ".ai/work/pin.md"
  title: string;
  tags: string[];
  updated_at: string; // ISO 8601
}

/** DiffSignal — git diff에서 추출한 변경 신호 */
export interface DiffSignal {
  changed_files: ChangedFile[];
  new_deps: string[];
  config_changed: boolean;
  structure_changed: boolean;
  has_changes: boolean;
}

export interface ChangedFile {
  status: "A" | "M" | "D" | "R" | "?"; // Added, Modified, Deleted, Renamed, Untracked
  path: string;
  category: FileCategory;
}

export type FileCategory =
  | "source"
  | "test"
  | "config"
  | "package"
  | "docs"
  | "other";

/** Capsule 파일 내용 (null = 파일 없음) */
export interface CapsuleFiles {
  project: string | null;
  conventions: string | null;
  status: string | null;
}

/** Hook 출력 구조 */
export interface HookOutput {
  hookSpecificOutput: {
    hookEventName: string;
    additionalContext?: string;
    permissionDecision?: "allow" | "deny" | "ask";
    permissionDecisionReason?: string;
  };
}
