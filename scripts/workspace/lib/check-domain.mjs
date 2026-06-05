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
  const { data } = readJson('workspace/manifest.json');
  return data?.schema ?? 'gtcx.workspace.manifest.v1';
}

const VALID_SCHEMAS = new Set([
  'gtcx.workspace.manifest.v1',
  'gtcx.workspace.manifest.v2',
  'gtcx.workspace.manifest.v3',
]);

export function checkRootManifest() {
  const errors = [];
  const { missing, parseError, data } = readJson('workspace/manifest.json');
  if (missing) errors.push(missing);
  if (parseError) errors.push(parseError);
  if (data && !VALID_SCHEMAS.has(data.schema)) {
    errors.push('workspace/manifest.json schema must be v1, v2, or v3');
  }
  return errors;
}

export function checkCoordination() {
  const errors = [];
  for (const rel of [
    'workspace/coordination/manifest.json',
    'workspace/coordination/remaining-work.json',
  ]) {
    const { missing, parseError } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
  }
  for (const dir of ['workspace/coordination/outbound', 'workspace/coordination/inbound']) {
    if (!existsSync(join(repoRoot(), dir))) errors.push(dir);
  }
  return errors;
}

export function checkAttestation() {
  const errors = [];
  for (const rel of [
    'workspace/attestation/manifest.json',
    'workspace/attestation/gates.local.json',
    'workspace/attestation/evidence-index.json',
    'workspace/attestation/runners.json',
  ]) {
    const { missing, parseError, data } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
    if (rel.endsWith('gates.local.json') && data && !Array.isArray(data.gates)) {
      errors.push('workspace/attestation/gates.local.json: gates must be array');
    }
    if (rel.endsWith('runners.json') && data && !Array.isArray(data.runners)) {
      errors.push('workspace/attestation/runners.json: runners must be array');
    }
  }
  return errors;
}

/** @deprecated v1 — use checkAttestation for v2+ */
export function checkAssurance() {
  const errors = [];
  for (const rel of [
    'workspace/assurance/gates.local.json',
    'workspace/assurance/evidence-index.json',
  ]) {
    const { missing, parseError, data } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
    if (rel.endsWith('gates.local.json') && data && !Array.isArray(data.gates)) {
      errors.push('workspace/assurance/gates.local.json: gates must be array');
    }
  }
  return errors;
}

export function checkProductManagement() {
  const errors = [];
  for (const rel of [
    'workspace/product-management/manifest.json',
    'workspace/product-management/backlog.json',
  ]) {
    const { missing, parseError, data } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
    if (rel.endsWith('backlog.json') && data && !Array.isArray(data.stories)) {
      errors.push('workspace/product-management/backlog.json: stories must be array');
    }
  }
  const agileDocs = join(repoRoot(), 'docs/agile');
  if (!existsSync(agileDocs)) {
    errors.push('docs/agile (gtcx-agile bridge — create roadmap.md or run rollout)');
  }
  return errors;
}

export function checkCompliance() {
  const errors = [];
  for (const rel of [
    'workspace/compliance/manifest.json',
    'workspace/compliance/evidence-index.json',
    'workspace/compliance/gaps.json',
  ]) {
    const { missing, parseError } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
  }
  return errors;
}

export function checkGtm() {
  const errors = [];
  const { missing, parseError } = readJson('workspace/gtm/manifest.json');
  if (missing) errors.push(missing);
  if (parseError) errors.push(parseError);
  const scope = readJson('workspace/gtm/scope.json');
  if (scope.missing) errors.push(scope.missing);
  if (scope.parseError) errors.push(scope.parseError);
  if (!existsSync(join(repoRoot(), 'docs/gtm/README.md'))) errors.push('docs/gtm/README.md');
  return errors;
}

export function checkSecurity() {
  const errors = [];
  for (const rel of ['workspace/security/manifest.json', 'workspace/security/posture.json']) {
    const { missing, parseError } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
  }
  if (!existsSync(join(repoRoot(), 'docs/security/README.md'))) {
    errors.push('docs/security/README.md');
  }
  return errors;
}

export function checkAssurancePrograms() {
  const errors = [];
  for (const rel of [
    'workspace/assurance-programs/manifest.json',
    'workspace/assurance-programs/programs.json',
  ]) {
    const { missing, parseError, data } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
    if (rel.endsWith('programs.json') && data && !Array.isArray(data.programs)) {
      errors.push('workspace/assurance-programs/programs.json: programs must be array');
    }
  }
  if (!existsSync(join(repoRoot(), 'docs/assurance/programs/README.md'))) {
    errors.push('docs/assurance/programs/README.md');
  }
  return errors;
}

export function checkAudit() {
  const errors = [];
  for (const rel of ['workspace/audit/manifest.json', 'workspace/audit/evidence-index.json']) {
    const { missing, parseError, data } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
    if (rel.endsWith('evidence-index.json') && data && !Array.isArray(data.artifacts)) {
      errors.push('workspace/audit/evidence-index.json: artifacts must be array');
    }
  }
  for (const rel of [
    'workspace/audit/README.md',
    'docs/audit/README.md',
    'docs/audit/master/README.md',
    'docs/audit/engineering/README.md',
    'docs/audit/ux/README.md',
    'docs/audit/bank-grade/README.md',
    'docs/audit/evidence/README.md',
  ]) {
    if (!existsSync(join(repoRoot(), rel))) errors.push(rel);
  }
  return errors;
}

export function checkOperations() {
  const errors = [];
  for (const rel of ['workspace/operations/manifest.json', 'workspace/operations/verify.json']) {
    const { missing, parseError, data } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
    if (rel.endsWith('verify.json') && data && !Array.isArray(data.commands)) {
      errors.push('workspace/operations/verify.json: commands must be array');
    }
  }
  if (!existsSync(join(repoRoot(), 'docs/operations/README.md'))) {
    errors.push('docs/operations/README.md');
  }
  return errors;
}

function checkWorkspaceReadmes() {
  const errors = [];
  for (const rel of [
    'workspace/README.md',
    'workspace/coordination/README.md',
    'workspace/product-management/README.md',
    'workspace/gtm/README.md',
    'workspace/compliance/README.md',
    'workspace/attestation/README.md',
    'workspace/security/README.md',
    'workspace/assurance-programs/README.md',
    'workspace/operations/README.md',
  ]) {
    if (!existsSync(join(repoRoot(), rel))) errors.push(rel);
  }
  return errors;
}

function checkAgentsFolder() {
  const errors = [];
  for (const rel of [
    'docs/agents/README.md',
    'docs/agents/universal/README.md',
    'docs/agents/cursor/README.md',
  ]) {
    if (!existsSync(join(repoRoot(), rel))) errors.push(rel);
  }
  return errors;
}

function checkLegalLens() {
  const errors = [];
  if (!existsSync(join(repoRoot(), 'docs/legal/gates.json'))) errors.push('docs/legal/gates.json');
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
