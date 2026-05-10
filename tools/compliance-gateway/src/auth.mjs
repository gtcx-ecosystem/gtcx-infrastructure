import { timingSafeEqual } from 'node:crypto';

const DEFAULT_DEV_TOKEN = 'dev-local-readonly-token';
const DEFAULT_DEV_PERMISSIONS = ['query:read', 'tools:read', 'providers:read'];

/**
 * @typedef {{
 *   token: string,
 *   subject: string,
 *   permissions: string[],
 *   label?: string,
 * }} GatewayTokenConfig
 */

/**
 * @typedef {{
 *   configurationError: string | null,
 *   defaulted: boolean,
 *   nodeEnv: string,
 *   tokens: GatewayTokenConfig[],
 * }} GatewayAuthState
 */

/**
 * @typedef {{
 *   subject: string,
 *   permissions: Set<string>,
 *   label: string,
 * }} GatewayPrincipal
 */

/**
 * @typedef {{
 *   approvedBy: string | null,
 *   idempotencyKey: string | null,
 *   reason: string | null,
 *   ticket: string | null,
 *   valid: boolean,
 * }} ApprovalContext
 */

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {GatewayAuthState}
 */
export function loadAuthState(env = process.env) {
  const nodeEnv = env.NODE_ENV ?? 'development';
  const raw = env.COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON?.trim();

  if (!raw) {
    if (nodeEnv === 'production') {
      return {
        configurationError: 'COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON is required in production.',
        defaulted: false,
        nodeEnv,
        tokens: [],
      };
    }

    return {
      configurationError: null,
      defaulted: true,
      nodeEnv,
      tokens: [{
        token: DEFAULT_DEV_TOKEN,
        subject: 'local-dev-readonly',
        permissions: DEFAULT_DEV_PERMISSIONS,
        label: 'default-dev-readonly',
      }],
    };
  }

  try {
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : parsed?.tokens;
    if (!Array.isArray(list) || list.length === 0) {
      throw new Error('auth token list must be a non-empty array');
    }

    /** @type {GatewayTokenConfig[]} */
    const tokens = [];
    const seenSubjects = new Set();

    for (const entry of list) {
      if (!entry || typeof entry !== 'object') {
        throw new Error('each auth token entry must be an object');
      }

      const token = typeof entry.token === 'string' ? entry.token.trim() : '';
      const subject = typeof entry.subject === 'string' ? entry.subject.trim() : '';
      const permissions = Array.isArray(entry.permissions)
        ? entry.permissions.filter((permission) => typeof permission === 'string' && permission.trim().length > 0)
        : [];
      const label = typeof entry.label === 'string' && entry.label.trim().length > 0
        ? entry.label.trim()
        : subject;

      if (!token || !subject || permissions.length === 0) {
        throw new Error('each auth token entry requires token, subject, and at least one permission');
      }
      if (seenSubjects.has(subject)) {
        throw new Error(`duplicate auth subject: ${subject}`);
      }

      seenSubjects.add(subject);
      tokens.push({ token, subject, permissions, label });
    }

    return {
      configurationError: null,
      defaulted: false,
      nodeEnv,
      tokens,
    };
  } catch (error) {
    return {
      configurationError: `Invalid COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON: ${error instanceof Error ? error.message : 'unknown error'}`,
      defaulted: false,
      nodeEnv,
      tokens: [],
    };
  }
}

/**
 * @param {import('node:http').IncomingHttpHeaders | Record<string, string | string[] | undefined>} headers
 * @param {string} name
 * @returns {string | null}
 */
export function getHeader(headers, name) {
  const value = headers[name.toLowerCase()] ?? headers[name];
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return typeof value === 'string' ? value : null;
}

/**
 * @param {string | null} header
 * @returns {string | null}
 */
export function parseBearerToken(header) {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function constantTimeEquals(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

/**
 * @param {GatewayTokenConfig[]} tokens
 * @param {string} bearerToken
 * @returns {GatewayPrincipal | null}
 */
function matchPrincipal(tokens, bearerToken) {
  for (const entry of tokens) {
    if (!constantTimeEquals(entry.token, bearerToken)) {
      continue;
    }
    return {
      subject: entry.subject,
      permissions: new Set(entry.permissions),
      label: entry.label ?? entry.subject,
    };
  }
  return null;
}

/**
 * @param {GatewayPrincipal} principal
 * @param {string} permission
 * @returns {boolean}
 */
export function hasPermission(principal, permission) {
  return principal.permissions.has(permission);
}

/**
 * @param {import('node:http').IncomingHttpHeaders | Record<string, string | string[] | undefined>} headers
 * @returns {ApprovalContext}
 */
export function parseApprovalContext(headers) {
  const ticket = getHeader(headers, 'x-gtcx-approval-ticket')?.trim() || null;
  const approvedBy = getHeader(headers, 'x-gtcx-approved-by')?.trim() || null;
  const reason = getHeader(headers, 'x-gtcx-approval-reason')?.trim() || null;
  const idempotencyKey = getHeader(headers, 'x-idempotency-key')?.trim() || null;
  return {
    approvedBy,
    idempotencyKey,
    reason,
    ticket,
    valid: Boolean(ticket && approvedBy && reason && idempotencyKey),
  };
}

/**
 * @param {GatewayPrincipal} principal
 * @param {ApprovalContext} approval
 * @returns {{
 *   approval: ApprovalContext,
 *   canMutate: boolean,
 *   canQuery: boolean,
 *   canReadProviders: boolean,
 *   canReadTools: boolean,
 *   permissions: string[],
 *   subject: string,
 * }}
 */
export function buildAccessProfile(principal, approval) {
  const canQuery = hasPermission(principal, 'query:read');
  return {
    approval,
    canMutate: canQuery && hasPermission(principal, 'query:mutate') && approval.valid,
    canQuery,
    canReadProviders: hasPermission(principal, 'providers:read'),
    canReadTools: hasPermission(principal, 'tools:read'),
    permissions: [...principal.permissions].sort(),
    subject: principal.subject,
  };
}

/**
 * @param {import('node:http').IncomingHttpHeaders | Record<string, string | string[] | undefined>} headers
 * @param {GatewayAuthState} authState
 * @param {string} requiredPermission
 * @returns {{
 *   error?: string,
 *   ok: boolean,
 *   principal?: GatewayPrincipal,
 *   status: number,
 * }}
 */
export function authenticateHeaders(headers, authState, requiredPermission) {
  if (authState.configurationError) {
    return { ok: false, status: 503, error: authState.configurationError };
  }

  const bearerToken = parseBearerToken(getHeader(headers, 'authorization'));
  if (!bearerToken) {
    return { ok: false, status: 401, error: 'Missing bearer token.' };
  }

  const principal = matchPrincipal(authState.tokens, bearerToken);
  if (!principal) {
    return { ok: false, status: 401, error: 'Invalid bearer token.' };
  }

  if (!hasPermission(principal, requiredPermission)) {
    return {
      ok: false,
      status: 403,
      error: `Missing required permission: ${requiredPermission}`,
    };
  }

  return { ok: true, principal, status: 200 };
}

export { DEFAULT_DEV_TOKEN };
