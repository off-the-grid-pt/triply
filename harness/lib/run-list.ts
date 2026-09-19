// run-list.ts — formatting helpers for list-runs script.

import type { ModuleId, RunStatus, RunVerdict, Stage } from './types';

export interface RunListEntry {
  dirName: string;
  module: ModuleId | null;
  stage: Stage | null;
  agent: string | null;
  status: RunStatus | null;
  score: number | null;
  verdict: RunVerdict | null;
}

export function formatRunEntry(entry: RunListEntry): string {
  const score = entry.score == null ? 'not-scored' : String(entry.score);
  const verdict = entry.verdict ?? '-';
  const status = entry.status ?? '?';
  const module = entry.module ?? '?';
  const stage = entry.stage ?? '?';
  const agent = entry.agent ?? '?';
  return [
    entry.dirName,
    `module=${module}`,
    `stage=${stage}`,
    `agent=${agent}`,
    `status=${status}`,
    `score=${score}`,
    `verdict=${verdict}`,
  ].join('  ');
}

export function formatRunList(entries: RunListEntry[]): string {
  if (entries.length === 0) {
    return 'No runs found in harness/runs/\n';
  }
  const header = 'Recent harness runs (newest first):\n';
  return header + entries.map(formatRunEntry).join('\n') + '\n';
}
