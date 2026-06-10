#!/usr/bin/env bash
# DAAS-S1-03 — sync AGX staging DATABASE_URL from RDS operational master secret.
set -euo pipefail

NAMESPACE="${NAMESPACE:-gtcx-staging}"
SECRET_NAME="${SECRET_NAME:-gtcx-agx-database-staging}"
REGION="${AWS_REGION:-af-south-1}"
DB_ID="${DB_ID:-gtcx-staging-operational}"

RDS_JSON="$(aws rds describe-db-instances \
  --db-instance-identifier "$DB_ID" \
  --region "$REGION" \
  --query 'DBInstances[0].{host:Endpoint.Address,port:Endpoint.Port,db:DBName,secret:MasterUserSecret.SecretArn}' \
  --output json)"

HOST="$(echo "$RDS_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['host'])")"
PORT="$(echo "$RDS_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['port'])")"
DBNAME="$(echo "$RDS_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['db'])")"
SM_ARN="$(echo "$RDS_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['secret'])")"

CREDS="$(aws secretsmanager get-secret-value \
  --secret-id "$SM_ARN" \
  --region "$REGION" \
  --query SecretString \
  --output text)"

DATABASE_URL="$(CREDS="$CREDS" HOST="$HOST" PORT="$PORT" DBNAME="$DBNAME" python3 - <<'PY'
import json, os, urllib.parse
creds = json.loads(os.environ["CREDS"])
user = creds["username"]
password = urllib.parse.quote(creds["password"], safe="")
host = os.environ["HOST"]
port = os.environ["PORT"]
db = os.environ["DBNAME"]
print(f"postgresql://{user}:{password}@{host}:{port}/{db}?sslmode=require")
PY
)"

kubectl create secret generic "$SECRET_NAME" \
  --namespace "$NAMESPACE" \
  --from-literal="DATABASE_URL=$DATABASE_URL" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "synced $SECRET_NAME in $NAMESPACE from $DB_ID"
