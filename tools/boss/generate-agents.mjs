#!/usr/bin/env node
// Ported from bow-decision-challenges tools/boss/generate-agents.mjs @ 9313c91.
// Economics changes: per-role tool grants come from roles.json (the source
// hardcoded a product-specific bash-role list) and the product name comes from
// project.json.

import { readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import { findRepoRoot, loadConfig } from "./lib/core.mjs";

const root = findRepoRoot();
const config = loadConfig(root);
const agentDir = path.join(root, ".claude", "agents");
const productName = config.project.displayName;

function yamlString(value) {
  return JSON.stringify(value);
}

function toolsFor(role) {
  if (typeof role.tools === "string" && role.tools.trim()) return role.tools;
  if (role.mode === "builder" || role.mode === "orchestrator") return "Read, Grep, Glob, Edit, Write, Bash";
  return "Read, Grep, Glob";
}

function sectionList(values) {
  return values.map((value) => `- ${value}`).join("\n");
}

function agentFile(role) {
  const readOnly = role.mode === "read-only" || role.mode === "advisor";
  return `---
name: ${role.id}
description: ${yamlString(`${role.purpose} Trigger when: ${role.triggers.join("; ")}.`)}
tools: ${toolsFor(role)}
model: inherit
effort: ${role.costBand === "low" ? "low" : "high"}
maxTurns: ${role.costBand === "high" ? 55 : role.costBand === "medium" ? 45 : 30}
---

# ${role.name}

You are the ${role.name} for ${productName}.

## Purpose

${role.purpose}

## Trigger

${sectionList(role.triggers)}

## You may

${sectionList(role.allowedActions)}

## You must not

${sectionList(role.forbiddenActions)}
${readOnly ? "- modify repository files or implementation state\n" : ""}
## Required context

Do not judge until you have the relevant items below. Name anything unavailable as NOT VERIFIED.

${sectionList(role.requiredContext)}

## Independence

${role.independencePolicy}

Do not accept an assignment that violates this policy. Report the conflict to the Lead Integrator.

## Output contract

Return one concise section for every exact key below. These keys are machine-checked when the
role completion is recorded.

${sectionList(role.outputSections)}

Evidence claims must name Boss evidence ids. Distinguish observed, inferred, and not verified.
Do not praise. Put the highest-severity finding first. Your final response is the report the Lead
Integrator receives, so do not leave the report in tool output.

## Authority

Blocking categories: ${role.blockingAuthority.length ? role.blockingAuthority.join(", ") : "none; advisory unless another BOW law makes the finding blocking"}.

Record formal dissent when material disagreement remains. A final decision does not erase it.
`;
}

const expected = new Set(config.roles.roles.map((role) => `${role.id}.md`));
for (const file of readdirSync(agentDir)) {
  if (file.endsWith(".md") && !expected.has(file)) rmSync(path.join(agentDir, file));
}
for (const role of config.roles.roles) {
  writeFileSync(path.join(agentDir, `${role.id}.md`), agentFile(role), "utf8");
}

process.stdout.write(`Generated ${config.roles.roles.length} ${productName} Boss agent contracts.\n`);
