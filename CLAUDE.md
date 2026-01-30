# Compass Project Instructions

> **Version**: v0.1.0 | **Updated**: 2026-01-30

---

## Project Overview

Compass는 Claude Code 기반의 **개인 최적화 코치/거버너** 시스템입니다.

- **목표**: 관측(Observability) → 진단 → 추천/생성 → 검증/튜닝의 닫힌 고리(closed loop)로 개인에게 맞게 자동 최적화
- **핵심 가치**: "컴포넌트 창고"가 아니라 개인 최적화 엔진
- **기반**: Claude Code의 공식 메커니즘(Memory, Hooks, OTel, MCP) 위에서 동작

---

## Architecture (4 Modules)

```
[Observatory] → [Diagnosis] → [Coach] → [Governor] → [Measure] → (loop)
```

### 1. Observatory (관측 레이어)
- OTel events/metrics, Hook-based Trace, Git diff/test/lint 결과 수집
- 저장: `.ai/trace/trace.jsonl` (프로젝트), `~/.compass/` (개인)

### 2. Spec System (스펙 핀)
- 스펙을 파일에 고정하여 컴팩트/새 세션에도 "북극성" 유지
- 구조: `.ai/specs/SPEC-*.md`, `.ai/work/pin.md`, `.ai/work/current.json`

### 3. Complexity Governor (품질 방어)
- Spec Condenser: 요청을 구조화된 스펙으로 변환
- Scope Slicer: 복잡도 기반 단계 분할
- Guard Rails: 품질 게이트 (lint, typecheck, test)

### 4. Personal Coach (개인 맞춤 코치)
- 패턴 감지 → 라우팅(Skill/Hook/MCP/Sub-agent) → 생성/적용/튜닝

---

## File Structure Convention

```
compass/
├── .ai/                          # AI 작업 데이터 (gitignore 권장 일부)
│   ├── specs/                    # 스펙 원문
│   │   └── SPEC-YYYYMMDD-<slug>.md
│   ├── work/                     # 현재 작업 상태
│   │   ├── current.json          # 활성 스펙 포인터
│   │   └── pin.md                # 항상 로드되는 PIN
│   └── trace/                    # 관측 로그
│       └── trace.jsonl
├── .claude/                      # Claude Code 설정
│   ├── settings.json             # 공유 설정
│   ├── settings.local.json       # 개인 설정 (gitignore)
│   └── rules/                    # 조건부 규칙
├── docs/                         # 문서
├── src/                          # 소스 코드
│   ├── observatory/              # 관측 모듈
│   ├── spec-system/              # 스펙 시스템
│   ├── governor/                 # 거버너
│   ├── coach/                    # 코치
│   └── cli/                      # CLI 명령
└── AGENTS.md                     # 에이전트/스킬 명세
```

---

## Development Guidelines

### Code Style
- TypeScript strict mode
- ESM modules
- Functional patterns preferred
- Error handling at system boundaries only

### Naming Conventions
- Files: kebab-case (`trace-parser.ts`)
- Functions: camelCase (`parseTraceEvent`)
- Types/Interfaces: PascalCase (`TraceEvent`)
- Constants: SCREAMING_SNAKE_CASE (`MAX_TRACE_SIZE`)

### Testing
- Vitest for unit/integration tests
- Test files: `*.test.ts` or `*.spec.ts`
- Coverage threshold: 80%

---

## Commands Reference

### Spec System
- `/spec new <title>` - 새 스펙 생성
- `/spec pin` - 현재 스펙을 PIN으로 고정
- `/spec status` - 활성 스펙 상태 확인

### Observatory
- `/trace last [n]` - 최근 n개 이벤트 (기본 10)
- `/trace why` - 자동화 실행 이유 추적
- `/trace stats` - 통계 요약

### Coach
- `/coach scan` - 자동화 후보 분석
- `/coach apply <id>` - 후보 적용
- `/coach rollback <id>` - 적용 취소
- `/coach report` - 효과 리포트
- `/coach mode <simple|pro|lab>` - 모드 전환

### Governor
- `/guard status` - 게이트 상태 확인
- `/guard run` - 수동 게이트 실행

---

## Security Principles

1. **최소 권한**: 훅은 필요한 곳에만, 최소한으로
2. **개인 데이터 분리**: 민감 정보는 `~/.compass/`에만 저장
3. **Prompt 원문 비저장**: 요약/해시만 저장, 원문은 opt-in
4. **위험 명령 차단**: PreToolUse로 `rm -rf`, `drop table` 등 차단

---

## Version History

| Version | Date       | Changes                          |
|---------|------------|----------------------------------|
| v0.1.0  | 2026-01-30 | Initial structure and guidelines |

---

## References

- [Claude Code Memory](https://code.claude.com/docs/en/memory)
- [Claude Code Hooks](https://code.claude.com/docs/en/hooks)
- [Claude Code Monitoring](https://code.claude.com/docs/en/monitoring-usage)
- [Claude Code MCP](https://code.claude.com/docs/en/mcp)
