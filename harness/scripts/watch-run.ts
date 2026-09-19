#!/usr/bin/env node
// watch-run.ts — tail the most recent run logs in real time.
//
// Usage:
//   npm run harness:watch
//   node --import tsx harness/scripts/watch-run.ts [<run-dir> | --list]

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { harnessPaths } from "../lib/run-state";

const WATCH_FILES = [
  "validation.log",
  "score.txt",
  "result.md",
];

function listRunDirs(runsDir: string): Array<{ name: string; dir: string; mtime: number }> {
  if (!existsSync(runsDir)) return [];
  return readdirSync(runsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => {
      const dir = join(runsDir, d.name);
      return { name: d.name, dir, mtime: statSync(dir).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

function readChunk(filePath: string, start: number): { next: number; text: string } {
  if (!existsSync(filePath)) return { next: start, text: "" };
  const size = statSync(filePath).size;
  if (size < start) return { next: 0, text: "" };
  if (size === start) return { next: size, text: "" };
  const text = readFileSync(filePath, "utf8").slice(start);
  return { next: size, text };
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length > 1) {
    process.stderr.write("usage: node --import tsx harness/scripts/watch-run.ts [--list | <run-dir>]\n");
    process.exit(2);
  }

  const repoRoot = process.cwd();
  const { runsDir } = harnessPaths(repoRoot);

  if (args[0] === "--list") {
    const dirs = listRunDirs(runsDir).slice(0, 20);
    if (dirs.length === 0) {
      process.stdout.write("No runs yet.\n");
    } else {
      for (const r of dirs) process.stdout.write(r.name + "\n");
    }
    return;
  }

  let runDir: string;
  if (args[0]) {
    runDir = resolve(repoRoot, args[0]);
  } else {
    const dirs = listRunDirs(runsDir);
    if (dirs.length === 0) {
      process.stderr.write("No runs found in harness/runs/\n");
      process.exit(1);
    }
    runDir = dirs[0].dir;
  }

  if (!existsSync(runDir)) {
    process.stderr.write("Run directory not found: " + runDir + "\n");
    process.exit(1);
  }

  process.stdout.write("Watching run: " + runDir + "\n");
  process.stdout.write("Files: " + WATCH_FILES.join(", ") + "\n");
  process.stdout.write("Press Ctrl-C to stop.\n\n");

  const positions = new Map<string, number>();
  for (const name of WATCH_FILES) {
    const filePath = join(runDir, name);
    const size = existsSync(filePath) ? statSync(filePath).size : 0;
    positions.set(filePath, Math.max(0, size - 2048));
  }

  const poll = (): void => {
    for (const name of WATCH_FILES) {
      const filePath = join(runDir, name);
      const current = positions.get(filePath) ?? 0;
      const { next, text } = readChunk(filePath, current);
      positions.set(filePath, next);
      if (text) {
        process.stdout.write("\n--- " + name + " ---\n");
        process.stdout.write(text.endsWith("\n") ? text : text + "\n");
      }
    }
  };

  poll();
  setInterval(poll, 1000);
}

main();
