# Project Overview

## Name

Compass

## Purpose

**관측(Observability) → 진단 → 추천/생성 → 검증/튜닝**까지 닫힌 고리로 돌려 개인에게 맞게 자동 최적화하는 **운영 레이어(코치/거버너)**

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **CLI Framework**: TBD (commander/yargs)
- **Test**: Vitest
- **Integration**: Claude Code (hooks, skills, memory)

## Structure

```
/
├── src/
│   ├── cli/          # CLI 엔트리포인트 + 명령
│   ├── core/         # 핵심 로직 (spec, trace, coach, guard)
│   └── hooks/        # Hook 핸들러 (stdin → stdout)
├── .claude/
│   ├── skills/       # 슬래시 커맨드 정의
│   └── settings.local.json  # 개인 hooks 설정
├── .ai/
│   ├── specs/        # 스펙 원문
│   ├── work/         # PIN + current.json
│   ├── trace/        # trace.jsonl
│   └── capsule/      # 프로젝트 메타 (이 디렉토리)
└── docs/             # PRD, 결정 문서
```

## Key Concepts

- **PIN**: 20~30줄 내의 "북극성" 요약 (Goal, Must-have, Constraints, Acceptance, Pointer)
- **SPEC**: 상세 스펙 원문 (Change Log 포함)
- **Trace**: 작업 이벤트 로그 (민감정보 금지)
- **Coach**: 관측 기반 자동화 추천 엔진
- **Governor**: 복잡도 기반 품질 게이트
