// file-utils.ts — filesystem helpers for harness scripts.
// Uses only Node built-ins. No external dependencies.

import { mkdirSync, writeFileSync, readFileSync, existsSync, appendFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export function ensureDir(dirPath: string): string {
  mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

export function writeText(filePath: string, contents: string): string {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, contents);
  return filePath;
}

export function writeJson(filePath: string, value: unknown): string {
  return writeText(filePath, JSON.stringify(value, null, 2) + '\n');
}

export function readText(filePath: string): string {
  return readFileSync(filePath, 'utf8');
}

export function readJson<T = unknown>(filePath: string): T {
  return JSON.parse(readText(filePath)) as T;
}

export function appendLine(filePath: string, line: string): string {
  ensureDir(dirname(filePath));
  appendFileSync(filePath, line.endsWith('\n') ? line : line + '\n');
  return filePath;
}

export function fileExists(filePath: string): boolean {
  return existsSync(filePath);
}

// harness/lib/ is two levels below the repo root (graninha/harness/lib/)
export function repoRootFrom(startDir: string): string {
  return resolve(startDir, '..', '..');
}

export function timestampSlug(date: Date = new Date()): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    '-' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds())
  );
}
