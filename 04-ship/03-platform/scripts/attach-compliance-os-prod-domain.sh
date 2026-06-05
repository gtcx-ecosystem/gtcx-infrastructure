#!/usr/bin/env bash
# Point compliance.gtcx.trade at production ALB (Hub #17 Phase B).
# Usage: CLOUDFLARE_API_TOKEN=<token> ALB_DNS=<alb-hostname> ./attach-compliance-os-prod-domain.sh
set -euo pipefail

TOKEN="${CLOUDFLARE_API_TOKEN:-}"
ZONE_NAME="${CLOUDFLARE_ZONE_NAME:-gtcx.trade}"
RECORD_NAME="${CLOUDFLARE_COMPLIANCE_HOST:-compliance}"
ALB_DNS="${ALB_DNS:-}"
PROXIED="${CLOUDFLARE_PROXIED:-false}"

if [[ -z "$TOKEN" ]]; then
  echo "ERROR: Set CLOUDFLARE_API_TOKEN (Zone DNS Edit on gtcx.trade)."
  exit 1
fi

if [[ -z "$ALB_DNS" ]]; then
  echo "ERROR: Set ALB_DNS (e.g. k8s-gtcxproductionapi-....af-south-1.elb.amazonaws.com)"
  exit 1
fi

api() {
  local method="$1"
  local path="$2"
  local data="${3:-}"
  if [[ -n "$data" ]]; then
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
if [[ -z "$ZONE_ID" || "$ZONE_ID" == "null" ]]; then
  echo "ERROR: Zone not found or token lacks Zone:Read"
  exit 1
fi
echo "Zone ID: ${ZONE_ID}"

FQDN="${RECORD_NAME}.${ZONE_NAME}"
echo ""
echo "=== DNS CNAME: ${FQDN} -> ${ALB_DNS} (proxied=${PROXIED}) ==="
EXISTING=$(api GET "/zones/${ZONE_ID}/dns_records?type=CNAME&name=${FQDN}")
RECORD_ID=$(echo "$EXISTING" | jq -r '.result[0].id // empty')
RECORD_CONTENT=$(echo "$EXISTING" | jq -r '.result[0].content // empty')

PAYLOAD=$(jq -n \
  --arg name "$FQDN" \
  --arg content "$ALB_DNS" \
  --argjson proxied "$( [[ "$PROXIED" == "true" ]] && echo true || echo false )" \
  '{type:"CNAME",name:$name,content:$content,proxied:$proxied,ttl:1}')

if [[ -n "$RECORD_ID" && "$RECORD_ID" != "null" ]]; then
  if [[ "$RECORD_CONTENT" == "$ALB_DNS" ]]; then
    echo "CNAME already correct (${RECORD_ID})"
  else
    echo "Updating CNAME ${RECORD_ID} (was: ${RECORD_CONTENT})"
    api PUT "/zones/${ZONE_ID}/dns_records/${RECORD_ID}" "$PAYLOAD" | jq -r '.success, (.errors[]?.message // empty)'
  fi
else
  echo "Creating CNAME..."
  api POST "/zones/${ZONE_ID}/dns_records" "$PAYLOAD" | jq -r '.success, (.errors[]?.message // empty)'
fi

echo ""
echo "Verify:"
echo "  dig +short ${FQDN} CNAME"
printf '  curl -sS -o /dev/null -w %%{http_code}\\n https://%s/\n' "${FQDN}"
