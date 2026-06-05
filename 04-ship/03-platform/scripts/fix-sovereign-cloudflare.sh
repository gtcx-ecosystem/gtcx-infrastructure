#!/bin/bash
set -euo pipefail

# =============================================================================
# Fix sovereign-staging.gtcx.trade Cloudflare routing
# =============================================================================
# Usage: CLOUDFLARE_API_TOKEN=<token> ./fix-sovereign-cloudflare.sh
#
# This script:
#   1. Finds and removes redirect rules for sovereign-staging.gtcx.trade
#   2. Adds ACM validation CNAME (gray cloud)
#   3. Adds ALB CNAME (orange cloud / proxied)
#   4. Verifies the changes
# =============================================================================

TOKEN="${CLOUDFLARE_API_TOKEN:-}"
if [ -z "$TOKEN" ]; then
  echo "ERROR: Set CLOUDFLARE_API_TOKEN environment variable"
  echo "       The token needs Zone:Read, DNS:Edit, Page Rules:Edit permissions"
  exit 1
fi

# Zone name
ZONE_NAME="gtcx.trade"
SUBDOMAIN="sovereign-staging"
FULL_HOST="${SUBDOMAIN}.${ZONE_NAME}"
ALB_DNS="k8s-gtcxstagingapi-295a96727a-1533822930.af-south-1.elb.amazonaws.com"

# ACM validation record (do NOT proxy this)
ACM_CNAME_NAME="_552ca3cb0ef27690343dbb9fefe1d81e.${SUBDOMAIN}"
ACM_CNAME_VALUE="_221f2001f4782089df2c5cbf87542277.jkddzztszm.acm-validations.aws."

echo "=== Finding zone ID for ${ZONE_NAME} ==="
ZONE_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=${ZONE_NAME}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

ZONE_ID=$(echo "$ZONE_RESPONSE" | jq -r '.result[0].id')
if [ "$ZONE_ID" = "null" ] || [ -z "$ZONE_ID" ]; then
  echo "ERROR: Could not find zone ID for ${ZONE_NAME}"
  echo "Response: $ZONE_RESPONSE"
  exit 1
fi
echo "Zone ID: ${ZONE_ID}"

echo ""
echo "=== Listing current DNS records for ${FULL_HOST} ==="
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?name=${FULL_HOST}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" | jq -r '.result[] | "  \(.type) \(.name) → \(.content) (proxied: \(.proxied))"'

echo ""
echo "=== Listing Page Rules ==="
PAGE_RULES=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/pagerules" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")
echo "$PAGE_RULES" | jq -r '.result[]? | "  ID: \(.id) | Targets: \(.targets[].constraint.value) | Actions: \(.actions[].id)"' || echo "  (none or API error)"

echo ""
echo "=== Listing Redirect Rules (Rulesets) ==="
RULESETS=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/rulesets" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")
echo "$RULESETS" | jq -r '.result[]? | "  Ruleset: \(.name) (\(.phase))"' || echo "  (none or API error)"

echo ""
echo "=== Removing redirect rules matching ${FULL_HOST} ==="
# Check page rules for redirects matching our host
RULE_IDS=$(echo "$PAGE_RULES" | jq -r --arg host "$FULL_HOST" '.result[]? | select(.targets[].constraint.value | contains($host)) | .id')
for RULE_ID in $RULE_IDS; do
  echo "Deleting Page Rule: ${RULE_ID}"
  curl -s -X DELETE "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/pagerules/${RULE_ID}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" | jq -r '.success'
done

echo ""
echo "=== Adding ACM validation CNAME (gray cloud / DNS-only) ==="
ACM_PAYLOAD=$(cat <<EOF
{
  "type": "CNAME",
  "name": "${ACM_CNAME_NAME}",
  "content": "${ACM_CNAME_VALUE}",
  "ttl": 60,
  "proxied": false
}
EOF
)
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$ACM_PAYLOAD" | jq -r '.success // .errors'

echo ""
echo "=== Adding/Updating ALB CNAME (orange cloud / proxied) ==="
# Check if record already exists
EXISTING=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?type=CNAME&name=${FULL_HOST}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")
EXISTING_ID=$(echo "$EXISTING" | jq -r '.result[0]?.id // "null"')

ALB_PAYLOAD=$(cat <<EOF
{
  "type": "CNAME",
  "name": "${FULL_HOST}",
  "content": "${ALB_DNS}",
  "ttl": 1,
  "proxied": true
}
EOF
)

if [ "$EXISTING_ID" != "null" ] && [ -n "$EXISTING_ID" ]; then
  echo "Updating existing CNAME record: ${EXISTING_ID}"
  curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${EXISTING_ID}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$ALB_PAYLOAD" | jq -r '.success // .errors'
else
  echo "Creating new CNAME record"
  curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$ALB_PAYLOAD" | jq -r '.success // .errors'
fi

echo ""
echo "=== Verification ==="
echo "DNS records for ${FULL_HOST}:"
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?name=${FULL_HOST}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" | jq -r '.result[] | "  \(.type) \(.name) → \(.content) (proxied: \(.proxied))"'

echo ""
echo "=== Next steps ==="
echo "1. Wait 1-5 minutes for DNS propagation"
echo "2. Verify ACM certificate validation:"
echo "   aws acm describe-certificate --certificate-arn arn:aws:acm:af-south-1:348389439381:certificate:9f7149a3-26db-4dee-bce5-b5a3cd29fe16 --region af-south-1 --query 'Certificate.Status'"
echo "3. Once ISSUED, attach to ALB:"
echo "   aws elbv2 add-listener-certificates --listener-arn \$(aws elbv2 describe-listeners --load-balancer-arn arn:aws:elasticloadbalancing:af-south-1:348389439381:loadbalancer/app/k8s-gtcxstagingapi-295a96727a/c71b6e1f69c8e8a2 --region af-south-1 --query 'Listeners[?Protocol==\`HTTPS\`].ListenerArn' --output text) --certificates CertificateArn=arn:aws:acm:af-south-1:348389439381:certificate/9f7149a3-26db-4dee-bce5-b5a3cd29fe16 --region af-south-1"
echo "4. Test: curl -sI https://${FULL_HOST}/health"
