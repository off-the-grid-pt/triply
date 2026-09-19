// batch-loader.ts — parse harness batch markdown into a concrete BatchContext.

import { basename, join } from "node:path";
import { fileExists, readText } from "./file-utils";
import type { BatchContext } from "./prompt-builder";
import type { ModuleId, Stage } from "./types";

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

const VALID_STAGES: Stage[] = ["architecture", "design", "database", "backend", "frontend", "qa"];

export function isModuleId(value: string): value is ModuleId {
  return VALID_MODULES.includes(value as ModuleId);
}

export function isStage(value: string): value is Stage {
  return VALID_STAGES.includes(value as Stage);
}

export function defaultBatchPath(repoRoot: string, module: ModuleId, stage: Stage): string {
  return join(repoRoot, "harness", "batches", module + "-" + stage + ".md");
}

function sections(text: string): Map<string, string> {
  const result = new Map<string, string>();
  let current: string | null = null;
  let lines: string[] = [];

  const flush = (): void => {
    if (current) result.set(current.toLowerCase(), lines.join("\n").trim());
  };

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^##\s+(.+?)\s*$/);
    if (match) {
      flush();
      current = match[1].trim();
      lines = [];
    } else if (current) {
      lines.push(line);
    }
  }

  flush();
  return result;
}

function sectionFromMap(parsed: Map<string, string>, heading: string): string {
  return parsed.get(heading.toLowerCase()) ?? "";
}

function scalar(parsed: Map<string, string>, heading: string): string {
  return sectionFromMap(parsed, heading)
    .split(/\r?\n/)
    .map(line => line.trim())
    .find(Boolean) ?? "";
}

function bulletList(parsed: Map<string, string>, heading: string): string[] {
  return sectionFromMap(parsed, heading)
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.startsWith("- "))
    .map(line => line.slice(2).trim())
    .filter(Boolean);
}

function codeBlockLines(parsed: Map<string, string>, heading: string): string[] {
  const body = sectionFromMap(parsed, heading);
  const match = body.match(/```(?:bash|sh)?\s*([\s\S]*?)```/i);
  const source = match?.[1] ?? body;
  return source
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !line.startsWith("#"));
}

export function loadBatchFile(batchFile: string): BatchContext {
  if (!fileExists(batchFile)) {
    throw new Error("Batch file not found: " + batchFile);
  }

  const text = readText(batchFile);
  const parsed = sections(text);
  const module = scalar(parsed, "Module");
  const stage = scalar(parsed, "Stage");

  if (!isModuleId(module)) {
    throw new Error("Invalid or missing Module in " + batchFile + ": " + module);
  }
  if (!isStage(stage)) {
    throw new Error("Invalid or missing Stage in " + batchFile + ": " + stage);
  }

  const agent = scalar(parsed, "Agent");
  const specPath = scalar(parsed, "Spec");
  const goal = sectionFromMap(parsed, "Goal");
  const architectureNotes = sectionFromMap(parsed, "Architecture Rules");

  if (!agent) throw new Error("Missing Agent in " + batchFile);
  if (!specPath) throw new Error("Missing Spec in " + batchFile);
  if (!goal) throw new Error("Missing Goal in " + batchFile);

  return {
    module,
    stage,
    agent,
    goal,
    allowedFiles: bulletList(parsed, "Allowed Files"),
    forbiddenFiles: bulletList(parsed, "Forbidden Files"),
    validationCommands: codeBlockLines(parsed, "Validation Commands"),
    architectureNotes,
    specPath,
    batchFile: batchFile.includes("/") ? batchFile : basename(batchFile),
  };
}
