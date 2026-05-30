/**
 * @fileoverview Render an evidence bundle as a self-contained,
 * offline-verifiable HTML document. Regulator-readable in any browser;
 * printable to PDF via the browser's print dialog (no PDF library at
 * runtime — that's an intentional dep choice).
 *
 * The output is a single HTML file with:
 *   - Identification block (tenant, range, signing posture, chain head)
 *   - Verification instructions (copy-paste-runnable Node snippet)
 *   - Per-tenant section with one row per audit record
 *   - Embedded NDJSON so the artifact is self-contained — a consumer
 *     can verify it offline using only the file itself and Node 20+
 *
 * No external CSS, no JS, no images. The whole file is one <html>
 * the regulator can save, archive, and re-open without dependencies.
 */

/**
 * Escape a string for safe insertion into HTML text content.
 * @param {string} s
 */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Parse an NDJSON string into an array of records; tolerates blank
 * lines and a trailing newline.
 *
 * @param {string} ndjson
 * @returns {Array<object>}
 */
function parseNdjson(ndjson) {
  if (!ndjson) return [];
  const records = [];
  for (const line of ndjson.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try { records.push(JSON.parse(t)); } catch { /* skip malformed line */ }
  }
  return records;
}

function renderRecordRow(r) {
  const ts = esc(r.timestamp ?? '');
  const action = esc(r.action ?? '');
  const actor = esc(r.actor ?? '');
  const target = esc(r.target ?? '');
  const reason = esc(r.reason ?? '');
  const id = esc(r.id ?? '');
  const sig = esc((r.signature ?? '').slice(0, 16));
  return `
    <tr>
      <td class="ts">${ts}</td>
      <td class="action">${action}</td>
      <td>${actor}</td>
      <td class="target">${target}</td>
      <td class="reason">${reason}</td>
      <td class="mono small">${id}</td>
      <td class="mono small">${sig}…</td>
    </tr>`;
}

function renderSection(section, idx) {
  const records = parseNdjson(section.ndjson);
  const rows = records.map(renderRecordRow).join('');
  return `
    <section class="tenant" id="tenant-${idx}">
      <h2>Tenant: <code>${esc(section.tenantId)}</code></h2>
      <p class="meta"><strong>${section.recordCount}</strong> record(s) in this section.</p>
      <table>
        <thead>
          <tr>
            <th>Timestamp</th><th>Action</th><th>Actor</th>
            <th>Target</th><th>Reason</th><th>Record ID</th><th>Signature</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="7" class="empty">— no records —</td></tr>'}</tbody>
      </table>
      <details>
        <summary>Raw NDJSON (offline-verifiable)</summary>
        <pre class="ndjson">${esc(section.ndjson || '')}</pre>
      </details>
    </section>`;
}

/**
 * Render either a single-tenant (v1) or multi-tenant (v2) bundle.
 *
 * @param {object} bundle - shape returned by buildEvidenceBundle or buildMultiTenantEvidenceBundle
 * @returns {string} self-contained HTML document
 */
export function renderEvidenceHtml(bundle) {
  const isMulti = bundle?.bundleVersion === '2-multi-tenant';
  const sections = isMulti
    ? bundle.sections
    : [{
        tenantId: bundle?.tenantId ?? 'unknown',
        recordCount: bundle?.recordCount ?? 0,
        ndjson: bundle?.ndjson ?? '',
      }];

  const tenantLabel = isMulti
    ? `${bundle.tenantCount} tenants: ${sections.map((s) => esc(s.tenantId)).join(', ')}`
    : esc(sections[0].tenantId);

  const totalRecords = sections.reduce((a, s) => a + (s.recordCount ?? 0), 0);
  const producedAt = esc(bundle?.producedAt ?? new Date().toISOString());
  const chainHead = esc(bundle?.chainHead ?? '');
  const priorCheckpointHash = esc(bundle?.priorCheckpointHash ?? '');
  const priorCheckpointCount = bundle?.priorCheckpointCount ?? 0;
  const algorithm = esc(bundle?.verification?.algorithm ?? 'ed25519+sha256+jcs');

  const sectionsHtml = sections.map(renderSection).join('');

  // Inline minimal CSS — print-friendly, no external deps.
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>GTCX Evidence Bundle — ${tenantLabel}</title>
<style>
  :root { color-scheme: light; }
  body { font: 14px/1.5 -apple-system, BlinkMacSystemFont, system-ui, sans-serif; margin: 2rem; color: #111; }
  h1 { font-size: 1.6rem; margin: 0 0 .5rem; }
  h2 { font-size: 1.2rem; margin: 2rem 0 .5rem; border-top: 1px solid #ddd; padding-top: 1rem; }
  .meta-block { background: #f7f7f9; border: 1px solid #e1e4e8; border-radius: 6px; padding: 1rem; margin: 1rem 0; }
  .meta-block dt { font-weight: 600; margin-top: .35rem; }
  .meta-block dd { margin: 0 0 .35rem 1.25rem; }
  code, .mono { font-family: ui-monospace, "SF Mono", Menlo, monospace; }
  .small { font-size: 12px; color: #555; }
  table { border-collapse: collapse; width: 100%; font-size: 12px; }
  th, td { padding: .35rem .5rem; border-bottom: 1px solid #eee; text-align: left; vertical-align: top; }
  th { background: #fafbfc; font-weight: 600; }
  .ts { white-space: nowrap; color: #333; }
  .action { font-weight: 600; }
  .target, .reason { max-width: 32ch; word-break: break-word; }
  .empty { text-align: center; color: #888; padding: 1rem; font-style: italic; }
  details { margin: 1rem 0; }
  summary { cursor: pointer; font-weight: 600; }
  pre.ndjson { background: #f7f7f9; border: 1px solid #e1e4e8; border-radius: 4px; padding: .75rem; overflow-x: auto; font-size: 11px; line-height: 1.4; }
  .verification { background: #fffbea; border: 1px solid #f4d35e; border-radius: 6px; padding: 1rem; margin: 1rem 0; }
  .verification pre { background: #fff; padding: .5rem; border-radius: 4px; font-size: 12px; overflow-x: auto; }
  @media print {
    body { margin: 1rem; font-size: 11px; }
    details[open] { page-break-inside: avoid; }
    pre.ndjson { font-size: 9px; }
  }
</style>
</head>
<body>

<header>
  <h1>GTCX Compliance Evidence Bundle</h1>
  <p class="meta small">
    Produced ${producedAt} · Bundle version <code>${esc(bundle?.bundleVersion ?? '1')}</code> ·
    Algorithm <code>${algorithm}</code>
  </p>
</header>

<div class="meta-block">
  <dl>
    <dt>Tenant scope</dt><dd>${tenantLabel}</dd>
    <dt>Total records</dt><dd>${totalRecords}</dd>
    <dt>Chain head</dt><dd><code>${chainHead || '<none>'}</code></dd>
    <dt>Prior checkpoint hash</dt><dd><code>${priorCheckpointHash || '<none>'}</code></dd>
    <dt>Prior checkpoint count</dt><dd>${priorCheckpointCount}</dd>
  </dl>
</div>

<div class="verification">
  <strong>How to verify this bundle offline</strong>
  <p class="small">Every record below carries its own Ed25519 public key and signature. No GTCX-side trust is required.</p>
  <pre>npm install @gtcx/audit-signer
node -e "
  const { verifyChain, fromNdjson } = require('@gtcx/audit-signer');
  const fs = require('fs');
  // Extract each &lt;pre class='ndjson'&gt; block, run verifyChain on it.
  // Each section verifies independently.
"</pre>
  <p class="small">Tampering with any record breaks <code>verifyChain</code> for its section.</p>
</div>

${sectionsHtml}

<footer class="small" style="margin-top:3rem;color:#888;border-top:1px solid #eee;padding-top:1rem;">
  Generated by @gtcx/compliance-gateway — see
  <a href="https://github.com/gtcx-ecosystem/gtcx-infrastructure">repository</a>
  for the verifier source and signing key public component.
</footer>

</body>
</html>`;
}
