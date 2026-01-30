# Compass Agents & Skills Specification

> **Version**: v0.1.0 | **Updated**: 2026-01-30

이 문서는 Compass에서 사용하는 **에이전트, 스킬, 훅**의 설계 명세입니다.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Skills](#skills)
3. [Sub-Agents](#sub-agents)
4. [Hooks](#hooks)
5. [Routing Rules](#routing-rules)
6. [Extension Points](#extension-points)

---

## Design Philosophy

### 자동화 선택 기준

Compass는 **무조건 많이** 자동화하지 않습니다. 관측 데이터를 기반으로 **필요한 것만** 추천합니다.

| 패턴 유형 | 자동화 메커니즘 | 예시 |
|-----------|----------------|------|
| 반복되는 "말" | **Skill** | "계획 세워줘", "테스트 돌려줘" |
| 자주 까먹는 습관 | **Hook** | 커밋 전 테스트, 저장 전 린트 |
| 외부 시스템 접근 반복 | **MCP** | Jira, Notion, GitHub Issues |
| 역할 분업 필요 | **Sub-agent** | 리뷰어, 보안 검토, 테스트 생성 |

### 안전 원칙

1. **기본은 최소 훅**: 필수 4개만 (UserPromptSubmit, Stop, PreCompact, PreToolUse)
2. **추천은 Top 3**: 과부하 방지
3. **실패 시 자동 비활성**: 서킷 브레이커 패턴
4. **개인 설정 우선**: `.local` 파일로 안전하게 실험

---

## Skills

스킬은 **반복되는 말(프롬프트 패턴)**을 자동화합니다.

### Core Skills (Built-in)

#### `/spec new`

새 스펙을 생성하고 PIN을 설정합니다.

```yaml
name: spec-new
trigger: /spec new <title>
description: 새로운 스펙 파일과 PIN을 생성합니다
inputs:
  - title: string (required)
outputs:
  - .ai/specs/SPEC-{date}-{slug}.md
  - .ai/work/pin.md
  - .ai/work/current.json
```

**동작**:
1. 사용자 요청을 구조화된 스펙 템플릿으로 변환
2. `.ai/specs/SPEC-YYYYMMDD-<slug>.md` 생성
3. PIN 생성 (Goal, Must-have, Constraints, Acceptance Criteria, Pointer)
4. `current.json`에 활성 스펙 포인터 저장

---

#### `/spec condense`

긴 요구사항을 구조화된 스펙으로 압축합니다.

```yaml
name: spec-condense
trigger: /spec condense
description: 현재 대화의 요구사항을 구조화된 스펙으로 압축
inputs:
  - context: 현재 대화 컨텍스트 (자동)
outputs:
  - 구조화된 스펙 (Goal, Must-have, Constraints, Acceptance Criteria)
```

**PIN 규격** (항상 이 5개만):
```markdown
## PIN: {title}

### Goal
[1-2줄 목표]

### Must-have
- [ ] 필수 요구사항 1
- [ ] 필수 요구사항 2
(최대 5개)

### Constraints
- 환경/보안/금지사항

### Acceptance Criteria
- 완료 판정 기준

### Pointer
→ .ai/specs/SPEC-{date}-{slug}.md
```

---

#### `/coach scan`

최근 세션을 분석하여 자동화 후보를 추천합니다.

```yaml
name: coach-scan
trigger: /coach scan
description: 최근 N 세션을 분석하여 자동화 후보 Top 5 추천
inputs:
  - sessions: number (default: 10)
outputs:
  - 자동화 후보 리스트 (id, type, reason, impact_score)
```

**분석 대상**:
- 반복 프롬프트 패턴
- 반복 시퀀스 (수정 → 테스트 → 포맷)
- 반복 실패 (같은 테스트/린트 에러)
- 비용/토큰 급증 구간

**출력 예시**:
```markdown
## 자동화 후보 (Top 5)

| # | Type | 추천 | Impact |
|---|------|-----|--------|
| 1 | Hook | Stop에 테스트 자동 게이트 추가 | ★★★★☆ |
| 2 | Skill | "영향도 분석" 스킬 생성 | ★★★☆☆ |
| 3 | Sub-agent | reviewer 서브에이전트 추가 | ★★★☆☆ |

적용: `/coach apply 1`
```

---

#### `/trace stats`

관측 데이터의 통계 요약을 보여줍니다.

```yaml
name: trace-stats
trigger: /trace stats [period]
description: 지정 기간의 관측 통계 요약
inputs:
  - period: string (default: "7d", options: "1d", "7d", "30d")
outputs:
  - 실패율, 테스트 누락률, 반복 패턴 Top N
```

---

### Generated Skills (Coach가 생성)

Coach는 패턴 감지 후 사용자 맞춤 스킬을 생성할 수 있습니다.

**생성 템플릿**:
```yaml
name: {auto-generated}
trigger: /{name}
description: {pattern description}
inputs: {extracted from pattern}
outputs: {expected results}
source: coach-generated
created_at: {timestamp}
stats:
  usage_count: 0
  success_rate: 0
```

---

## Sub-Agents

서브에이전트는 **역할 분업**이 필요할 때 사용합니다.

### Reviewer Agent

코드 리뷰를 전담하는 에이전트입니다.

```yaml
name: reviewer
role: Code Reviewer
trigger: /review [files]
description: 지정된 파일 또는 staged 변경사항을 리뷰
capabilities:
  - 코드 품질 분석
  - 버그 가능성 탐지
  - 보안 취약점 체크
  - 테스트 커버리지 확인
context_requirements:
  - 프로젝트 코딩 컨벤션 (.claude/rules/)
  - 최근 관련 커밋 히스토리
output_format: |
  ## Review Summary
  - 변경 파일: {count}
  - 심각도: {Critical|Warning|Info}

  ## Findings
  | File | Line | Severity | Issue |
  |------|------|----------|-------|

  ## Recommendations
  - ...
```

---

### Security Agent

보안 관점에서 코드를 검토합니다.

```yaml
name: security
role: Security Reviewer
trigger: /security [scope]
description: 보안 취약점 및 민감 정보 노출 검토
capabilities:
  - OWASP Top 10 체크
  - 하드코딩된 시크릿 탐지
  - 의존성 취약점 확인
  - 권한 에스컬레이션 가능성
context_requirements:
  - 보안 정책 문서
  - 환경 설정 파일
output_format: |
  ## Security Scan Results
  - Risk Level: {High|Medium|Low}
  - Vulnerabilities Found: {count}

  ## Details
  ...
```

---

### Test Agent

테스트 생성 및 검증을 전담합니다.

```yaml
name: tester
role: Test Engineer
trigger: /test [target]
description: 테스트 생성, 실행, 커버리지 분석
capabilities:
  - 유닛 테스트 생성
  - 엣지 케이스 도출
  - 테스트 실행 및 결과 분석
  - 커버리지 리포트
context_requirements:
  - 테스트 프레임워크 설정
  - 기존 테스트 패턴
output_format: |
  ## Test Results
  - Total: {count}
  - Passed: {count}
  - Failed: {count}
  - Coverage: {percent}%

  ## New Tests Generated
  ...
```

---

## Hooks

훅은 **자동 트리거**되는 품질 게이트입니다. Compass는 **최소 4개**만 권장합니다.

### Hook Configuration Schema

```json
{
  "hooks": {
    "{event}": [
      {
        "name": "{hook-name}",
        "matcher": "{tool-pattern}",
        "command": "{script-path}",
        "timeout": 30000,
        "enabled": true
      }
    ]
  }
}
```

---

### 1. UserPromptSubmit Hook

사용자 입력 시 PIN/스펙 포인터를 컨텍스트에 주입합니다.

```json
{
  "event": "UserPromptSubmit",
  "name": "pin-inject",
  "command": "compass hook pin-inject",
  "description": "활성 스펙의 PIN을 컨텍스트에 주입"
}
```

**동작**:
1. `.ai/work/current.json` 확인
2. 활성 스펙이 있으면 `pin.md` 내용을 `additionalContext`로 반환
3. 없으면 패스

---

### 2. Stop Hook (Quality Gate)

응답 완료 시 품질 게이트를 실행합니다.

```json
{
  "event": "Stop",
  "name": "quality-gate",
  "command": "compass hook quality-gate",
  "description": "lint, typecheck, test 실행 및 검증"
}
```

**동작**:
1. 변경된 파일 감지
2. 해당 파일에 대한 lint/typecheck 실행
3. 관련 테스트 실행 (영향도 기반)
4. 실패 시 피드백 반환, 성공 시 패스

**게이트 레벨** (설정 가능):
- Level 0: 없음 (비권장)
- Level 1: lint만
- Level 2: lint + typecheck (기본)
- Level 3: lint + typecheck + affected tests

---

### 3. PreCompact Hook

컴팩트 전 PIN/스펙을 업데이트합니다.

```json
{
  "event": "PreCompact",
  "name": "spec-sync",
  "command": "compass hook spec-sync",
  "description": "컴팩트 전 진행 상황을 PIN에 반영"
}
```

**동작**:
1. 현재 대화에서 완료된 작업/결정 사항 추출
2. `pin.md` 업데이트 (Must-have 체크박스 등)
3. `SPEC.md`에 변경 로그 추가

---

### 4. PreToolUse Hook (Optional)

위험 명령을 차단하거나 확인을 요청합니다.

```json
{
  "event": "PreToolUse",
  "name": "safety-guard",
  "matcher": "Bash",
  "command": "compass hook safety-guard",
  "description": "위험 명령 차단/확인"
}
```

**차단 패턴** (deny):
- `rm -rf /`, `rm -rf ~`, `rm -rf .`
- `DROP TABLE`, `DELETE FROM ... WHERE 1=1`
- `--force` with destructive commands
- 프로덕션 배포 명령

**확인 패턴** (ask):
- `git push --force`
- `npm publish`
- 환경 변수 수정

**자동 승인 패턴** (allow):
- `pnpm test`, `npm test`, `vitest`
- `pnpm lint`, `eslint`
- `pnpm build`

---

## Routing Rules

Coach가 자동화 메커니즘을 선택하는 규칙입니다.

### Pattern → Mechanism Mapping

```yaml
routing_rules:
  # 반복 프롬프트 → Skill
  - pattern: "same_prompt_3x_in_7d"
    action: "suggest_skill"
    priority: high

  # 반복 시퀀스 → Skill or Hook
  - pattern: "sequence_edit_test_format"
    action: "suggest_hook_or_skill"
    priority: medium

  # 반복 실패 → Hook (품질 게이트)
  - pattern: "same_test_fail_3x"
    action: "suggest_hook"
    hook_type: "Stop"
    priority: high

  # 외부 시스템 반복 → MCP
  - pattern: "external_api_5x_in_session"
    action: "suggest_mcp"
    priority: medium

  # 역할 분업 필요 → Sub-agent
  - pattern: "review_security_test_in_sequence"
    action: "suggest_subagent"
    priority: low
```

### Impact Score Calculation

```yaml
impact_factors:
  - frequency: 0.4      # 발생 빈도
  - time_saved: 0.3     # 예상 절약 시간
  - error_reduction: 0.2 # 에러 감소 효과
  - complexity: 0.1     # 구현 복잡도 (역수)
```

---

## Extension Points

Compass는 확장 가능한 구조로 설계됩니다.

### Custom Skill Registration

```typescript
interface SkillDefinition {
  name: string;
  trigger: string;
  description: string;
  handler: (input: SkillInput) => Promise<SkillOutput>;
  metadata?: {
    source: 'builtin' | 'coach-generated' | 'user-defined';
    createdAt: string;
    stats?: SkillStats;
  };
}
```

### Custom Hook Registration

```typescript
interface HookDefinition {
  event: HookEvent;
  name: string;
  matcher?: string;
  handler: (input: HookInput) => Promise<HookOutput>;
  timeout?: number;
  enabled?: boolean;
}

type HookEvent =
  | 'SessionStart'
  | 'UserPromptSubmit'
  | 'PreToolUse'
  | 'PostToolUse'
  | 'Stop'
  | 'PreCompact'
  | 'SessionEnd';

interface HookOutput {
  decision?: 'allow' | 'deny' | 'ask';
  reason?: string;
  additionalContext?: string;
  updatedInput?: Record<string, unknown>;
}
```

### Custom Sub-Agent Registration

```typescript
interface SubAgentDefinition {
  name: string;
  role: string;
  trigger: string;
  description: string;
  capabilities: string[];
  contextRequirements: string[];
  outputFormat: string;
  handler: (input: AgentInput) => Promise<AgentOutput>;
}
```

---

## Version History

| Version | Date       | Changes                                    |
|---------|------------|--------------------------------------------|
| v0.1.0  | 2026-01-30 | Initial specification                      |

---

## References

- [PRD](./docs/00_start_here.md) - 제품 요구사항 정의
- [CLAUDE.md](./CLAUDE.md) - 프로젝트 지침
- [Claude Code Hooks](https://code.claude.com/docs/en/hooks)
- [Claude Code Memory](https://code.claude.com/docs/en/memory)
