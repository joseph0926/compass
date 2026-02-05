# Compass Roadmap

> **Updated**: 2026-02-06
> 현재 상태 및 앞으로의 구현 계획

---

## 현재 상태: MVP-1 Complete (v0.1.0)

MVP-1은 Compass의 **핵심 인프라**를 구축했습니다.

### 완료된 기능

| 기능 | 명령 | 설명 |
|------|------|------|
| 프로젝트 초기화 | `compass init` | `.ai/` 스켈레톤 + capsule 템플릿 + CLAUDE.md 패치 |
| 스펙 생성 | `compass spec new <title>` | SPEC + PIN(북극성) + current.json + capsule 자동 보정 |
| PIN 주입 훅 | `compass hook pin-inject` | 매 입력마다 PIN을 additionalContext로 주입 |
| 스펙 동기화 훅 | `compass hook spec-sync` | compact 전 PIN/SPEC 갱신 지시 |
| Capsule 동기화 | `compass capsule sync` | diff + PIN 기반 capsule 갱신 프롬프트 |
| 슬래시 커맨드 | `/capsule-sync` | Claude Code에서 capsule 동기화 실행 |

### MVP-1 품질 강화 (Refactoring, 2026-02-06)

코드 리뷰를 통해 발견된 9개 이슈(P0x2, P1x3, P2x4)를 수정했습니다:

| 우선순위 | 수정 내용 |
|----------|-----------|
| **P0** | `isSafePath` path traversal 방어 (`resolve()` + `startsWith`) |
| **P0** | symlink bypass 방어 (`realpathSync` 추가) |
| **P1** | hook stdin JSON 파싱 + exit code 규약 준수 |
| **P1** | `spec new` 시 capsule 자동 보정 (auto-heal) |
| **P1** | `new_deps` false positive 수정 (섹션 인식 파서) |
| **P2** | rename diff 파싱 (`R100\told\tnew` → old(D) + new(A)) |
| **P2** | `.claude/commands/capsule-sync.md` 누락 생성 |
| **P2** | `parseDepsFromDiff` 함수 직접 테스트 (10개 케이스) |
| **P2** | symlink defense 통합 테스트 (3개 케이스) |

**테스트 현황**: 36/36 통과 (5 suites, 113ms)

---

## MVP-2: Trace + Quality Gate (다음 구현)

> **목표**: "AI가 뭘 했는지" 보이게 만들고, 품질 게이트로 실수를 줄인다.

### 범위

| 기능 | 명령 | 설명 |
|------|------|------|
| 이벤트 기록 | `compass trace append` | trace.jsonl에 이벤트 추가 (hook/내부용) |
| 최근 이벤트 | `compass trace last [n]` | 최근 n개 이벤트 타임라인 출력 |
| 실행 이유 | `compass trace why [event]` | 어떤 규칙 때문에 자동화가 실행됐는지 |
| 통계 요약 | `compass trace stats [period]` | 실패율/테스트 누락률/반복 패턴 |
| 품질 게이트 | `compass hook quality-gate` | Stop 이벤트에서 테스트/린트 실행 여부 확인 |
| 게이트 상태 | `compass guard status` | 현재 게이트/리스크 상태 |
| 수동 게이트 | `compass guard run` | 품질 게이트 수동 실행 |

### Trace 스키마 (v0.1)

```typescript
interface TraceEvent {
  ts: string;           // ISO 8601
  session_id: string;   // Claude Code 세션 ID
  event: string;        // PostToolUse, Stop, etc.
  tool?: string;        // Edit, Bash, etc.
  files?: string[];     // 영향받은 파일
  result?: "success" | "failure" | "skipped";
  notes?: string;       // 자유 텍스트 (민감정보 금지)
}
```

### 핵심 설계 원칙

- trace.jsonl에는 **요약/익명** 데이터만 저장 (시크릿/원문 프롬프트 금지)
- quality-gate는 Stop 훅으로 동작, `decision: "block"` 반환 시 Claude가 계속 진행
- 민감 정보 금지 규칙: 파일 경로 OK, 파일 내용 금지, 에러는 요약만

### 선행 조건

- MVP-1 기능이 안정적으로 동작 (완료)
- TraceEvent 스키마 고정 (docs/01_decisions.md에 정의됨)

---

## MVP-3: Coach + Closed Loop (최종 목표)

> **목표**: 관측 데이터를 근거로 "나에게 맞는 자동화"를 추천/적용/롤백한다.

### 범위

| 기능 | 명령 | 설명 |
|------|------|------|
| 자동화 후보 추천 | `compass coach scan [--top N]` | trace 기반 Top 3 추천 |
| 후보 적용 | `compass coach apply <id>` | hook/rule 패치 적용 (diff 프리뷰 포함) |
| 적용 롤백 | `compass coach rollback <id>` | 스냅샷 기반 되돌리기 |
| 효과 리포트 | `compass coach report [period]` | 적용 전/후 비교 |
| 노출 수준 | `compass coach mode <simple\|pro\|lab>` | 정보 노출 수준 전환 |

### Coach의 3단계 동작

1. **패턴 감지**: 반복 프롬프트, 반복 실패, 비용 급증 구간 탐지
2. **라우팅**: 반복되는 "말" → Skill, 까먹는 습관 → Hook, 외부 접근 반복 → MCP
3. **생성/적용/튜닝**: `.local` 우선 적용 + diff 프리뷰 + 롤백 스냅샷

### 핵심 설계 원칙

- 기본은 **최소 자동화**, 추천은 **Top 3만**
- 실패하면 자동 비활성 (**서킷 브레이커**)
- 적용은 항상 `.local` 우선 (안전), rollback 스냅샷 자동 생성
- 측정 지표: 테스트 누락률, 반복 실패율, 재시작 비용

### 선행 조건

- MVP-2 Trace 시스템이 데이터를 축적하고 있어야 함
- trace.jsonl에 최소 수 세션 분량의 데이터 필요

---

## 범위 외 (현재 계획에 없음)

| 항목 | 이유 |
|------|------|
| OTel 연동 | MVP-3 이후 선택적 확장 |
| 로컬 웹 UI | trace/coach를 시각적으로 보는 것은 후순위 |
| settings.local.json 자동 등록 | init에서 자동화하지 않고 수동 안내 유지 |
| 플러그인/마켓 시스템 | Compass의 Non-goal |
| 장기 메모리 시스템 | 별도 제품 영역 |

---

## 기술 스택 (고정)

| 항목 | 선택 |
|------|------|
| 런타임 | Node.js >= 22 |
| 언어 | TypeScript strict, ESM |
| 테스트 | Vitest 4.x |
| 패키지 | 단일 패키지 (`compass-ai`) |
| 외부 의존성 | **0** (node:* 빌트인만) |

---

## 성공 지표

MVP를 통해 검증하려는 핵심 지표:

| 지표 | 측정 방법 |
|------|-----------|
| 세션 재시작 비용 감소 | "프로젝트 탐색" 반복 메시지/토큰 감소 |
| 품질 안정화 | 테스트 누락률, 회귀(같은 버그 재발) 감소 |
| 개인화 성과 | 추천 적용률, 적용 후 유지율 |
| 인지 부하 감소 | "뭘 깔아야 하지?" 질문 빈도 감소 |
