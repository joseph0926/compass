# session-wrap

세션 마무리 자동화 플러그인. `/session-wrap:wrap` 명령으로 5개 에이전트가 2-Phase로 세션을 분석합니다.

## 기능

- **CLAUDE.md 업데이트 제안**: 세션에서 발견된 컨벤션/규칙/패턴 문서화
- **자동화 기회 탐지**: 반복 패턴을 skill/command/agent/hook으로 자동화 제안
- **학습점 추출**: 실수/교훈/발견을 MEMORY.md에 기록
- **후속 작업 정리**: 미완성 작업 식별, 다음 세션 우선순위 정리

## 아키텍처

```
Phase 0: 컨텍스트 수집 (git status, diff, log, CLAUDE.md, MEMORY.md)
    ↓
Phase 1: 병렬 분석 (4개 에이전트 동시 실행)
    ├── doc-updater (sonnet)      → 문서 업데이트 제안
    ├── automation-scout (sonnet) → 자동화 기회 탐지
    ├── learning-extractor (sonnet) → 학습점 추출
    └── followup-suggester (sonnet) → 후속 작업 정리
    ↓
Phase 2: 중복 검증 (Phase 1 완료 후 순차)
    └── duplicate-checker (haiku) → 기존 문서 대조, 중복 제거
    ↓
Phase 3: 결과 통합 + 사용자 선택
    ↓
Phase 4: 선택된 액션 실행
```

## 설치

### 로컬 테스트

```bash
claude --plugin-dir ./plugins/session-wrap
```

### 프로젝트 설치

```bash
# .claude/settings.json에 추가하거나
claude plugin install session-wrap --scope project
```

## 사용법

```
/session-wrap:wrap
/session-wrap:wrap "이번 세션에서 인증 시스템 리팩토링 완료"
```

## 에이전트 구성

| 에이전트 | Phase | 모델 | 역할 |
|----------|-------|------|------|
| doc-updater | 1 | sonnet | CLAUDE.md/context.md 업데이트 제안 |
| automation-scout | 1 | sonnet | 자동화 기회 탐지 |
| learning-extractor | 1 | sonnet | 학습점/실수/발견 추출 |
| followup-suggester | 1 | sonnet | 미완성 작업/우선순위 정리 |
| duplicate-checker | 2 | haiku | 중복 검증 (비용 효율) |

## 디렉토리 구조

```
plugins/session-wrap/
├── .claude-plugin/
│   └── plugin.json              # 플러그인 메타데이터
├── commands/
│   └── wrap.md                  # /wrap 오케스트레이션 플로우
├── agents/
│   ├── doc-updater.md           # Phase 1: 문서 업데이트 제안
│   ├── automation-scout.md      # Phase 1: 자동화 기회 탐지
│   ├── learning-extractor.md    # Phase 1: 학습점 추출
│   ├── followup-suggester.md    # Phase 1: 후속 작업 정리
│   └── duplicate-checker.md     # Phase 2: 중복 검증
├── skills/
│   └── session-wrap/
│       └── SKILL.md             # 스킬 정의 (자동 트리거 비활성)
└── README.md
```

## 설계 결정

1. **에이전트 = 마크다운**: 실행 코드 없이 프롬프트만으로 동작 (Claude Code 플러그인 컨벤션)
2. **wrap.md 오케스트레이터**: 모든 플로우 제어는 command 파일에서 수행
3. **Phase 1 병렬화**: Task tool 4개를 단일 메시지에서 호출하여 성능 최적화
4. **duplicate-checker는 haiku**: 단순 비교 작업이므로 비용 효율적 모델 사용
5. **multiSelect 사용자 선택**: 여러 액션을 동시에 선택 가능
