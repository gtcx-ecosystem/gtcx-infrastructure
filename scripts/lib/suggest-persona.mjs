/**
 * Persona selection for agent:next-work (vendored — no gtcx-agentic checkout required).
 * SoR: gtcx-protocols ecosystem-persona-bridge; synced from gtcx-intelligence pattern.
 * @see gtcx-protocols/docs/operations/coordination/ecosystem-persona-bridge-2026-06.md
 */

export const PERSONA_DOCS =
  'https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/docs/governance/institutional/personas';

export const PERSONA_BRIDGE_URL =
  'https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/docs/operations/coordination/ecosystem-persona-bridge-2026-06.md';

const RULES = [
  {
    re: /\b(signal|agentic maturity|trace_id|sprint zero)\b/i,
    institutional: 'platform-architect',
    mcp: 'agile',
    frame: 'development',
  },
  {
    re: /\b(pen-?test|h-05|ext-inf|trust attest|inf-86|ceremony|xr-401|xr-402|vault|eap-|security audit|threat model|crypto|zkp|fips)\b/i,
    institutional: 'security-engineer',
    mcp: 'security',
    frame: 'regulatory-audit',
  },
  {
    re: /\b(soc\s*2|compliance|evidence pack|wire-?2|procurement|audit trail|regulator|hub-?17|w2)\b/i,
    institutional: 'compliance-officer',
    mcp: 'reviewer',
    frame: 'regulatory-audit',
  },
  {
    re: /\b(runbook|operator live path|runtime-evidence|bootstrap|eso|externalsecret)\b/i,
    institutional: 'platform-architect',
    mcp: 'builder',
    frame: 'development',
  },
  {
    re: /\b(hub handoff|coordination|cross-repo|p22|sprint|roadmap|agent:next-work|bridge|log row)\b/i,
    institutional: 'platform-architect',
    mcp: 'agile',
    frame: 'development',
  },
  {
    re: /\b(terraform|k8s|kubernetes|waf|deploy|ecr|gateway|rds|npm publish|slsa|infra|secretstore|irsa)\b/i,
    institutional: 'platform-architect',
    mcp: 'builder',
    frame: 'development',
  },
  {
    re: /\b(protocol|sdk|csp|did |wire mock|@gtcx\/|witness|workproof)\b/i,
    institutional: 'protocol-engineer',
    mcp: 'builder',
    frame: 'development',
  },
];

export const DEFAULT_BY_REPO = {
  'gtcx-infrastructure': {
    institutional: 'platform-architect',
    mcp: 'builder',
    frame: 'development',
  },
};

/**
 * @param {{ storyId?: string, title?: string, repo?: string }} input
 */
export function suggestPersona(input = {}) {
  const text = `${input.storyId ?? ''} ${input.title ?? ''}`;
  for (const rule of RULES) {
    if (rule.re.test(text)) {
      return pack(rule.institutional, rule.mcp, rule.frame);
    }
  }
  const repo = input.repo ?? 'gtcx-infrastructure';
  const d = DEFAULT_BY_REPO[repo] ?? {
    institutional: 'platform-architect',
    mcp: 'builder',
    frame: 'development',
  };
  return pack(d.institutional, d.mcp, d.frame);
}

function pack(institutional, mcp, frame) {
  return {
    institutional,
    mcp,
    frame,
    docUrl: `${PERSONA_DOCS}/${institutional}.md`,
    bridgeUrl: PERSONA_BRIDGE_URL,
    instruction: 'Read persona doc before work; re-select persona on task switch (Phase 4).',
  };
}

/**
 * @param {object} payload
 * @param {{ repo: string, storyId?: string, title?: string }} ctx
 */
export function enrichWithPersona(payload, ctx) {
  const storyId =
    ctx.storyId ??
    payload.next?.storyId ??
    payload.next?.milestone ??
    payload.next?.handoff ??
    '';
  const title = ctx.title ?? payload.next?.title ?? '';
  const persona = suggestPersona({ repo: ctx.repo, storyId, title });
  const phase4 = `Phase 4: adopt persona **${persona.institutional}** (${persona.frame}) — read ${persona.docUrl}`;
  const instructions = Array.isArray(payload.agentInstructions) ? [...payload.agentInstructions] : [];
  if (!instructions.some((l) => l.includes('Phase 4:'))) {
    instructions.unshift(
      phase4,
      'Include **Active persona** + **Frame** in Proceed Brief and Status Update (P26).',
    );
  }
  return {
    protocol: payload.protocol ?? '22-agent-work-selection',
    repo: ctx.repo,
    frame: persona.frame ?? payload.frame,
    persona,
    ...payload,
    proceedBrief: {
      activePersona: persona.institutional,
      frame: persona.frame,
      personaDocUrl: persona.docUrl,
      ...(payload.proceedBrief ?? {}),
    },
    agentInstructions: instructions,
  };
}
