// Ported from bow-decision-challenges tools/boss/lib/doctor.mjs @ 9313c91.
// Economics changes: the viewport check validates shape from project config
// instead of hardcoding one product's exact viewports; a constitution-
// separation check enforces that Decision Challenges assessment law has not
// bled into the Economics constitution; a surfaces check pins the three
// classroom surfaces; role contracts also require a tools field; the
// model-hierarchy check covers this repo's pre-Boss wording.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { bossPaths, loadConfig, readJson } from "./core.mjs";
import { projectionFresh, readRunEvents } from "./events.mjs";

function check(id, passed, message, severity = "error") {
  return { id, passed, message, severity };
}

export function detectConstitutionBleed(config) {
  const exclusions = config.project.constitutionExclusions ?? {};
  const forbiddenRoles = new Set(exclusions.forbiddenRoleIds ?? []);
  const forbiddenScopes = new Set(exclusions.forbiddenScopes ?? []);
  const forbiddenBlocking = new Set(exclusions.forbiddenBlockingCategories ?? []);
  return [...new Set([
    ...config.roles.roles.map((role) => role.id).filter((id) => forbiddenRoles.has(id)),
    ...config.activation.rules.flatMap((rule) => rule.scopes.filter((scope) => forbiddenScopes.has(scope))),
    ...(config.project.blockingDissentCategories ?? []).filter((category) => forbiddenBlocking.has(category)),
    ...config.roles.roles.flatMap((role) => role.blockingAuthority.filter((category) => forbiddenBlocking.has(category))),
  ])];
}

export function runDoctor(root) {
  const checks = [];
  let config;
  try {
    config = loadConfig(root);
    checks.push(check("config-json", true, "All harness configuration files contain valid JSON."));
  } catch (error) {
    checks.push(check("config-json", false, error.message));
    return { ok: false, checks };
  }

  const roleIds = config.roles.roles.map((role) => role.id);
  const roleSet = new Set(roleIds);
  checks.push(check("role-ids-unique", roleSet.size === roleIds.length, roleSet.size === roleIds.length ? `${roleIds.length} durable role ids are unique.` : "Durable role ids are duplicated."));

  const roleContractFields = [
    "id", "name", "mode", "purpose", "triggers", "allowedActions", "forbiddenActions",
    "requiredContext", "independencePolicy", "outputSections", "costBand", "blockingAuthority", "tools",
  ];
  const malformedRoles = config.roles.roles.filter((role) => roleContractFields.some((field) => role[field] === undefined));
  checks.push(check("role-contracts", malformedRoles.length === 0, malformedRoles.length ? `Malformed role contracts: ${malformedRoles.map((role) => role.id).join(", ")}.` : "Every durable role has a complete machine contract."));

  const missingAgents = roleIds.filter((id) => !existsSync(path.join(root, ".claude", "agents", `${id}.md`)));
  checks.push(check("agent-parity", missingAgents.length === 0, missingAgents.length ? `Claude agent files missing: ${missingAgents.join(", ")}.` : "Every durable role has a Claude agent file."));

  const unknownLevelRoles = Object.values(config.levels.levels).flatMap((level) => level.minimumRoles.filter((id) => !roleSet.has(id)));
  checks.push(check("level-role-references", unknownLevelRoles.length === 0, unknownLevelRoles.length ? `Levels reference unknown roles: ${unknownLevelRoles.join(", ")}.` : "Rigor levels reference valid roles."));

  const unknownCeremonyRoles = (config.levels.releaseOnlyRoles ?? []).filter((id) => !roleSet.has(id));
  checks.push(check("ceremony-role-references", unknownCeremonyRoles.length === 0, unknownCeremonyRoles.length ? `releaseOnlyRoles reference unknown roles: ${unknownCeremonyRoles.join(", ")}.` : "Ceremony-sensitive roles reference valid roles."));

  const unknownActivationRoles = config.activation.rules.flatMap((rule) => rule.roles.filter((id) => !roleSet.has(id)));
  checks.push(check("activation-role-references", unknownActivationRoles.length === 0, unknownActivationRoles.length ? `Activation rules reference unknown roles: ${unknownActivationRoles.join(", ")}.` : "Activation rules reference valid roles."));

  const requiredSchemas = ["event", "wave-contract", "role-output", "lesson", "precedent"];
  const missingSchemas = requiredSchemas.filter((name) => !existsSync(path.join(root, ".boss", "schemas", `${name}.schema.json`)));
  checks.push(check("schemas-present", missingSchemas.length === 0, missingSchemas.length ? `Missing schemas: ${missingSchemas.join(", ")}.` : "Required runtime schemas are present."));

  const project = config.project;
  checks.push(check("founder-merge-control", project.founderControlsMainMerge === true, project.founderControlsMainMerge ? "Founder control of main merge is enabled." : "Founder control of main merge must be enabled."));

  const viewportsValid = Array.isArray(project.requiredViewports)
    && project.requiredViewports.length > 0
    && project.requiredViewports.every((viewport) => Number.isInteger(viewport.width) && Number.isInteger(viewport.height) && viewport.width > 0 && viewport.height > 0);
  checks.push(check("viewports", viewportsValid, viewportsValid ? `Required viewports: ${project.requiredViewports.map((viewport) => `${viewport.width}×${viewport.height}`).join(", ")}.` : "project.requiredViewports must be a non-empty list of {width, height}."));

  const surfacesValid = JSON.stringify(project.surfaces) === JSON.stringify(["play", "teach", "board"]);
  checks.push(check("surfaces", surfacesValid, surfacesValid ? "The three classroom surfaces (play/teach/board) are declared." : "project.surfaces must declare exactly play, teach, board."));

  const bleed = detectConstitutionBleed(config);
  checks.push(check("constitution-separation", bleed.length === 0, bleed.length ? `Decision Challenges constitution bleed detected: ${bleed.join(", ")}.` : "No sibling-product assessment law has bled into the Economics constitution."));

  const roleFiles = existsSync(path.join(root, ".claude", "agents"))
    ? readdirSync(path.join(root, ".claude", "agents")).filter((file) => file.endsWith(".md"))
    : [];
  const obsoleteAgents = roleFiles.filter((file) => !roleSet.has(file.replace(/\.md$/, "")));
  checks.push(check("orchestration-consolidated", obsoleteAgents.length === 0, obsoleteAgents.length ? `Unregistered/obsolete agent files remain: ${obsoleteAgents.join(", ")}.` : "Claude agent directory matches the one durable roster."));

  const skills = ["bow-prototype", "bow-boss"];
  const missingSkills = skills.filter((name) => !existsSync(path.join(root, ".claude", "skills", name, "SKILL.md")));
  checks.push(check("mode-skills", missingSkills.length === 0, missingSkills.length ? `Missing mode skills: ${missingSkills.join(", ")}.` : "Prototype and Boss skills are present."));

  const packageJson = readJson(path.join(root, "package.json"));
  const requiredScripts = ["boss", "boss:test", "boss:doctor"];
  const missingScripts = requiredScripts.filter((name) => !packageJson.scripts?.[name]);
  checks.push(check("package-scripts", missingScripts.length === 0, missingScripts.length ? `Missing package scripts: ${missingScripts.join(", ")}.` : "Harness package scripts are installed."));

  const claude = readFileSync(path.join(root, "CLAUDE.md"), "utf8");
  const modelHierarchy = /FABLE\s*[—-]\s*CEO|OPUS\s*[—-]\s*DIRECTOR|SONNET\s*[—-]\s*BUILDER|Fable \/ Sonnet division|Fable owns product judgment|Lead Sonnet build/i.test(claude);
  checks.push(check("no-model-hierarchy", !modelHierarchy, modelHierarchy ? "CLAUDE.md still grants permanent organizational authority to model names." : "CLAUDE.md does not grant permanent authority to model names."));
  checks.push(check("mode-distinction", /PROTOTYPE MODE/i.test(claude) && /BOSS MODE/i.test(claude), "CLAUDE.md names Prototype Mode and Boss Mode."));

  const paths = bossPaths(root);
  const runIds = existsSync(paths.runs)
    ? readdirSync(paths.runs, { withFileTypes: true }).filter((entry) => entry.isDirectory() && !entry.name.startsWith(".")).map((entry) => entry.name)
    : [];
  for (const runId of runIds) {
    try {
      const history = readRunEvents(root, runId);
      checks.push(check(`run-history:${runId}`, history.truncatedTail === null, history.truncatedTail === null ? `${runId} event history is valid.` : `${runId} has an interrupted trailing event.`, "warning"));
      const freshness = projectionFresh(root, runId);
      checks.push(check(`run-projection:${runId}`, freshness.fresh, freshness.fresh ? `${runId} state projection matches its event head.` : `${runId}: ${freshness.reason}`));
    } catch (error) {
      checks.push(check(`run-history:${runId}`, false, error.message));
    }
  }

  return {
    ok: checks.every((item) => item.passed || item.severity === "warning"),
    checks,
    counts: {
      roles: roleIds.length,
      activationRules: config.activation.rules.length,
      models: config.models.models.length,
      runs: runIds.length,
    },
  };
}
