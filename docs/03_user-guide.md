# Compass User Guide

> 각 MVP별 기능을 직접 테스트할 수 있는 가이드입니다.

---

## 사전 준비

### 설치

```bash
# [사용자] 기존 프로젝트에 Compass CLI만 추가
pnpm add -D compass-ai
# 또는
npm i -D compass-ai

# 실행 확인
pnpm exec compass --help
# 또는
npx compass-ai --help
```

```bash
# [기여자] 저장소 클론 후 개발
git clone <repo-url> && cd compass
pnpm install && pnpm build

# 실행 확인
./dist/cli/index.js --help
```

### 요구 사항

- Node.js >= 22
- pnpm (또는 npm)
- Git (diff/capsule 기능에 필요)

---

## MVP-1: Spec Pin + Capsule Sync

MVP-1은 "긴 작업에서도 목표가 흔들리지 않는 북극성(PIN)" 시스템입니다.

### 1. 프로젝트 초기화

```bash
compass init
```

**확인 사항**:
- `.ai/specs/`, `.ai/work/`, `.ai/trace/`, `.ai/capsule/` 디렉토리가 생성됨
- `.ai/capsule/PROJECT.md`, `CONVENTIONS.md`, `STATUS.md` 템플릿이 생성됨
- `CLAUDE.md`가 없으면 최소 템플릿이 자동 생성됨
- `CLAUDE.md` 파일 선두에 `@.ai/work/pin.md` import 라인이 보장됨

```bash
# 검증
ls -la .ai/
ls -la .ai/capsule/
head -3 CLAUDE.md   # @.ai/work/pin.md 라인 확인
```

### 2. 스펙 생성

```bash
compass spec new "로그인 페이지 구현"
```

**확인 사항**:
- `.ai/specs/SPEC-YYYYMMDD-login-page.md` 생성 (SPEC 템플릿)
- `.ai/work/pin.md` 생성 (PIN 템플릿 — 5개 섹션)
- `.ai/work/current.json` 생성 (활성 스펙 포인터)
- `.ai/capsule/*.md`가 없었다면 자동 생성됨 (auto-heal)

```bash
# 검증
ls .ai/specs/
cat .ai/work/pin.md
cat .ai/work/current.json
```

**PIN 구조** (직접 편집 가능):
```markdown
# PIN

## Goal
로그인 페이지를 구현한다.

## Must-have
- 이메일/비밀번호 입력 폼
- 유효성 검증
- 에러 메시지 표시

## Constraints
- React + TypeScript

## Acceptance Criteria
- 유효하지 않은 입력 시 에러 메시지가 표시됨
- 유효한 입력 시 대시보드로 리다이렉트됨

## Pointer
.ai/specs/SPEC-20260206-login-page.md
```

### 3. PIN 주입 Hook 테스트

이 훅은 매 사용자 입력마다 PIN을 Claude Code 컨텍스트에 주입합니다.

```bash
# stdin으로 빈 JSON 전달 (Claude Code가 보내는 형식)
echo '{}' | compass hook pin-inject
```

**확인 사항**:
- `hookSpecificOutput.additionalContext`에 PIN 내용이 `<compass-pin>` 태그로 래핑되어 출력됨
- 활성 스펙이 없으면 아무 출력 없이 exit 0

```bash
# 예상 출력 (JSON)
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "<compass-pin>\n# PIN\n...\n</compass-pin>"
  }
}
```

### 4. 스펙 동기화 Hook 테스트

이 훅은 PreCompact(컨텍스트 압축 전)에 PIN/SPEC 갱신 지시를 주입합니다.

```bash
echo '{}' | compass hook spec-sync
```

**확인 사항**:
- `additionalContext`에 `<compass-spec-sync>` 태그로 갱신 지시가 출력됨
- PIN 5개 섹션 유지 + SPEC Change Log 갱신 지시 포함

### 5. Capsule Sync 테스트

Capsule은 프로젝트의 "항해 지도"입니다. git diff를 기반으로 갱신 프롬프트를 생성합니다.

```bash
# 테스트를 위해 임의 변경 생성
echo "// test" >> src/cli/index.ts

# capsule sync 실행 (Prompt 모드)
compass capsule sync
```

**확인 사항**:
- 변경된 파일 목록이 프롬프트에 포함됨
- 현재 capsule 내용 (`PROJECT.md`, `CONVENTIONS.md`, `STATUS.md`)이 포함됨
- PIN이 있으면 "PIN의 Goal/Must-have와 관련된 변경만 반영하라" 기준 포함
- 변경이 없으면 "No changes detected" 메시지 출력

```bash
# Hook 모드 (hookSpecificOutput JSON 출력)
compass capsule sync --hook

# 테스트 변경 원복
git checkout src/cli/index.ts
```

### 6. `/capsule-sync` 슬래시 커맨드

Claude Code 대화 중:
```
/capsule-sync
```

Claude Code가 `compass capsule sync`를 실행하고, 출력 프롬프트에 따라 capsule 파일을 갱신합니다.

### 7. Claude Code Hook 등록 (수동)

실제로 Hook을 자동 실행하려면 `.claude/settings.local.json`에 Hook 설정을 넣습니다.

#### Case A) 파일이 없는 경우: 새로 생성

```bash
mkdir -p .claude
```

`.claude/settings.local.json`:

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

#### Case B) 기존 `.claude/settings.local.json`이 있는 경우: `hooks` 키만 병합

예시(현재 프로젝트의 `permissions` 유지 + `hooks` 추가):

```json
{
  "permissions": {
    "allow": [
      "WebFetch(domain:github.com)",
      "WebFetch(domain:raw.githubusercontent.com)",
      "WebFetch(domain:api.github.com)",
      "Skill(ai-claude-code-aio)",
      "Bash(python3:*)",
      "Bash(wc:*)"
    ]
  },
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

#### 적용 체크리스트

- [ ] `.claude/settings.local.json`이 유효한 JSON인지 확인
- [ ] 기존 `permissions`/기타 설정이 유지됐는지 확인
- [ ] `hooks.UserPromptSubmit`, `hooks.PreCompact`가 추가됐는지 확인
- [ ] Claude Code를 재시작해 Hook 로딩 반영

#### 동작 검증

```bash
echo '{}' | pnpm exec compass hook pin-inject
echo '{}' | pnpm exec compass hook spec-sync
```

### 8. Codex 사용 (부분 지원)

Codex 통합 상세는 `docs/04_codex-integration.md`를 참고하세요.

- Codex는 현재 Claude Code처럼 Hook 이벤트를 직접 제공하지 않음
- 따라서 PIN/spec-sync는 수동 루틴 또는 자동화 제안(문서) 방식으로 운용
- `capsule sync`는 CLI 명령(`compass capsule sync`)으로 동일하게 사용 가능

---

## MVP-2: Trace + Quality Gate (미구현)

> 아래는 구현 예정인 기능의 사용 시나리오입니다.

### Trace 사용 시나리오

```bash
# 최근 5개 이벤트 확인
compass trace last 5

# 특정 자동화가 실행된 이유 확인
compass trace why PostToolUse

# 최근 7일 통계 요약
compass trace stats 7d
```

### Quality Gate 사용 시나리오

```bash
# 게이트 상태 확인
compass guard status

# 수동으로 게이트 실행
compass guard run
```

Quality Gate Hook은 Stop 이벤트에서 동작합니다:
- 테스트가 실행되지 않았으면 `decision: "block"` 반환
- Claude가 테스트를 실행하도록 유도

---

## MVP-3: Coach + Closed Loop (미구현)

> 아래는 구현 예정인 기능의 사용 시나리오입니다.

### Coach 사용 시나리오

```bash
# 최근 세션 분석 → 자동화 후보 Top 3 추천
compass coach scan

# 추천 결과 예시:
# 1. [Hook] Stop에 테스트 자동 게이트 추가 (반복 테스트 누락 감지)
# 2. [Skill] spec-condense 스킬 생성 (반복 프롬프트 감지)
# 3. [Rule] reviewer 서브에이전트 규칙 추가 (반복 리뷰 패턴 감지)

# 후보 #1 적용 (diff 프리뷰 포함)
compass coach apply 1

# 적용 후 효과가 없으면 롤백
compass coach rollback 1

# 적용 전/후 비교 리포트
compass coach report 7d
```

---

## 테스트 실행

```bash
# 전체 테스트 한 번 실행
pnpm test:run

# Watch 모드
pnpm test

# 빌드 + 타입 체크
pnpm build
pnpm typecheck
```

### 테스트 현황 (43 tests, 6 suites)

| 테스트 파일 | 테스트 수 | 커버 범위 |
|-------------|-----------|-----------|
| `tests/core/spec/generator.test.ts` | 7 | toSlug, todayDate, generateSpec |
| `tests/core/spec/generator-capsule.test.ts` | 2 | capsule auto-heal |
| `tests/cli/init.test.ts` | 4 | CLAUDE.md 자동 생성/패치/idempotent |
| `tests/core/capsule/prompt-builder.test.ts` | 9 | determineSectionUpdates, buildCapsulePrompt |
| `tests/core/capsule/diff-collector.test.ts` | 13 | parseDepsFromDiff + collectDiff 통합(임시 git repo) |
| `tests/hooks/pin-inject.test.ts` | 8 | isSafePath (traversal + symlink) |

---

## 트러블슈팅

### `compass: command not found`

```bash
# 직접 실행
node ./dist/cli/index.js <command>

# 또는 빌드 확인
pnpm build
```

### Hook이 동작하지 않음

1. `.claude/settings.local.json`에 Hook이 등록되어 있는지 확인
2. `compass hook pin-inject` / `compass hook spec-sync`가 단독 실행되는지 확인
3. `.ai/work/current.json`이 존재하는지 확인 (`compass spec new` 실행 필요)

### `parseDepsFromDiff`가 빈 배열 반환

- `package.json`이 `git diff HEAD`에 변경으로 잡히는지 확인
- staged 변경이 아닌 **unstaged** 변경이어야 함 (HEAD 기준 diff)

### Capsule sync에 변경 파일이 안 보임

- `git status`로 변경 사항이 있는지 확인
- 모든 파일이 committed 상태이면 diff가 비어있음
