#!/usr/bin/env bash
# Assert GET /api/v1/health body matches API envelope + healthy payload.
# Uses python3 (not jq) so it works on the Pi runner without extra deps.
set -euo pipefail
file="${1:?health JSON file path}"
if ! python3 - "$file" <<'EOF'
import json, sys
with open(sys.argv[1]) as f:
    d = json.load(f)
ok = d.get('ok') is True
healthy = (d.get('data', {}).get('ok') is True or
           d.get('data', {}).get('status') == 'healthy')
sys.exit(0 if (ok and healthy) else 1)
EOF
then
  echo "::error::Unexpected /api/v1/health JSON (expected ok + healthy data):" >&2
  cat "$file" >&2
  exit 1
fi
