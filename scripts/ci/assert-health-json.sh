#!/usr/bin/env bash
# Assert GET /api/v1/health body matches API envelope + healthy payload.
set -euo pipefail
file="${1:?health JSON file path}"
# Use Node instead of jq because Node is guaranteed on CI + Pi runners.
if ! node - "$file" <<'NODE'
const fs = require('fs');
const path = process.argv[2];

try {
  const raw = fs.readFileSync(path, 'utf8');
  const json = JSON.parse(raw);
  const healthy =
    json?.ok === true &&
    (json?.data?.ok === true || json?.data?.status === 'healthy');
  if (!healthy) process.exit(1);
} catch {
  process.exit(1);
}
NODE
then
  echo "::error::Unexpected /api/v1/health JSON (expected ok + healthy data):" >&2
  cat "$file" >&2
  exit 1
fi
