# Compass MVP-1 구현 문서

> **Version**: v0.1.0 | **Implemented**: 2026-02-05
> Spec Pin 시스템(북극성) + Capsule Sync + Hook 통합

---

## 요약

MVP-1은 Compass의 **핵심 인프라**를 구축한다:

1. `compass init` — 프로젝트 초기화 (.ai/ 스켈레톤 + capsule 템플릿)
2. `compass spec new` — 작업 스펙 + PIN(북극성) + 포인터 생성
3. `compass hook pin-inject` — 매 입력마다 PIN 컨텍스트 주입
4. `compass hook spec-sync` — compact 전 PIN/SPEC 갱신 지시
5. `compass capsule sync` — diff + PIN 기반 capsule 갱신 프롬프트

**PIN이 있으면** capsule sync의 "무엇을 영속화할 것인가"에 **객관적 기준**(Goal/Must-have)이 생긴다.

---

## 기술 스택

| 항목        | 선택                                     |
| ----------- | ---------------------------------------- |
| 런타임      | Node.js ≥22                              |
| 언어        | TypeScript (strict, ES2022, Node16 모듈) |
| 테스트      | Vitest 4.x                               |
| 패키지      | 단일 패키지 (모노레포 아님)              |
| 외부 의존성 | 0 (node:\* 빌트인만 사용)                |

---

## 디렉토리 구조

```
compass/
├── src/
│   ├── cli/
│   │   ├── index.ts                  # CLI 진입점 (parseArgs, 라우팅)
│   │   └── commands/
│   │       ├── init.ts               # compass init
│   │       ├── spec.ts               # compass spec new <title>
│   │       └── capsule.ts            # compass capsule sync [--hook]
│   ├── core/
│   │   ├── types.ts                  # 공유 타입 (CurrentJson, DiffSignal 등)
│   │   ├── spec/
│   │   │   ├── generator.ts          # SPEC/PIN/current.json 생성 로직
│   │   │   └── templates.ts          # 마크다운 템플릿 상수
│   │   └── capsule/
│   │       ├── reader.ts             # capsule/pin 파일 읽기
│   │       ├── diff-collector.ts     # git diff → DiffSignal
│   │       └── prompt-builder.ts     # diff + PIN → AI 프롬프트
│   └── hooks/
│       ├── index.ts                  # hook 라우터
│       ├── pin-inject.ts             # UserPromptSubmit hook
│       └── spec-sync.ts             # PreCompact hook
├── tests/
│   └── core/
│       ├── spec/
│       │   └── generator.test.ts     # 7 tests
│       └── capsule/
│           └── prompt-builder.test.ts # 9 tests
├── .claude/
│   ├── commands/
│   │   └── capsule-sync.md           # /capsule-sync 슬래시 커맨드
│   └── settings.local.json
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── .gitignore
```

---

## 명령어별 상세

### 1. `compass init`

**파일**: `src/cli/commands/init.ts`

**동작**:

1. `.ai/specs/`, `.ai/work/`, `.ai/trace/`, `.ai/capsule/` 디렉토리 생성
2. capsule 파일 생성 (기존 파일은 **절대 덮어쓰지 않음**)
   - `.ai/capsule/PROJECT.md`
   - `.ai/capsule/CONVENTIONS.md`
   - `.ai/capsule/STATUS.md`
3. `CLAUDE.md`에 `@.ai/work/pin.md` import 라인 추가 (없으면)

**출력**:

```
✔ Compass initialized
  Created: .ai/specs/, .ai/work/, .ai/trace/, .ai/capsule/

Next steps:
  compass spec new "My Task"  — create your first spec & PIN
```

---

### 2. `compass spec new <title>`

**파일**: `src/cli/commands/spec.ts`, `src/core/spec/generator.ts`

**동작**:

1. title → kebab-case slug 변환 (`toSlug`)
2. 날짜 생성 (YYYYMMDD)
3. `.ai/specs/SPEC-{date}-{slug}.md` 생성 (SPEC 템플릿)
4. `.ai/work/pin.md` 생성 (PIN 템플릿 — 5개 섹션 고정)
5. `.ai/work/current.json` 생성/갱신

**PIN 구조** (절대 고정):

```markdown
# PIN

## Goal

## Must-have

## Constraints

## Acceptance Criteria

## Pointer
```

**current.json 구조**:

```json
{
  "active_spec": ".ai/specs/SPEC-20260205-mvp-1.md",
  "pin": ".ai/work/pin.md",
  "title": "MVP-1 구현",
  "tags": [],
  "updated_at": "2026-02-05T10:35:44.470Z"
}
```

---

### 3. `compass hook pin-inject`

**파일**: `src/hooks/pin-inject.ts`
**이벤트**: UserPromptSubmit

**동작**:

1. `.ai/work/current.json` 읽기
2. 활성 스펙 있으면 → `.ai/work/pin.md` 읽기
3. PIN 내용을 `<compass-pin>` 태그로 래핑하여 `additionalContext`로 출력

**출력 (JSON)**:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "<compass-pin>\n# PIN\n...\n</compass-pin>"
  }
}
```

**활성 스펙 없으면**: 아무 출력 없이 exit 0

---

### 4. `compass hook spec-sync`

**파일**: `src/hooks/spec-sync.ts`
**이벤트**: PreCompact

**동작**:

1. `.ai/work/current.json` 읽기
2. 활성 스펙 + pin 파일 확인
3. "PIN/SPEC을 이 세션 진행에 맞게 갱신하라"는 지시를 `additionalContext`로 출력

**지시 내용 요약**:

- PIN: Goal/Must-have/Constraints/Acceptance Criteria 갱신 (≤30줄 유지)
- SPEC: Change Log 항목 추가 + Must-have/Nice-to-have 완료 상태 갱신

---

### 5. `compass capsule sync`

**파일**: `src/cli/commands/capsule.ts`, `src/core/capsule/*.ts`

**두 가지 모드**:

| 모드          | 호출                          | stdout                  |
| ------------- | ----------------------------- | ----------------------- |
| Prompt (기본) | `compass capsule sync`        | 플레인텍스트 프롬프트   |
| Hook          | `compass capsule sync --hook` | hookSpecificOutput JSON |

**동작**:

1. `git diff --name-status HEAD` + `git ls-files --others` → **DiffSignal** 수집
2. `.ai/capsule/*.md` 읽기 (기존 내용)
3. `.ai/work/pin.md` 읽기 (필터링 기준)
4. **Section Schema** 기반 프롬프트 조립

**Section Schema 필터링 규칙**:

| 트리거                      | 갱신 대상                               |
| --------------------------- | --------------------------------------- |
| package.json 변경 / 새 deps | PROJECT.md → Tech Stack                 |
| 설정 파일 변경              | CONVENTIONS.md                          |
| 3+ 새 디렉토리              | PROJECT.md → Structure                  |
| 변경 있음 (항상)            | STATUS.md → Recent Changes / Next Steps |

**PIN 있을 때**: "PIN의 Goal/Must-have와 관련된 변경만 반영하라" 기준 포함
**트리거 없으면**: 갱신하지 않음 (불필요한 오염 방지)

---

## 파일 분류 로직

`diff-collector.ts`의 `categorizeFile` 함수:

| 패턴                                                                  | 분류      |
| --------------------------------------------------------------------- | --------- |
| `package.json`, `*-lock.*`                                            | `package` |
| `*.test.*`, `*.spec.*`                                                | `test`    |
| `tsconfig*`, `.eslint*`, `.prettier*`, `vitest.config*`, `Dockerfile` | `config`  |
| `*.md`, `*.txt`                                                       | `docs`    |
| `*.ts`, `*.js`, `*.tsx`, `*.jsx`, `*.py`, `*.go`, `*.rs`              | `source`  |
| 기타                                                                  | `other`   |

---

## 공유 타입 (`src/core/types.ts`)

```typescript
// 활성 스펙 포인터
interface CurrentJson {
  active_spec: string; // ".ai/specs/SPEC-{date}-{slug}.md"
  pin: string; // ".ai/work/pin.md"
  title: string;
  tags: string[];
  updated_at: string; // ISO 8601
}

// git diff에서 추출한 변경 신호
interface DiffSignal {
  changed_files: ChangedFile[];
  new_deps: string[];
  config_changed: boolean;
  structure_changed: boolean;
  has_changes: boolean;
}

// Hook 출력 구조
interface HookOutput {
  hookSpecificOutput: {
    hookEventName: string;
    additionalContext?: string;
  };
}
```

---

## 테스트

### 실행 방법

```bash
pnpm test:run    # 한 번 실행
pnpm test        # watch 모드
```

### 테스트 현황 (16 tests, 2 suites)

**`tests/core/spec/generator.test.ts`** (7 tests):

- `toSlug`: kebab-case 변환, 공백 정규화, 특수문자 제거
- `todayDate`: YYYYMMDD 형식 검증
- `generateSpec`: 파일 생성, 내용 검증, 디렉토리 자동 생성, 한국어 제목

**`tests/core/capsule/prompt-builder.test.ts`** (9 tests):

- `determineSectionUpdates`: STATUS 항상 포함, Tech Stack (deps), CONVENTIONS (config), Structure
- `buildCapsulePrompt`: 변경 없음 메시지, PIN 포함, 파일 목록, capsule 내용, 새 deps

---

## 검증 결과 (2026-02-05)

```
✔ pnpm build       — TypeScript 컴파일 성공
✔ pnpm typecheck   — 타입 에러 없음
✔ pnpm test:run    — 16/16 passed (128ms)
```

### E2E 테스트 (수동)

```bash
# init
compass init
# → .ai/ 디렉토리 + capsule 템플릿 + CLAUDE.md 패치 ✔

# spec new
compass spec new "MVP-1 구현"
# → SPEC + PIN + current.json 생성 ✔

# pin-inject hook
echo '{}' | compass hook pin-inject
# → hookSpecificOutput JSON에 PIN 포함 ✔

# spec-sync hook
echo '{}' | compass hook spec-sync
# → additionalContext에 갱신 지시 포함 ✔

# capsule sync
compass capsule sync
# → diff + PIN 기반 구조화된 프롬프트 출력 ✔
```

---

## Claude Code 통합

### `/capsule-sync` 슬래시 커맨드

**파일**: `.claude/commands/capsule-sync.md`

Claude Code에서 `/capsule-sync` 입력 시:

1. `compass capsule sync` 실행
2. 출력 프롬프트에 따라 capsule 파일 갱신

### Hook 등록 (수동 — 미자동화)

`.claude/settings.local.json`에 수동으로 추가:

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
    ]
  }
}
```

---

## 범위 외 (이번에 하지 않은 것)

| 항목                                         | 이유             |
| -------------------------------------------- | ---------------- |
| `compass spec condense` / `spec status`      | MVP-2+           |
| `compass trace/*` / `coach/*` / `guard/*`    | MVP-2, MVP-3     |
| `compass hook quality-gate` / `safety-guard` | MVP-2            |
| settings.local.json 자동 등록                | 수동 안내로 대체 |
| .claude/skills/ 마크다운 생성                | MVP-2            |
| OTel 연동                                    | MVP-3            |
| capsule status / capsule diff 서브커맨드     | 후순위           |

---

## 설계 결정 로그

| 결정                                          | 근거                                          |
| --------------------------------------------- | --------------------------------------------- |
| `node:util.parseArgs` 사용                    | 외부 의존성 0 원칙 유지                       |
| PIN을 `<compass-pin>` 태그로 래핑             | 다른 additionalContext와 구분 가능            |
| capsule sync를 prompt/hook 두 모드로 분리     | CLI에서도, hook에서도 사용 가능하도록         |
| `detectStructureChange`를 3+ 새 디렉토리 기준 | 과도한 false positive 방지                    |
| CLAUDE.md 패치는 파일 선두에 추가             | `@.ai/work/pin.md` import가 최우선 로드되도록 |
| capsule 파일은 절대 덮어쓰지 않음             | 사용자가 편집한 내용 보호                     |

---

## 다음 단계 (MVP-2 방향)

0. **codex**: codex가 MVP-1 리뷰 진행
1. **Trace**: `compass trace append` / `last` / `why` / `stats`
2. **Quality Gate**: `compass hook quality-gate` (Stop 이벤트)
3. **관측 기반 Coach**: trace 데이터에서 자동화 후보 Top 3 추천
