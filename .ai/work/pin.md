# PIN: Compass MVP

## Goal

Claude Code 위에서 동작하는 "닫힌 고리 운영 레이어" MVP 구현

## Must-have

1. `/spec new` → PIN + SPEC + current.json 생성
2. PreCompact 훅으로 PIN 업데이트
3. trace.jsonl에 이벤트 기록
4. `/coach scan`으로 자동화 후보 Top 3 추천
5. `/coach apply`로 hook 추가 + 롤백 지원

## Constraints

- Claude Code 공식 기능(hooks, skills, memory) 위에서 동작
- 민감정보(토큰/키/프롬프트 원문) 저장 금지
- MVP에서는 단일 패키지, 모노레포 구조 금지

## Acceptance Criteria

- [ ] `compass init`으로 .ai/, .claude/ 구조 생성
- [ ] `compass spec new`로 스펙 생성 + PIN 자동 로드 확인
- [ ] hooks가 세션 내에서 정상 동작 (UserPromptSubmit, PreCompact, Stop)
- [ ] `/coach scan` 실행 시 후보 3개 출력
- [ ] `/coach apply` 후 롤백으로 원상복구 확인

## Pointer

- SPEC: `.ai/specs/SPEC-20260131-compass-mvp.md` (생성 예정)
- PRD: `docs/00_start_here.md`
- Decisions: `docs/01_decisions.md`
