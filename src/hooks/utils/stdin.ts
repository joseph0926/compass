/**
 * Claude Code Hook 입력 기본 타입
 */
export interface HookInput {
  hookEventName?: string;
  sessionId?: string;
  [key: string]: unknown;
}

/**
 * stdin에서 JSON을 파싱
 * TTY가 아닌 경우에만 읽음 (파이프 입력)
 */
export async function parseStdin<T extends HookInput>(): Promise<T | null> {
  // TTY인 경우 (직접 실행) stdin 없음
  if (process.stdin.isTTY) {
    return null;
  }

  return new Promise((resolve, reject) => {
    let data = "";

    process.stdin.setEncoding("utf-8");

    process.stdin.on("data", (chunk: string) => {
      data += chunk;
    });

    process.stdin.on("end", () => {
      if (!data.trim()) {
        resolve(null);
        return;
      }

      try {
        const parsed = JSON.parse(data) as T;
        resolve(parsed);
      } catch {
        reject(new Error("Failed to parse stdin JSON"));
      }
    });

    process.stdin.on("error", reject);
  });
}
