#!/bin/bash
set -euo pipefail

TOKEN="${CLOUDFLARE_API_TOKEN:-}"
if [ -z "$TOKEN" ]; then
  echo "ERROR: Set CLOUDFLARE_API_TOKEN environment variable"
  exit 1
fi

ZONE_NAME="gtcx.trade"
SUBDOMAIN="intelligence-staging"
FULL_HOST="${SUBDOMAIN}.${ZONE_NAME}"
ALB_DNS="k8s-gtcxintelligences-c3c85835b6-524590907.af-south-1.elb.amazonaws.com"

ACM_CNAME_NAME="_0903ca587530ef76e5e9654561a7a15c.${SUBDOMAIN}"
ACM_CNAME_VALUE="_eead0ca61ca66d971b54aa78b03db63a.jkddzztszm.acm-validations.aws."

echo "=== Finding zone ID for ${ZONE_NAME} ==="
ZONE_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=${ZONE_NAME}" \
  -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json")
ZONE_ID=$(echo "$ZONE_RESPONSE" | jq -r '.result[0].id')
if [ "$ZONE_ID" = "null" ] || [ -z "$ZONE_ID" ]; then
  echo "ERROR: Could not find zone ID"; exit 1
fi
echo "Zone ID: ${ZONE_ID}"

echo ""
echo "=== Listing Page Rules ==="
PAGE_RULES=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/pagerules" \
  -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json")
echo "$PAGE_RULES" | jq -r '.result[]? | "  ID: \(.id) | Target: \(.targets[].constraint.value) | Action: \(.actions[].id)"' || true

echo ""
echo "=== Removing redirect rules matching ${FULL_HOST} ==="
RULE_IDS=$(echo "$PAGE_RULES" | jq -r --arg host "$FULL_HOST" '.result[]? | select(.targets[].constraint.value | contains($host)) | .id')
for RULE_ID in $RULE_IDS; do
  echo "Deleting Page Rule: ${RULE_ID}"
  curl -s -X DELETE "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/pagerules/${RULE_ID}" \
    -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" | jq -r '.success'
done

echo ""
echo "=== Adding ACM validation CNAME (gray cloud) ==="
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" \
  -d "{\"type\":\"CNAME\",\"name\":\"${ACM_CNAME_NAME}\",\"content\":\"${ACM_CNAME_VALUE}\",\"ttl\":60,\"proxied\":false}" | jq -r '.success // .errors'

echo ""
echo "=== Adding/Updating ALB CNAME (orange cloud) ==="
EXISTING=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?type=CNAME&name=${FULL_HOST}" \
  -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json")
EXISTING_ID=$(echo "$EXISTING" | jq -r '.result[0]?.id // "null"')
ALB_PAYLOAD="{\"type\":\"CNAME\",\"name\":\"${FULL_HOST}\",\"content\":\"${ALB_DNS}\",\"ttl\":1,\"proxied\":true}"
if [ "$EXISTING_ID" != "null" ] && [ -n "$EXISTING_ID" ]; then
  echo "Updating existing CNAME: ${EXISTING_ID}"
  curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${EXISTING_ID}" \
    -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" -d "$ALB_PAYLOAD" | jq -r '.success // .errors'
else
  echo "Creating new CNAME"
  curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
    -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" -d "$ALB_PAYLOAD" | jq -r '.success // .errors'
fi

echo ""
echo "=== Verification ==="
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?name=${FULL_HOST}" \
  -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" | jq -r '.result[] | "  \(.type) \(.name) → \(.content) (proxied: \(.proxied))"'
