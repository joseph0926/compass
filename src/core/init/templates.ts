export const CAPSULE_TEMPLATES = {
  "PROJECT.md": `# Project Overview

## Name
<!-- 프로젝트 이름 -->

## Purpose
<!-- 한 줄 정의 -->

## Tech Stack
<!-- 주요 기술 스택 -->

## Structure
<!-- 디렉토리 구조 요약 -->
`,

  "CONVENTIONS.md": `# Coding Conventions

## Language
<!-- 주 언어/프레임워크 -->

## Style
<!-- 코드 스타일 규칙 -->

## Naming
<!-- 네이밍 컨벤션 -->

## Testing
<!-- 테스트 규칙 -->
`,

  "STATUS.md": `# Project Status

## Current Phase
<!-- 현재 단계 (MVP, Beta, Production 등) -->

## Recent Changes
<!-- 최근 주요 변경 사항 -->

## Known Issues
<!-- 알려진 이슈 -->

## Next Steps
<!-- 다음 단계 -->
`,
} as const satisfies Record<string, string>;
