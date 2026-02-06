# Compass Codex Integration Guide

> **Updated**: 2026-02-06
> 이 문서는 Compass를 Codex 환경에서 운영할 때의 **지원 범위/한계/운영 절차**를 정의합니다.

---

## 1) 지원 범위

| 항목 | Claude Code | Codex |
|---|---|---|
| PIN 자동 로드 | `CLAUDE.md` import | 수동 확인 (권장 루틴) |
| 입력 시 PIN 주입 | Hook(`UserPromptSubmit`) | 미지원 |
| compact 전 spec-sync | Hook(`PreCompact`) | 미지원 |
| capsule sync | `/capsule-sync`, CLI | CLI |

정책:
- **Full support**: Claude Code
- **Partial support**: Codex

---

## 2) Codex 운영 루틴 (수동)

### 세션 시작

```bash
cat .ai/work/current.json
cat .ai/work/pin.md
```

체크:
- 활성 스펙 포인터(`active_spec`) 확인
- PIN 5개 섹션(Goal/Must-have/Constraints/Acceptance Criteria/Pointer) 확인

### 작업 중

```bash
compass capsule sync
```

체크:
- 프롬프트가 제시한 섹션만 갱신
- PIN Goal/Must-have와 무관한 변경은 `STATUS.md`에만 짧게 반영

### 세션 종료 전 (spec-sync 수동 대체)

1. `pin.md` 갱신:
- Goal/Must-have/Constraints/Acceptance Criteria 업데이트
- 20~30줄 내 유지

2. SPEC Change Log 갱신:
- 당일 결정/구현 사항 1줄 이상 추가

---

## 3) Codex 자동화 제안 (문서화 범위)

> 아래 항목은 운영 제안이며, Compass 기능 구현 범위에는 포함되지 않습니다.

### 제안 A: 세션 시작 PIN 확인

- 목적: 작업 시작 시 북극성(PIN) 기준을 강제
- 권장 주기: 업무일 오전 1회
- 자동화 프롬프트 예시:
  - `현재 작업 디렉토리에서 .ai/work/current.json과 .ai/work/pin.md를 확인하고, Goal/Must-have/Acceptance Criteria를 5줄 이내로 요약해줘. 파일이 없으면 누락 파일만 보고해줘.`
- 대상 디렉토리: 프로젝트 루트
- 수동 fallback:
  - `cat .ai/work/current.json && cat .ai/work/pin.md`

### 제안 B: 마감 전 capsule sync 점검

- 목적: 세션 종료 전 capsule 최신화 누락 방지
- 권장 주기: 업무일 저녁 1회
- 자동화 프롬프트 예시:
  - `compass capsule sync 결과를 기준으로 .ai/capsule/PROJECT.md, CONVENTIONS.md, STATUS.md 중 갱신이 필요한 섹션만 제안해줘. 변경이 없으면 이유를 한 줄로 요약해줘.`
- 대상 디렉토리: 프로젝트 루트
- 수동 fallback:
  - `compass capsule sync`

---

## 4) 한계 및 주의사항

- Codex에는 현재 Claude Code와 동일한 Hook 이벤트 모델이 없습니다.
- 따라서 `pin-inject`, `spec-sync`는 Codex에서 자동 실행되지 않습니다.
- 자동화 제안은 보조 수단이며, 최종 기준 파일은 `.ai/work/pin.md`, `.ai/specs/*.md`입니다.

---

## 5) 관련 문서

- `docs/03_user-guide.md` (사용자 실행 가이드)
- `docs/02_mvp1-implementation.md` (MVP-1 구현 세부)
- `docs/01_decisions.md` (Hook I/O 및 설계 결정)
