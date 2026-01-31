@.ai/work/pin.md
@.ai/capsule/PROJECT.md
@.ai/capsule/CONVENTIONS.md
@.ai/capsule/STATUS.md

# Compass Coach & Governor — Project Memory (CLAUDE.md)

> **Version**: v0.1.2 | **Updated**: 2026-01-31
> 이 파일은 Claude Code가 프로젝트에서 항상 로드하는 **프로젝트 메모리**입니다.

## 한 줄 정의

**Compass**는 “AI 코딩 툴을 더 설치하는 번들러”가 아니라,  
**관측(Observability) → 진단 → 추천/생성 → 검증/튜닝**까지 닫힌 고리로 돌려 **개인에게 맞게 자동 최적화**하는 **운영 레이어(코치/거버너)** 입니다.

---

## 1) 우리가 하는 것 / 하지 않는 것

### Do (Goals)
- 파일 기반 “북극성(PIN)” 유지: 긴 작업/컴팩트/새 세션에서도 목표가 흔들리지 않게 함
- 작업이 길어질수록 생기는 품질 저하를 “분할 + 게이트”로 방어
- 훅/스킬/서브에이전트가 실제로 무엇을 했는지 **보이는 형태(Trace/OTel)** 로 남김
- 관측을 근거로 **나에게 맞는 자동화만 Top 3** 추천하고, 안전하게 적용/롤백

### Don’t (Non-goals)
- 템플릿/훅/스킬을 “더 많이” 깔아주는 마켓/번들러
- 장기 메모리 시스템 자체를 새로 구현
- 새로운 런타임/새 코딩 모델을 만드는 것

---

## 2) 기본 운영 원칙 (항상)

1. **대화(채팅)보다 파일(영속)을 우선**한다.  
   - 스펙/결정/상태는 `.ai/` 아래 파일로 고정한다.
2. **PIN은 항상 얇게(20~30줄 내)** 유지한다.  
   - 상세는 SPEC로, PIN에는 5개 항목만.
3. 자동화는 **추가보다 유지/삭제가 중요**하다.  
   - 기본은 최소 자동화, 추천은 Top 3, 실패하면 자동 비활성(서킷 브레이커).
4. 보안/프라이버시:
   - 민감 정보(토큰/키/개인정보/원문 프롬프트)는 기본 저장 금지(요약/해시만).
   - 훅은 자동 실행이므로 위험 작업은 “deny/ask” 우선.

---

## 3) 세션 시작 체크리스트 (Claude Code가 시작되면)

1. `.ai/work/pin.md`를 최우선으로 읽고, **이 작업의 기준은 PIN의 Acceptance Criteria**임을 유지한다.
2. `.ai/work/current.json`이 있으면 활성 SPEC 포인터를 확인한다.
3. `.ai/capsule/PROJECT.md`, `CONVENTIONS.md`, `STATUS.md`가 있으면 L0 지도로 사용한다.
4. 위 파일이 없다면:
   - 질문으로 시간을 끌지 말고, **최소 템플릿을 즉시 생성**하는 방향으로 진행한다.

---

## 4) 닫힌 고리(Closed Loop) 작업 흐름

### A. Observability (관측)
- 작업 중 발생한 주요 이벤트를 `.ai/trace/trace.jsonl`에 요약 기록한다.
- 가능하면 OTel(옵트인)로 비용/토큰/툴 이벤트를 추가 수집한다.

### B. Diagnosis (진단)
- 사용자 요청을 **Spec Condense** 포맷으로 즉시 구조화한다:
  - Goal / Must-have(≤5) / Nice-to-have(≤5) / Constraints / Acceptance Criteria

### C. Coach (추천)
- 관측 기반으로 다음 자동화 후보를 **Top 3만** 제시한다.
- 적용은 `.local` 우선(안전) + diff 프리뷰 + 롤백 스냅샷.

### D. Governor (품질 방어)
- **Complexity Score**로 작업 분할 여부를 결정한다.
- 각 단계 종료 시 최소 1~2개 품질 게이트(예: lint/test)를 수행한다.

### E. Measure & Tune (측정/튜닝)
- 적용 전/후로 테스트 누락률, 반복 실패율, 재시작 비용 등을 비교한다.
- 도움이 안 되는 자동화는 자동으로 끈다(서킷 브레이커).

---

## 5) Spec & PIN 규칙 (긴 작업의 북극성)

### 권장 폴더 구조
```
.ai/specs/                 # 스펙 원문(SPEC)
.ai/work/
  current.json             # 활성 스펙 포인터
  pin.md                   # 항상 얇게 로드되는 PIN
.ai/trace/trace.jsonl      # 공유 가능한 요약 Trace
.ai/capsule/               # 프로젝트 항해지도(권장)
```

### capsule 최소 스켈레톤 (compass init가 자동 생성)
- `.ai/capsule/PROJECT.md`: Goal / What it is / Non-goals / Key commands / Repo map
- `.ai/capsule/CONVENTIONS.md`: coding/test conventions
- `.ai/capsule/STATUS.md`: Current focus / Risks / Next / Active spec pointer
- (선택) `.ai/capsule/MAP.md`: 디렉터리별 위치 지도

### PIN 규격 (절대 고정)
PIN에는 반드시 아래 5개만 포함:
- Goal
- Must-have (최대 5)
- Constraints
- Acceptance Criteria
- Pointer (spec 원문 링크)

---

## 6) Complexity Governor (Quick Score & Gate)

### Quick Score (룰 기반 초기안)
- 변경 파일 수/디렉토리 수
- 리스크 플래그: 인증/결제/권한/개인정보/DB 스키마/외부 API/동시성
- 모호함: Acceptance 없음, Must 과밀(6개+), 표현 모호
- 새로움: 프로젝트에 없던 기술/패턴 도입

**권장 임계치**
- 0~20: 한 번에 진행 가능
- 21~40: 2~3단계 분할 권장
- 41~60: 강제 분할 + 게이트 강화
- 61+: 여러 PR/단계로 분리(설계/실험/리팩터/기능 분리)

### Gate (품질 게이트)
- 최소 1~2개: `lint`, `typecheck`, `unit test`, `smoke test` 중 프로젝트에 맞게 선택
- Stop 훅(또는 수동 명령)에서 “실행/검증”한다.

---

## 7) Observability: Trace & OTel

### Trace (항상 가능)
- 파일: `.ai/trace/trace.jsonl`
- 원칙: 공유 가능한 **요약/익명 중심**, 민감 정보 금지

### OTel (선택이지만 강력)
- OTel은 opt-in이다.
- 기본적으로 사용자 프롬프트 내용은 **redacted**(길이만 기록)이며, 필요 시에만 opt-in으로 활성화한다.

---

## 8) Compass 명령(컨벤션)

> 아래는 “제품 UX” 기준의 명령 체계입니다. 실제 구현은 CLI/플러그인 형태로 제공될 수 있습니다(AGENTS.md 참고).

### Spec
- `/spec new <title>`: SPEC + PIN + current.json 생성
- `/spec condense`: 현재 요청을 SPEC/PIN 포맷으로 압축
- `/spec status`: 활성 스펙 및 진행 상태 요약

### Trace
- `/trace last [n]`: 최근 이벤트 타임라인
- `/trace why [event]`: 어떤 규칙 때문에 자동화가 실행됐는지
- `/trace stats [period]`: 실패율/테스트 누락률/반복 패턴 요약

### Coach
- `/coach scan [sessions] [--top N]`: 자동화 후보 추천 (기본 Top 3)
- `/coach apply <id>`: 후보 적용(패치 프리뷰 포함)
- `/coach rollback <id>`: 되돌리기
- `/coach report [period]`: 적용 전/후 효과 리포트
- `/coach mode simple|pro|lab`: 노출 수준 전환

### Governor
- `/guard status`: 게이트/리스크 상태 확인
- `/guard run`: 수동 게이트 실행

---

## 9) Hook 구성 (권장)

- 훅은 `settings.json` 계층(유저/프로젝트/로컬)에서 관리된다.
- 훅 구성은 **matchers → hooks 배열** 구조를 사용한다.
- 훅 명령은 자동 실행이므로, 반드시 안전한 경로/입력 검증을 수행한다.

### 최소 세트(권장)
- **UserPromptSubmit**: PIN 주입(컨텍스트 안정화)
- **PreCompact**: pin/spec 업데이트(긴 작업 유지)
- **Stop**: 품질 게이트(테스트/린트)

### 선택(상황에 따라)
- **PreToolUse**: 위험 명령 deny/ask (보안 강화)
- **PostToolUse/PostToolUseFailure/SessionStart/SessionEnd**: 더 풍부한 Trace를 원할 때

---

## 10) 보안 메모

- `.env`, `secrets/**`, 키 파일 등은 Claude Code 권한(permissions)에서 차단하는 구성이 권장된다.
- 훅/스크립트는 반드시 직접 검토하고, 안전한 환경에서 먼저 테스트한다.

---

## Version History

| Version | Date       | Changes |
|---------|------------|---------|
| v0.1.2  | 2026-01-31 | MVP 결정 반영(CLI 구조/설치/Hook I/O/Trace 스키마 고정) - docs/01_decisions.md 참조 |
| v0.1.1  | 2026-01-30 | PRD v0.1 정합성 반영(Top3 기본, 훅/설정 스키마 최신화, Trace/명령 보강) |
| v0.1.0  | 2026-01-30 | Initial structure |

---

## References (raw links)

- https://code.claude.com/docs/en/memory
- https://code.claude.com/docs/en/hooks
- https://code.claude.com/docs/en/settings
- https://code.claude.com/docs/en/monitoring-usage
- https://code.claude.com/docs/en/mcp
