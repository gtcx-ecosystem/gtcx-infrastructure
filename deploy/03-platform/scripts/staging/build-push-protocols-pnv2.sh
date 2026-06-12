#!/usr/bin/env bash
# XR-MKT-PROTOCOL-NATIVE-001 — build and push gtcx-protocols:e7525dfa to ECR.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ECOSYSTEM_ROOT="${GTCX_ECOSYSTEM_ROOT:-$(cd "${SCRIPT_DIR}/../../../../.." && pwd)}"
PROTOCOLS_ROOT="${PROTOCOLS_ROOT:-${ECOSYSTEM_ROOT}/gtcx-os/platform/protocols}"
REGION="${AWS_REGION:-af-south-1}"
ECR_REGISTRY="${ECR_REGISTRY:-348389439381.dkr.ecr.af-south-1.amazonaws.com}"
TAG="${TAG:-e7525dfa}"

if [[ ! -d "${PROTOCOLS_ROOT}/04-deploy/docker" ]]; then
  echo "error: protocols source not found at ${PROTOCOLS_ROOT}" >&2
  exit 1
fi

if [[ "${1:-}" == "--dry-run" ]]; then
  echo "context: ${PROTOCOLS_ROOT}"
  echo "image:  ${ECR_REGISTRY}/gtcx-protocols:${TAG}"
  echo "PASS — dry-run only"
  exit 0
fi

aws ecr get-login-password --region "${REGION}" \
  | docker login --username AWS --password-stdin "${ECR_REGISTRY}"

cd "${PROTOCOLS_ROOT}"
docker build --platform linux/amd64 \
  -f 04-deploy/docker/Dockerfile \
  -t "${ECR_REGISTRY}/gtcx-protocols:${TAG}" \
  .

docker push "${ECR_REGISTRY}/gtcx-protocols:${TAG}"
echo "PASS — pushed ${ECR_REGISTRY}/gtcx-protocols:${TAG}"
