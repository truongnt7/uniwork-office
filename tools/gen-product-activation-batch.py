#!/usr/bin/env python3
"""Generate product activation codes (plaintext for you → customers) + hashes for Hub.

Usage:
  python3 tools/gen-product-activation-batch.py 100000
  python3 tools/gen-product-activation-batch.py 100000 --prefix UW --plan personal

Writes (gitignored plaintext):
  docs/pricing/product-activation-codes-{N}.csv
  docs/pricing/product-activation-codes-{N}.xlsx   (if openpyxl available)
  docs/pricing/product-activation-codes-{N}-hashes.json  (Hub import — hashes only)

Plaintext column = mã anh gửi KH. code_hash = SHA-256("uniwork-trial-v1:" + normalized).
Do NOT commit the CSV/XLSX. Seed hashes to Cloud Hub via admin batch / SQL.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import secrets
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HASH_PREFIX = "uniwork-trial-v1:"


def normalize(raw: str) -> str:
    return "".join(c for c in raw.upper() if c.isalnum())


def hash_code(raw: str) -> str:
    return hashlib.sha256(f"{HASH_PREFIX}{normalize(raw)}".encode()).hexdigest()


def one_code(prefix: str) -> str:
    # 12 hex chars → UW-XXXX-XXXX-XXXX (enough entropy for 100k+)
    body = secrets.token_hex(6).upper()
    return f"{prefix}-{body[:4]}-{body[4:8]}-{body[8:12]}"


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("count", nargs="?", type=int, default=100_000)
    ap.add_argument("--prefix", default="UW", help="Code prefix (default UW)")
    ap.add_argument(
        "--plan",
        default="personal",
        help="Suggested Hub plan_id when importing (default personal)",
    )
    ap.add_argument(
        "--batch",
        default=None,
        help="Batch label stored in JSON metadata",
    )
    ap.add_argument("--no-xlsx", action="store_true", help="Skip Excel output")
    args = ap.parse_args()

    n = max(1, min(500_000, int(args.count)))
    prefix = "".join(c for c in args.prefix.upper() if c.isalnum())[:12] or "UW"
    batch = args.batch or f"product-{prefix.lower()}-{n}"

    out_dir = ROOT / "docs" / "pricing"
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"Generating {n:,} codes (prefix={prefix}, plan={args.plan})…", flush=True)
    t0 = time.time()

    codes: list[str] = []
    seen: set[str] = set()
    while len(codes) < n:
        c = one_code(prefix)
        key = normalize(c)
        if key in seen:
            continue
        seen.add(key)
        codes.append(c)
        if len(codes) % 20_000 == 0:
            print(f"  … {len(codes):,} / {n:,}", flush=True)

    rows = [{"i": i, "code": c, "hash": hash_code(c)} for i, c in enumerate(codes, 1)]

    csv_path = out_dir / f"product-activation-codes-{n}.csv"
    with csv_path.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["#", "Activation code", "Recipient (fill in)", "Notes", "SHA-256 hash", "plan_id"])
        for r in rows:
            w.writerow([r["i"], r["code"], "", "", r["hash"], args.plan])

    hash_path = out_dir / f"product-activation-codes-{n}-hashes.json"
    hash_path.write_text(
        json.dumps(
            {
                "version": 1,
                "count": n,
                "prefix": prefix,
                "hashPrefix": HASH_PREFIX,
                "planId": args.plan,
                "kind": "office",
                "batch": batch,
                "hashes": [
                    {"codeHash": r["hash"], "codeHint": f"••••{normalize(r['code'])[-4:]}"}
                    for r in rows
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    xlsx_path = None
    if not args.no_xlsx:
        try:
            from openpyxl import Workbook
        except ImportError:
            print("openpyxl not installed — skipped .xlsx (CSV is ready)", file=sys.stderr)
        else:
            xlsx_path = out_dir / f"product-activation-codes-{n}.xlsx"
            wb = Workbook(write_only=True)
            ws = wb.create_sheet("Activation codes")
            ws.append(["#", "Activation code", "Recipient (fill in)", "Notes", "SHA-256 hash", "plan_id"])
            for r in rows:
                ws.append([r["i"], r["code"], "", "", r["hash"], args.plan])
            wb.save(xlsx_path)

    elapsed = time.time() - t0
    print(f"Done in {elapsed:.1f}s")
    print(f"Plaintext CSV (ANH GỬI KH — giữ bí mật): {csv_path}")
    if xlsx_path:
        print(f"Plaintext Excel: {xlsx_path}")
    print(f"Hashes for Hub import: {hash_path}")
    print(f"Sample codes: {codes[0]}, {codes[1]}, {codes[2]}")
    print("Import Hub: Admin → codes/batch with planId=" + args.plan + " (or seed script).")


if __name__ == "__main__":
    main()
