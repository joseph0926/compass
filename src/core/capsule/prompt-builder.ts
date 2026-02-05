import type { CapsuleFiles, DiffSignal } from "../types.js";

interface PromptBuildInput {
  diff: DiffSignal;
  capsule: CapsuleFiles;
  pin: string | null;
}

interface SectionUpdate {
  file: string;
  section: string;
  reason: string;
}

/**
 * DiffSignal + 기존 capsule + PIN → AI 지시 프롬프트 조립
 */
export function buildCapsulePrompt(input: PromptBuildInput): string {
  const { diff, capsule, pin } = input;

  if (!diff.has_changes) {
    return "No changes detected. Capsule files are up to date.";
  }

  const updates = determineSectionUpdates(diff, pin);

  if (updates.length === 0) {
    return "Changes detected but no capsule sections need updating.";
  }

  const parts: string[] = [];

  // Header
  parts.push("# Capsule Sync Prompt");
  parts.push("");
  parts.push("Based on the current diff, update the following capsule files.");
  parts.push("");

  // PIN 기준 (있으면)
  if (pin) {
    parts.push("## Active PIN (filtering criteria)");
    parts.push("");
    parts.push(pin);
    parts.push("");
    parts.push(
      "> Only reflect changes relevant to the PIN's Goal/Must-have. For unrelated changes, note them briefly under STATUS.md Recent Changes.",
    );
    parts.push("");
  }

  // Diff 요약
  parts.push("## Changes Detected");
  parts.push("");
  for (const f of diff.changed_files) {
    parts.push(`- [${f.status}] ${f.path} (${f.category})`);
  }
  if (diff.new_deps.length > 0) {
    parts.push("");
    parts.push(`New dependencies: ${diff.new_deps.join(", ")}`);
  }
  parts.push("");

  // 갱신 지시
  parts.push("## Sections to Update");
  parts.push("");
  for (const u of updates) {
    parts.push(`### ${u.file} → ${u.section}`);
    parts.push(`Reason: ${u.reason}`);
    parts.push("");
  }

  // 기존 내용 참조
  parts.push("## Current Capsule Contents");
  parts.push("");
  if (capsule.project) {
    parts.push("### PROJECT.md");
    parts.push(capsule.project);
    parts.push("");
  }
  if (capsule.conventions) {
    parts.push("### CONVENTIONS.md");
    parts.push(capsule.conventions);
    parts.push("");
  }
  if (capsule.status) {
    parts.push("### STATUS.md");
    parts.push(capsule.status);
    parts.push("");
  }

  // 지시사항
  parts.push("## Instructions");
  parts.push("");
  parts.push("1. Read the sections listed above");
  parts.push(
    "2. Update ONLY the listed sections with concise, factual information",
  );
  parts.push("3. Preserve existing content that is still accurate");
  parts.push("4. Do not add speculative or placeholder content");
  parts.push("5. Write the updated files to their respective paths");

  return parts.join("\n");
}

/**
 * diff + PIN으로 어떤 섹션을 갱신해야 하는지 결정
 */
export function determineSectionUpdates(
  diff: DiffSignal,
  pin: string | null,
): SectionUpdate[] {
  const updates: SectionUpdate[] = [];

  // package.json 변경 → Tech Stack
  if (diff.new_deps.length > 0 || diff.changed_files.some((f) => f.category === "package")) {
    updates.push({
      file: "PROJECT.md",
      section: "Tech Stack",
      reason: diff.new_deps.length > 0
        ? `New dependencies added: ${diff.new_deps.join(", ")}`
        : "Package configuration changed",
    });
  }

  // 설정 파일 변경 → Conventions
  if (diff.config_changed) {
    updates.push({
      file: "CONVENTIONS.md",
      section: "Style / relevant section",
      reason: "Configuration files changed",
    });
  }

  // 구조 변경 → Structure
  if (diff.structure_changed) {
    updates.push({
      file: "PROJECT.md",
      section: "Structure",
      reason: "Directory structure has changed significantly",
    });
  }

  // STATUS.md는 변경이 있으면 항상 갱신
  updates.push({
    file: "STATUS.md",
    section: "Recent Changes / Next Steps",
    reason: `${diff.changed_files.length} file(s) changed`,
  });

  return updates;
}
