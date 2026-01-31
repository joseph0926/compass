# Coding Conventions

## Language

- TypeScript (strict mode)
- Node.js ESM

## Style

- Prettier + ESLint (설정 예정)
- 80% 이상 커버리지 권장 (core 모듈)

## Naming

- 파일: kebab-case (`pin-inject.ts`)
- 타입/인터페이스: PascalCase (`TraceEvent`)
- 함수/변수: camelCase (`parseStdin`)
- 상수: UPPER_SNAKE_CASE (`DEFAULT_TOP_N`)

## Testing

- 단위 테스트: Vitest
- 통합 테스트: CLI 실행 + 파일 검증 (임시 디렉토리)
- Hook 테스트: stdin JSON fixture → stdout JSON 검증

## Git

- 커밋 메시지: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- 브랜치: `main` (기본), `feat/*`, `fix/*`

## Documentation

- 코드 주석: 복잡한 로직에만 (자명한 코드는 주석 없이)
- 문서: `docs/` 디렉토리에 마크다운
- 변경 이력: 각 문서의 Version History 섹션
