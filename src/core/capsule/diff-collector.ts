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

    return output.split("\n").map((line) => {
      const [status, path] = line.split("\t");
      return {
        status: (status?.charAt(0) ?? "M") as ChangedFile["status"],
        path: path ?? "",
        category: categorizeFile(path ?? ""),
      };
    });
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

function extractNewDeps(cwd: string, files: ChangedFile[]): string[] {
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

    const newDeps: string[] = [];
    for (const line of diff.split("\n")) {
      // +    "dep-name": "^1.0.0"
      const match = line.match(/^\+\s+"([^"]+)":\s*"\^/);
      if (match && match[1] && !match[1].startsWith("@types/")) {
        newDeps.push(match[1]);
      }
    }
    return newDeps;
  } catch {
    return [];
  }
}

function detectStructureChange(files: ChangedFile[]): boolean {
  // 새 디렉토리가 생겼는지 (새 파일의 디렉토리 depth가 기존과 다르면)
  const newFiles = files.filter((f) => f.status === "A" || f.status === "?");
  const newDirs = new Set(
    newFiles.map((f) => f.path.split("/").slice(0, -1).join("/")),
  );
  return newDirs.size > 2; // 3개 이상 새 디렉토리면 구조 변경
}
