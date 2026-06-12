#!/usr/bin/env node
/**
 * Protocol 22 — deterministic next-work selection for fabric-os.
 * Sources: pm/manifest.json local paths — work register, DAAS/SECAS roadmaps,
 * .baseline/memory/session.md (session pointer).
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { enrichWithPersona } from './lib/suggest-persona.mjs';
import { attachLaunchFocus, writeLaunchFocusState } from './lib/attach-launch-focus.mjs';
import { resolveTraceId } from './lib/trace-context.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '../..');
const THIS_REPO = 'fabric-os';

function resolvePaths() {
  const paths = {
    manifest: join(REPO_ROOT, 'docs/operations/agent-work-selection.md'),
    roadmap: join(REPO_ROOT, 'audit/product-management/execution-roadmap.md'),
    secasRoadmap: join(REPO_ROOT, 'audit/product-management/secas-execution-roadmap.md'),
    session: join(REPO_ROOT, '.baseline/memory/session.md'),
  };
  const manifestJson = join(REPO_ROOT, 'pm/manifest.json');
  if (!existsSync(manifestJson)) return paths;
  try {
    const pm = JSON.parse(readFileSync(manifestJson, 'utf8'));
    if (pm.local?.workSelection) paths.manifest = join(REPO_ROOT, pm.local.workSelection);
    if (pm.local?.executionRoadmap) paths.roadmap = join(REPO_ROOT, pm.local.executionRoadmap);
    if (pm.generate?.secas?.output) paths.secasRoadmap = join(REPO_ROOT, pm.generate.secas.output);
  } catch {
    // keep defaults
  }
  return paths;
}

const STORY_ID_RE = /^(S\d+-\d+|SECAS-S\d+-\d+|IR-\d+\.\d+|P22-[A-Z]+-\d+)$/;

const EVIDENCE_RE =
  /\b(manual UAT|staging probe with live creds|operator step|live RDS restore)\b/i;
const OPS_DOCS_RE = /\b(Author `docs\/|manifest|Protocol \d+|roadmap reconcile|runbook|operator live path)\b/i;
const EXTERNAL_RE =
  /\b(human selection|human SOW|CISO decision|Supabase unpause|DNS zone:write|protocols contract|pen-test vendor|npm publish|EXT-INF|legal review|insurance quote|indemnified|DPA|pilot agreement|human signature)\b/i;

function parsePriority(p) {
  const n = Number.parseInt(String(p).replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : 9;
}

function normalizeStatus(raw) {
  const s = String(raw).toLowerCase();
  if (s.includes('done') || s.includes('closed') || s.includes('✅')) return 'done';
  if (s.includes('blocked')) return 'blocked';
  if (s.includes('deferred')) return 'deferred';
  if (s.includes('in progress') || s.includes('in_progress')) return 'in_progress';
  if (s.includes('structural done')) return 'done';
  if (s.includes('intake ready')) return 'blocked';
  if (s.includes('open')) return 'pending';
  return 'pending';
}

function classifyStory(title, statusCol, classCol) {
  if (classCol) {
    const c = classCol.trim().toLowerCase();
    if (['code', 'ops-docs', 'evidence-capture', 'external'].includes(c)) return c;
  }
  const blob = `${title} ${statusCol}`;
  if (EXTERNAL_RE.test(blob) || normalizeStatus(statusCol) === 'blocked') return 'external';
  if (EVIDENCE_RE.test(title)) return 'evidence-capture';
  if (OPS_DOCS_RE.test(title)) return 'ops-docs';
  return 'code';
}

function storyOrdinal(id) {
  const ir = /^IR-(\d+)\.(\d+)/.exec(id);
  if (ir) return Number.parseInt(ir[1], 10) * 100 + Number.parseInt(ir[2], 10);
  const secas = /^SECAS-S(\d+)-(\d+)/.exec(id);
  if (secas) return 900 + Number.parseInt(secas[1], 10) * 100 + Number.parseInt(secas[2], 10);
  const s = /^S(\d+)-(\d+)/.exec(id);
  if (s) return Number.parseInt(s[1], 10) * 100 + Number.parseInt(s[2], 10);
  const p22 = /^P22-[A-Z]+-(\d+)/.exec(id);
  if (p22) return Number.parseInt(p22[1], 10);
  return 999;
}

function parseWorkRegister(md) {
  const stories = new Map();
  const rowRe =
    /^\|\s*(S\d+-\d+|SECAS-S\d+-\d+|IR-\d+\.\d+|P22-[A-Z]+-\d+)\s*\|\s*([^|]+?)\s*\|\s*(P\d)\s*\|\s*(pending|in_progress|blocked|done|deferred)\s*\|\s*([^|]+?)\s*\|/gm;
  let match;
  while ((match = rowRe.exec(md)) !== null) {
    const [, id, title, priority, status, classCol] = match;
    const key = id.trim();
    stories.set(key, {
      id: key,
      title: title.trim(),
      priority: priority.trim(),
      status: status.trim(),
      implementationClass: classifyStory(title.trim(), status, classCol),
      source: 'work-register',
    });
  }
  return stories;
}

function deriveStatusFromRowTail(rowTail) {
  if (/\*\*(done|closed)\*\*/i.test(rowTail) || /\b(done|closed)\b/i.test(rowTail)) {
    return 'done';
  }
  if (/\*\*blocked\*\*/i.test(rowTail) || /\bblocked\b/i.test(rowTail)) return 'blocked';
  if (/\*\*in[_ ]progress\*\*/i.test(rowTail) || /\bin[_ ]progress\b/i.test(rowTail)) {
    return 'in_progress';
  }
  if (/\*\*scaffolded\*\*/i.test(rowTail)) return 'blocked';
  if (/\*\*structural done\*\*/i.test(rowTail)) return 'done';
  if (/\*\*intake ready\*\*/i.test(rowTail)) return 'blocked';
  if (/\*\*pending\*\*/i.test(rowTail) || /\bpending\b/i.test(rowTail)) return 'pending';
  return 'pending';
}

function roadmapPriority(id) {
  if (id.startsWith('SECAS-') || id.startsWith('S1-') || id.startsWith('S4-')) return 'P0';
  return 'P1';
}

function parseRoadmapStories(md, source = 'execution-roadmap') {
  const stories = new Map();
  const rowRe = /^\| \*{0,2}((?:SECAS-|DAAS-)?S\d+(?:-\d+)?)\*{0,2} \|(.+)$/gm;
  let match;
  while ((match = rowRe.exec(md)) !== null) {
    const [, id, rowTail] = match;
    const key = id.trim();
    const title = rowTail.split('|')[0]?.trim() ?? key;
    const status = deriveStatusFromRowTail(rowTail);
    stories.set(key, {
      id: key,
      title,
      priority: roadmapPriority(key),
      status,
      implementationClass: classifyStory(title, rowTail, ''),
      source,
    });
  }
  return stories;
}

function parseSessionInProgress(md) {
  const inProgress = [];
  const m = md.match(/\|\s*in_progress\s*\|\s*([^|]*)\|/i);
  if (m?.[1]) {
    const raw = m[1].trim();
    if (raw && raw !== '—' && raw !== '-') {
      for (const id of raw.split(/[,;\s]+/).filter(Boolean)) {
        if (STORY_ID_RE.test(id)) inProgress.push(id);
      }
    }
  }
  return inProgress;
}

function isAutomatable(story, frame) {
  if (['blocked', 'done', 'deferred'].includes(story.status)) return false;
  if (frame === 'development') {
    if (story.implementationClass === 'external' || story.implementationClass === 'evidence-capture') {
      return false;
    }
    return story.implementationClass === 'code' || story.implementationClass === 'ops-docs';
  }
  return true;
}

function compareStories(a, b) {
  const pa = parsePriority(a.priority);
  const pb = parsePriority(b.priority);
  if (pa !== pb) return pa - pb;
  return storyOrdinal(a.id) - storyOrdinal(b.id);
}

function selectNext(allStories, options) {
  const { frame } = options;

  const inProgress = [...allStories.values()]
    .filter((s) => s.status === 'in_progress' && isAutomatable(s, frame))
    .sort(compareStories);
  if (inProgress.length > 0) {
    return {
      story: inProgress[0],
      tier: 'resume-in_progress',
      reason: 'Story already in_progress in backlog',
    };
  }

  const registerPending = [...allStories.values()]
    .filter(
      (s) =>
        s.source === 'work-register' &&
        s.status === 'pending' &&
        isAutomatable(s, frame) &&
        !s.id.startsWith('LAUNCH-PLAN'),
    )
    .sort(compareStories);
  if (registerPending.length > 0) {
    return {
      story: registerPending[0],
      tier: 'work-register',
      reason: 'Next pending work-register item',
    };
  }

  const p22Pending = [...allStories.values()]
    .filter(
      (s) =>
        (s.id.startsWith('P22-') || s.id.startsWith('IR-')) &&
        s.status === 'pending' &&
        isAutomatable(s, frame),
    )
    .sort(compareStories);
  if (p22Pending.length > 0) {
    return {
      story: p22Pending[0],
      tier: 'work-register-ir',
      reason: 'Next pending IR/P22 work-register item',
    };
  }

  const remainder = [...allStories.values()]
    .filter(
      (s) =>
        s.status === 'pending' &&
        isAutomatable(s, frame) &&
        !s.id.startsWith('LAUNCH-PLAN'),
    )
    .sort(compareStories);
  if (remainder.length > 0) {
    return {
      story: remainder[0],
      tier: 'backlog',
      reason: 'Remaining automatable backlog',
    };
  }

  return null;
}

function attachTrace(payload) {
  const traceId = resolveTraceId(process.env.GTCX_TRACE_ID);
  return {
    traceId,
    coordinationHint: `Append cross-repo-agent-log row with trace_id=${traceId}`,
    ...payload,
  };
}

function main() {
  const frame = process.env.AGENT_FRAME === 'regulatory-audit' ? 'regulatory-audit' : 'development';
  const PATHS = resolvePaths();
  const allStories = new Map();

  if (existsSync(PATHS.manifest)) {
    for (const [k, v] of parseWorkRegister(readFileSync(PATHS.manifest, 'utf8'))) {
      allStories.set(k, v);
    }
  }

  if (existsSync(PATHS.roadmap)) {
    for (const [k, v] of parseRoadmapStories(readFileSync(PATHS.roadmap, 'utf8'))) {
      if (!allStories.has(k)) allStories.set(k, v);
    }
  }

  if (existsSync(PATHS.secasRoadmap)) {
    for (const [k, v] of parseRoadmapStories(
      readFileSync(PATHS.secasRoadmap, 'utf8'),
      'secas-roadmap',
    )) {
      if (!allStories.has(k)) allStories.set(k, v);
    }
  }

  const selection = selectNext(allStories, { frame });

  if (!selection) {
    const base = {
      ok: true,
      backlogClear: true,
      frame,
      protocol: '22-agent-work-selection',
      repo: THIS_REPO,
      message: 'No automatable pending or in_progress stories for current frame.',
    };
    const withLaunch = attachLaunchFocus(base, REPO_ROOT);
    if (withLaunch.launchFocus) writeLaunchFocusState(REPO_ROOT, withLaunch.launchFocus);
    console.log(
      JSON.stringify(
        enrichWithPersona(attachTrace(withLaunch), {
          repo: THIS_REPO,
          title: 'coordination witness',
        }),
        null,
        2,
      ),
    );
    process.exit(0);
  }

  const { story, tier, reason } = selection;
  const payload = {
    ok: true,
    backlogClear: false,
    protocol: '22-agent-work-selection',
    repo: 'fabric-os',
    frame,
    next: {
      storyId: story.id,
      title: story.title,
      priority: story.priority,
      status: story.status,
      implementationClass: story.implementationClass,
      source: story.source ?? 'unknown',
    },
    selection: {
      tier,
      reason,
    },
    proceedBrief: {
      next: `${story.id} — ${story.title}`,
      because: reason,
      blockedUntil: story.implementationClass === 'external' ? 'external gate' : 'none',
      override: 'stop | correct: | story ID',
    },
    communicationPolicy: {
      protocol: '26-agent-proceed-confirmation',
      version: '1.2.0',
      statusUpdateSections: ['Done', 'Next priority', 'Approval needed'],
      forbiddenReplyPatterns: [
        'Your call',
        'Two options',
        'Which do you prefer',
        'natural transition point',
        'Switch to compliance-os',
        'Either ',
        'Want me to tackle',
        'Want me to',
        'anything on the P1 list',
        'I can push',
        'I can help',
      ],
    },
    agentInstructions: [
      `Mark ${story.id} in_progress in docs/operations/agent-work-selection.md before coding.`,
      'Update audit/product-management execution roadmaps and work register when complete.',
      'Refresh audit/product-management/auto-dev-state.md after completion.',
      'After push/status reports: Status Update (Done → Next priority from this JSON → Approval needed if any), then implement.',
      'FORBIDDEN: "Your call", "Two options", "Want me to tackle…", "anything on the P1 list?", repo pick menus.',
      'Do not ask the user which story or repo to pick — P22 already selected.',
    ],
  };

  const withLaunch = attachLaunchFocus(payload, REPO_ROOT);
  if (withLaunch.launchFocus) writeLaunchFocusState(REPO_ROOT, withLaunch.launchFocus);
  console.log(
    JSON.stringify(
      enrichWithPersona(attachTrace(withLaunch), {
        repo: THIS_REPO,
        storyId: withLaunch.next?.storyId ?? story.id,
        title: withLaunch.next?.title ?? story.title,
      }),
      null,
      2,
    ),
  );
}

main();
