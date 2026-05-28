#!/usr/bin/env bash
# Assert GET /api/v1/health body matches API envelope + healthy payload.
set -euo pipefail
file="${1:?health JSON file path}"
if ! jq -e '.ok == true and (.data.ok == true or .data.status == "healthy")' "$file"; then
  echo "::error::Unexpected /api/v1/health JSON (expected ok + healthy data):" >&2
  cat "$file" >&2
  exit 1
fi
