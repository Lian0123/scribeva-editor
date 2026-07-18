import { readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";

const root = process.cwd();
const docsRoot = resolve(root, "docs/ai-maintenance");
const required = [
  "entry.md",
  "creation-guide.md",
  "documentation-maintenance.md",
  "installation-and-configuration.md",
  "development-standards.md",
  "testing-and-verification.md",
  "quick-navigation/feature-map.md",
  "quick-navigation/editor-core.md",
  "quick-navigation/browser-input.md",
  "quick-navigation/html-security-and-serialization.md",
  "quick-navigation/ui-and-theming.md",
  "key-memory/project-facts.md",
  "key-memory/risks-and-technical-debt.md",
  "task-processing/task-workflow.md",
  "decision-process/change-decision-flow.md",
  "reading-strategy/progressive-reading.md",
  "external-references/reference-index.md",
  "change-history/decision-log.md",
  "change-history/CHANGELOG.md",
];

const failures = [];

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

for (const relative of required) {
  const path = resolve(docsRoot, relative);
  if (!(await exists(path))) {
    failures.push(`Missing required document: ${relative}`);
    continue;
  }

  const content = await readFile(path, "utf8");
  const firstLine = content.split(/\r?\n/, 1)[0];
  if (
    !/^<!-- AI-DOC: owner=[^;]+; verified=\d{4}-\d{2}-\d{2}; sources=.+ -->$/.test(
      firstLine,
    )
  ) {
    failures.push(`Invalid AI-DOC metadata: ${relative}`);
  }

  const linkPattern = /\[[^\]]+\]\((?!https?:|mailto:|#)([^)]+)\)/g;
  for (const match of content.matchAll(linkPattern)) {
    const target = decodeURIComponent(match[1].split("#")[0]);
    if (!target) continue;
    const targetPath = resolve(dirname(path), target);
    if (!(await exists(targetPath))) {
      failures.push(`Broken link in ${relative}: ${match[1]}`);
    }
  }
}

const packageJSON = JSON.parse(
  await readFile(resolve(root, "package.json"), "utf8"),
);
if (packageJSON.license !== "MIT") failures.push("package.json license must be MIT");
if (Object.keys(packageJSON.dependencies ?? {}).length !== 0) {
  failures.push("Runtime dependencies require an approved ADR");
}
if (!(await exists(resolve(root, "LICENSE")))) failures.push("LICENSE is missing");
if (!(await exists(resolve(root, "AGENTS.md")))) failures.push("AGENTS.md is missing");

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Verified ${required.length} living documents and package policy.`);
}
