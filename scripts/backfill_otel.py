"""
Backfill OTel - 과거 transcript JSONL을 파싱하여 날짜별로 OTel Collector에 push.

사용법:
  python3 scripts/backfill_otel.py              # dry-run (전송 안 함)
  python3 scripts/backfill_otel.py --push       # 실제 전송
  python3 scripts/backfill_otel.py --push --since 2026-02-17  # 특정 날짜 이후만
"""

import json
import os
import sys
import glob
import urllib.request
import urllib.error
from collections import defaultdict
from datetime import datetime, timezone

OTEL_ENDPOINT = "https://otel-collector-production-2dac.up.railway.app"
OTLP_METRICS_PATH = "/v1/metrics"
SERVICE_NAME = "claude-code"
TEAM_NAME = "eostudio"
USER_EMAIL = "ash@eoeoeo.net"

TRANSCRIPT_BASE = os.path.expanduser("~/.claude/projects")


def find_transcripts():
    """메인 세션 transcript 파일 목록 (subagents 제외)"""
    files = []
    for pattern in [
        os.path.join(TRANSCRIPT_BASE, "*", "*.jsonl"),       # projects/proj/session.jsonl
        os.path.join(TRANSCRIPT_BASE, "*", "*", "*.jsonl"),  # projects/proj/sub/session.jsonl
    ]:
        files.extend(glob.glob(pattern))
    return [f for f in files if "/subagents/" not in f]


def parse_transcript(path: str) -> list[dict]:
    """transcript에서 (date, model, token_type, count) 추출"""
    results = []
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

                date = ts_str[:10]  # YYYY-MM-DD
                results.append({
                    "date": date,
                    "model": model,
                    "input": usage.get("input_tokens", 0),
                    "output": usage.get("output_tokens", 0),
                    "cache_read": usage.get("cache_read_input_tokens", 0),
                    "cache_creation": usage.get("cache_creation_input_tokens", 0),
                })
    except (IOError, OSError):
        pass
    return results


def aggregate_by_date(all_entries: list[dict]) -> dict:
    """날짜 × 모델 × 토큰타입 별 합산"""
    # {date: {(model, token_type): count}}
    by_date = defaultdict(lambda: defaultdict(int))

    for e in all_entries:
        date = e["date"]
        model = e["model"]
        by_date[date][(model, "input")] += e["input"]
        by_date[date][(model, "output")] += e["output"]
        by_date[date][(model, "cache_read")] += e["cache_read"]
        by_date[date][(model, "cache_creation")] += e["cache_creation"]

    return dict(by_date)


def build_payload(date: str, totals: dict) -> dict:
    """특정 날짜의 OTLP 메트릭 payload 생성"""
    # 해당 날짜 정오(UTC) 기준 타임스탬프
    dt = datetime.strptime(date, "%Y-%m-%d").replace(
        hour=12, tzinfo=timezone.utc
    )
    ts_ns = str(int(dt.timestamp() * 1e9))

    token_data_points = []
    for (model, token_type), count in totals.items():
        if count == 0:
            continue
        token_data_points.append({
            "attributes": [
                {"key": "model", "value": {"stringValue": model}},
                {"key": "token_type", "value": {"stringValue": token_type}},
                {"key": "user_email", "value": {"stringValue": USER_EMAIL}},
            ],
            "timeUnixNano": ts_ns,
            "startTimeUnixNano": ts_ns,
            "asInt": str(count),
        })

    if not token_data_points:
        return {}

    return {
        "resourceMetrics": [{
            "resource": {
                "attributes": [
                    {"key": "service.name", "value": {"stringValue": SERVICE_NAME}},
                    {"key": "team.name", "value": {"stringValue": TEAM_NAME}},
                ]
            },
            "scopeMetrics": [{
                "scope": {"name": "claude.code.stop-hook", "version": "1.0.0"},
                "metrics": [{
                    "name": "claude_code_tokens_total",
                    "description": "Claude Code token usage (backfill)",
                    "sum": {
                        "dataPoints": token_data_points,
                        "aggregationTemporality": 1,  # DELTA
                        "isMonotonic": True,
                    },
                }],
            }],
        }]
    }


def push_payload(payload: dict) -> tuple[bool, str]:
    """OTel Collector에 전송"""
    url = OTEL_ENDPOINT + OTLP_METRICS_PATH
    data = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(
        url, data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status == 200, f"HTTP {resp.status}"
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")[:200]
        return False, f"HTTP {e.code}: {body}"
    except Exception as e:
        return False, str(e)


def main():
    do_push = "--push" in sys.argv
    since = None
    for i, arg in enumerate(sys.argv):
        if arg == "--since" and i + 1 < len(sys.argv):
            since = sys.argv[i + 1]

    print(f"{'🚀 PUSH 모드' if do_push else '👀 DRY-RUN 모드 (--push로 실제 전송)'}")
    print()

    # 1. transcript 파일 수집
    files = find_transcripts()
    print(f"transcript 파일: {len(files)}개")

    # 2. 전체 파싱
    all_entries = []
    for f in files:
        all_entries.extend(parse_transcript(f))
    print(f"파싱된 메시지: {len(all_entries)}개")

    # 3. 날짜별 집계
    by_date = aggregate_by_date(all_entries)
    dates = sorted(by_date.keys())

    if since:
        dates = [d for d in dates if d >= since]

    if not dates:
        print("전송할 데이터가 없습니다.")
        return

    print(f"날짜 범위: {dates[0]} ~ {dates[-1]} ({len(dates)}일)")
    print()

    # 4. 날짜별 출력 / 전송
    total_tokens_all = 0
    success_count = 0

    for date in dates:
        totals = by_date[date]
        day_tokens = sum(v for v in totals.values())
        total_tokens_all += day_tokens

        # 모델별 요약
        models = defaultdict(int)
        for (model, _), count in totals.items():
            models[model] += count
        model_str = ", ".join(f"{m.split('-')[-1]}: {t:,}" for m, t in sorted(models.items(), key=lambda x: -x[1]))

        if do_push:
            payload = build_payload(date, totals)
            if payload:
                ok, msg = push_payload(payload)
                status = "✅" if ok else f"❌ {msg}"
                if ok:
                    success_count += 1
            else:
                status = "⏭️ skip (no data)"
            print(f"  {date}: {day_tokens:>12,} tokens  [{model_str}]  {status}")
        else:
            print(f"  {date}: {day_tokens:>12,} tokens  [{model_str}]")

    print()
    print(f"총 토큰: {total_tokens_all:,}")
    if do_push:
        print(f"전송 결과: {success_count}/{len(dates)} 성공")


if __name__ == "__main__":
    main()
