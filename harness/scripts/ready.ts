#!/usr/bin/env node
// ready.ts — go/no-go readiness check before the first real module run.
//
// Usage:
//   npm run harness:ready
//   node --import tsx harness/scripts/ready.ts
//
// Inspection only — never invokes agents, never runs validation.
// Exit 0 = GO (warnings allowed), exit 1 = NO-GO.

import { resolve } from 'node:path';
import { evaluateReadiness, formatReadinessReport } from '../lib/readiness';

function main(): void {
  const repoRoot = process.cwd();
  const report = evaluateReadiness(repoRoot);

  process.stdout.write(formatReadinessReport(report));
  process.exit(report.go ? 0 : 1);
}

if (process.argv[1] && /ready\.ts$/.test(resolve(process.argv[1]))) {
  main();
}
