const MUTATING_TOOL_NAMES = new Set([
  'tradepass_createIdentity',
  'tradepass_issueCredential',
  'tradepass_revokeCredential',
  'tradepass_enrollBiometrics',
  'gci_createGCIScore',
  'gci_createGCIAppeal',
  'geotag_captureGeoTag',
  'geotag_createOriginMark',
  'vaultmark_createCustodyRecord',
  'vaultmark_createCustodyTransfer',
  'vaultmark_createPhysicalSeal',
  'pvp_createSettlement',
  'pvp_executeSettlement',
  'pvp_createEscrowDispute',
  'panx_registerNode',
  'panx_issueAttestation',
  'panx_buildConsensus',
]);

/**
 * @param {string} toolName
 * @returns {boolean}
 */
export function isMutatingToolName(toolName) {
  return MUTATING_TOOL_NAMES.has(toolName);
}

/**
 * @param {string} toolName
 * @param {{ canMutate: boolean, canQuery: boolean }} accessProfile
 * @returns {boolean}
 */
export function canAccessTool(toolName, accessProfile) {
  if (!accessProfile.canQuery) {
    return false;
  }
  if (!isMutatingToolName(toolName)) {
    return true;
  }
  return accessProfile.canMutate;
}

/**
 * @param {{
 *   approval: { ticket: string | null },
 *   canMutate: boolean,
 *   permissions: string[],
 *   subject: string,
 * }} accessProfile
 * @returns {string}
 */
export function buildRuntimePolicyPrompt(accessProfile) {
  const lines = [
    'Runtime access policy:',
    `- Caller subject: ${accessProfile.subject}`,
    `- Caller permissions: ${accessProfile.permissions.join(', ') || 'none'}`,
  ];

  if (accessProfile.canMutate) {
    lines.push(`- Mutating tools are enabled for approval ticket ${accessProfile.approval.ticket}.`);
    lines.push('- Only use mutating tools when the request explicitly requires a state change.');
    lines.push('- Prefer read-only inspection before any mutation.');
  } else {
    lines.push('- Mutating tools are DISABLED for this request.');
    lines.push('- Do not claim to have changed credentials, custody, consensus, or settlements.');
    lines.push('- If the request needs a state change, explain that approved mutating access is required.');
  }

  return lines.join('\n');
}

export { MUTATING_TOOL_NAMES };
