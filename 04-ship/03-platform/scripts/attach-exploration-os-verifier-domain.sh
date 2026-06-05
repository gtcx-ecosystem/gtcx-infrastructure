#!/usr/bin/env bash
# Attach verify.explorationos.gtcx.trade to exploration-os-verifier Pages (XR-EO-001 / XR-507).
# Usage: CLOUDFLARE_API_TOKEN=<token> ./attach-exploration-os-verifier-domain.sh
set -euo pipefail

TOKEN="${CLOUDFLARE_API_TOKEN:-}"
ZONE_NAME="${CLOUDFLARE_ZONE_NAME:-gtcx.trade}"
RECORD_NAME="${CLOUDFLARE_VERIFIER_HOST:-verify.explorationos}"
PAGES_TARGET="${CLOUDFLARE_PAGES_TARGET:-exploration-os-verifier.pages.dev}"
PAGES_PROJECT="${CLOUDFLARE_PAGES_PROJECT:-exploration-os-verifier}"

if [ -z "$TOKEN" ]; then
  echo "ERROR: Set CLOUDFLARE_API_TOKEN (zone DNS Edit + Account Pages Edit recommended)."
  exit 1
fi

api() {
  local method="$1"
  local path="$2"
  local data="${3:-}"
  if [ -n "$data" ]; then
    curl -sS -X "$method" "https://api.cloudflare.com/client/v4${path}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      --data "$data"
  else
    curl -sS -X "$method" "https://api.cloudflare.com/client/v4${path}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json"
  fi
}

echo "=== Zone: ${ZONE_NAME} ==="
ZONE_RESPONSE=$(api GET "/zones?name=${ZONE_NAME}")
ZONE_ID=$(echo "$ZONE_RESPONSE" | jq -r '.result[0].id // empty')
if [ -z "$ZONE_ID" ] || [ "$ZONE_ID" = "null" ]; then
  echo "ERROR: Zone not found or token lacks Zone:Read"
  echo "$ZONE_RESPONSE" | jq -r '.errors[]? | .message' 2>/dev/null || true
  exit 1
fi
echo "Zone ID: ${ZONE_ID}"

FQDN="${RECORD_NAME}.${ZONE_NAME}"
echo ""
echo "=== DNS CNAME: ${FQDN} -> ${PAGES_TARGET} ==="
EXISTING=$(api GET "/zones/${ZONE_ID}/dns_records?type=CNAME&name=${FQDN}")
RECORD_ID=$(echo "$EXISTING" | jq -r '.result[0].id // empty')
RECORD_CONTENT=$(echo "$EXISTING" | jq -r '.result[0].content // empty')

if [ -n "$RECORD_ID" ] && [ "$RECORD_ID" != "null" ]; then
  if [ "$RECORD_CONTENT" = "$PAGES_TARGET" ]; then
    echo "CNAME already correct (${RECORD_ID})"
  else
    echo "Updating CNAME ${RECORD_ID} (was: ${RECORD_CONTENT})"
    api PUT "/zones/${ZONE_ID}/dns_records/${RECORD_ID}" \
      "$(jq -n --arg name "$FQDN" --arg content "$PAGES_TARGET" \
        '{type:"CNAME",name:$name,content:$content,proxied:true,ttl:1}')" | jq -r '.success, (.errors[]?.message // empty)'
  fi
else
  echo "Creating CNAME..."
  CREATE=$(api POST "/zones/${ZONE_ID}/dns_records" \
    "$(jq -n --arg name "$FQDN" --arg content "$PAGES_TARGET" \
      '{type:"CNAME",name:$name,content:$content,proxied:true,ttl:1}')")
  echo "$CREATE" | jq -r '.success, (.errors[]?.message // empty), (.result.id // empty)'
  if [ "$(echo "$CREATE" | jq -r '.success')" != "true" ]; then
    exit 1
  fi
fi

echo ""
echo "=== Pages custom domain (required for TLS on proxied CNAME) ==="
ACCOUNT_ID=$(api GET "/zones/${ZONE_ID}" | jq -r '.result.account.id // empty')
if [ -z "$ACCOUNT_ID" ] || [ "$ACCOUNT_ID" = "null" ]; then
  ACCOUNTS=$(api GET "/accounts")
  ACCOUNT_ID=$(echo "$ACCOUNTS" | jq -r '.result[0].id // empty')
fi
if [ -z "$ACCOUNT_ID" ] || [ "$ACCOUNT_ID" = "null" ]; then
  echo "WARN: Could not resolve account id — register custom domain in Pages dashboard"
else
  echo "Account ID: ${ACCOUNT_ID}"
  DOMAIN_BODY=$(jq -n --arg name "$FQDN" '{name:$name}')
  PAGES_DOMAIN=$(api POST "/accounts/${ACCOUNT_ID}/pages/projects/${PAGES_PROJECT}/domains" "$DOMAIN_BODY" 2>/dev/null || true)
  if echo "$PAGES_DOMAIN" | jq -e '.success == true' >/dev/null 2>&1; then
    echo "Pages domain attached: ${FQDN}"
  else
    MSG=$(echo "$PAGES_DOMAIN" | jq -r '.errors[0].message // "skipped or already exists"')
    echo "Pages domain API: ${MSG}"
  fi
fi

echo ""
echo "=== Smoke (may take 1–5 min to propagate) ==="
for i in 1 2 3 4 5; do
  if curl -sfI "https://${FQDN}/sir/" | head -1 | grep -q '200\|301\|308'; then
    echo "OK: https://${FQDN}/sir/ responds"
    curl -sL "https://${FQDN}/sir/" | grep -q '__SIR_VERIFIER_PEPPER__' && echo "OK: pepper present in HTML" || echo "WARN: pepper not found in HTML"
    exit 0
  fi
  echo "Attempt ${i}/5: not ready yet..."
  sleep 15
done
echo "WARN: HTTPS not 200 yet — check Cloudflare dashboard for SSL/custom hostname status"
exit 0
