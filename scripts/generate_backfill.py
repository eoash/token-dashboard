"""
Generate Backfill JSON - transcript JSONL을 파싱하여 ClaudeCodeDataPoint[] 형태의 JSON 생성.

설치 스크립트에서 자동 호출됨.
출력: stdout에 JSON (install-hook.sh가 파일로 저장)

사용법:
  python3 generate_backfill.py                    # stdout JSON
  python3 generate_backfill.py --out result.json  # 파일로 저장
"""

import json
import os
import sys
import glob
import subprocess
from collections import defaultdict

TRANSCRIPT_BASE = os.path.expanduser("~/.claude/projects")


def detect_user_email() -> str:
    try:
        result = subprocess.run(
            ["git", "config", "user.email"],
            capture_output=True, text=True, timeout=5,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except Exception:
        pass
    return "unknown"


def find_transcripts():
    files = []
    for pattern in [
        os.path.join(TRANSCRIPT_BASE, "*", "*.jsonl"),
        os.path.join(TRANSCRIPT_BASE, "*", "*", "*.jsonl"),
    ]:
        files.extend(glob.glob(pattern))
    return [f for f in files if "/subagents/" not in f]


def parse_transcripts(files: list[str]) -> list[dict]:
    results = []
    for path in files:
        try:
            with open(path) as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        record = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    if record.get("type") != "assistant":
                        continue

                    ts_str = record.get("timestamp", "")
                    msg = record.get("message", {})
                    model = msg.get("model")
                    usage = msg.get("usage")

                    if not model or not usage or not ts_str:
                        continue

                    results.append({
                        "date": ts_str[:10],
                        "model": model,
                        "input_tokens": usage.get("input_tokens", 0),
                        "output_tokens": usage.get("output_tokens", 0),
                        "cache_read_tokens": usage.get("cache_read_input_tokens", 0),
                        "cache_creation_tokens": usage.get("cache_creation_input_tokens", 0),
                    })
        except (IOError, OSError):
            pass
    return results


def aggregate(entries: list[dict], email: str) -> list[dict]:
    """date × model 별 합산 → ClaudeCodeDataPoint[] 형태"""
    agg = defaultdict(lambda: {
        "input_tokens": 0, "output_tokens": 0,
        "cache_read_tokens": 0, "cache_creation_tokens": 0,
    })

    for e in entries:
        key = (e["date"], e["model"])
        agg[key]["input_tokens"] += e["input_tokens"]
        agg[key]["output_tokens"] += e["output_tokens"]
        agg[key]["cache_read_tokens"] += e["cache_read_tokens"]
        agg[key]["cache_creation_tokens"] += e["cache_creation_tokens"]

    data = []
    for (date, model), tokens in sorted(agg.items()):
        data.append({
            "actor": {
                "type": "user",
                "id": email,
                "email_address": email,
            },
            "model": model,
            "date": date,
            "session_count": 0,
            "lines_of_code": 0,
            "commits": 0,
            "pull_requests": 0,
            "tool_acceptance_rate": 0,
            **tokens,
        })

    return data


def main():
    email = detect_user_email()
    files = find_transcripts()

    if not files:
        print(json.dumps({"data": []}))
        return

    entries = parse_transcripts(files)
    if not entries:
        print(json.dumps({"data": []}))
        return

    data = aggregate(entries, email)

    out_path = None
    for i, arg in enumerate(sys.argv):
        if arg == "--out" and i + 1 < len(sys.argv):
            out_path = sys.argv[i + 1]

    result = json.dumps({"data": data}, ensure_ascii=False)

    if out_path:
        with open(out_path, "w") as f:
            f.write(result)
        dates = sorted(set(d["date"] for d in data))
        print(f"      {email}: {len(data)}개 레코드, {dates[0]} ~ {dates[-1]}")
    else:
        print(result)


if __name__ == "__main__":
    main()
