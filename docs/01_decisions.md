# Compass MVP Decisions (v0.1)

> **Updated**: 2026-02-05
> 이 문서는 MVP 구현에 필요한 **설계 결정**을 고정합니다.

---

## 결정 요약 (Quick Reference)

| 항목 | 결정 | 근거 |
|------|------|------|
| CLI 패키지 구조 | (B) 단일 패키지(루트) | MVP는 closed loop 데모가 핵심, 모노레포 오버헤드 회피 |
| CLI 설치/실행 | (B) devDependencies + 초기 1회 npx | hooks 반복 호출 효율, 버전 고정 |
| .ai/ 생성 범위 | init 분리 + spec new 자동 보정 | UX: 파일 없어도 동작, 기존 파일 보호 |
| Hook I/O | stdin JSON → stdout JSON/text + exit code | Claude Code hooks 공식 스펙 정합 |
| 기술 스택 | TypeScript + Node.js | JSON 파싱/스키마 검증/윈도우 호환 |
| MVP 순서 | MVP-1 → MVP-2 → MVP-3 순차 | closed loop 최소 완성 우선 |

---

## 1. CLI 패키지 구조

### 결정: (B) 단일 패키지(루트)로 MVP 시작

```
/
  package.json            # compass-ai
  tsconfig.json
  vitest.config.ts
  src/
    cli/
      index.ts           # CLI 엔트리포인트
      commands/
        init.ts          # compass init
        spec.ts          # compass spec new
        capsule.ts       # compass capsule sync       (MVP-1)
        trace.ts         # compass trace *             (MVP-2)
        coach.ts         # compass coach *             (MVP-3)
        guard.ts         # compass guard *             (MVP-2)
    core/
      types.ts           # 공유 타입
      spec/
        generator.ts     # SPEC/PIN/current.json 생성
        templates.ts     # 마크다운 템플릿
      capsule/
        reader.ts        # capsule/pin 파일 읽기
        diff-collector.ts # git diff → DiffSignal
        prompt-builder.ts # capsule 갱신 프롬프트 조립
      trace/             # (MVP-2)
      coach/             # (MVP-3)
      guard/             # (MVP-2)
    hooks/
      index.ts           # hook 라우터
      pin-inject.ts
      spec-sync.ts
      quality-gate.ts    # (MVP-2)
      safety-guard.ts    # (선택)
  tests/
    core/
      spec/
        generator.test.ts
      capsule/
        prompt-builder.test.ts
  .claude/
    commands/
      capsule-sync.md    # /capsule-sync 슬래시 커맨드
    settings.local.json  # 개인 실험 (gitignore)
  .ai/
    specs/
    work/
    trace/
    capsule/
  docs/
```

### 근거

- 리포가 비어있고, MVP는 "닫힌 고리 데모"가 핵심
- skills 마크다운은 `.claude/skills/`로 패키지 분리 없이 관리 가능
- 모노레포 전환 트리거: 플러그인 패키징 또는 코어 라이브러리 분리가 필요해질 때

---

## 2. CLI 설치/실행 방식

### 결정: 기본 (B) devDependencies + 보조 (A) 초기 1회 npx

#### 초기 1회 (부트스트랩)

```bash
# 새 프로젝트에서 처음 설치
npx compass-ai init
# 또는
pnpm dlx compass-ai init
```

`init` 명령이 내부에서:
1. `.ai/` 스켈레톤 생성 (specs, work, trace, capsule)
2. `.ai/capsule/*.md` 최소 템플릿 생성 (기존 파일 보호)
3. CLAUDE.md에 `@.ai/work/pin.md` import 라인 추가 (없으면)
4. (후순위) `.claude/settings.local.json` hooks 자동 등록
5. (후순위) `.claude/skills/` 생성 (skill 마크다운)

#### 이후 hooks 호출

```bash
# settings.local.json에서 등록된 hook command
"$CLAUDE_PROJECT_DIR"/node_modules/.bin/compass hook pin-inject
```

- `$CLAUDE_PROJECT_DIR`: Claude Code가 제공하는 환경변수로 프로젝트 루트 고정
- 로컬 바이너리 호출로 버전 일치/속도 보장

---

## 3. .ai/ 디렉토리 생성 범위

### 결정: init 분리 + spec new 자동 보정

#### `/compass init` (레포 단위 초기화)

생성 대상:
- `.ai/specs/` (빈 디렉토리)
- `.ai/work/` (빈 디렉토리)
- `.ai/trace/` (빈 디렉토리)
- `.ai/capsule/PROJECT.md` (최소 템플릿)
- `.ai/capsule/CONVENTIONS.md` (최소 템플릿)
- `.ai/capsule/STATUS.md` (최소 템플릿)
- `.claude/settings.local.json` (hooks 등록) — **(후순위, 현재는 수동)**
- `.claude/skills/` (skill 마크다운) — **(후순위)**

#### `/spec new <title>` (작업 단위 스펙 생성)

생성/보정 대상:
- `.ai/specs/SPEC-{date}-{slug}.md` (생성)
- `.ai/work/pin.md` (생성)
- `.ai/work/current.json` (생성/업데이트)
- `.ai/capsule/*` (없으면 최소 템플릿 생성, **기존 파일은 절대 덮어쓰지 않음**)

### 근거

- CLAUDE.md에서 `@.ai/work/pin.md` import가 걸려있을 때, 파일이 없으면 UX가 나빠질 수 있음
- "init 안 하고 /spec new부터 쓰는 사용자"도 정상 동작해야 함

---

## 4. Hook I/O 규약

### 결정: stdin JSON → stdout JSON/text + exit code

#### 기본 규칙

| 상황 | stdout | exit code |
|------|--------|-----------|
| 정상, 할 일 없음 | (없음) | 0 |
| 정상, 출력 있음 | JSON 또는 text | 0 |
| stdin JSON 파싱 실패 | (없음) | 1 |
| 즉시 차단 + 메시지 | (없음), stderr에 메시지 | 2 |

#### Hook별 출력 스키마

##### UserPromptSubmit (pin-inject)

```json
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "<PIN 내용>"
  }
}
```

##### PreCompact (spec-sync)

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreCompact",
    "additionalContext": "<compass-spec-sync>갱신 지시 내용</compass-spec-sync>"
  }
}
```

- PIN/SPEC 갱신 **지시**를 `additionalContext`로 출력 (Claude가 파일 갱신 수행)
- 직접 파일을 변경하지 않음

##### Stop (quality-gate)

```json
{
  "decision": "block",
  "reason": "테스트가 실행되지 않았습니다. pnpm test 실행 후 다시 종료하세요."
}
```

- `decision: "block"` → Claude가 계속 진행하도록 유도
- `decision` 없이 exit 0 → 정상 종료 허용

##### PreToolUse (safety-guard)

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "ask",
    "permissionDecisionReason": "파괴적 명령 가능성이 있어 확인이 필요합니다.",
    "updatedInput": {
      "command": "rm -i ..."
    },
    "additionalContext": "주의: destructive operation"
  }
}
```

- **중요**: PreToolUse에서 `decision`/`reason`은 deprecated, `hookSpecificOutput.permissionDecision` 사용
- 호환 매핑: `approve`→`allow`, `block`→`deny`

---

## 5. Trace 스키마 (v0.1)

### 결정: 필수/옵션 필드 고정

```typescript
interface TraceEvent {
  // 필수
  ts: string;           // ISO 8601 (e.g., "2026-01-31T10:21:33+09:00")
  session_id: string;   // Claude Code 세션 ID (없으면 UUID 생성)
  event: string;        // 이벤트 타입 (PostToolUse, Stop, etc.)

  // 권장
  tool?: string;        // 사용된 도구 (Edit, Bash, etc.)
  call_id?: string;     // tool_use_id (tool 이벤트에 한해 기록)
  files?: string[];     // 영향받은 파일 목록
  result?: "success" | "failure" | "skipped";

  // 선택
  matcher?: string;     // hook matcher (e.g., "Write|Edit")
  tests?: {
    ran: boolean;
    cmd?: string;
    status?: "pass" | "fail" | "error";
  };
  policy?: {
    complexity_score?: number;
    gate_level?: number;
  };
  automation?: {
    hooks_fired?: string[]; // "Event/hook-id"
    skills_used?: string[];
  };
  notes?: string;       // 자유 텍스트 메모 (민감정보 금지)
}
```

- trace.jsonl의 canonical 필드는 `session_id`이며, 내부/DB에서는 필요 시 `run_id = session_id`로 alias합니다.

### 민감정보 금지 규칙

- 시크릿/토큰/개인정보/원문 프롬프트 저장 금지
- 파일 경로는 OK, 파일 내용은 금지
- 에러 메시지는 요약만 (스택트레이스 전체 금지)

---

## 6. Capsule 최소 템플릿

### `.ai/capsule/PROJECT.md`

```markdown
# Project Overview

## Name
<!-- 프로젝트 이름 -->

## Purpose
<!-- 한 줄 정의 -->

## Tech Stack
<!-- 주요 기술 스택 -->

## Structure
<!-- 디렉토리 구조 요약 -->
```

### `.ai/capsule/CONVENTIONS.md`

```markdown
# Coding Conventions

## Language
<!-- 주 언어/프레임워크 -->

## Style
<!-- 코드 스타일 규칙 -->

## Naming
<!-- 네이밍 컨벤션 -->

## Testing
<!-- 테스트 규칙 -->
```

### `.ai/capsule/STATUS.md`

```markdown
# Project Status

## Current Phase
<!-- 현재 단계 (MVP, Beta, Production 등) -->

## Recent Changes
<!-- 최근 주요 변경 사항 -->

## Known Issues
<!-- 알려진 이슈 -->

## Next Steps
<!-- 다음 단계 -->
```

---

## 7. settings.local.json 기본 템플릿

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/node_modules/.bin/compass hook pin-inject"
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/node_modules/.bin/compass hook spec-sync"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/node_modules/.bin/compass hook quality-gate"
          }
        ]
      }
    ]
  }
}
```

---

## 8. CLI 명령 체계

```
compass
├── init                     # 프로젝트 초기화
├── spec
│   ├── new <title>          # 새 스펙 생성
│   ├── condense             # 현재 요청을 스펙으로 구조화
│   └── status               # 활성 스펙 상태
├── trace
│   ├── append               # 이벤트 추가 (내부용)
│   ├── last [n]             # 최근 n개 이벤트
│   ├── why [event]          # 자동화 실행 이유
│   └── stats [period]       # 통계 요약
├── coach
│   ├── scan [--top N]       # 자동화 후보 추천
│   ├── apply <id>           # 후보 적용
│   ├── rollback <id>        # 적용 롤백
│   ├── report [period]      # 효과 리포트
│   └── mode <simple|pro|lab># 노출 수준 변경
├── guard
│   ├── status               # 게이트 상태
│   └── run [level]          # 수동 게이트 실행
└── hook
    ├── pin-inject           # stdin → stdout (UserPromptSubmit)
    ├── spec-sync            # stdin → 파일 업데이트 (PreCompact)
    ├── quality-gate         # stdin → stdout (Stop)
    └── safety-guard         # stdin → stdout (PreToolUse, 선택)
```

---

## 9. MVP 로드맵

### MVP-1: Spec Pin + 멀티세션 참조 + Capsule Sync ✅ (2026-02-05)

- [x] `compass init` 구현
- [x] `compass spec new` 구현
- [x] `compass hook pin-inject` 구현
- [x] `compass hook spec-sync` 구현
- [x] CLAUDE.md import 패치 로직
- [x] `compass capsule sync` 구현 (diff + PIN 기반 프롬프트)
- [x] `/capsule-sync` 슬래시 커맨드

### MVP-2: Trace + 관측

- [ ] `compass trace append` 구현
- [ ] `compass trace last` 구현
- [ ] `compass trace why` 구현
- [ ] `compass trace stats` 구현 (기본)

### MVP-3: Coach + 닫힌 고리

- [ ] `compass coach scan` 구현 (Top 3 추천)
- [ ] `compass coach apply` 구현 (hook 추가 1종류)
- [ ] `compass coach rollback` 구현 (스냅샷 기반)
- [ ] `compass hook quality-gate` 구현

---

## Version History

| Version | Date       | Changes |
|---------|------------|---------|
| v0.1.1  | 2026-02-05 | MVP-1 구현 반영 (패키지명, 디렉토리 구조, PreCompact 출력 방식, capsule sync 추가) |
| v0.1.0  | 2026-01-31 | 초기 결정 문서 |
