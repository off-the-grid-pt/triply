#!/usr/bin/env node
// wizard.ts — interactive harness launcher for the Triply.
//
// Usage:
//   npm run harness:wizard
//   node --import tsx harness/scripts/wizard.ts

import { join } from "node:path";
import { fileExists } from "../lib/file-utils";
import { runCommand } from "../lib/process-runner";
import { harnessPaths, listRunDirs } from "../lib/run-state";
import type { ModuleId, Stage } from "../lib/types";

const MODULES: ModuleId[] = [
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

const STAGES: Stage[] = ["architecture", "design", "database", "backend", "frontend", "qa"];

const AGENTS: Record<Stage, string> = {
  architecture: "Agent Architecture",
  design: "Agent Design",
  database: "Agent Database",
  backend: "Agent Backend",
  frontend: "Agent Frontend",
  qa: "Agent QA",
};

async function prompt<T extends Record<string, unknown>>(
  question: Record<string, unknown>
): Promise<T> {
  const mod = await import("enquirer") as unknown as { prompt: <R>(q: unknown) => Promise<R> };
  return mod.prompt<T>(question);
}

async function askSelect<T extends string>(
  message: string,
  choices: Array<{ name: string; value: T; hint?: string }>
): Promise<T> {
  const answer = await prompt<{ value: T }>({
    type: "select",
    name: "value",
    message,
    choices: choices.map(c => ({
      name: c.value,
      message: c.name + (c.hint ? " — " + c.hint : ""),
    })),
  });
  return answer.value;
}

async function askConfirm(message: string, initial = true): Promise<boolean> {
  const answer = await prompt<{ value: boolean }>({
    type: "confirm",
    name: "value",
    message,
    initial,
  });
  return answer.value;
}

async function operationStartRun(): Promise<void> {
  const module = await askSelect<ModuleId>(
    "Qual módulo?",
    MODULES.map(m => ({ name: m, value: m }))
  );

  const stage = await askSelect<Stage>(
    "Qual etapa?",
    STAGES.map(s => ({
      name: s,
      value: s,
      hint: AGENTS[s],
    }))
  );

  const agent = AGENTS[stage];

  process.stdout.write("\n" + "=".repeat(50) + "\n");
  process.stdout.write("Pronto para iniciar:\n");
  process.stdout.write("  Módulo: " + module + "\n");
  process.stdout.write("  Etapa:  " + stage + "\n");
  process.stdout.write("  Agente: " + agent + "\n");
  process.stdout.write("=".repeat(50) + "\n\n");

  const proceed = await askConfirm("Iniciar esta run?");
  if (!proceed) return;

  const result = await runCommand({
    command: "node",
    args: ["--import", "tsx", "harness/scripts/start-run.ts", module, stage],
    cwd: process.cwd(),
  });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  if (result.exitCode !== 0) {
    process.stderr.write("Erro ao iniciar a run.\n");
  }
}

async function operationScoreRun(): Promise<void> {
  const repoRoot = process.cwd();
  const { runsDir } = harnessPaths(repoRoot);
  const dirs = listRunDirs(repoRoot).slice(0, 10);

  if (dirs.length === 0) {
    process.stdout.write("Nenhuma run encontrada em harness/runs/\n");
    return;
  }

  const runDir = await askSelect<string>(
    "Qual run pontuar?",
    dirs.map(d => ({
      name: d.split("/").pop() ?? d,
      value: d,
    }))
  );

  const result = await runCommand({
    command: "node",
    args: ["--import", "tsx", "harness/scripts/score-run.ts", runDir],
    cwd: repoRoot,
  });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
}

async function operationEndRun(): Promise<void> {
  const repoRoot = process.cwd();
  const dirs = listRunDirs(repoRoot).slice(0, 10);

  if (dirs.length === 0) {
    process.stdout.write("Nenhuma run encontrada.\n");
    return;
  }

  const runDir = await askSelect<string>(
    "Qual run finalizar?",
    dirs.map(d => ({
      name: d.split("/").pop() ?? d,
      value: d,
    }))
  );

  const result = await runCommand({
    command: "node",
    args: ["--import", "tsx", "harness/scripts/end-run.ts", runDir],
    cwd: repoRoot,
  });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
}

async function operationListRuns(): Promise<void> {
  const result = await runCommand({
    command: "node",
    args: ["--import", "tsx", "harness/scripts/list-runs.ts"],
    cwd: process.cwd(),
  });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
}

async function operationReadiness(): Promise<void> {
  const result = await runCommand({
    command: "node",
    args: ["--import", "tsx", "harness/scripts/ready.ts"],
    cwd: process.cwd(),
  });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
}

async function main(): Promise<void> {
  const repoRoot = process.cwd();

  process.stdout.write("\n" + "=".repeat(50) + "\n");
  process.stdout.write("  Triply — Harness Wizard\n");
  process.stdout.write("=".repeat(50) + "\n\n");

  if (!fileExists(join(repoRoot, "AGENTS.md"))) {
    process.stdout.write("AVISO: AGENTS.md não encontrado.\n");
  }
  if (!fileExists(join(repoRoot, "project-state.json"))) {
    process.stdout.write("AVISO: project-state.json não encontrado.\n");
  }

  type Operation = "start" | "score" | "end" | "list" | "ready";

  const operation = await askSelect<Operation>("O que queres fazer?", [
    { name: "Iniciar nova run", value: "start", hint: "npm run harness:start" },
    { name: "Pontuar run", value: "score", hint: "npm run harness:score" },
    { name: "Finalizar run", value: "end", hint: "npm run harness:end" },
    { name: "Listar runs recentes", value: "list", hint: "npm run agent:list-runs" },
    { name: "Verificar readiness", value: "ready", hint: "npm run harness:ready" },
  ]);

  if (operation === "start") await operationStartRun();
  else if (operation === "score") await operationScoreRun();
  else if (operation === "end") await operationEndRun();
  else if (operation === "list") await operationListRuns();
  else if (operation === "ready") await operationReadiness();
}

main().catch((err: Error) => {
  process.stderr.write(err.stack ?? err.message + "\n");
  process.exit(1);
});
