import { parseStdin, type HookInput } from "./utils/stdin.js";

/**
 * PreCompact hook: PIN/SPEC 파일 업데이트
 *
 * stdin: Claude Code hook JSON
 * stdout: 없음 (파일 변경이 목적)
 */
export async function runSpecSync(): Promise<void> {
  try {
    const input = await parseStdin<HookInput>();

    if (!input) {
      process.exit(0);
    }

    // TODO: MVP-1 구현
    // 1. 현재 대화 컨텍스트에서 진행 상황 추출
    // 2. PIN 파일 업데이트
    // 3. SPEC 파일에 변경 로그 추가

    // 현재는 조용히 종료
    process.exit(0);
  } catch (error) {
    console.error("spec-sync error:", error);
    process.exit(1);
  }
}
