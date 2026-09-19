import { test } from "node:test";
import assert from "node:assert/strict";
import { checkChangedFilesScope, patternFromEntry } from "../lib/scope-checker";

test("patternFromEntry strips human-readable descriptions", () => {
  assert.equal(
    patternFromEntry("supabase/migrations/*_modulo_02_contas.sql — criar migration principal"),
    "supabase/migrations/*_modulo_02_contas.sql"
  );
});

test("scope check accepts files matching allowed globs", () => {
  const result = checkChangedFilesScope({
    changedFiles: ["supabase/migrations/20260622000000_modulo_02_contas.sql"],
    allowedFiles: ["supabase/migrations/*_modulo_02_contas.sql — criar migration principal"],
    forbiddenFiles: ["src/**"],
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.violations, []);
});

test("scope check rejects forbidden files before allowed files", () => {
  const result = checkChangedFilesScope({
    changedFiles: ["src/app/page.tsx"],
    allowedFiles: ["src/app/*.tsx"],
    forbiddenFiles: ["src/**"],
  });

  assert.equal(result.ok, false);
  assert.equal(result.violations[0]?.reason, "forbidden");
  assert.equal(result.violations[0]?.pattern, "src/**");
});

test("scope check rejects files outside allowed scope", () => {
  const result = checkChangedFilesScope({
    changedFiles: ["package.json"],
    allowedFiles: ["supabase/migrations/*.sql"],
    forbiddenFiles: [],
  });

  assert.equal(result.ok, false);
  assert.equal(result.violations[0]?.reason, "not_allowed");
});

test("scope check ignores configured generated files", () => {
  const result = checkChangedFilesScope({
    changedFiles: ["test-results/.last-run.json"],
    allowedFiles: ["src/**"],
    forbiddenFiles: [],
    ignoredFiles: ["test-results/**"],
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.changedFiles, []);
  assert.deepEqual(result.violations, []);
});
