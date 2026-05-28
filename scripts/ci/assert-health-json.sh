#!/usr/bin/env bash
# Assert GET /api/v1/health body matches API envelope + healthy payload.
set -euo pipefail
file="${1:?health JSON file path}"
jq -e '.ok == true and (.data.ok == true or .data.status == "healthy")' "$file"
