# Compass Coach & Governor PRD v0.1

## 한 줄 정의

**Compass**는 “AI 코딩 툴을 더 많이 설치하는 도구”가 아니라, **관측(Observability) → 진단 → 추천/생성 → 검증/튜닝**까지 닫힌 고리로 돌려서 **개인에게 맞게 자동으로 최적화**해주는 **운영 레이어(코치/거버너)** 입니다.

---

## 1) 문제 정의 (Why)

여러 툴을 조합하면 4개 병목은 해결 가능하지만, 개인 사용자 관점에서 현실은 이렇습니다.

1. **세션/채팅이 바뀔 때마다 재탐색** → 초반 토큰/시간 반복
2. **작업이 길어질수록 실수 체감 증가** → 컨텍스트 오염/드리프트/회귀
3. **훅/스킬/에이전트가 실제로 뭘 했는지 블랙박스** → 통제감 상실
4. **MCP/훅/스킬/에이전트/커맨드가 많아도 “나에게 맞는 조합”을 모르겠다** → 선택 과부하

> 핵심: 개인은 “기능”이 부족한 게 아니라, **운영(ops)**과 **개인화(personalization)**가 부족합니다.

---

## 2) 포지셔닝 (What we are / aren’t)

### 우리가 하는 것

- **관측 데이터**(툴 사용·실패·비용·반복 패턴)를 근거로
- 개인에게 맞는 **훅/스킬/레시피/서브에이전트/MCP**를
- **추천**하고, (가능하면) **자동 생성/적용**하고,
- 적용 후 성과를 측정해 **자동 튜닝**한다.

### 우리가 하지 않는 것 (Non-goals)

- 플러그인/스킬/템플릿을 “더 많이” 모아주는 마켓/번들러(= claude-code-templates 류와 정면승부)
- 장기 메모리 자체를 새로 구현(= claude-mem 대체)
- 새로운 코딩 모델/런타임을 만드는 것

> 즉, Compass는 “컴포넌트 창고”가 아니라 개인 최적화 엔진입니다.

---

## 3) 플랫폼/기술 전제 (Claude Code 기반)

Compass는 Claude Code가 이미 제공하는 **공식 메커니즘** 위에서 동작하도록 설계합니다.

### 3.1 Memory(지속 컨텍스트)

- Claude Code는 `~/.claude/CLAUDE.md`, 프로젝트의 `CLAUDE.md`/`.claude/CLAUDE.md`, 개인용 `CLAUDE.local.md` 등 **계층형 메모리**를 자동 로드합니다.
- `CLAUDE.md`는 `@path/to/import`로 다른 파일을 import할 수 있고(최대 깊이 제한 포함), `.claude/rules/`에 룰 파일을 쪼개서 두며 `paths`로 조건부 적용도 가능합니다. ([Claude Code](https://code.claude.com/docs/en/memory))

→ Compass의 “스펙 핀(pin) / 프로젝트 캡슐 / 도메인 규칙”은 **대화가 아니라 파일에 고정**하고, Claude Code의 메모리 로딩으로 “항상 참조”되게 만듭니다.

### 3.2 Hooks(자동화 트리거)

- Claude Code는 SessionStart/UserPromptSubmit/PreToolUse/PostToolUse/Stop/PreCompact/SessionEnd 등 훅 이벤트를 제공합니다. ([Claude Code](https://code.claude.com/docs/en/hooks-guide))
- PreToolUse는 **도구 실행을 allow/deny/ask로 제어**, 입력 수정(updatedInput), 컨텍스트 주입(additionalContext)까지 가능합니다. ([Claude Code](https://code.claude.com/docs/en/hooks))
- 훅은 `~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json` 등 settings 계층에서 관리됩니다. ([Claude Code](https://code.claude.com/docs/en/hooks))
- 훅은 자동 실행이므로 보안 위험(자격증명/환경 접근)을 고려해야 한다는 경고가 공식 문서에 있습니다. ([Claude Code](https://code.claude.com/docs/en/hooks-guide))
- hook command는 `"$CLAUDE_PROJECT_DIR"/node_modules/.bin/compass ...` 형태를 표준으로 사용합니다.

→ Compass는 훅을 “많이” 쓰지 않고, **딱 필요한 곳(거버너/관측/스펙 핀 유지)**에만 씁니다.

### 3.3 Observability(OpenTelemetry)

- Claude Code는 OpenTelemetry(OTel)로 **metrics + events**를 내보낼 수 있습니다(옵트인). ([Claude Code](https://code.claude.com/docs/en/monitoring-usage))
- 기본적으로 user prompt content는 **redacted**이고, 필요하면 `OTEL_LOG_USER_PROMPTS=1`로 활성화할 수 있다고 명시합니다. ([Claude Code](https://code.claude.com/docs/en/monitoring-usage))

→ Compass의 “코치 추천”은 **민감정보를 저장하지 않고도**(반복 패턴/실패율/툴 사용 빈도/비용/시간) 충분히 가능하게 설계합니다.

### 3.4 MCP(외부 도구 연결)

- 프로젝트 스코프 MCP는 프로젝트 루트의 `.mcp.json`에 저장되며 팀 공유에 적합하고, env var 확장(`${VAR}` 등)도 지원합니다. ([Claude Code](https://code.claude.com/docs/en/mcp))
- MCP 스코프/저장 위치와 설정 범위는 settings 문서에 정리되어 있습니다. ([Claude Code](https://code.claude.com/docs/en/settings))

→ Compass는 MCP를 “다 붙여주는” 게 아니라, 관측을 근거로 **필요한 1~2개를 추천/설치 패치**합니다.

---

## 4) 제품 구성(모듈) — Closed Loop 운영 엔진

Compass는 4개 모듈을 “닫힌 고리”로 연결합니다.

```
[Telemetry & Trace] → [Diagnosis] → [Coach Recommendations] → [Apply & Guardrails] → [Measure] → (loop)

```

### 4.1 Observatory (관측 레이어)

### 목표

- “AI가 실제로 무엇을 했는지”를 **사용자에게 보이는 형태로** 남기고,
- 그 데이터를 코치/거버너가 재사용할 수 있게 표준화.

### 데이터 소스

1. **OTel events/metrics** (가능하면)
2. **Hook-based Trace** (항상 가능)
3. Git diff / test 결과 / lint 결과 (로컬)

### 저장 구조(권장)

- 프로젝트: `./.ai/trace/trace.jsonl` (가벼운 익명/요약만)
- 개인: `~/.compass/<project-id>/telemetry.db` (상세 통계/개인 피드백)

> 원칙: 프로젝트에는 공유 가능한 최소 로그, 개인 홈에는 개인 최적화 데이터.

### Trace 이벤트 스키마(초안)

`trace.jsonl` 한 줄 = 한 이벤트(요약 기반):

```json
{
  "ts": "2026-01-30T10:21:33+09:00",
  "session_id": "abc",
  "event": "PostToolUse",
  "tool": "Edit",
  "call_id": "tool_use_id",
  "matcher": "Write|Edit",
  "files": ["src/auth/login.ts"],
  "result": "success",
  "tests": { "ran": true, "cmd": "pnpm test auth", "status": "pass" },
  "policy": { "complexity_score": 42, "gate_level": 2 },
  "automation": {
    "hooks_fired": ["PostToolUse/trace-write"],
    "skills_used": ["spec-condense"]
  },
  "notes": "edited login flow"
}
```

- `session_id`는 trace.jsonl의 canonical 필드입니다. tool 이벤트인 경우 `call_id`(= tool_use_id)를 옵션으로 기록합니다.

### 사용자 UX

- `/trace last` : 최근 이벤트 타임라인
- `/trace why` : 어떤 규칙 때문에 어떤 자동화가 실행됐는지
- `/trace stats` : 실패율/테스트 누락률/반복 패턴 Top N
- (선택) 간단한 로컬 웹 UI: “내가 뭘 자동화해야 하는지”를 카드로 보여줌

---

### 4.2 Spec System (긴 작업용 “스펙 핀” + 멀티 세션 참조)

> 사용자가 질문했던 “다이어트된 프롬프트를 여러 채팅/컴팩트에서 어떻게 참조하나?”의 제품화입니다.

### 목표

- 스펙을 대화에 두지 않고 **파일에 고정**한다.
- 컴팩트/새 채팅에도 항상 “북극성”이 컨텍스트에 들어오게 한다.

### 파일 구조(권장)

```
.ai/specs/
  SPEC-YYYYMMDD-<slug>.md          # 스펙 원문(변경 로그 포함)
.ai/work/
  current.json                     # 현재 활성 스펙 포인터
  pin.md                           # 항상 얇게 로드되는 PIN

```

### PIN의 규격(고정)

PIN은 절대 길어지면 안 됩니다.

항상 아래 5개만:

- Goal (1~2줄)
- Must-have (최대 5)
- Constraints (환경/보안/금지사항)
- Acceptance Criteria (완료 판정)
- Pointer (spec 원문 링크)

### “항상 참조”를 어떻게 구현하나?

가장 단단한 방법은 **Claude Code 메모리 import**를 쓰는 겁니다.

- `.claude/CLAUDE.md` 또는 `CLAUDE.md`에
  `@.ai/work/pin.md` 를 넣어 **항상 로드**되게 합니다. ([Claude Code](https://code.claude.com/docs/en/memory))

또는 더 고급:

- `.claude/rules/pin-payment.md` 같은 룰 파일을 만들고
- `paths:`로 결제 코드에만 적용(컨텍스트 노이즈 감소) ([Claude Code](https://code.claude.com/docs/en/memory))

### 컴팩트 대응

- `PreCompact` 훅에서:
  - 현재 진행/결정 사항을 `pin.md`에 반영(짧게)
  - `SPEC.md`에 변경 로그 append
    (PreCompact 이벤트는 공식 훅 이벤트로 존재) ([Claude Code](https://code.claude.com/docs/en/hooks-guide))

---

### 4.3 Complexity Governor (긴 작업 품질 방어)

### 목표

- “요구사항이 길어서”가 아니라 “작업이 길고 복잡해져서” 생기는 실수를
  - **작업 분할**
  - **품질 게이트**
  - **위험 작업 차단/확인**
    으로 줄인다.

### 구성 3종 세트

### (A) Spec Condenser (스펙 구조화)

- 사용자의 원문 요청을 Spec 템플릿으로 구조화해서 `.ai/specs/`에 저장
- PIN도 자동 생성

### (B) Scope Slicer (복잡도 기반 분할)

- 변경 범위/리스크 플래그/모호함을 점수화(초기엔 룰 기반)
- 임계치 이상이면 자동으로 단계 계획을 생성:
  - 0단계: 재현/측정(버그면)
  - 1단계: 안전한 준비(리팩터링/인터페이스 정리)
  - 2단계: 기능 구현
  - 3단계: 테스트/문서/회귀

### (C) Guard Rails (품질 게이트)

- `Stop` 훅에서 “필수 게이트” 실행(또는 실행 여부 확인)
- 예: `lint`, `typecheck`, `unit test`, `smoke test` 중 프로젝트에 맞는 최소 1~2개

> Stop 훅은 “응답이 끝날 때 실행”되고, 훅은 Claude의 흐름을 계속 진행시키거나(차단) 피드백을 줄 수 있습니다. (Claude Code)

### “위험 작업”을 어떻게 제어하나?

- `PreToolUse` 훅으로:
  - `rm -rf`, `drop table`, prod deploy 같은 위험 패턴은 `deny/ask`
  - 안전한 테스트 명령은 `allow`로 자동 승인
  - 필요 시 `updatedInput`으로 명령 자체를 안전하게 수정 가능
    (allow/deny/ask + updatedInput + additionalContext가 공식 지원) ([Claude Code](https://code.claude.com/docs/en/hooks))

---

### 4.4 Personal Coach (개인 맞춤 자동 코치)

여기가 “번들링이 아니라 Go”의 핵심입니다.

### 목표

- 사용자의 실제 작업 로그를 보고:
  1. 어떤 자동화가 필요한지 찾고
  2. **훅/스킬/서브에이전트/MCP** 중 무엇으로 해결할지 결정하고
  3. 바로 **생성/적용/튜닝**까지 한다

### 코치의 3단계 동작

### 1) 패턴 감지

- 반복 프롬프트(“계획 세워줘”, “테스트 돌려줘”, “영향도 분석해줘”)
- 반복 시퀀스(수정 → 테스트 요청 → 포맷 요청)
- 반복 실패(같은 테스트 깨짐, 같은 린트 지적)
- 외부 참조 반복(이슈/Jira/로그/문서 검색 빈도 증가)
- 비용/토큰 급증 구간(OTel) ([Claude Code](https://code.claude.com/docs/en/monitoring-usage))

### 2) 라우팅(어떤 메커니즘으로 자동화할지)

- 반복되는 “말” → **Skill**
- 자주 까먹는 습관 → **Hook**
- 외부 시스템 접근 반복 → **MCP**
- 역할 분업 필요(리뷰/보안/테스트) → **Sub-agent**
- 여러 프로젝트 배포 필요 → **Plugin/Command 패키징**

### 3) 생성/적용/튜닝

- “추천 카드”를 만들고, 적용하면 파일 패치 생성:
  - `.claude/settings.local.json`에 훅 추가 (개인 실험용) ([Claude Code](https://code.claude.com/docs/en/settings))
  - `.claude/rules/*.md`에 규칙 추가(조건부 paths 포함) ([Claude Code](https://code.claude.com/docs/en/memory))
  - `.ai/specs/` / `pin.md` 자동 생성
  - `.mcp.json`에 MCP 추가(필요할 때만) ([Claude Code](https://code.claude.com/docs/en/mcp))
- 적용 후 Trace/OTel로 효과 측정 → “가중치 조정/자동 끄기”

### 개인화 UX (명령 체계)

- `/coach scan` : 최근 N세션 분석 → 자동화 후보 Top N(기본 3, 최대 5)
- `/coach apply <id>` : 후보 적용(패치 프리뷰 포함)
- `/coach rollback <id>` : 자동화 되돌리기
- `/coach report` : “적용 후 효과” 리포트(테스트 누락률↓, 반복 요청↓ 등)
- `/coach mode simple|pro|lab`
  - Simple: 추천/적용만
  - Pro: why/trace/점수 노출
  - Lab: 룰 엔진 편집, 임계치 튜닝

---

## 5) Compass의 “차별화”를 한 문장으로 정리하면

> 관측(OTel/Trace) 데이터를 “다음 액션(추천/생성/튜닝)”으로 연결하는 폐쇄루프 제품이다.

- 기존 생태계는:
  - 메모리(기억)
  - 템플릿/마켓(설치)
  - 오케스트레이션(실행)
  - 모니터링(보이기)
    를 각각 잘하지만,
- Compass는 **“보인 것을 기반으로 자동으로 설정이 진화”**하게 만듭니다.

---

## 6) 구현 설계 (Claude Code 기준)

### 6.1 파일/설정 배치 원칙

- 공유 가능한 것: repo 안 (`.ai/`, `.claude/rules/`, `.mcp.json`)
- 개인 실험/민감: local (`.claude/settings.local.json`, `CLAUDE.local.md`, `~/.compass/…`)
  (`.claude/settings.local.json`은 문서상 “커밋되지 않음” 용도) ([Claude Code](https://code.claude.com/docs/en/settings))
  (`CLAUDE.local.md`는 gitignore 자동) ([Claude Code](https://code.claude.com/docs/en/memory))

### 6.2 훅 최소 세트(권장)

1. `UserPromptSubmit`
   - PIN 주입/스펙 포인터 확인(컨텍스트 안정화)
     (공식 이벤트) ([Claude Code](https://code.claude.com/docs/en/hooks-guide))
2. `Stop`
   - 품질 게이트 실행/검증(테스트/린트)
     (Stop 제어 가능) ([Claude Code](https://code.claude.com/docs/en/hooks))
3. `PreCompact`
   - pin/spec 업데이트(긴 작업 유지) ([Claude Code](https://code.claude.com/docs/en/hooks-guide))
4. `PreToolUse` (선택)
   - 위험 명령 차단/ask, 안전 명령 allow, 입력 수정(updatedInput) ([Claude Code](https://code.claude.com/docs/en/hooks))

> 훅은 설정 파일로 구성되며, 자동 실행이라 보안 고려가 필수라는 경고가 있습니다. (Claude Code)

### 6.3 OTel 연동(선택이지만 강력)

- 개인은 처음엔 `console exporter`로 시작해도 충분
- 비용/토큰/툴 이벤트 기반으로 “복잡도 급증” 탐지 가능
  (OTel 설정/옵션은 공식 문서에 예시 포함) ([Claude Code](https://code.claude.com/docs/en/monitoring-usage))

---

## 7) MVP 범위(“Go 포지션”을 증명하는 최소 기능)

번들링을 피하고 “코치/거버너”임을 증명하려면 MVP도 그에 맞아야 합니다.

## MVP-1: 스펙 핀 + 멀티세션 참조(병목 2의 기반)

- `/spec new` → `SPEC.md + pin.md + current.json` 생성
- `CLAUDE.md` import로 pin 항상 로드 ([Claude Code](https://code.claude.com/docs/en/memory))
- PreCompact로 pin 업데이트

## MVP-2: 관측 → 추천(병목 3→4를 잇는 핵심)

- trace.jsonl 생성
- `/coach scan`이 “후보 3개”만이라도 정확히 추천
  - 예: “Stop에 테스트 자동 게이트 추가”
  - 예: “spec-condense 스킬 생성”
  - 예: “reviewer 서브에이전트 추가”

## MVP-3: 안전한 자동 적용/롤백(개인 사용자 UX의 승부처)

- apply는 항상:
  - 변경 파일 목록 + diff 프리뷰
  - `.local` 우선 적용(안전)
  - rollback 스냅샷(자동)

---

## 8) 성공 지표(Go를 유지할지 판단하는 측정 기준)

Compass는 “설치 수”보다 **행동 변화**가 핵심입니다.

- **세션 재시작 비용 감소**
  - “프로젝트 탐색/분석” 반복 메시지/토큰 감소(정량)
- **품질 안정화**
  - 테스트 누락률↓, 회귀(같은 버그 재발)↓
- **개인화 성과**
  - 추천 적용률(accept rate)
  - 적용 후 유지율(자동화가 꺼지지 않고 남는 비율)
- **인지 부하 감소**
  - “내가 뭘 깔아야 하지?” 질문 빈도 감소(간단 설문/피드백)

---

## 9) 리스크 & 설계적 완충장치

### 9.1 자동화 과적재(= 또 다른 병목 2)

- 해결: “기본은 최소 훅”, 추천도 Top 3만, 실패하면 자동 비활성(서킷 브레이커)

### 9.2 보안/프라이버시

- 훅은 자동 실행이므로 스크립트 검토가 필수(공식 문서도 경고) ([Claude Code](https://code.claude.com/docs/en/hooks-guide))
- OTel은 기본 prompt content redacted(필요시 opt-in) ([Claude Code](https://code.claude.com/docs/en/monitoring-usage))
- Compass는 기본 저장을 “요약/해시”로 하고 원문 저장은 opt-in

### 9.3 플랫폼 변경(Claude Code 업데이트)

- 해결: “공식 기능(메모리/훅/OTel/MCP)”을 최대한 활용해 API 의존 최소화
  (관련 공식 문서 기반 설계) ([Claude Code](https://code.claude.com/docs/en/memory))

---

## 10) 최종 정리: 이 문서가 말하는 “제품의 본질”

1. **스펙 핀**이 긴 작업의 북극성을 고정
2. **거버너**가 작업을 안전하게 분할하고 게이트로 실수를 줄이며
3. **관측**이 “블랙박스”를 없애고
4. **코치**가 그 관측을 근거로 “나에게 맞는 자동화”를 추천/생성/튜닝한다

이게 바로 “올인원 번들”과 다른, **개인 맞춤 자동 코치/거버너**의 제품 정의입니다.
