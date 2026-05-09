/**
 * @fileoverview Protocol Handler Tool Definitions
 *
 * Maps all 64 GTCX protocol handlers as AI SDK tool definitions.
 * Each tool has a description, input schema, and routes to the
 * corresponding protocol endpoint at the configured base URL.
 */

import { z } from 'zod';

const PROTOCOL_BASE_URL = process.env.PROTOCOL_BASE_URL || 'http://gtcx-protocols.gtcx.svc.cluster.local:8300';

// ---------------------------------------------------------------------------
// Helper: create a tool that POSTs to a protocol endpoint
// ---------------------------------------------------------------------------

function protocolTool(protocol, handler, description, schema) {
  return {
    description,
    parameters: schema,
    execute: async (args) => {
      const url = `${PROTOCOL_BASE_URL}/v1/${protocol}/${handler}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
      return res.json();
    },
  };
}

// ---------------------------------------------------------------------------
// TradePass — Digital identity and verifiable credentials
// ---------------------------------------------------------------------------

const tradepass = {
  tradepass_createIdentity: protocolTool('tradepass', 'createIdentity',
    'Create a new digital trade identity (DID) for a person, cooperative, or organization. Used when onboarding a new trader, miner, or field agent.',
    z.object({
      name: z.string().describe('Full legal name of the identity holder'),
      type: z.enum(['individual', 'cooperative', 'organization']).describe('Type of identity'),
      jurisdiction: z.string().describe('Country or region code (e.g., zimbabwe, kenya)'),
      nationalId: z.string().optional().describe('National ID number if available'),
    }),
  ),
  tradepass_resolveIdentity: protocolTool('tradepass', 'resolveIdentity',
    'Look up an existing trade identity by DID or national ID. Use when verifying who someone is.',
    z.object({
      did: z.string().optional().describe('Decentralized identifier'),
      nationalId: z.string().optional().describe('National ID number'),
      jurisdiction: z.string().optional().describe('Jurisdiction to search in'),
    }),
  ),
  tradepass_issueCredential: protocolTool('tradepass', 'issueCredential',
    'Issue a verifiable credential (mining license, export permit, cooperative membership) to a trade identity.',
    z.object({
      did: z.string().describe('DID of the credential holder'),
      credentialType: z.string().describe('Type: mining_license, export_permit, cooperative_membership, trader_registration'),
      claims: z.record(z.string(), z.any()).describe('Credential claims (key-value pairs)'),
      expiresAt: z.string().optional().describe('ISO-8601 expiration date'),
    }),
  ),
  tradepass_verifyCredential: protocolTool('tradepass', 'verifyCredential',
    'Verify a credential is valid, not expired, and not revoked. Use before accepting a trade or shipment.',
    z.object({
      credentialId: z.string().describe('Credential ID or JWT to verify'),
      did: z.string().optional().describe('Expected holder DID'),
    }),
  ),
  tradepass_revokeCredential: protocolTool('tradepass', 'revokeCredential',
    'Revoke a previously issued credential (e.g., expired mining license, suspended trader).',
    z.object({
      credentialId: z.string().describe('Credential ID to revoke'),
      reason: z.string().describe('Reason for revocation'),
    }),
  ),
  tradepass_createPresentation: protocolTool('tradepass', 'createPresentation',
    'Create a verifiable presentation combining multiple credentials for a transaction.',
    z.object({
      did: z.string().describe('Presenter DID'),
      credentialIds: z.array(z.string()).describe('Credentials to include'),
      audience: z.string().optional().describe('Intended verifier'),
    }),
  ),
  tradepass_enrollBiometrics: protocolTool('tradepass', 'enrollBiometrics',
    'Enroll biometric data (fingerprint hash, face template) for a trade identity.',
    z.object({
      did: z.string().describe('DID to enroll biometrics for'),
      biometricType: z.enum(['fingerprint', 'face']).describe('Type of biometric'),
      templateHash: z.string().describe('SHA-256 hash of the biometric template'),
    }),
  ),
};

// ---------------------------------------------------------------------------
// GCI — Global Compliance Index (commodity compliance scoring)
// ---------------------------------------------------------------------------

const gci = {
  gci_createGCIScore: protocolTool('gci', 'createGCIScore',
    'Calculate a compliance score for a commodity trader or shipment. Considers regulatory history, documentation completeness, and jurisdiction requirements.',
    z.object({
      did: z.string().describe('DID of the entity being scored'),
      commodity: z.string().describe('Commodity type: gold, tobacco, platinum, lithium, diamonds, coffee, tea'),
      jurisdiction: z.string().describe('Jurisdiction code'),
    }),
  ),
  gci_getScoreBreakdown: protocolTool('gci', 'getScoreBreakdown',
    'Get a detailed breakdown of a compliance score showing which factors contributed positively or negatively.',
    z.object({
      did: z.string().describe('DID of the scored entity'),
      scoreId: z.string().optional().describe('Specific score ID, or latest if omitted'),
    }),
  ),
  gci_checkGCITierRequirement: protocolTool('gci', 'checkGCITierRequirement',
    'Check if an entity meets the minimum compliance tier for a specific trade activity (e.g., cross-border export requires Tier 3+).',
    z.object({
      did: z.string().describe('DID to check'),
      requiredTier: z.number().describe('Minimum tier (1-5)'),
      activity: z.string().describe('Trade activity: domestic_sale, export, cross_border, high_value'),
    }),
  ),
  gci_generateComplianceReport: protocolTool('gci', 'generateComplianceReport',
    'Generate a formal compliance report for regulatory submission or audit purposes.',
    z.object({
      did: z.string().describe('DID of the entity'),
      jurisdiction: z.string().describe('Target jurisdiction for the report'),
      period: z.string().optional().describe('Reporting period (e.g., 2026-Q1)'),
    }),
  ),
  gci_createGCIAppeal: protocolTool('gci', 'createGCIAppeal',
    'File an appeal against a compliance score decision.',
    z.object({
      did: z.string().describe('DID of the appellant'),
      scoreId: z.string().describe('Score being appealed'),
      grounds: z.string().describe('Grounds for appeal'),
      evidence: z.array(z.string()).optional().describe('Supporting document references'),
    }),
  ),
};

// ---------------------------------------------------------------------------
// GeoTag — Geographic origin verification
// ---------------------------------------------------------------------------

const geotag = {
  geotag_captureGeoTag: protocolTool('geotag', 'captureGeoTag',
    'Capture a geolocation tag for a commodity at its point of origin (mine site, farm, warehouse). Proves where a commodity came from.',
    z.object({
      latitude: z.number().describe('Latitude'),
      longitude: z.number().describe('Longitude'),
      altitude: z.number().optional().describe('Altitude in meters'),
      commodity: z.string().describe('Commodity being tagged'),
      siteId: z.string().optional().describe('Known site identifier'),
      deviceId: z.string().optional().describe('Capture device ID'),
    }),
  ),
  geotag_verifyGeoTag: protocolTool('geotag', 'verifyGeoTag',
    'Verify a geotag is authentic and matches expected origin location. Detects GPS spoofing.',
    z.object({
      geoTagId: z.string().describe('GeoTag ID to verify'),
      expectedRegion: z.string().optional().describe('Expected geographic region'),
    }),
  ),
  geotag_detectSpoof: protocolTool('geotag', 'detectSpoof',
    'Run anti-spoofing analysis on a geotag to detect GPS manipulation or location fraud.',
    z.object({
      geoTagId: z.string().describe('GeoTag ID to analyze'),
    }),
  ),
  geotag_createOriginMark: protocolTool('geotag', 'createOriginMark',
    'Create a permanent origin mark linking a commodity to its verified geographic source.',
    z.object({
      geoTagId: z.string().describe('Verified GeoTag ID'),
      commodity: z.string().describe('Commodity type'),
      quantity: z.number().describe('Quantity in standard units'),
      unit: z.string().describe('Unit: kg, tonnes, carats, ounces'),
    }),
  ),
};

// ---------------------------------------------------------------------------
// VaultMark — Custody chain and physical verification
// ---------------------------------------------------------------------------

const vaultmark = {
  vaultmark_createCustodyRecord: protocolTool('vaultmark', 'createCustodyRecord',
    'Create a custody record when a commodity changes hands or enters a vault/warehouse.',
    z.object({
      commodity: z.string().describe('Commodity type'),
      quantity: z.number().describe('Quantity'),
      unit: z.string().describe('Unit of measure'),
      custodian: z.string().describe('DID of the custodian'),
      location: z.string().describe('Storage location or facility'),
      originMarkId: z.string().optional().describe('Origin mark reference'),
    }),
  ),
  vaultmark_createCustodyTransfer: protocolTool('vaultmark', 'createCustodyTransfer',
    'Transfer custody of a commodity from one party to another. Both parties must confirm.',
    z.object({
      recordId: z.string().describe('Custody record ID'),
      fromDid: z.string().describe('Current custodian DID'),
      toDid: z.string().describe('New custodian DID'),
      reason: z.string().describe('Reason for transfer: sale, processing, storage, export'),
    }),
  ),
  vaultmark_createPhysicalSeal: protocolTool('vaultmark', 'createPhysicalSeal',
    'Register a physical tamper-evident seal on a container, bag, or shipment.',
    z.object({
      recordId: z.string().describe('Custody record ID'),
      sealType: z.string().describe('Seal type: bolt_seal, cable_seal, rfid_tag, qr_label'),
      sealNumber: z.string().describe('Physical seal number'),
    }),
  ),
  vaultmark_verifyPhysicalSeal: protocolTool('vaultmark', 'verifyPhysicalSeal',
    'Verify a physical seal is intact and matches the custody record.',
    z.object({
      sealNumber: z.string().describe('Seal number to verify'),
      recordId: z.string().optional().describe('Expected custody record'),
    }),
  ),
};

// ---------------------------------------------------------------------------
// PvP — Payment vs Payment settlement
// ---------------------------------------------------------------------------

const pvp = {
  pvp_createSettlement: protocolTool('pvp', 'createSettlement',
    'Create a new settlement for a commodity trade. Links buyer, seller, commodity, and payment.',
    z.object({
      buyerDid: z.string().describe('Buyer DID'),
      sellerDid: z.string().describe('Seller DID'),
      commodity: z.string().describe('Commodity being traded'),
      quantity: z.number().describe('Quantity'),
      unit: z.string().describe('Unit of measure'),
      price: z.number().describe('Agreed price'),
      currency: z.string().describe('Currency: USD, ZWL, KES, NGN, ZAR, GHS'),
      custodyRecordId: z.string().optional().describe('VaultMark custody record reference'),
    }),
  ),
  pvp_executeSettlement: protocolTool('pvp', 'executeSettlement',
    'Execute a settlement after both legs (payment + commodity delivery) are locked.',
    z.object({
      settlementId: z.string().describe('Settlement ID to execute'),
    }),
  ),
  pvp_getSettlementSummary: protocolTool('pvp', 'getSettlementSummary',
    'Get a summary of a settlement including status, parties, amounts, and timeline.',
    z.object({
      settlementId: z.string().describe('Settlement ID'),
    }),
  ),
  pvp_createEscrowDispute: protocolTool('pvp', 'createEscrowDispute',
    'Raise a dispute on a settlement (e.g., commodity quality issue, non-delivery, payment discrepancy).',
    z.object({
      settlementId: z.string().describe('Settlement in dispute'),
      raisedBy: z.string().describe('DID of the disputing party'),
      reason: z.string().describe('Dispute reason'),
      evidence: z.array(z.string()).optional().describe('Evidence document references'),
    }),
  ),
};

// ---------------------------------------------------------------------------
// PANX — Peer consensus and attestation network
// ---------------------------------------------------------------------------

const panx = {
  panx_registerNode: protocolTool('panx', 'registerNode',
    'Register a new verification node in the PANX network (e.g., a warehouse, assay office, customs checkpoint).',
    z.object({
      did: z.string().describe('Node operator DID'),
      nodeType: z.string().describe('Node type: assay_office, warehouse, customs, cooperative_hub, trading_post'),
      location: z.string().describe('Physical location'),
      jurisdiction: z.string().describe('Operating jurisdiction'),
    }),
  ),
  panx_issueAttestation: protocolTool('panx', 'issueAttestation',
    'Issue an attestation — a signed statement that a node has verified something (commodity quality, weight, origin).',
    z.object({
      nodeDid: z.string().describe('Attesting node DID'),
      subjectDid: z.string().describe('Subject being attested'),
      attestationType: z.string().describe('Type: quality_assay, weight_verification, origin_confirmation, export_clearance'),
      claims: z.record(z.string(), z.any()).describe('Attestation claims'),
    }),
  ),
  panx_verifyAttestation: protocolTool('panx', 'verifyAttestation',
    'Verify an attestation is valid, from a trusted node, and not revoked.',
    z.object({
      attestationId: z.string().describe('Attestation ID to verify'),
    }),
  ),
  panx_validatePrice: protocolTool('panx', 'validatePrice',
    'Validate a commodity price against market data and peer oracle submissions.',
    z.object({
      commodity: z.string().describe('Commodity type'),
      price: z.number().describe('Price to validate'),
      currency: z.string().describe('Currency'),
      market: z.string().optional().describe('Reference market: LBMA, LME, local'),
    }),
  ),
  panx_buildConsensus: protocolTool('panx', 'buildConsensus',
    'Build consensus across multiple verification nodes for a high-value trade or disputed claim.',
    z.object({
      subjectId: z.string().describe('Subject of consensus (settlement ID, dispute ID, etc.)'),
      requiredNodes: z.number().optional().describe('Minimum nodes required (default: 3)'),
      nodeTypes: z.array(z.string()).optional().describe('Required node types'),
    }),
  ),
  panx_getReputation: protocolTool('panx', 'getReputation',
    'Get the reputation score of a PANX network node based on attestation accuracy and uptime.',
    z.object({
      nodeDid: z.string().describe('Node DID to check'),
    }),
  ),
};

// ---------------------------------------------------------------------------
// Export all tools
// ---------------------------------------------------------------------------

export const tools = {
  ...tradepass,
  ...gci,
  ...geotag,
  ...vaultmark,
  ...pvp,
  ...panx,
};

export const toolCount = Object.keys(tools).length;
