#!/usr/bin/env node
// start-run.ts — create a new harness run folder and seed its artifacts.
//
// Usage:
//   npm run harness:start
//   node --import tsx harness/scripts/start-run.ts <module> <stage> <agent>
//
// Side effects:
//   - Creates harness/runs/<timestamp>-<module>-<stage>/
//   - Seeds prompt.md, result.md, validation.log, diff.txt, score.txt, metrics.json
//   - Appends run.start event to harness/logs/events.jsonl
//   - Prints the run directory path to stdout

import { createRunDir, appendEvent } from "../lib/run-state";
import type { ModuleId, Stage } from "../lib/types";

const VALID_MODULES: ModuleId[] = [
  "01-auth-onboarding",
  "02-trips",
  "03-destinations-legs",
  "04-budget-expenses",
  "05-savings-plan",
  "06-itinerary",
  "07-reservations-checklists",
  "08-documents",
  "09-dashboard",
  "10-settings-preferences",
];

const VALID_STAGES: Stage[] = [
  "architecture",
  "design",
  "database",
  "backend",
  "frontend",
  "qa",
];

const AGENTS: Record<Stage, string> = {
  architecture: "Agent Architecture",
  design: "Agent Design",
  database: "Agent Database",
  backend: "Agent Backend",
  frontend: "Agent Frontend",
  qa: "Agent QA",
};

function usage(msg?: string): never {
  if (msg) process.stderr.write("error: " + msg + "\n");
  process.stderr.write(
    "usage: node --import tsx harness/scripts/start-run.ts <module> <stage> [agent]\n" +
    "\n" +
    "modules: " + VALID_MODULES.join(", ") + "\n" +
    "stages:  " + VALID_STAGES.join(", ") + "\n"
  );
  process.exit(2);
}

function main(): void {
  const [moduleArg, stageArg, agentArg] = process.argv.slice(2);

  if (!moduleArg || !stageArg) usage("missing required arguments");

  if (!VALID_MODULES.includes(moduleArg as ModuleId)) {
    usage("invalid module: " + moduleArg);
  }
  if (!VALID_STAGES.includes(stageArg as Stage)) {
    usage("invalid stage: " + stageArg);
  }

  const module = moduleArg as ModuleId;
  const stage = stageArg as Stage;
  const agent = agentArg ?? AGENTS[stage];
  const branch = "feat/" + module;
  const repoRoot = process.cwd();

  const { runDir, metrics } = createRunDir({
    repoRoot,
    module,
    stage,
    agent,
    branch,
  });

  appendEvent(repoRoot, {
    event: "run.start",
    module,
    stage,
    agent,
    branch,
    runDir,
  });

  process.stdout.write("\nRun started:\n");
  process.stdout.write("  Module:  " + module + "\n");
  process.stdout.write("  Stage:   " + stage + "\n");
  process.stdout.write("  Agent:   " + agent + "\n");
  process.stdout.write("  Run dir: " + runDir + "\n");
  process.stdout.write("\nNext steps:\n");
  process.stdout.write("  Preferred automation: npm run agent:run-batch -- --module " + module + " --stage " + stage + " --mode codex --validate --score --repair-attempts 2\n");
  process.stdout.write("  Manual fallback:\n");
  process.stdout.write("  1. Fill in harness/templates/implementation-prompt.md\n");
  process.stdout.write("  2. Copy prompt to " + runDir + "/prompt.md\n");
  process.stdout.write("  3. Activate the agent in Cursor with the prompt\n");
  process.stdout.write("  4. Paste agent reply to " + runDir + "/result.md\n");
  process.stdout.write("  5. Run: npx tsc --noEmit && npm run build && npm run test\n");
  process.stdout.write("  6. Paste output to " + runDir + "/validation.log\n");
  process.stdout.write("  7. Run: npm run harness:score\n");
  process.stdout.write("  8. Run: npm run harness:end " + runDir + "\n");
}

main();
