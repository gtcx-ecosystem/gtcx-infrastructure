/**
 * Shared workspace domain checks — run from any repo cwd.
 * Protocol 29 — gtcx.workspace.manifest.v3
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function repoRoot() {
  return process.cwd();
}

export function readJson(rel) {
  const abs = join(repoRoot(), rel);
  if (!existsSync(abs)) return { missing: rel, data: null };
  try {
    return { missing: null, data: JSON.parse(readFileSync(abs, 'utf8')) };
  } catch (e) {
    return { missing: null, parseError: `${rel}: ${e.message}`, data: null };
  }
}

function schemaVersion() {
  const rel = existsSync(join(repoRoot(), '02-ops/manifest.json'))
    ? '02-ops/manifest.json'
    : 'workspace/manifest.json';
  const { data } = readJson(rel);
  return data?.schema ?? 'gtcx.workspace.manifest.v1';
}

const VALID_SCHEMAS = new Set([
  'gtcx.workspace.manifest.v1',
  'gtcx.workspace.manifest.v2',
  'gtcx.workspace.manifest.v3',
]);

export function checkRootManifest() {
  const errors = [];
  const rel = existsSync(join(repoRoot(), '02-ops/manifest.json'))
    ? '02-ops/manifest.json'
    : 'workspace/manifest.json';
  const { missing, parseError, data } = readJson(rel);
  if (missing) errors.push(missing);
  if (parseError) errors.push(parseError);
  if (data && !VALID_SCHEMAS.has(data.schema)) {
    errors.push(`${rel} schema must be v1, v2, or v3`);
  }
  return errors;
}

export function checkCoordination() {
  const errors = [];
  for (const rel of [
    '02-ops/coordination/manifest.json',
    '02-ops/coordination/remaining-work.json',
  ]) {
    const { missing, parseError } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
  }
  for (const dir of ['02-ops/coordination/outbound', '02-ops/coordination/inbound']) {
    if (!existsSync(join(repoRoot(), dir))) errors.push(dir);
  }
  return errors;
}

export function checkAttestation() {
  const errors = [];
  for (const rel of [
    '02-ops/attestation/manifest.json',
    '02-ops/attestation/gates.local.json',
    '02-ops/attestation/evidence-index.json',
    '02-ops/attestation/runners.json',
  ]) {
    const { missing, parseError, data } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
    if (rel.endsWith('gates.local.json') && data && !Array.isArray(data.gates)) {
      errors.push('02-ops/attestation/gates.local.json: gates must be array');
    }
    if (rel.endsWith('runners.json') && data && !Array.isArray(data.runners)) {
      errors.push('02-ops/attestation/runners.json: runners must be array');
    }
  }
  return errors;
}

/** @deprecated v1 — use checkAttestation for v2+ */
export function checkAssurance() {
  const errors = [];
  for (const rel of ['02-ops/assurance/gates.local.json', '02-ops/assurance/evidence-index.json']) {
    const { missing, parseError, data } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
    if (rel.endsWith('gates.local.json') && data && !Array.isArray(data.gates)) {
      errors.push('02-ops/assurance/gates.local.json: gates must be array');
    }
  }
  return errors;
}

export function checkProductManagement() {
  const errors = [];
  for (const rel of ['02-ops/pm/manifest.json', '02-ops/pm/backlog.json']) {
    const { missing, parseError, data } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
    if (rel.endsWith('backlog.json') && data && !Array.isArray(data.stories)) {
      errors.push('02-ops/pm/backlog.json: stories must be array');
    }
  }
  const agileDocs = join(repoRoot(), '01-docs/agile');
  if (!existsSync(agileDocs)) {
    errors.push('01-docs/agile (gtcx-agile bridge — create roadmap.md or run rollout)');
  }
  return errors;
}

export function checkCompliance() {
  const errors = [];
  for (const rel of [
    '02-ops/compliance/manifest.json',
    '02-ops/compliance/evidence-index.json',
    '02-ops/compliance/gaps.json',
  ]) {
    const { missing, parseError } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
  }
  return errors;
}

export function checkGtm() {
  const errors = [];
  const { missing, parseError } = readJson('02-ops/gtm/manifest.json');
  if (missing) errors.push(missing);
  if (parseError) errors.push(parseError);
  const scope = readJson('02-ops/gtm/scope.json');
  if (scope.missing) errors.push(scope.missing);
  if (scope.parseError) errors.push(scope.parseError);
  const gtmReadme = ['01-docs/08-gtm/README.md', '01-docs/08-gtm/README.md'].find((p) =>
    existsSync(join(repoRoot(), p)),
  );
  if (!gtmReadme) errors.push('01-docs/08-gtm/README.md');
  return errors;
}

export function checkSecurity() {
  const errors = [];
  for (const rel of ['02-ops/security/manifest.json', '02-ops/security/posture.json']) {
    const { missing, parseError } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
  }
  if (!existsSync(join(repoRoot(), '01-docs/09-security/README.md'))) {
    errors.push('01-docs/09-security/README.md');
  }
  return errors;
}

export function checkAssurancePrograms() {
  const errors = [];
  for (const rel of ['02-ops/assurance/manifest.json', '02-ops/assurance/programs.json']) {
    const { missing, parseError, data } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
    if (rel.endsWith('programs.json') && data && !Array.isArray(data.programs)) {
      errors.push('02-ops/assurance/programs.json: programs must be array');
    }
  }
  if (!existsSync(join(repoRoot(), '01-docs/07-assurance/programs/README.md'))) {
    errors.push('01-docs/07-assurance/programs/README.md');
  }
  return errors;
}

export function checkAudit() {
  const errors = [];
  for (const rel of [
    '02-ops/attestation/witness/manifest.json',
    '02-ops/attestation/witness/evidence-index.json',
  ]) {
    const { missing, parseError, data } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
    if (rel.endsWith('evidence-index.json') && data && !Array.isArray(data.artifacts)) {
      errors.push('02-ops/attestation/witness/evidence-index.json: artifacts must be array');
    }
  }
  for (const rel of [
    '02-ops/attestation/witness/README.md',
    '01-docs/05-audit/README.md',
    '01-docs/05-audit/master/README.md',
    '01-docs/05-audit/engineering/README.md',
    '01-docs/05-audit/ux/README.md',
    '01-docs/05-audit/bank-grade/README.md',
    '01-docs/05-audit/evidence/README.md',
  ]) {
    if (!existsSync(join(repoRoot(), rel))) errors.push(rel);
  }
  return errors;
}

export function checkOperations() {
  const errors = [];
  for (const rel of ['02-ops/manifest.json', '02-ops/verify.json']) {
    const { missing, parseError, data } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
    if (rel.endsWith('verify.json') && data && !Array.isArray(data.commands)) {
      errors.push('02-ops/verify.json: commands must be array');
    }
  }
  if (!existsSync(join(repoRoot(), '01-docs/04-ops/README.md'))) {
    errors.push('01-docs/04-ops/README.md');
  }
  return errors;
}

function checkWorkspaceReadmes() {
  const errors = [];
  for (const rel of [
    '02-ops/coordination/README.md',
    '02-ops/pm/README.md',
    '02-ops/gtm/README.md',
    '02-ops/compliance/README.md',
    '02-ops/attestation/README.md',
    '02-ops/security/README.md',
    '02-ops/assurance/README.md',
    '02-ops/README.md',
  ]) {
    if (!existsSync(join(repoRoot(), rel))) errors.push(rel);
  }
  return errors;
}

function checkAgentsFolder() {
  const errors = [];
  for (const rel of [
    '01-docs/01-agents/README.md',
    '01-docs/01-agents/universal/README.md',
    '01-docs/01-agents/cursor/README.md',
  ]) {
    if (!existsSync(join(repoRoot(), rel))) errors.push(rel);
  }
  return errors;
}

function checkLegalLens() {
  const errors = [];
  if (!existsSync(join(repoRoot(), '01-docs/11-legal/gates.json')))
    errors.push('01-docs/11-legal/gates.json');
  return errors;
}

export function runAll() {
  const schema = schemaVersion();
  const isV3 = schema === 'gtcx.workspace.manifest.v3';
  const isV2Plus = isV3 || schema === 'gtcx.workspace.manifest.v2';

  const results = {
    root: checkRootManifest(),
    coordination: checkCoordination(),
    compliance: checkCompliance(),
    gtm: checkGtm(),
  };

  if (isV3) {
    results.attestation = checkAttestation();
    results['product-management'] = checkProductManagement();
    results.security = checkSecurity();
    results['assurance-programs'] = checkAssurancePrograms();
    results.audit = checkAudit();
    results.operations = checkOperations();
    results.readmes = checkWorkspaceReadmes();
    results.agents = checkAgentsFolder();
    results.legal = checkLegalLens();
  } else if (isV2Plus) {
    results.attestation = checkAttestation();
    results['product-management'] = checkProductManagement();
  } else {
    results.assurance = checkAssurance();
  }

  return results;
}

export function hasErrors(results) {
  return Object.values(results).some((arr) => arr.length > 0);
}
