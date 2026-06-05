/**
 * Launch focus — ecosystem-shared (config-driven per repo).
 * Normative hub doc: gtcx-core docs/operations/agent-launch-focus.md
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const LAUNCH_SCHEMA = 'gtcx.launchFocus.v1';
export const CONFIG_PATH = '.baseline/launch-focus.config.json';
export const STATE_PATH = '.baseline/launch-focus.json';

function readUtf8(repoRoot, rel) {
  if (!rel) return '';
  const p = join(repoRoot, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : '';
}

export function loadLaunchFocusConfig(repoRoot) {
  const p = join(repoRoot, CONFIG_PATH);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8'));
}

function parseGtmTiers(latestJson) {
  try {
    const j = JSON.parse(latestJson);
    const gtm = j?.lanes?.gtmReadiness?.gtmReadinessTier ?? {};
    return {
      library: gtm.library ?? 'GR-T1',
      integratorPilot: gtm.integratorPilot ?? 'GR-T2-partial',
      ecosystemSovereign: gtm.ecosystemSovereign ?? 'below-GR-T2',
      index: j?.lanes?.gtmReadiness?.index,
    };
  } catch {
    return { library: 'GR-T1', integratorPilot: 'GR-T2-partial', ecosystemSovereign: 'below-GR-T2' };
  }
}

function normalizeStatus(raw) {
  const s = String(raw).toLowerCase();
  if (s.includes('done') || s.includes('complete') || s.includes('✅')) return 'done';
  if (s.includes('outbound')) return 'outbound-filed';
  if (s.includes('blocked')) return 'blocked';
  if (s.includes('in progress') || s.includes('in_progress')) return 'in_progress';
  if (s.includes('pending') || s.includes('open')) return 'pending';
  if (s.includes('awaiting-human')) return 'human';
  return s;
}

/** Parse markdown table rows: | ID | title | ... | status | */
function parseTableStories(md, idPattern, allowedStatuses) {
  const items = [];
  const re = new RegExp(
    `\\|\\s*(${idPattern.source})\\s*\\|([^|\\n]+)\\|([^|\\n]*)\\|([^|\\n]*)\\|([^|\\n]*)\\|`,
    'gim',
  );
  let m;
  while ((m = re.exec(md)) !== null) {
    const storyId = m[1].trim();
    const title = m[2].trim();
    const statusCol = m[5] ?? m[4] ?? m[3];
    const status = normalizeStatus(statusCol);
    if (status === 'done') continue;
    if (allowedStatuses.length && !allowedStatuses.includes(status)) continue;
    items.push({
      storyId,
      title,
      workClass: 'ops-docs',
      authorityClass: status === 'human' ? 'S' : 'S',
      lane: 'roadmap-parse',
      because: `Roadmap/register status: ${status}`,
    });
  }
  return items;
}

function parseOpenIdRows(md, allowedIds) {
  const items = [];
  const re = /\|\s*([A-Z][A-Z0-9-]+)\s*\|[^|\n]*\|[^|\n]*\|\s*(\*\*)?(partial|pending|open|in_progress)(\*\*)?/gi;
  let m;
  while ((m = re.exec(md)) !== null) {
    const id = m[1];
    if (allowedIds?.length && !allowedIds.includes(id)) continue;
    items.push({
      storyId: id,
      title: `Close ${id} on launch path`,
      workClass: 'ops-docs',
      authorityClass: 'S',
      lane: 'ecosystem-open',
      because: `Open item: ${m[3]}`,
    });
  }
  return items;
}

function dedupeById(list) {
  const seen = new Set();
  return list.filter((x) => {
    if (seen.has(x.storyId)) return false;
    seen.add(x.storyId);
    return true;
  });
}

function fileExists(repoRoot, rel) {
  return rel && existsSync(join(repoRoot, rel));
}

export function buildLaunchFocusFromConfig(repoRoot, config, nextWork = {}) {
  const executionMd = readUtf8(repoRoot, config.paths?.executionRoadmap);
  const openMd = readUtf8(repoRoot, config.paths?.openItems);
  const latestJson = readUtf8(repoRoot, config.paths?.latestJson);

  const idRe = new RegExp(config.storyIdPattern ?? '[A-Z0-9.-]+');
  const allowedStatuses = config.implementStatuses ?? ['pending', 'in_progress'];

  let implement = dedupeById([
    ...(config.staticImplement ?? []).filter((item) => {
      if (item.requiresFile && !fileExists(repoRoot, item.requiresFile)) return false;
      if (item.skipIfFile && fileExists(repoRoot, item.skipIfFile)) return false;
      return true;
    }),
    ...parseTableStories(executionMd, idRe, allowedStatuses),
    ...parseTableStories(openMd, idRe, allowedStatuses),
    ...(config.parseOpenIds?.length
      ? parseOpenIdRows(executionMd + openMd, config.parseOpenIds)
      : []),
  ]);

  const human = dedupeById([
    ...(config.staticHuman ?? []),
    ...(nextWork.humanOnly ?? []).map((h) => ({
      storyId: h.storyId,
      title: h.title,
      authorityClass: h.authorityClass ?? 'S',
      owner: h.owner ?? 'Human',
      lane: 'p22',
    })),
  ]);

  const plan = [...(config.planningQueue ?? [])];
  const witness = [...(config.staticWitness ?? [])];

  let sessionMode = 'implement';
  if (implement.length === 0) sessionMode = 'plan';
  if (implement.length === 0 && plan.length === 0 && human.length > 0) sessionMode = 'witness';

  if (implement.length > 0 && nextWork.backlogClear) {
    // Launch path still has Class R — override false ceiling
  }

  const gtmTier = parseGtmTiers(latestJson);

  const launchFocus = {
    schema: LAUNCH_SCHEMA,
    normativeDoc: config.normativeDoc ?? 'docs/operations/agent-launch-focus.md',
    hubDoc: 'https://github.com/gtcx-ecosystem/gtcx-core/blob/main/docs/operations/agent-launch-focus.md',
    statePath: STATE_PATH,
    provisionedAt: new Date().toISOString(),
    repo: config.repo,
    northStar: {
      ...config.northStar,
      gtmTier,
    },
    sessionMode,
    activePhase: config.activePhase ?? { id: 'launch-gtm', label: 'App launch → GTM' },
    workSet: { implement, plan, witness, human },
    activeWorkSet: sessionMode === 'plan' ? plan : implement,
    workSetCounts: {
      implement: implement.length,
      plan: plan.length,
      witness: witness.length,
      human: human.length,
    },
    sources: Object.values(config.paths ?? {}).filter(Boolean),
    forbidden: config.forbidden ?? [
      'Ask operator to run forensic audit before starting work',
      'Ask operator to run execute-roadmap to discover priorities',
    ],
    agentInstructions: buildInstructions(config, sessionMode, implement.length, plan.length),
  };

  return launchFocus;
}

function buildInstructions(config, sessionMode, implementCount, planCount) {
  const lines = [
    `Launch focus (${config.repo}) — read .baseline/launch-focus.json before audits.`,
    config.northStar?.outcome ?? '',
  ];
  if (sessionMode === 'implement') {
    lines.push(`IMPLEMENT mode — drain ${implementCount} item(s) toward app launch / GTM.`);
  } else if (sessionMode === 'plan') {
    lines.push(
      `PLAN mode — ${planCount} Class R planning tasks; reconcile roadmaps and coordination; do not idle.`,
    );
  } else {
    lines.push('WITNESS mode — human gates only.');
  }
  return lines.filter(Boolean);
}

export function attachLaunchFocus(nextWork, repoRoot) {
  const config = loadLaunchFocusConfig(repoRoot);
  if (!config) return nextWork;

  const launchFocus = buildLaunchFocusFromConfig(repoRoot, config, nextWork);

  const p22Head = nextWork?.next;
  if (p22Head?.storyId && !p22Head.blocked && p22Head.implementationClass !== 'external') {
    launchFocus.workSet.implement = dedupeById([
      {
        storyId: p22Head.storyId,
        title: p22Head.title ?? p22Head.storyId,
        workClass: p22Head.implementationClass ?? 'code',
        authorityClass: 'S',
        lane: 'p22-head',
      },
      ...launchFocus.workSet.implement,
    ]);
    launchFocus.workSetCounts.implement = launchFocus.workSet.implement.length;
    launchFocus.sessionMode = 'implement';
    launchFocus.activeWorkSet = launchFocus.workSet.implement;
  }

  if (launchFocus.workSetCounts.implement > 0) {
    nextWork.backlogClear = false;
    nextWork.automatableExhausted = false;
    nextWork.message = `Launch implement queue: ${launchFocus.workSetCounts.implement} Class R items (${config.repo}).`;
    const head = launchFocus.workSet.implement[0];
    const p22Blocked =
      nextWork.next?.blocked === true ||
      nextWork.next?.implementationClass === 'external' ||
      nextWork.next?.status === 'awaiting-human';
    if (head && p22Blocked) {
      nextWork.certificationCeiling = nextWork.certificationCeiling ?? {
        storyId: nextWork.next?.storyId ?? 'INT-S12-01',
        title: nextWork.next?.title ?? 'External certification gates',
        authorityClass: 'S',
        owner: nextWork.next?.owner ?? 'Human / Security',
        bankGradeLane: 'lanes.bankGrade',
        note: 'Certified composite 9.5 — ceiling is attestation, not engineering',
      };
      nextWork.next = {
        storyId: head.storyId,
        title: head.title,
        track: 'launch',
        milestone: head.storyId,
        workClass: head.workClass ?? 'code',
        blocked: false,
        owner: config.repo,
        implementationClass: head.workClass ?? 'code',
      };
      nextWork.nextPriority = {
        owner: config.repo,
        action: head.title,
        because: `${head.storyId} — launch implement (INT-S12-* is parallel Class S only)`,
        outbound: head.paths?.[0] ?? config.normativeDoc,
      };
      if (nextWork.statusUpdate) {
        nextWork.statusUpdate = {
          ...nextWork.statusUpdate,
          nextPriority: `**${config.repo}** — ${head.storyId} (${head.title})`,
          approvalNeeded:
            nextWork.statusUpdate.approvalNeeded ??
            '**INT-S12-01** pen-test SOW; **SOC 2** Type 1 + signed quarterly access review',
        };
      }
      if (nextWork.proceedBrief) {
        nextWork.proceedBrief = {
          next: `${head.storyId} — ${head.title}`,
          because: 'Launch implement queue — bank-grade lane 4 ceiling does not freeze IR',
          authorityClass: 'R',
          override: 'stop | correct: | story ID',
        };
      }
      nextWork.agentInstructions = [
        ...(nextWork.agentInstructions ?? []).filter(
          (line) => !/do NOT start new feature code/i.test(line),
        ),
        `${head.storyId} = Class R — implement in-session; INT-S12-01/02/03 = Class S witness only.`,
        'bankGrade backlogClear = external attestation ceiling — not idle.',
      ];
    }
  }

  if (launchFocus.sessionMode === 'plan') {
    const head = launchFocus.workSet.plan[0];
    nextWork.next = {
      storyId: head?.storyId ?? 'LAUNCH-PLAN-01',
      title: head?.title ?? 'Advance launch planning',
      track: 'launch',
      milestone: head?.storyId,
      workClass: 'ops-docs',
      blocked: false,
    };
    nextWork.backlogClear = false;
    nextWork.message =
      'Implement queue empty — PLAN mode: advance launch/GTM state without forensic audit.';
    nextWork.agentInstructions = [
      ...(launchFocus.agentInstructions ?? []),
      'Drain workSet.plan in-session — same bout loop as implement.',
    ];
  }

  return { ...nextWork, launchFocus };
}

export function writeLaunchFocusState(repoRoot, launchFocus) {
  const path = join(repoRoot, STATE_PATH);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(launchFocus, null, 2)}\n`);
}
