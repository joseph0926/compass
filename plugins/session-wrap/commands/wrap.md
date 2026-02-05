---
description: "세션 마무리 - 5개 에이전트가 세션을 분석하고 문서/자동화/학습/후속작업을 정리합니다"
argument-hint: "[optional wrap message]"
---

# Session Wrap

세션을 마무리하고 분석합니다. 아래 4개 Phase를 순서대로 실행하세요.

## Phase 0: 컨텍스트 수집

다음 정보를 **병렬로** 수집하세요:

1. **Bash**: `git status` — 현재 작업 트리 상태 확인
2. **Bash**: `git diff --stat` — 변경 통계 확인
3. **Bash**: `git log --oneline -10` — 최근 커밋 이력 확인
4. **Read**: 프로젝트 루트의 `CLAUDE.md` (있으면)
5. **Read**: `~/.claude/projects/` 하위의 `memory/MEMORY.md` (있으면)
6. **Read**: `.ai/work/pin.md` (있으면)

수집한 정보를 `session_context`로 정리합니다. 사용자가 wrap message를 제공했다면 ($ARGUMENTS) 함께 포함하세요.

## Phase 1: 병렬 분석 (4개 에이전트)

**반드시 단일 메시지에서 4개 Task를 병렬로 호출하세요.** 각 에이전트에게 Phase 0에서 수집한 `session_context`를 전달합니다.

### Task 1: doc-updater (sonnet)
```
subagent_type: general-purpose
model: sonnet
```
프롬프트:
> 당신은 doc-updater 에이전트입니다. 세션에서 발견/결정된 컨벤션, 규칙, 패턴을 CLAUDE.md와 context.md에 추가할 형태로 제안합니다.
>
> ## 세션 컨텍스트
> {session_context 전체 삽입}
>
> ## 작업
> 1. 변경된 파일을 분석하여 새로운 컨벤션/규칙/패턴 식별
> 2. 현재 CLAUDE.md를 읽고 갭 분석
> 3. 추가/수정이 필요한 항목을 구체적으로 제안
>
> ## 출력 형식
> ```
> ## Doc Updates
> ### CLAUDE.md 추가 제안
> - **[섹션명]**: [추가할 내용] (이유: ...)
> ### CLAUDE.md 수정 제안
> - **[섹션명]** L[줄번호]: [현재] → [수정] (이유: ...)
> ### context.md 추가 제안
> - **[항목]**: [내용] (이유: ...)
> ```

### Task 2: automation-scout (sonnet)
```
subagent_type: general-purpose
model: sonnet
```
프롬프트:
> 당신은 automation-scout 에이전트입니다. 세션에서 반복된 작업 패턴을 식별하고 자동화 방안을 제안합니다.
>
> ## 세션 컨텍스트
> {session_context 전체 삽입}
>
> ## 작업
> 1. 반복 패턴 식별 (같은 명령, 유사 코드 패턴, 보일러플레이트)
> 2. 자동화 방법 평가 (skill/command/agent/hook)
> 3. 우선순위 산정 (빈도 x 절약 시간)
>
> ## 출력 형식
> ```
> ## Automation Opportunities
> ### P0 (즉시 적용 권장)
> - **[패턴명]**: [방법] | 타입: skill/command/hook | 빈도: ... | 효과: ...
> ### P1 (다음 세션)
> - ...
> ### P2 (고려)
> - ...
> ```

### Task 3: learning-extractor (sonnet)
```
subagent_type: general-purpose
model: sonnet
```
프롬프트:
> 당신은 learning-extractor 에이전트입니다. 세션에서 배운 것, 실수한 것, 새로 발견한 것을 추출합니다.
>
> ## 세션 컨텍스트
> {session_context 전체 삽입}
>
> ## 작업
> 1. 에러 해결 과정, 접근 방식 변경, 새 API/도구 사용 등 학습 포인트 추출
> 2. 기존 MEMORY.md와 중복 확인
> 3. 교훈/발견/실수로 분류
>
> ## 출력 형식
> ```
> ## Learnings
> ### 교훈 (Lessons)
> - **[제목]**: [상황] → [해결] (키워드: ..., 재발방지: ...)
> ### 발견 (Discoveries)
> - **[제목]**: [설명] (활용처: ...)
> ### 실수 (Mistakes)
> - **[제목]**: [원인] → [예방법]
> ```

### Task 4: followup-suggester (sonnet)
```
subagent_type: general-purpose
model: sonnet
```
프롬프트:
> 당신은 followup-suggester 에이전트입니다. 미완성 작업을 식별하고 다음 세션의 우선순위를 정리합니다.
>
> ## 세션 컨텍스트
> {session_context 전체 삽입}
>
> ## 작업
> 1. TODO/FIXME/HACK/XXX/TEMP 코멘트 스캔 (Grep 사용)
> 2. 미완성 변경사항, 누락된 테스트, 문서화 필요 항목 감지
> 3. P0/P1/P2 우선순위로 정렬
>
> ## 출력 형식
> ```
> ## Follow-up
> ### 미완성 작업
> - **[작업명]**: [상태] | 위치: [파일:줄] | 우선순위: P0-P2
> ### 다음 세션 추천 순서
> 1. **[작업]** (P0) - [이유]
> 2. ...
> ### pin.md 업데이트 제안
> - [고정할 작업과 이유]
> ```

## Phase 2: 중복 검증 (Phase 1 완료 후 순차 실행)

Phase 1의 4개 에이전트 결과가 모두 돌아온 후 실행합니다.

### Task 5: duplicate-checker (haiku)
```
subagent_type: general-purpose
model: haiku
```
프롬프트:
> 당신은 duplicate-checker 에이전트입니다. Phase 1 결과를 기존 문서와 대조하여 중복을 제거합니다.
>
> ## Phase 1 결과
> ### doc-updater 결과
> {doc_result}
> ### automation-scout 결과
> {auto_result}
> ### learning-extractor 결과
> {learn_result}
> ### followup-suggester 결과
> {follow_result}
>
> ## 기존 문서
> ### CLAUDE.md
> {CLAUDE.md 내용}
> ### MEMORY.md
> {MEMORY.md 내용}
>
> ## 작업
> 각 제안 항목을 기존 문서와 대조하여 마킹하세요:
> - **NEW**: 기존에 없는 새로운 내용
> - **DUPLICATE**: 이미 존재하는 내용 (제거 권장)
> - **MERGE**: 유사하지만 새로운 관점 포함 (병합 제안)
> - **CONFLICT**: 에이전트 간 모순되는 제안
>
> ## 출력 형식
> ```
> ## Dedup Results
> ### doc-updater 검증
> - [항목]: NEW | DUPLICATE | MERGE | CONFLICT (상세: ...)
> ### automation-scout 검증
> - ...
> ### learning-extractor 검증
> - ...
> ### followup-suggester 검증
> - ...
> ### 요약
> - 총: N개 | NEW: N | DUPLICATE: N | MERGE: N | CONFLICT: N
> ```

## Phase 3: 결과 통합 및 사용자 선택

모든 에이전트 결과를 통합하여 사용자에게 보여줍니다.

### 통합 출력 형식

```markdown
# Session Wrap Report

## 1. 문서 업데이트 제안 (doc-updater)
{dedup 필터링된 doc_result — NEW/MERGE 항목만}

## 2. 자동화 기회 (automation-scout)
{dedup 필터링된 auto_result — NEW/MERGE 항목만}

## 3. 학습점 (learning-extractor)
{dedup 필터링된 learn_result — NEW/MERGE 항목만}

## 4. 후속 작업 (followup-suggester)
{dedup 필터링된 follow_result — NEW/MERGE 항목만}

## 5. 중복/충돌 요약 (duplicate-checker)
- 제거된 중복: N개
- 병합 제안: N개
- 충돌 (사용자 결정 필요): N개
```

### 사용자 선택

AskUserQuestion을 사용하여 실행할 액션을 선택받습니다:

```
question: "어떤 액션을 실행할까요?"
multiSelect: true
options:
  - label: "CLAUDE.md 업데이트"
    description: "doc-updater의 제안을 CLAUDE.md에 적용합니다"
  - label: "MEMORY.md 업데이트"
    description: "learning-extractor의 학습점을 MEMORY.md에 기록합니다"
  - label: "후속 작업 저장"
    description: "followup-suggester의 결과를 .ai/work/pin.md에 저장합니다"
  - label: "보고서만 확인"
    description: "변경 없이 보고서만 확인합니다"
```

## Phase 4: 선택된 액션 실행

사용자가 선택한 액션만 실행합니다:

- **CLAUDE.md 업데이트**: Edit 도구로 CLAUDE.md에 NEW/MERGE 항목 추가
- **MEMORY.md 업데이트**: Edit 도구로 MEMORY.md에 학습점 추가
- **후속 작업 저장**: Write 도구로 .ai/work/pin.md에 우선순위 리스트 저장
- **보고서만 확인**: 추가 액션 없이 종료

완료 후 실행된 액션의 요약을 출력합니다.
