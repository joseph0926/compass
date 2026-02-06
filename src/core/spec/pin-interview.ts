import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { CurrentJson } from "../types.js";

export interface PinInterviewDefaults {
  goal: string;
  targetUser: string;
  primaryCta: string;
  mustHave: string[];
  constraints: string[];
  acceptanceCriteria: string[];
}

export interface PinContext {
  title: string;
  specPath: string;
  pinPath: string;
  currentJsonPath: string;
}

export interface BuildGoalInput {
  title: string;
  goal: string;
  targetUser: string;
  primaryCta: string;
}

export interface BuildPinInput {
  goal: string;
  mustHave: string[];
  constraints: string[];
  acceptanceCriteria: string[];
  specPath: string;
}

export const PIN_INTERVIEW_DEFAULTS: PinInterviewDefaults = {
  goal: "",
  targetUser: "AI 코딩 도구를 쓰는 개발자",
  primaryCta: "npx compass-ai 실행",
  mustHave: [
    "Hero 섹션에서 Compass 가치 제안 제시",
    "핵심 기능(Spec/PIN/Capsule) 소개",
    "빠른 시작(설치/실행) 가이드",
  ],
  constraints: [
    "Next.js App Router 사용",
    "모바일/데스크톱 반응형",
    "문구는 한국어 우선",
  ],
  acceptanceCriteria: [
    "첫 화면 5초 내 Compass 목적과 핵심 CTA가 보인다",
    "사용자가 3클릭 이내에 설치/실행 명령을 찾는다",
    "모바일(360px+)과 데스크톱(1280px+)에서 레이아웃이 깨지지 않는다",
  ],
};

export function resolvePinContext(cwd: string): PinContext | null {
  const currentJsonPath = ".ai/work/current.json";
  const currentJsonFullPath = join(cwd, currentJsonPath);

  if (!existsSync(currentJsonFullPath)) {
    return null;
  }

  const raw = readFileSync(currentJsonFullPath, "utf-8");
  const parsed = JSON.parse(raw) as Partial<CurrentJson>;

  if (
    !isNonEmptyString(parsed.title) ||
    !isNonEmptyString(parsed.active_spec) ||
    !isNonEmptyString(parsed.pin)
  ) {
    throw new Error("Invalid current.json: title/active_spec/pin is required");
  }

  return {
    title: parsed.title,
    specPath: parsed.active_spec,
    pinPath: parsed.pin,
    currentJsonPath,
  };
}

export function buildGoal(input: BuildGoalInput): string {
  const goal = input.goal.trim();
  if (goal) {
    return goal;
  }

  const targetUser = input.targetUser.trim() || PIN_INTERVIEW_DEFAULTS.targetUser;
  const cta = input.primaryCta.trim() || PIN_INTERVIEW_DEFAULTS.primaryCta;
  const homepageTitle = normalizeHomepageTitle(input.title);
  return `${targetUser}가 ${cta}를 즉시 시도할 수 있도록 ${homepageTitle}를 구축한다.`;
}

export function parseListInput(value: string, fallback: string[]): string[] {
  const items = value
    .split(/[\n,]/g)
    .map((item) => item.trim().replace(/^-+\s*/, ""))
    .filter(Boolean);

  if (items.length === 0) {
    return fallback;
  }

  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }
  return deduped;
}

export function buildPinContent(input: BuildPinInput): string {
  return `# PIN

## Goal
${input.goal}

## Must-have
${toBulletList(input.mustHave)}

## Constraints
${toBulletList(input.constraints)}

## Acceptance Criteria
${toBulletList(input.acceptanceCriteria)}

## Pointer
${input.specPath}
`;
}

function toBulletList(items: string[]): string {
  if (items.length === 0) {
    return "- (none)";
  }
  return items.map((item) => `- ${item}`).join("\n");
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeHomepageTitle(title: string): string {
  const trimmed = title.trim();
  if (trimmed.includes("홈페이지")) {
    return trimmed;
  }
  return `${trimmed} 홈페이지`;
}
