#!/usr/bin/env bash
# Assert GET /api/v1/health body matches API envelope + healthy payload.
set -euo pipefail
file="${1:?health JSON file path}"
if ! node -e "const fs=require('fs');const p=process.argv[1];const j=JSON.parse(fs.readFileSync(p,'utf8'));if(!(j?.ok===true && (j?.data?.ok===true || j?.data?.status==='healthy'))){process.exit(1)}" "$file"; then
  echo "::error::Unexpected /api/v1/health JSON (expected ok + healthy data):" >&2
  cat "$file" >&2
  exit 1
fi
