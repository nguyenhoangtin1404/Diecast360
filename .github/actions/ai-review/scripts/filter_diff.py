#!/usr/bin/env python3
from pathlib import Path
import fnmatch
import sys

if len(sys.argv) != 3:
    raise SystemExit("Usage: filter_diff.py <src_diff> <dest_diff>")

src = Path(sys.argv[1])
dest = Path(sys.argv[2])
raw = src.read_text(encoding="utf-8", errors="replace").splitlines(True)
excludes = ["*/package-lock.json", "*/pnpm-lock.yaml", "*/yarn.lock", "*/prisma/migrations/*"]


def is_excluded(path: str) -> bool:
    return any(fnmatch.fnmatch(path, pat) for pat in excludes)

out = []
cur = []
cur_path = None

for line in raw:
    if line.startswith("diff --git "):
        if cur and cur_path is not None and not is_excluded(cur_path):
            out.extend(cur)
        cur = []
        parts = line.strip().split(" ")
        cur_path = parts[2][2:] if len(parts) >= 4 and parts[2].startswith("a/") else ""
        cur.append(line)
    elif cur:
        cur.append(line)

if cur and cur_path is not None and not is_excluded(cur_path):
    out.extend(cur)

dest.write_text("".join(out), encoding="utf-8")
