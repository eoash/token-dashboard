"""
Backfill Audit — 유저별 데이터 품질 리포트
Usage: python3 scripts/backfill_audit.py
"""
import json
import os
from collections import defaultdict

BACKFILL_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "lib", "backfill")


def audit():
    if not os.path.isdir(BACKFILL_DIR):
        print("backfill 디렉토리 없음")
        return

    files = [f for f in os.listdir(BACKFILL_DIR) if f.endswith(".json")]
    print(f"{'User':<30s} | {'Records':>7s} | {'First':>10s} | {'Last':>10s} | {'Days':>4s} | {'Total Tokens':>15s}")
    print("-" * 90)

    for fname in sorted(files):
        path = os.path.join(BACKFILL_DIR, fname)
        with open(path) as f:
            data = json.load(f)

        records = data.get("data", [])
        if not records:
            print(f"{fname:<30s} | {'0':>7s} | {'N/A':>10s} | {'N/A':>10s} | {'0':>4s} | {'0':>15s}")
            continue

        dates = set()
        total_tokens = 0
        non_synthetic = 0
        for d in records:
            if d.get("model") == "<synthetic>":
                continue
            non_synthetic += 1
            dates.add(d["date"])
            total_tokens += d.get("input_tokens", 0) + d.get("output_tokens", 0) + d.get("cache_read_tokens", 0)

        first = min(dates) if dates else "N/A"
        last = max(dates) if dates else "N/A"
        days = len(dates)

        print(f"{fname:<30s} | {non_synthetic:>7d} | {first:>10s} | {last:>10s} | {days:>4d} | {total_tokens:>15,}")


if __name__ == "__main__":
    audit()
