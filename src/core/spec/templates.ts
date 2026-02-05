/**
 * SPEC / PIN / Capsule 템플릿 상수
 */

export function specTemplate(
  title: string,
  date: string,
  slug: string,
): string {
  return `# SPEC: ${title}

> **Created**: ${date}
> **Status**: Draft

## Goal
<!-- 1-2줄 목표 -->

## Must-have (≤5)
- <!-- 항목 1 -->

## Nice-to-have (≤5)
- <!-- 항목 1 -->

## Constraints
- <!-- 제약 -->

## Acceptance Criteria
- [ ] <!-- 완료 기준 1 -->

## Notes
<!-- 자유 메모 -->

## Change Log
| Date | Change |
|------|--------|
| ${date} | Initial spec created |
`;
}

export function pinTemplate(title: string, specPath: string): string {
  return `# PIN

## Goal
<!-- ${title}: 1-2줄 목표 -->

## Must-have
- <!-- 항목 1 -->

## Constraints
- <!-- 제약 -->

## Acceptance Criteria
- <!-- 완료 기준 -->

## Pointer
${specPath}
`;
}

export const CAPSULE_PROJECT = `# Project Overview

## Name
<!-- 프로젝트 이름 -->

## Purpose
<!-- 한 줄 정의 -->

## Tech Stack
<!-- 주요 기술 스택 -->

## Structure
<!-- 디렉터리 구조 요약 -->
`;

export const CAPSULE_CONVENTIONS = `# Coding Conventions

## Language
<!-- 주 언어/프레임워크 -->

## Style
<!-- 코드 스타일 규칙 -->

## Naming
<!-- 네이밍 컨벤션 -->

## Testing
<!-- 테스트 규칙 -->
`;

export const CAPSULE_STATUS = `# Project Status

## Current Phase
<!-- 현재 단계 (MVP, Beta, Production 등) -->

## Recent Changes
<!-- 최근 주요 변경 사항 -->

## Known Issues
<!-- 알려진 이슈 -->

## Next Steps
<!-- 다음 단계 -->
`;
