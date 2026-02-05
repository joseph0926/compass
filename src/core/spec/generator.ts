import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { CurrentJson } from "../types.js";
import { specTemplate, pinTemplate } from "./templates.js";

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
