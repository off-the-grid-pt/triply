#!/usr/bin/env node
// list-runs.ts — list recent harness runs in a compact format.
//
// Usage:
//   npm run agent:list-runs
//   node --import tsx harness/scripts/list-runs.ts [--limit <n>]

import { repoRootFrom } from "../lib/file-utils";
import { listRunDirs, readRunMetrics } from "../lib/run-state";
import { formatRunList } from "../lib/run-list";
import type { RunListEntry } from "../lib/run-list";

const DEFAULT_LIMIT = 10;

function parseLimit(argv: string[]): number {
  const idx = argv.indexOf("--limit");
  if (idx !== -1 && argv[idx + 1]) {
    const n = parseInt(argv[idx + 1], 10);
    if (!isNaN(n) && n > 0) return n;
  }
  return DEFAULT_LIMIT;
}

function main(): void {
  const repoRoot = repoRootFrom(import.meta.dirname ?? __dirname);
  const limit = parseLimit(process.argv.slice(2));
  const dirs = listRunDirs(repoRoot).slice(0, limit);

  const entries: RunListEntry[] = dirs.map(runDir => {
    const dirName = runDir.split("/").pop() ?? runDir;
    try {
      const metrics = readRunMetrics(runDir);
      return {
        dirName,
        module: metrics.module,
        stage: metrics.stage,
        agent: metrics.agent,
        status: metrics.status,
        score: metrics.score,
        verdict: metrics.verdict,
      };
    } catch {
      return {
        dirName,
        module: null,
        stage: null,
        agent: null,
        status: null,
        score: null,
        verdict: null,
      };
    }
  });

  process.stdout.write(formatRunList(entries));
}

main();
