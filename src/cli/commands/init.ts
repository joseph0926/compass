import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  CAPSULE_PROJECT,
  CAPSULE_CONVENTIONS,
  CAPSULE_STATUS,
} from "../../core/spec/templates.js";

const DIRS = [
  ".ai/specs",
  ".ai/work",
  ".ai/trace",
  ".ai/capsule",
] as const;

const CAPSULE_FILES: Record<string, string> = {
  ".ai/capsule/PROJECT.md": CAPSULE_PROJECT,
  ".ai/capsule/CONVENTIONS.md": CAPSULE_CONVENTIONS,
  ".ai/capsule/STATUS.md": CAPSULE_STATUS,
};

const CLAUDE_MD_IMPORT = "@.ai/work/pin.md";
const CLAUDE_MD_MINIMAL_TEMPLATE = `# Project Memory (CLAUDE.md)

> This file is loaded by Claude Code for project-level context.
`;

type ClaudeMdStatus = "created" | "patched" | "unchanged";

export function runInit(cwd: string): void {
  // 1. 디렉토리 생성
  for (const dir of DIRS) {
    mkdirSync(join(cwd, dir), { recursive: true });
  }

  // 2. capsule 파일 생성 (기존 파일은 덮어쓰지 않음)
  for (const [path, content] of Object.entries(CAPSULE_FILES)) {
    const fullPath = join(cwd, path);
    if (!existsSync(fullPath)) {
      writeFileSync(fullPath, content, "utf-8");
    }
  }

  // 3. CLAUDE.md 생성/패치 + pin.md import 보장
  const claudeMdStatus = ensureClaudeMdWithPinImport(cwd);

  console.log("✔ Compass initialized");
  console.log("  Created: .ai/specs/, .ai/work/, .ai/trace/, .ai/capsule/");
  if (claudeMdStatus === "created") {
    console.log("  CLAUDE.md: created + @.ai/work/pin.md import added");
  } else if (claudeMdStatus === "patched") {
    console.log("  CLAUDE.md: @.ai/work/pin.md import added");
  } else {
    console.log("  CLAUDE.md: unchanged (PIN import already present)");
  }
  console.log("");
  console.log("Next steps:");
  console.log('  compass spec new "My Task"  — create your first spec & PIN');
}

function ensureClaudeMdWithPinImport(cwd: string): ClaudeMdStatus {
  const claudeMdPath = join(cwd, "CLAUDE.md");
  let status: ClaudeMdStatus = "unchanged";

  if (!existsSync(claudeMdPath)) {
    writeFileSync(claudeMdPath, CLAUDE_MD_MINIMAL_TEMPLATE, "utf-8");
    status = "created";
  }

  const content = readFileSync(claudeMdPath, "utf-8");
  if (content.includes(CLAUDE_MD_IMPORT)) return status;

  // import 라인이 없으면 파일 선두에 추가
  const patched = `${CLAUDE_MD_IMPORT}\n${content}`;
  writeFileSync(claudeMdPath, patched, "utf-8");
  if (status !== "created") {
    status = "patched";
  }
  return status;
}
