#!/usr/bin/env python3
from pathlib import Path
import os
import sys

if len(sys.argv) != 3:
    raise SystemExit("Usage: truncate_diff.py <src_diff> <dest_diff>")

max_bytes = int(os.environ.get("MAX_BYTES", "100000"))
src = Path(sys.argv[1]).read_bytes()
text = src.decode("utf-8", errors="replace")
was_truncated = len(src) > max_bytes

if was_truncated:
    lo, hi = 0, len(text)
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if len(text[:mid].encode("utf-8")) <= max_bytes:
            lo = mid
        else:
            hi = mid - 1
    text = text[:lo]

# Prefer truncating at newline boundary to avoid cutting diff hunk headers mid-line.
last_nl = text.rfind("\n")
if last_nl > 0:
    text = text[: last_nl + 1]

if was_truncated:
    text += "\n\n... [diff truncated due to size] ..."

Path(sys.argv[2]).write_text(text, encoding="utf-8")
