#!/usr/bin/env python3
"""Generate trial activation codes → Excel (plaintext) + hash JSON for packaging.

Usage:
  python3 tools/gen-trial-activation-batch.py 100

Writes:
  docs/pricing/trial-activation-codes-{N}.xlsx  (gitignored)
  apps/shell/build/trial-activation-hashes.json (committed — hashes only)
"""
from __future__ import annotations

import argparse
import hashlib
import json
import secrets
import sys
from pathlib import Path

try:
    from openpyxl import Workbook
    from openpyxl.styles import Font
except ImportError:
    print("Need openpyxl: pip install openpyxl", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
PREFIX = "UWTRIAL"
HASH_PREFIX = "uniwork-trial-v1:"


def normalize(raw: str) -> str:
    return "".join(c for c in raw.upper() if c.isalnum())


def hash_code(raw: str) -> str:
    return hashlib.sha256(f"{HASH_PREFIX}{normalize(raw)}".encode()).hexdigest()


def one_code() -> str:
    body = secrets.token_hex(5).upper()
    return f"{PREFIX}-{body[:4]}-{body[4:8]}"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("count", nargs="?", type=int, default=100)
    args = ap.parse_args()
    n = max(1, min(500, args.count))

    codes: list[str] = []
    seen: set[str] = set()
    while len(codes) < n:
        c = one_code()
        key = normalize(c)
        if key in seen:
            continue
        seen.add(key)
        codes.append(c)

    hashes = [hash_code(c) for c in codes]

    xlsx = ROOT / "docs" / "pricing" / f"trial-activation-codes-{n}.xlsx"
    wb = Workbook()
    ws = wb.active
    ws.title = "Activation codes"
    ws.append(["#", "Activation code", "Recipient (fill in)", "Notes", "SHA-256 hash"])
    for i, c in enumerate(codes, 1):
        ws.append([i, c, "", "", hash_code(c)])
    for col, width in enumerate([6, 22, 28, 28, 70], 1):
        ws.column_dimensions[chr(64 + col)].width = width
    for cell in ws[1]:
        cell.font = Font(bold=True)
    ws.freeze_panes = "A2"
    wb.save(xlsx)

    txt = ROOT / "docs" / "pricing" / f"trial-activation-codes-{n}.txt"
    txt.write_text("\n".join(f"{i}\t{c}" for i, c in enumerate(codes, 1)) + "\n", encoding="utf-8")

    hash_path = ROOT / "apps" / "shell" / "build" / "trial-activation-hashes.json"
    hash_path.write_text(
        json.dumps(
            {
                "version": 1,
                "count": len(hashes),
                "prefix": PREFIX,
                "hashPrefix": HASH_PREFIX,
                "hashes": hashes,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    print(f"Wrote {xlsx} ({n} plaintext codes — keep private)")
    print(f"Wrote {txt}")
    print(f"Wrote {hash_path} ({len(hashes)} hashes — baked into trial on dist)")


if __name__ == "__main__":
    main()
