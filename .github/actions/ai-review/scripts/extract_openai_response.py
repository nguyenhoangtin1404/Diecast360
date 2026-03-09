#!/usr/bin/env python3
import json
import sys
from pathlib import Path

if len(sys.argv) != 3:
    raise SystemExit("Usage: extract_openai_response.py <api_response_json> <review_output>")

response = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
if "error" in response:
    raise SystemExit(f"OpenAI API error: {response['error']}")

try:
    content = response["choices"][0]["message"]["content"]
except (KeyError, IndexError, TypeError) as exc:
    raise SystemExit(f"OpenAI response format invalid: {exc}")

Path(sys.argv[2]).write_text(content, encoding="utf-8")
