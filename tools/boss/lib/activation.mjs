// Ported unchanged from bow-decision-challenges tools/boss @ 9313c91.
import { invariant, loadConfig, unique } from "./core.mjs";

export function activationPlan(root, level, scopes) {
  const config = loadConfig(root);
  const levelConfig = config.levels.levels[String(level)];
  invariant(levelConfig, `Unknown Boss level: ${level}`);
  invariant(levelConfig.bossEnabled === true, "Level 0 is Prototype Mode and must not create a Boss run.", "PROTOTYPE_ONLY");

  const normalizedScopes = unique(scopes.map((scope) => String(scope).trim().toLowerCase()).filter(Boolean));
  const roles = new Set(levelConfig.minimumRoles);
  const evidence = new Set(levelConfig.minimumEvidence);
  const matchedRules = [];
  const blockingRoles = new Set();

  for (const rule of config.activation.rules) {
    const matches = rule.scopes.some((scope) => normalizedScopes.includes(scope));
    if (!matches) continue;
    matchedRules.push(rule.id);
    for (const role of rule.roles) {
      roles.add(role);
      if (rule.blocking) blockingRoles.add(role);
    }
    for (const evidenceKind of rule.evidence) evidence.add(evidenceKind);
  }

  return {
    level,
    levelName: levelConfig.name,
    scopes: normalizedScopes,
    roles: [...roles].sort(),
    blockingRoles: [...blockingRoles].sort(),
    evidence: [...evidence].sort(),
    matchedRules,
    softAgentBudget: levelConfig.softAgentBudget,
    softMeetingBudget: levelConfig.softMeetingBudget,
  };
}

export function validateRoleIds(root, roleIds) {
  const config = loadConfig(root);
  const known = new Set(config.roles.roles.map((role) => role.id));
  const unknown = roleIds.filter((id) => !known.has(id));
  invariant(unknown.length === 0, `Unknown role(s): ${unknown.join(", ")}`, "UNKNOWN_ROLE");
}
