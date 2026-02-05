import { readSync } from "node:fs";
import { runPinInject } from "./pin-inject.js";
import { runSpecSync } from "./spec-sync.js";

/**
 * stdin을 동기적으로 읽기 (non-TTY stdin)
 */
function readStdinSync(): string {
  const chunks: Buffer[] = [];
  const buf = Buffer.alloc(4096);

  try {
    let bytesRead: number;
    while (true) {
      try {
        bytesRead = readSync(process.stdin.fd, buf, 0, buf.length, null);
      } catch {
        break;
      }
      if (bytesRead === 0) break;
      chunks.push(Buffer.from(buf.subarray(0, bytesRead)));
    }
  } catch {
    // stdin not readable (e.g., no pipe)
  }

  return Buffer.concat(chunks).toString("utf-8");
}

/**
 * Hook 라우터: compass hook <name>
 *
 * stdin JSON 파싱 실패 시 exit 1 (docs/01_decisions.md Hook I/O 규약)
 */
export function runHook(name: string | undefined, cwd: string): void {
  // stdin JSON 읽기 & 파싱
  const raw = readStdinSync();

  // stdin이 비어있으면 파싱 실패로 처리하지 않음 (파이프 없이 호출 가능)
  // 단, 내용이 있으면 반드시 유효한 JSON이어야 함
  if (raw.trim()) {
    try {
      JSON.parse(raw);
    } catch {
      process.exitCode = 1;
      return;
    }
  }

  switch (name) {
    case "pin-inject":
      runPinInject(cwd);
      break;

    case "spec-sync":
      runSpecSync(cwd);
      break;

    default:
      console.error(`Unknown hook: ${name ?? "(none)"}`);
      console.error("Available hooks: pin-inject, spec-sync");
      process.exitCode = 1;
  }
}
