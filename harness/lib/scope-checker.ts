// scope-checker.ts — verifies changed files against a batch allow/deny list.

export interface ScopeCheckInput {
  changedFiles: string[];
  allowedFiles: string[];
  forbiddenFiles: string[];
  ignoredFiles?: string[];
}

export interface ScopeViolation {
  file: string;
  reason: "not_allowed" | "forbidden";
  pattern: string | null;
}

export interface ScopeCheckResult {
  ok: boolean;
  changedFiles: string[];
  violations: ScopeViolation[];
}

export function patternFromEntry(entry: string): string {
  return entry
    .split(/\s+—\s+/)[0]
    .split(/\s+-\s+/)[0]
    .trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.+^${}()|[\]\\]/g, "\\$&");
}

function globToRegex(pattern: string): RegExp {
  const normalized = pattern.replace(/\\/g, "/");
  let source = "";
  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];
    const next = normalized[i + 1];
    if (char === "*" && next === "*") {
      source += ".*";
      i += 1;
    } else if (char === "*") {
      source += "[^/]*";
    } else {
      source += escapeRegex(char);
    }
  }
  return new RegExp("^" + source + "$");
}

function matchesPattern(file: string, pattern: string): boolean {
  return globToRegex(pattern).test(file.replace(/\\/g, "/"));
}

function normalizePatterns(entries: string[]): string[] {
  return entries.map(patternFromEntry).filter(Boolean);
}

export function checkChangedFilesScope({
  changedFiles,
  allowedFiles,
  forbiddenFiles,
  ignoredFiles = [],
}: ScopeCheckInput): ScopeCheckResult {
  const allowed = normalizePatterns(allowedFiles);
  const forbidden = normalizePatterns(forbiddenFiles);
  const ignored = normalizePatterns(ignoredFiles);
  const normalizedChanged = changedFiles
    .map(file => file.replace(/\\/g, "/"))
    .filter(Boolean)
    .filter(file => !ignored.some(pattern => matchesPattern(file, pattern)));
  const violations: ScopeViolation[] = [];

  for (const file of normalizedChanged) {
    const forbiddenPattern = forbidden.find(pattern => matchesPattern(file, pattern));
    if (forbiddenPattern) {
      violations.push({ file, reason: "forbidden", pattern: forbiddenPattern });
      continue;
    }

    const allowedPattern = allowed.find(pattern => matchesPattern(file, pattern));
    if (!allowedPattern) {
      violations.push({ file, reason: "not_allowed", pattern: null });
    }
  }

  return {
    ok: violations.length === 0,
    changedFiles: normalizedChanged,
    violations,
  };
}

export function formatScopeCheckResult(result: ScopeCheckResult): string {
  const lines = ["Scope Check", ""];
  lines.push(result.ok ? "PASS" : "FAIL");
  lines.push("");
  lines.push("Changed files:");
  if (result.changedFiles.length === 0) {
    lines.push("  (none)");
  } else {
    for (const file of result.changedFiles) lines.push("  " + file);
  }

  if (!result.ok) {
    lines.push("");
    lines.push("Violations:");
    for (const violation of result.violations) {
      const detail = violation.pattern ? " matched " + violation.pattern : " outside allowed files";
      lines.push("  " + violation.file + " — " + violation.reason + detail);
    }
  }

  return lines.join("\n") + "\n";
}
