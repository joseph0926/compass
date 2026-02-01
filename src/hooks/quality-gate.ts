import { parseStdin, type HookInput } from "./utils/stdin.js";

/**
 * Stop hook: 품질 게이트 실행
 *
 * stdin: Claude Code hook JSON
 * stdout: 블록 결정 시 JSON 출력
 */
export async function runQualityGate(): Promise<void> {
  try {
    const input = await parseStdin<HookInput>();

    if (!input) {
      process.exit(0);
    }

    // TODO: MVP-3 구현
    // 1. 테스트 실행 여부 확인
    // 2. 린트 결과 확인
    // 3. 필요 시 블록 결정 반환

    // 현재는 조용히 종료 (통과)
    process.exit(0);
  } catch (error) {
    console.error("quality-gate error:", error);
    process.exit(1);
  }
}
