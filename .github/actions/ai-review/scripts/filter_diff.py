#!/usr/bin/env python3
from pathlib import Path
import fnmatch
import sys

if len(sys.argv) != 3:
    raise SystemExit("Usage: filter_diff.py <src_diff> <dest_diff>")

src = Path(sys.argv[1])
dest = Path(sys.argv[2])
raw = src.read_text(encoding="utf-8", errors="replace").splitlines(True)
excludes = [
    "*/package-lock.json",
    "*/pnpm-lock.yaml",
    "*/yarn.lock",
    "*/prisma/migrations/*",
    "*/Cargo.lock",
    "*/Gemfile.lock",
    "*/go.sum",
    "*/poetry.lock",
    "*/.next/*",
    "*/dist/*",
    "*/build/*",
]


def is_excluded(path: str) -> bool:
    return any(fnmatch.fnmatch(path, pat) for pat in excludes)


out = []
cur = []
cur_path = None

for line in raw:
    if line.startswith("diff --git "):
        if cur and (cur_path is None or not is_excluded(cur_path)):
            out.extend(cur)
        cur = []
        parts = line.strip().split(" ")
        if len(parts) >= 4:
            path_a = parts[2]
            cur_path = path_a[2:] if path_a.startswith("a/") else path_a
        else:
            cur_path = None
        cur.append(line)
    elif cur:
        cur.append(line)

if cur and (cur_path is None or not is_excluded(cur_path)):
    out.extend(cur)

dest.write_text("".join(out), encoding="utf-8")
