import { describe, it, expect } from "vitest";
import { parseDepsFromDiff } from "../../../src/core/capsule/diff-collector.js";

describe("parseDepsFromDiff", () => {
  it("extracts deps from dependencies section", () => {
    const diff = `
--- a/package.json
+++ b/package.json
@@ -3,6 +3,7 @@
   "version": "0.1.0",
   "dependencies": {
     "react": "^19.0.0",
+    "express": "^4.18.0",
+    "zod": "~3.23.0"
   },
   "devDependencies": {
`;
    const result = parseDepsFromDiff(diff);
    expect(result).toEqual(["express", "zod"]);
  });

  it("extracts deps from devDependencies section", () => {
    const diff = `
--- a/package.json
+++ b/package.json
@@ -5,6 +5,7 @@
   "devDependencies": {
     "typescript": "^5.9.3",
+    "vitest": "^4.0.18"
   }
`;
    const result = parseDepsFromDiff(diff);
    expect(result).toEqual(["vitest"]);
  });

  it("ignores @types/ packages", () => {
    const diff = `
--- a/package.json
+++ b/package.json
@@ -5,6 +5,7 @@
   "devDependencies": {
+    "@types/node": "^25.0.0",
+    "vitest": "^4.0.18"
   }
`;
    const result = parseDepsFromDiff(diff);
    expect(result).toEqual(["vitest"]);
  });

  it("does NOT match keys outside dependency sections (version, name, scripts)", () => {
    const diff = `
--- a/package.json
+++ b/package.json
@@ -1,5 +1,5 @@
 {
-  "version": "0.1.0",
+  "version": "0.2.0",
+  "description": "updated desc",
   "scripts": {
+    "build": "tsc",
+    "test": "vitest"
   },
   "dependencies": {
   }
`;
    const result = parseDepsFromDiff(diff);
    expect(result).toEqual([]);
  });

  it("handles workspace:* versions", () => {
    const diff = `
--- a/package.json
+++ b/package.json
@@ -3,6 +3,7 @@
   "dependencies": {
+    "@repo/shared": "workspace:*"
   }
`;
    const result = parseDepsFromDiff(diff);
    expect(result).toEqual(["@repo/shared"]);
  });

  it("handles exact versions", () => {
    const diff = `
--- a/package.json
+++ b/package.json
@@ -3,6 +3,7 @@
   "dependencies": {
+    "lodash": "4.17.21"
   }
`;
    const result = parseDepsFromDiff(diff);
    expect(result).toEqual(["lodash"]);
  });

  it("handles peerDependencies and optionalDependencies", () => {
    const diff = `
--- a/package.json
+++ b/package.json
@@ -3,6 +3,7 @@
   "peerDependencies": {
+    "react": "^19.0.0"
   },
   "optionalDependencies": {
+    "fsevents": "^2.3.0"
   }
`;
    const result = parseDepsFromDiff(diff);
    expect(result).toEqual(["react", "fsevents"]);
  });

  it("returns empty array for empty diff", () => {
    expect(parseDepsFromDiff("")).toEqual([]);
  });

  it("handles multiple dependency sections correctly", () => {
    const diff = `
--- a/package.json
+++ b/package.json
@@ -3,10 +3,12 @@
   "dependencies": {
     "react": "^19.0.0",
+    "express": "^4.18.0"
   },
   "scripts": {
+    "start": "node index.js"
   },
   "devDependencies": {
+    "vitest": "^4.0.18"
   }
`;
    const result = parseDepsFromDiff(diff);
    expect(result).toEqual(["express", "vitest"]);
  });
});

describe("rename line parsing (integration)", () => {
  it("splits rename line correctly", () => {
    const line = "R100\tsrc/old.ts\tsrc/new.ts";
    const parts = line.split("\t");
    const statusCode = parts[0]?.charAt(0);

    expect(statusCode).toBe("R");
    expect(parts.length).toBeGreaterThanOrEqual(3);
    expect(parts[1]).toBe("src/old.ts");
    expect(parts[2]).toBe("src/new.ts");
  });
});
