#!/usr/bin/env node
/**
 * @fileoverview Dependency audit with CVE acceptance log filtering.
 *
 * Runs `pnpm audit --json`, removes CVEs documented in the acceptance log,
 * and exits non-zero if unaccepted CRITICAL or HIGH findings remain.
 *
 * Usage: node 03-platform/tools/03-platform/scripts/audit-with-acceptance.mjs [--output-file=path]
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ACCEPTANCE_LOG = resolve("01-docs/09-security/cve-acceptance-log.md");

function parseArgs() {
  const args = process.argv.slice(2);
  let outputFile = null;
  for (const arg of args) {
    if (arg.startsWith("--output-file=")) {
      outputFile = arg.split("=")[1];
    }
  }
  return { outputFile };
}

function loadAcceptedCves() {
  try {
    const text = readFileSync(ACCEPTANCE_LOG, "utf-8");
    const cves = [];
    const regex = /\|\s*CVE-(\d{4}-\d+)\s*\|/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      cves.push(`CVE-${match[1]}`);
    }
    return new Set(cves);
  } catch {
    console.warn(
      JSON.stringify({
        level: "warn",
        type: "audit.acceptance_log.missing",
        message: `Acceptance log not found at ${ACCEPTANCE_LOG}; no CVEs will be filtered.`,
      })
    );
    return new Set();
  }
}

function runAudit() {
  let stdout;
  try {
    stdout = execSync("pnpm audit --json", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (err) {
    // pnpm audit exits 1 when vulnerabilities are found; stdout still contains JSON
    stdout = err.stdout ?? "{}";
  }

  try {
    return JSON.parse(stdout);
  } catch {
    // pnpm audit --json may output NDJSON (one object per line)
    const lines = stdout.trim().split(/\r?\n/);
    const advisories = {};
    const actions = [];
    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        if (obj.advisories) Object.assign(advisories, obj.advisories);
        if (obj.actions) actions.push(...obj.actions);
      } catch {
        /* ignore malformed lines */
      }
    }
    return { advisories, actions };
  }
}

function filterAccepted(audit, accepted) {
  const filteredAdvisories = {};
  let filteredCount = 0;
  for (const [id, advisory] of Object.entries(audit.advisories ?? {})) {
    const cves = advisory.cves ?? [];
    const isAccepted = cves.some((c) => accepted.has(c));
    if (isAccepted) {
      filteredCount++;
      continue;
    }
    filteredAdvisories[id] = advisory;
  }

  // Also filter actions that only resolve accepted advisories
  const filteredActions = (audit.actions ?? []).filter((action) => {
    const resolves = action.resolves ?? [];
    return resolves.some((r) => {
      const adv = audit.advisories?.[String(r.id)];
      const cves = adv?.cves ?? [];
      return !cves.some((c) => accepted.has(c));
    });
  });

  return {
    ...audit,
    advisories: filteredAdvisories,
    actions: filteredActions,
    _acceptedFiltered: filteredCount,
  };
}

function severityRank(sev) {
  const map = { critical: 4, high: 3, moderate: 2, low: 1, info: 0 };
  return map[sev?.toLowerCase()] ?? 0;
}

function summarize(audit) {
  const counts = { critical: 0, high: 0, moderate: 0, low: 0 };
  for (const advisory of Object.values(audit.advisories ?? {})) {
    const sev = advisory.severity?.toLowerCase();
    if (counts[sev] !== undefined) counts[sev]++;
  }
  return counts;
}

function main() {
  const { outputFile } = parseArgs();
  const accepted = loadAcceptedCves();

  console.log(
    JSON.stringify({
      level: "info",
      type: "audit.start",
      acceptedCves: Array.from(accepted),
    })
  );

  const raw = runAudit();
  const filtered = filterAccepted(raw, accepted);
  const counts = summarize(filtered);

  const report = {
    meta: {
      generatedAt: new Date().toISOString(),
      acceptedCves: Array.from(accepted),
      acceptedFiltered: filtered._acceptedFiltered ?? 0,
    },
    summary: counts,
    advisories: filtered.advisories,
    actions: filtered.actions,
  };

  if (outputFile) {
    writeFileSync(outputFile, JSON.stringify(report, null, 2));
  }

  console.log(
    JSON.stringify({
      level: "info",
      type: "audit.summary",
      ...counts,
      acceptedFiltered: report.meta.acceptedFiltered,
    })
  );

  if (counts.critical > 0 || counts.high > 0) {
    console.error(
      JSON.stringify({
        level: "error",
        type: "audit.gate.failed",
        message: `Unaccepted dependency audit failed: ${counts.critical} critical, ${counts.high} high severity findings`,
        ...counts,
      })
    );
    process.exit(1);
  }

  console.log(
    JSON.stringify({
      level: "info",
      type: "audit.gate.passed",
      message: "Dependency audit passed (accepted CVEs filtered).",
      ...counts,
    })
  );
  process.exit(0);
}

main();
