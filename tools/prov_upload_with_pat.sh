#!/usr/bin/env bash
set -euo pipefail

# prov_upload_with_pat.sh
# Simple shell test to verify that the prov-upload tRPC procedure can be
# called using a Personal Access Token (PAT).
#
# Assumptions:
# - The app is running and reachable at http://localhost:3000
# - The Postgres DB used by the app is reachable via psql and the usual
#   environment variables are set: PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE.
#   If not set, the script will try sensible defaults but you should export
#   the right env vars before running.
# - A test user with id 'test-user' exists (this is what vitest/testcontainers uses).
#
# Usage (from repo root):
#   bash tests/e2e/prov_upload_with_pat.sh

API_BASE_URL=http://localhost:3000

# Use existing PAT provided via $PAT or first argument
PAT="${1:-${PAT:-}}"
if [ -z "$PAT" ]; then
    echo "[error] No PAT provided. Set the PAT env var or pass it as the first argument."
    echo "Example: PAT=your_token_here bash tests/e2e/prov_upload_with_pat.sh"
    exit 2
fi

URL="$API_BASE_URL/api/trpc/pats-get-user-id"
echo "[test] Verifying PAT via GET $URL"
RESPONSE=$(curl -sS -H "Authorization: Bearer $PAT" -X GET "$URL") || (echo "[test] curl failed"; echo "$RESPONSE"; exit 2)
echo "[test] Response: $RESPONSE"

# build a minimal prov-upload input
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
ENTITY_ID="$(uuidgen)"
HASH_ID=$(echo -n "shell-test-entity" | sha256sum | awk '{print $1}')
HASH_ID2=$(echo -n "shell-test-entity2" | sha256sum | awk '{print $1}')
HASH_ID_PROCESS=$(echo -n "shell-test-entity-process" | sha256sum | awk '{print $1}')

ACTIVITY_HASH_ID=$(echo -n "shell-test-activity2" | sha256sum | awk '{print $1}')

INPUT_JSON=$(cat <<JSON
{"entities":[{"id":"${HASH_ID}","label":"shell-test-entity","role":"input","metadata":{"shell_test":true},"createdAt":0},{"id":"${HASH_ID2}","label":"shell-test-entity","role":"output","metadata":{"shell_test":true},"createdAt":0},{"id":"${HASH_ID_PROCESS}","label":"shell-test-entity-process","role":"process","metadata":{"shell_test":true},"createdAt":0}],"activity":{"id":"${ACTIVITY_HASH_ID}","startedAt":0,"endedAt":0,"metadata":{"shell_test":true}}}
JSON
)


URL="$API_BASE_URL/api/trpc/prov-upload"

echo "[test] Calling prov-upload via POST $URL"

RESPONSE=$(curl -sS -H "Authorization: Bearer $PAT" -H "Content-Type: application/json" -X POST -d "$INPUT_JSON" "$URL") || (echo "[test] curl failed"; echo "$RESPONSE"; exit 2)

echo "[test] Response: $RESPONSE"


OK=$(echo "$RESPONSE" | jq -e '((.result.data.success == true) or (.[0].result.data.ok.success == true))' ) || true

if [ "$OK" = "true" ]; then
    echo "[test] prov-upload accepted the PAT and inserted the entity — SUCCESS"
    exit 0
else
    echo "[test] prov-upload did not return expected success/counts. Full response:" >&2
    echo "$RESPONSE" >&2
    exit 3
fi
