# Compass Agents & Skills Specification (AGENTS.md)

> **Version**: v0.1.3 | **Updated**: 2026-02-05
> 이 문서는 Compass가 제공(또는 생성)하는 **스킬(Commands), 서브에이전트(Subagents), 훅(Hooks)** 의 "실행 계약"입니다.

---

## 0) Scope

- “무엇을 자동화할지”를 번들링하는 문서가 아니라,
  **관측 → 진단 → 추천/생성 → 검증/튜닝**을 닫힌 고리로 운용하기 위한 **운영 레이어 정의서**입니다.
- 구현체(CLI/플러그인/스크립트)가 바뀌어도, 이 문서의 **I/O 계약과 파일 구조**는 최대한 유지합니다.

---

## 1) Design Principles

### 1.1 자동화 선택 기준 (Routing)
| 패턴 유형 | 우선 메커니즘 | 예시 |
|---|---|---|
| 반복되는 “말” | **Skill** | “계획 세워줘”, “영향도 분석해줘” |
| 자주 까먹는 습관 | **Hook** | Stop 시 테스트 게이트 |
| 외부 시스템 참조 반복 | **MCP** | Jira/Notion/GitHub 검색 반복 |
| 역할 분업 필요 | **Sub-agent** | reviewer, security, tester |
| 여러 프로젝트 배포 | Plugin/Command 패키징(후순위) | 팀 배포용 |

### 1.2 안전 원칙
1. **기본은 최소 훅(3개)**: UserPromptSubmit, PreCompact, Stop  
   - PreToolUse(위험 차단), PostToolUse(추적 강화)는 **옵션**
2. **추천은 Top 3 기본값**  
   - Pro/Lab 모드에서만 Top 5까지 확장 가능
3. **개인 설정 우선(.local)**  
   - 적용/실험은 `.claude/settings.local.json` 등 로컬 우선
4. **서킷 브레이커**  
   - 동일 자동화가 반복 실패/방해하면 자동 비활성 + 이유 기록
5. **프라이버시 기본값 보수적**  
   - 원문 프롬프트/시크릿 저장 금지(요약/해시만)

---

## 2) Data Artifacts (파일 계약)

### 2.1 Spec & Work
- `.ai/specs/SPEC-YYYYMMDD-<slug>.md` : 스펙 원문(변경 로그 포함)
- `.ai/work/pin.md` : 항상 얇게 로드되는 PIN(5개 항목만)
- `.ai/work/current.json` : 현재 활성 스펙 포인터

#### `current.json` (권장 스키마)
```json
{
  "active_spec": ".ai/specs/SPEC-20260130-compass-mvp.md",
  "pin": ".ai/work/pin.md",
  "title": "Compass MVP",
  "tags": ["mvp", "spec-system"],
  "updated_at": "2026-01-30T10:21:33+09:00"
}
```

### 2.2 Trace
- `.ai/trace/trace.jsonl` : 공유 가능한 “요약 Trace” (1줄=1이벤트)

#### `trace.jsonl` (초안 스키마)
```json
{
  "ts": "2026-01-30T10:21:33+09:00",
  "session_id": "abc",
  "event": "PostToolUse",
  "tool": "Edit",
  "call_id": "tool_use_id",
  "files": ["src/auth/login.ts"],
  "result": "success",
  "tests": { "ran": true, "cmd": "pnpm test auth", "status": "pass" },
  "policy": { "complexity_score": 42, "gate_level": 2 },
  "automation": {
    "hooks_fired": ["Stop/quality-gate"],
    "skills_used": ["spec-condense"]
  },
  "notes": "edited login flow"
}
```

**민감정보 금지**: 시크릿/토큰/개인정보/원문 프롬프트를 넣지 않습니다.

### 2.3 Personal telemetry (개인 전용)
- `~/.compass/<project-id>/telemetry.db` : 개인 최적화 통계/피드백(Repo에 커밋 금지)

---

## 3) Skills (Commands)

> 표기는 “UX 명령” 기준입니다. 구현은 (A) Claude Code 플러그인 Commands, (B) `compass` CLI, (C) 둘의 혼합일 수 있습니다.

### 3.1 `/spec new <title>`
새 스펙 + PIN + current 포인터를 생성합니다.

```yaml
name: spec-new
trigger: /spec new <title>
inputs:
  - title: string (required)
writes:
  - .ai/specs/SPEC-{date}-{slug}.md
  - .ai/work/pin.md
  - .ai/work/current.json
acceptance:
  - pin.md가 5개 항목만 포함
  - SPEC 파일에 Change Log 섹션 존재
```

**SPEC 템플릿(요약)**
- Goal
- Must-have (≤5)
- Nice-to-have (≤5)
- Constraints
- Acceptance Criteria
- Notes / Decisions
- Change Log (append-only)

---

### 3.2 `/spec condense`
현재 요청(또는 제공된 요구사항)을 **Spec Condense 포맷**으로 구조화합니다.

```yaml
name: spec-condense
trigger: /spec condense
inputs:
  - context: current conversation (implicit)
writes:
  - (optional) .ai/specs/SPEC-{date}-{slug}.md
  - (optional) .ai/work/pin.md
outputs:
  - Goal / Must-have / Nice-to-have / Constraints / Acceptance Criteria
rules:
  - Must-have는 최대 5개
  - Acceptance Criteria가 없으면 생성(완료 판정 가능하게)
```

---

### 3.3 `/spec status`
활성 스펙의 현재 상태를 보여줍니다.

```yaml
name: spec-status
trigger: /spec status
reads:
  - .ai/work/current.json
  - .ai/work/pin.md
outputs:
  - active_spec, last_updated, Must 체크 상태, Acceptance 요약
```

---

### 3.4 `/trace last [n]`
최근 n개 Trace 이벤트를 타임라인으로 보여줍니다(기본 10).

```yaml
name: trace-last
trigger: /trace last [n]
reads:
  - .ai/trace/trace.jsonl
outputs:
  - ts, event, tool, files, result, notes
```

---

### 3.5 `/trace why [event_id|tail]`
“왜 이 자동화가 실행됐는지”를 설명합니다.

```yaml
name: trace-why
trigger: /trace why [event]
reads:
  - .ai/trace/trace.jsonl
outputs:
  - 어떤 규칙/점수 때문에 어떤 hooks/skills가 실행되었는지 (3줄 내)
```

---

### 3.6 `/trace stats [period]`
관측 통계를 요약합니다.

```yaml
name: trace-stats
trigger: /trace stats [period]
inputs:
  - period: "1d" | "7d" | "30d" (default: "7d")
outputs:
  - 실패율, 테스트 누락률, 반복 패턴 Top N, 비용 스파이크(가능 시)
```

---

### 3.7 `/coach scan [sessions] [--top N]`
최근 N 세션/이벤트를 분석하여 자동화 후보를 추천합니다.

```yaml
name: coach-scan
trigger: /coach scan [sessions] [--top N]
inputs:
  - sessions: number (default: 10)
  - top: number (default: 3, max: 5)
outputs:
  - candidates: [{id, type, title, reason, impact_score, risk_level}]
rules:
  - 기본은 Top 3만 출력
  - 각 후보는 "적용 방법 + 롤백 방법" 포함
```

**분석 신호**
- 반복 프롬프트/반복 시퀀스/반복 실패/외부 참조 반복/토큰·비용 급증(가능 시)

---

### 3.8 `/coach apply <id>`
후보를 “안전하게” 적용합니다.

```yaml
name: coach-apply
trigger: /coach apply <id>
writes:
  - (prefer) .claude/settings.local.json
  - (sometimes) .claude/rules/*.md
  - (sometimes) .mcp.json
  - snapshot: ~/.compass/<project-id>/snapshots/<id>/
outputs:
  - 변경 파일 목록 + diff 프리뷰
  - rollback 명령/경로
rules:
  - 로컬 우선 적용(.local)
  - 공유 파일 변경 시 명시적으로 알림
```

---

### 3.9 `/coach rollback <id>`
적용을 되돌립니다(스냅샷 기반).

```yaml
name: coach-rollback
trigger: /coach rollback <id>
reads:
  - ~/.compass/<project-id>/snapshots/<id>/
writes:
  - 변경 파일 원복
outputs:
  - rollback 결과(성공/실패, 원복 파일 목록)
```

---

### 3.10 `/coach report [period]`
적용 전/후 효과 리포트를 생성합니다.

```yaml
name: coach-report
trigger: /coach report [period]
reads:
  - .ai/trace/trace.jsonl
  - ~/.compass/<project-id>/telemetry.db (if exists)
outputs:
  - 테스트 누락률 변화, 반복 실패 변화, 반복 요청 변화
```

---

### 3.11 `/coach mode simple|pro|lab`
노출 수준을 바꿉니다.

- `simple`: 추천/적용 중심(점수/규칙 노출 최소)
- `pro`: why/trace/점수 노출
- `lab`: 룰 엔진/임계치 튜닝 허용

---

### 3.12 `/guard status` / `/guard run`
품질 게이트 상태 확인 및 수동 실행.

```yaml
name: guard-status
trigger: /guard status
outputs:
  - gate_level, last_run, last_result, suggested_next_gate

name: guard-run
trigger: /guard run [level]
outputs:
  - 실행 커맨드, 결과 요약, 실패 시 원인/다음 조치
```

---

## 4) Sub-Agents

> 서브에이전트는 “역할 분업”을 위한 프리셋입니다. (구현: Claude Code Subagents 또는 내부 오케스트레이션)

### 4.1 `reviewer`
```yaml
name: reviewer
role: Code Reviewer
trigger: /review [files]
focus:
  - 코드 품질/가독성
  - 버그 가능성/엣지 케이스
  - 테스트 누락 및 회귀 위험
output_format: |
  ## Review Summary
  - Files: {count}
  - Severity: {Critical|Warning|Info}

  ## Findings
  | File | Severity | Issue | Suggestion |
  |------|----------|-------|------------|

  ## Next
  - ...
```

### 4.2 `security`
```yaml
name: security
role: Security Reviewer
trigger: /security [scope]
focus:
  - 하드코딩 시크릿/민감정보
  - 권한/인증/인가 흐름
  - 위험 명령/데이터 파괴 가능성
output_format: |
  ## Security Scan
  - Risk: {High|Medium|Low}
  - Findings: {count}

  ## Details
  - ...
```

### 4.3 `tester`
```yaml
name: tester
role: Test Engineer
trigger: /test [target]
focus:
  - 영향도 기반 테스트 계획
  - 엣지 케이스 도출
  - 실패 원인 분석 및 회귀 방지
output_format: |
  ## Test Plan / Results
  - Target: {target}
  - Ran: {cmd}
  - Result: {pass|fail}

  ## Added / Updated Tests
  - ...
```

---

## 5) Hooks

### 5.1 Hook config (Claude Code settings 형식)

훅은 아래 형태로 설정됩니다(“matcher → hooks 배열”). 예시는 `.claude/settings.local.json`에 두고 실험하는 것을 권장합니다.

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "*",
        "hooks": [
          { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/node_modules/.bin/compass hook pin-inject" }
        ]
      }
    ]
  }
}
```

### 5.2 Hook I/O 계약 (스크립트)

- 입력: **stdin으로 JSON** (tool/prompt 정보 포함)
- 출력: `stdout`(plain text 또는 JSON), 종료 코드

#### Exit Code 규칙

| Exit Code | 의미 | stdout |
|-----------|------|--------|
| 0 | 정상 (선택적으로 JSON 제어 가능) | JSON 또는 없음 |
| 1 | 에러 (stdin 파싱 실패 등) | 없음 (stderr로 진단) |
| 2 | 즉시 차단 | 없음 (stderr가 사용자/Claude에게 표시) |

#### 이벤트별 출력 스키마

##### UserPromptSubmit/PreCompact — `additionalContext` 주입
```json
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "<컨텍스트 내용>"
  }
}
```

##### Stop/SubagentStop — 계속 진행 강제
```json
{
  "decision": "block",
  "reason": "테스트가 실행되지 않았습니다. 테스트 실행 후 다시 종료하세요."
}
```
- `decision: "block"` → Claude가 종료하지 않고 계속 진행하도록 유도
- `decision` 없이 exit 0 → 정상 종료 허용

##### PreToolUse — 권한 제어 (permissionDecision)
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow" | "deny" | "ask",
    "permissionDecisionReason": "허용/거부/확인 이유",
    "updatedInput": { "command": "수정된 명령" },
    "additionalContext": "추가 컨텍스트"
  }
}
```
> **중요**: PreToolUse에서 `decision`/`reason` 필드는 deprecated입니다. 반드시 `hookSpecificOutput.permissionDecision`을 사용하세요.

#### 공통 JSON 필드(옵션)
```json
{
  "continue": true,
  "stopReason": "string",
  "suppressOutput": true,
  "systemMessage": "string"
}
```

> `continue=false`는 해당 단계 전체를 멈추는 강한 제어입니다. (특정 툴만 막을 때는 PreToolUse의 permissionDecision을 우선 사용)

---

### 5.3 Required hooks (Core loop)

#### (1) UserPromptSubmit — `pin-inject`
- 목적: 매 입력 시 “북극성(PIN)”을 컨텍스트에 주입

권장 동작:
1) `.ai/work/current.json` 확인  
2) 활성 스펙이 있으면 `.ai/work/pin.md` 내용을 `additionalContext`로 추가  
3) 없으면 아무 것도 하지 않음

(JSON 방식 예시)
```json
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "<PIN CONTENTS>"
  }
}
```

---

#### (2) PreCompact — `spec-sync`
- 목적: 컴팩트 전에 PIN/SPEC 갱신 **지시**를 `additionalContext`로 주입

권장 동작:
1) `.ai/work/current.json`에서 활성 스펙/pin 경로 확인
2) "PIN의 Goal/Must-have/Constraints/Acceptance Criteria를 갱신하라"는 지시를 `additionalContext`로 출력
3) "SPEC Change Log에 이 세션의 진행을 추가하라"는 지시를 함께 출력
4) 직접 파일을 수정하지 않음 — Claude가 지시에 따라 갱신

(JSON 방식 예시)
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreCompact",
    "additionalContext": "<compass-spec-sync>갱신 지시 내용</compass-spec-sync>"
  }
}
```

---

#### (3) Stop — `quality-gate`
- 목적: 응답 종료 시 품질 게이트 실행/검증

권장 Gate Level
- L1: lint
- L2: lint + typecheck (기본)
- L3: lint + typecheck + affected tests

Stop 훅은 “멈추지 않고 더 진행하도록(Claude가 계속 작업하도록)” 강제할 수 있습니다.

(JSON 방식 예시)
```json
{
  "decision": "block",
  "reason": "테스트가 실행되지 않았습니다. 우선 `pnpm test`(또는 동등) 실행 후 다시 종료하세요."
}
```

---

### 5.4 Optional safety hook

#### PreToolUse — `safety-guard` (옵션)
- 목적: 위험한 툴/명령을 deny/ask로 제어하고, 안전한 명령은 allow/approve

**권장 매처**
- `Bash` (쉘)
- (추가) `Write`, `Edit` 등 파일 파괴 위험이 있는 경우

차단(deny) 예시:
- `rm -rf /`, `rm -rf ~`, `drop table`, prod deploy 등

PreToolUse는 특정 툴 실행만 제어하는 방식으로 출력합니다.

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "ask",
    "permissionDecisionReason": "파괴적 명령 가능성이 있어 확인이 필요합니다.",
    "updatedInput": {
      "command": "rm -i <...>"
    },
    "additionalContext": "주의: destructive operation"
  }
}
```

- **중요**: PreToolUse에서 `decision`/`reason`은 deprecated입니다. `permissionDecision`을 우선 사용하고, 호환 목적의 매핑은 `approve`→`allow`, `block`→`deny`로 처리합니다.

---

### 5.5 Optional trace hooks (가시성 강화)

- `SessionStart`: 세션 시작 요약(활성 스펙/게이트 레벨 등)
- `PostToolUse` / `PostToolUseFailure`: 툴 실행 결과를 trace.jsonl에 기록
- `SessionEnd`: 세션 요약 기록(실패/테스트/다음 액션)

> Trace는 “항상 가능”해야 하므로, OTel이 없을 때는 위 훅들로 최소 기능을 보완합니다.

---

## 6) Routing Rules (Coach의 선택 규칙)

```yaml
routing_rules:
  # 반복 프롬프트 → Skill
  - pattern: "same_prompt_3x_in_7d"
    action: "suggest_skill"
    priority: high

  # 반복 실패 → Stop Hook 강화
  - pattern: "same_test_fail_3x"
    action: "suggest_hook"
    hook_event: "Stop"
    priority: high

  # 외부 참조 반복 → MCP 추천
  - pattern: "external_lookup_5x_in_session"
    action: "suggest_mcp"
    priority: medium

  # 역할 분업 필요 → Sub-agent
  - pattern: "review_security_test_in_sequence"
    action: "suggest_subagent"
    priority: low
```

### Impact Score (초기 가중치)
```yaml
impact_factors:
  - frequency: 0.4
  - time_saved: 0.3
  - error_reduction: 0.2
  - complexity: 0.1
```

---

## 7) Extension Points

### 7.1 Custom skill registration (개념 인터페이스)
```ts
export interface SkillDefinition {
  name: string;
  trigger: string;
  description: string;
  handler: (input: unknown) => Promise<unknown>;
  metadata?: {
    source: "builtin" | "coach-generated" | "user-defined";
    createdAt: string;
    usageCount?: number;
    successRate?: number;
  };
}
```

### 7.2 Hook adapter (Claude Code I/O에 맞춘 어댑터)
- 표준 입력(stdin JSON)을 내부 `HookContext`로 변환
- 표준 출력(JSON/exit code)을 Claude Code 규약에 맞게 변환

---

## Version History

| Version | Date       | Changes |
|---------|------------|---------|
| v0.1.3  | 2026-02-05 | MVP-1 구현 반영(spec-sync additionalContext 방식으로 변경) |
| v0.1.2  | 2026-01-31 | Hook I/O 규약 보강(이벤트별 출력 스키마, PreToolUse permissionDecision) |
| v0.1.1  | 2026-01-30 | PRD v0.1 정합성 반영(Top3 기본, 명령/훅 계약 보강, 설정 스키마 최신화) |
| v0.1.0  | 2026-01-30 | Initial specification |

---

## References (raw links)

- https://code.claude.com/docs/en/hooks
- https://code.claude.com/docs/en/memory
- https://code.claude.com/docs/en/settings
- https://code.claude.com/docs/en/monitoring-usage
- https://code.claude.com/docs/en/mcp
