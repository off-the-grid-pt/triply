import { test } from "node:test";
import assert from "node:assert/strict";
import { parseValidationLog } from "../lib/validation-parser";

// ─── Tests ────────────────────────────────────────────────────────────────────

test("empty input returns all nulls", () => {
  assert.deepEqual(parseValidationLog(""), {
    tsc: null, build: null, test: null, test_e2e: null,
  });
});

test("parses a fully passing validation log", () => {
  const log = `
### TypeScript check [PASS]
$ npx tsc --noEmit
exit=0

### Next.js build [PASS]
$ npm run build
compiled successfully
exit=0

### Vitest tests [PASS]
$ npm run test
all tests passed
exit=0

### Playwright E2E [PASS]
$ npm run test:e2e
passed
exit=0
`;
  assert.deepEqual(parseValidationLog(log), {
    tsc: "pass", build: "pass", test: "pass", test_e2e: "pass",
  });
});

test("detects tsc failure", () => {
  const log = `
### TypeScript check [FAIL]
$ npx tsc --noEmit
error TS2322: Type 'string' is not assignable to type 'number'
exit=1
`;
  const r = parseValidationLog(log);
  assert.equal(r.tsc, "fail");
  assert.equal(r.build, null);
});

test("detects build failure", () => {
  const log = `
### TypeScript check [PASS]
exit=0

### Next.js build [FAIL]
$ npm run build
build failed
exit=1
`;
  const r = parseValidationLog(log);
  assert.equal(r.tsc, "pass");
  assert.equal(r.build, "fail");
});

test("detects E2E failure", () => {
  const log = `
### Playwright E2E [FAIL]
$ npm run test:e2e
3 tests failed
exit=1
`;
  const r = parseValidationLog(log);
  assert.equal(r.test_e2e, "fail");
});

test("partial log — only some steps present", () => {
  const log = `
### TypeScript check [PASS]
$ npx tsc --noEmit
exit=0
`;
  const r = parseValidationLog(log);
  assert.equal(r.tsc, "pass");
  assert.equal(r.build, null);
  assert.equal(r.test, null);
  assert.equal(r.test_e2e, null);
});

test("skipped steps stay null", () => {
  const log = `
### TypeScript check [PASS]
exit=0
### Vitest tests [SKIP]
skipped
`;
  const r = parseValidationLog(log);
  assert.equal(r.tsc, "pass");
  assert.equal(r.test, "skipped");
});
