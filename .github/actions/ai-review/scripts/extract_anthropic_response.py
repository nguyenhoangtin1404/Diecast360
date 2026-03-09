#!/usr/bin/env python3
import json
import sys
from pathlib import Path

if len(sys.argv) != 3:
    raise SystemExit("Usage: extract_anthropic_response.py <api_response_json> <review_output>")

response = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
if "error" in response:
    raise SystemExit(f"Anthropic API error: {response['error']}")

parts = [b.get("text", "") for b in response.get("content", []) if b.get("type") == "text"]
if not parts:
    raise SystemExit("Anthropic response format invalid: missing text content blocks")

Path(sys.argv[2]).write_text("\n".join(parts).strip(), encoding="utf-8")
