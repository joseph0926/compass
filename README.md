# Compass

Compass는 AI 코딩 도구 운영을 위한 레이어로, 관측 → 진단 → 추천/생성 → 검증 루프를 파일 기반으로 유지합니다.

---

## 플랫폼 지원

| 항목 | Claude Code | Codex |
|---|---|---|
| PIN 자동 로드 | 지원 (`CLAUDE.md` import) | 부분 지원 (수동 루틴) |
| Hook 기반 자동화 | 지원 | 미지원 |
| Capsule sync | 지원 (`/capsule-sync`, CLI) | 지원 (CLI) |

정책:
- Full support: Claude Code
- Partial support: Codex

---

## Quick Start

### 사용자 설치 (기존 프로젝트에 추가)

```bash
pnpm add -D compass-ai
pnpm exec compass init
pnpm exec compass spec new "My Task"
```

또는:

```bash
npx compass-ai init
npx compass-ai spec new "My Task"
```

### 기여자 설치 (저장소 클론)

```bash
git clone <repo-url> && cd compass
pnpm install
pnpm build
./dist/cli/index.js --help
```

---

## 주요 명령

```bash
compass init
compass spec new "<title>"
compass hook pin-inject
compass hook spec-sync
compass capsule sync
```

---

## Release

### 1) 최초 1회 수동 배포 (bootstrap)

- GitHub Actions에서 `Publish Bootstrap` (`.github/workflows/publish-bootstrap.yml`)을 수동 실행
- 이 워크플로우는 npm에 `compass-ai`가 이미 존재하면 실패하도록 설계됨
- 인증은 `NPM_TOKEN` secret을 사용

### 2) Trusted Publisher 연결

- npm에서 GitHub repo를 Trusted Publisher로 연결
- GitHub Repository Variable `NPM_TRUSTED_PUBLISHING=true` 설정

### 3) 이후 자동 배포 (OIDC)

- `v*` 태그 푸시 시 `Publish` (`.github/workflows/publish.yml`) 실행
- OIDC 기반으로 `npm publish --provenance --access public` 수행
- `NPM_TOKEN` 없이 배포

---

## 문서 인덱스

- `docs/00_start_here.md`: PRD/아키텍처 개요
- `docs/01_decisions.md`: 설계 결정 및 규약
- `docs/02_mvp1-implementation.md`: MVP-1 구현 세부
- `docs/03_user-guide.md`: 실행/검증 가이드
- `docs/04_codex-integration.md`: Codex 부분 지원 운영 가이드
- `docs/ROADMAP.md`: 로드맵/현재 상태
