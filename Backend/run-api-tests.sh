#!/usr/bin/env bash
# Simple bash smoke test using curl and jq (jq optional but recommended)
# Usage: BASE_URL=http://localhost/eepl_classess/v1 ./run-api-tests.sh

BASE_URL=${BASE_URL:-http://localhost/eepl_classess/v1}
set -euo pipefail

echo "Using BASE_URL=$BASE_URL"

# Login
LOGIN_RESP=$(curl -sS -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"secret"}')
TOKEN=$(echo "$LOGIN_RESP" | jq -r .token 2>/dev/null || echo "")
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "Login failed or token missing: $LOGIN_RESP"
  exit 1
fi

echo "Login OK"

# Get courses
COURSES=$(curl -sS -H "Authorization: Bearer $TOKEN" "$BASE_URL/courses")
echo "Courses: $COURSES"

echo "Smoke tests finished."
