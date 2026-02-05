import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { CurrentJson } from "../types.js";
import {
  specTemplate,
  pinTemplate,
  CAPSULE_PROJECT,
  CAPSULE_CONVENTIONS,
  CAPSULE_STATUS,
} from "./templates.js";

export interface GenerateSpecResult {
  specPath: string;
  pinPath: string;
  currentJsonPath: string;
}

/**
 * title → kebab-case slug
 */
export function toSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * 오늘 날짜를 YYYYMMDD로
 */
export function todayDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/**
 * SPEC + PIN + current.json 생성
 */
export function generateSpec(
  cwd: string,
  title: string,
  date?: string,
): GenerateSpecResult {
  const slug = toSlug(title);
  const d = date ?? todayDate();

  // 디렉토리 보장
  mkdirSync(join(cwd, ".ai/specs"), { recursive: true });
  mkdirSync(join(cwd, ".ai/work"), { recursive: true });

  // capsule 자동 보정: 없으면 최소 템플릿 생성 (기존 파일 절대 덮어쓰지 않음)
  ensureCapsule(cwd);

  // SPEC 파일
  const specRelPath = `.ai/specs/SPEC-${d}-${slug}.md`;
  const specFullPath = join(cwd, specRelPath);
  writeFileSync(specFullPath, specTemplate(title, d, slug), "utf-8");

  // PIN 파일
  const pinRelPath = ".ai/work/pin.md";
  const pinFullPath = join(cwd, pinRelPath);
  writeFileSync(pinFullPath, pinTemplate(title, specRelPath), "utf-8");

  // current.json
  const currentJsonRelPath = ".ai/work/current.json";
  const currentJsonFullPath = join(cwd, currentJsonRelPath);
  const current: CurrentJson = {
    active_spec: specRelPath,
    pin: pinRelPath,
    title,
    tags: [],
    updated_at: new Date().toISOString(),
  };
  writeFileSync(currentJsonFullPath, JSON.stringify(current, null, 2), "utf-8");

  return {
    specPath: specRelPath,
    pinPath: pinRelPath,
    currentJsonPath: currentJsonRelPath,
  };
}

const CAPSULE_FILES: Record<string, string> = {
  ".ai/capsule/PROJECT.md": CAPSULE_PROJECT,
  ".ai/capsule/CONVENTIONS.md": CAPSULE_CONVENTIONS,
  ".ai/capsule/STATUS.md": CAPSULE_STATUS,
};

/**
 * .ai/capsule/* 없으면 최소 템플릿 생성 (기존 파일 절대 덮어쓰지 않음)
 */
function ensureCapsule(cwd: string): void {
  mkdirSync(join(cwd, ".ai/capsule"), { recursive: true });
  for (const [path, content] of Object.entries(CAPSULE_FILES)) {
    const fullPath = join(cwd, path);
    if (!existsSync(fullPath)) {
      writeFileSync(fullPath, content, "utf-8");
    }
  }
}
