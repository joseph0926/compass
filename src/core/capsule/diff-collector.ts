import { execSync } from "node:child_process";
import type { DiffSignal, ChangedFile, FileCategory } from "../types.js";

/**
 * git diff + untracked files → DiffSignal 수집
 */
export function collectDiff(cwd: string): DiffSignal {
  const changed = getChangedFiles(cwd);
  const untracked = getUntrackedFiles(cwd);
  const allFiles = [...changed, ...untracked];

  const newDeps = extractNewDeps(cwd, allFiles);
  const configChanged = allFiles.some((f) => f.category === "config");
  const structureChanged = detectStructureChange(allFiles);

  return {
    changed_files: allFiles,
    new_deps: newDeps,
    config_changed: configChanged,
    structure_changed: structureChanged,
    has_changes: allFiles.length > 0,
  };
}

function getChangedFiles(cwd: string): ChangedFile[] {
  try {
    const output = execSync("git diff --name-status HEAD", {
      cwd,
      encoding: "utf-8",
      timeout: 5000,
    }).trim();

    if (!output) return [];

    const results: ChangedFile[] = [];
    for (const line of output.split("\n")) {
      const parts = line.split("\t");
      const statusCode = (parts[0]?.charAt(0) ?? "M") as ChangedFile["status"];

      if (statusCode === "R" && parts.length >= 3) {
        // Rename: R100\told\tnew → 기록 old(D) + new(A)
        const oldPath = parts[1] ?? "";
        const newPath = parts[2] ?? "";
        results.push({
          status: "D",
          path: oldPath,
          category: categorizeFile(oldPath),
        });
        results.push({
          status: "A",
          path: newPath,
          category: categorizeFile(newPath),
        });
      } else {
        const filePath = parts[1] ?? "";
        results.push({
          status: statusCode,
          path: filePath,
          category: categorizeFile(filePath),
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}

function getUntrackedFiles(cwd: string): ChangedFile[] {
  try {
    const output = execSync(
      "git ls-files --others --exclude-standard",
      { cwd, encoding: "utf-8", timeout: 5000 },
    ).trim();

    if (!output) return [];

    return output.split("\n").map((path) => ({
      status: "?" as const,
      path,
      category: categorizeFile(path),
    }));
  } catch {
    return [];
  }
}

function categorizeFile(path: string): FileCategory {
  if (path.includes("package.json") || path.includes("package-lock") || path.includes("pnpm-lock")) {
    return "package";
  }
  if (path.match(/\.(test|spec)\.(ts|js|tsx|jsx)$/)) return "test";
  if (
    path.match(
      /^(tsconfig|\.eslint|\.prettier|vitest\.config|jest\.config|\.env|\.gitignore|Makefile|Dockerfile)/,
    ) ||
    path.endsWith(".json") && !path.includes("src/")
  ) {
    return "config";
  }
  if (path.match(/\.(md|txt|rst)$/)) return "docs";
  if (path.match(/\.(ts|js|tsx|jsx|py|go|rs)$/)) return "source";
  return "other";
}

const DEP_SECTIONS = new Set([
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
]);

/**
 * git diff 출력에서 dependency 섹션 내의 새 의존성만 추출
 *
 * export for testing
 */
export function extractNewDeps(cwd: string, files: ChangedFile[]): string[] {
  const pkgChanged = files.some(
    (f) => f.path === "package.json" && (f.status === "M" || f.status === "A"),
  );
  if (!pkgChanged) return [];

  try {
    const diff = execSync("git diff HEAD -- package.json", {
      cwd,
      encoding: "utf-8",
      timeout: 5000,
    });

    return parseDepsFromDiff(diff);
  } catch {
    return [];
  }
}

/**
 * unified diff 텍스트에서 dependency 섹션 내 추가된 패키지명만 추출
 *
 * export for testing
 */
export function parseDepsFromDiff(diff: string): string[] {
  const newDeps: string[] = [];
  let inDepSection = false;
  let braceDepth = 0;

  for (const line of diff.split("\n")) {
    // context 또는 추가 라인에서 섹션 헤더 감지: "dependencies": {
    const sectionMatch = line.match(/^[+ ]\s+"([^"]+)":\s*\{/);
    if (sectionMatch && sectionMatch[1]) {
      if (DEP_SECTIONS.has(sectionMatch[1])) {
        inDepSection = true;
        braceDepth = 1;
        continue;
      } else {
        // 다른 섹션 시작 → dependency 섹션 종료
        if (inDepSection) {
          inDepSection = false;
          braceDepth = 0;
        }
        continue;
      }
    }

    if (!inDepSection) continue;

    // brace depth 추적 (context/추가/제거 라인 모두)
    if (line.match(/^[+ -]\s*\{/)) braceDepth++;
    if (line.match(/^[+ -]\s*\}/)) {
      braceDepth--;
      if (braceDepth <= 0) {
        inDepSection = false;
        braceDepth = 0;
        continue;
      }
    }

    // 추가 라인에서 패키지명 추출
    const depMatch = line.match(/^\+\s+"([^"]+)":\s*"/);
    if (depMatch && depMatch[1] && !depMatch[1].startsWith("@types/")) {
      newDeps.push(depMatch[1]);
    }
  }
  return newDeps;
}

function detectStructureChange(files: ChangedFile[]): boolean {
  // 새 디렉토리가 생겼는지 (새 파일의 디렉토리 depth가 기존과 다르면)
  const newFiles = files.filter((f) => f.status === "A" || f.status === "?");
  const newDirs = new Set(
    newFiles.map((f) => f.path.split("/").slice(0, -1).join("/")),
  );
  return newDirs.size > 2; // 3개 이상 새 디렉토리면 구조 변경
}
