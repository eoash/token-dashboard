"""
OTel Push - Stop Hook
Claude Code 세션 종료 시 transcript JSONL을 파싱하여
토큰 사용량을 OTel Collector로 push한다.

내장 텔레메트리의 모델명 오보고 버그를 우회하여 정확한 데이터를 전송.
"""

import json
import os
import sys
import urllib.request
import urllib.error
from collections import defaultdict

OTEL_ENDPOINT = "https://otel-collector-production-2dac.up.railway.app"
OTLP_METRICS_PATH = "/v1/metrics"

# 팀 메타데이터
SERVICE_NAME = "claude-code"
TEAM_NAME = "eostudio"


def parse_transcript(transcript_path: str) -> list[dict]:
    """transcript JSONL에서 assistant 메시지의 model/usage 추출"""
    entries = []
    try:
        with open(transcript_path, "r") as f:
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

                msg = record.get("message", {})
                model = msg.get("model")
                usage = msg.get("usage")
                if not model or not usage:
                    continue

                entries.append({"model": model, "usage": usage})
    except (IOError, OSError):
        pass
    return entries


def aggregate_tokens(entries: list[dict]) -> dict:
    """모델별, 토큰 타입별 합산"""
    # key: (model, token_type) -> sum
    totals = defaultdict(int)

    for e in entries:
        model = e["model"]
        usage = e["usage"]

        totals[(model, "input")] += usage.get("input_tokens", 0)
        totals[(model, "output")] += usage.get("output_tokens", 0)
        totals[(model, "cache_read")] += usage.get("cache_read_input_tokens", 0)
        totals[(model, "cache_creation")] += usage.get("cache_creation_input_tokens", 0)

    return dict(totals)


def estimate_cost(totals: dict) -> dict:
    """모델별 비용 추정 (USD). 가격은 2026-03 기준 근사치."""
    # per 1M tokens
    pricing = {
        "claude-opus-4-6": {"input": 15.0, "output": 75.0, "cache_read": 1.5, "cache_creation": 18.75},
        "claude-sonnet-4-6": {"input": 3.0, "output": 15.0, "cache_read": 0.3, "cache_creation": 3.75},
        "claude-haiku-4-5": {"input": 0.8, "output": 4.0, "cache_read": 0.08, "cache_creation": 1.0},
    }
    # fallback: sonnet pricing
    default_price = pricing["claude-sonnet-4-6"]

    costs = defaultdict(float)
    for (model, token_type), count in totals.items():
        price_map = pricing.get(model, default_price)
        rate = price_map.get(token_type, price_map.get("input", 3.0))
        costs[model] += (count / 1_000_000) * rate

    return dict(costs)


def build_otlp_payload(totals: dict, costs: dict, user_email: str, session_id: str) -> dict:
    """OTLP JSON 형식의 메트릭 payload 생성"""
    import time

    now_ns = int(time.time() * 1e9)

    # 토큰 메트릭 데이터 포인트
    token_data_points = []
    for (model, token_type), count in totals.items():
        if count == 0:
            continue
        token_data_points.append({
            "attributes": [
                {"key": "model", "value": {"stringValue": model}},
                {"key": "token_type", "value": {"stringValue": token_type}},
                {"key": "user_email", "value": {"stringValue": user_email}},
            ],
            "timeUnixNano": str(now_ns),
            "startTimeUnixNano": str(now_ns),
            "asInt": str(count),
        })

    # 비용 메트릭 데이터 포인트
    cost_data_points = []
    for model, cost in costs.items():
        if cost == 0:
            continue
        cost_data_points.append({
            "attributes": [
                {"key": "model", "value": {"stringValue": model}},
                {"key": "user_email", "value": {"stringValue": user_email}},
            ],
            "timeUnixNano": str(now_ns),
            "startTimeUnixNano": str(now_ns),
            "asDouble": round(cost, 6),
        })

    metrics = []
    if token_data_points:
        metrics.append({
            "name": "claude_code_tokens_total",
            "description": "Claude Code token usage per session",
            "sum": {
                "dataPoints": token_data_points,
                "aggregationTemporality": 1,  # DELTA
                "isMonotonic": True,
            },
        })
    if cost_data_points:
        metrics.append({
            "name": "claude_code_cost_total",
            "description": "Claude Code estimated cost per session (USD)",
            "sum": {
                "dataPoints": cost_data_points,
                "aggregationTemporality": 1,
                "isMonotonic": True,
            },
        })

    return {
        "resourceMetrics": [
            {
                "resource": {
                    "attributes": [
                        {"key": "service.name", "value": {"stringValue": SERVICE_NAME}},
                        {"key": "team.name", "value": {"stringValue": TEAM_NAME}},
                    ]
                },
                "scopeMetrics": [
                    {
                        "scope": {"name": "claude.code.stop-hook", "version": "1.0.0"},
                        "metrics": metrics,
                    }
                ],
            }
        ]
    }


def push_metrics(payload: dict) -> bool:
    """OTLP HTTP JSON으로 메트릭 전송"""
    url = OTEL_ENDPOINT + OTLP_METRICS_PATH
    data = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status == 200
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError):
        return False


def detect_user_email() -> str:
    """git config에서 이메일 추출"""
    try:
        import subprocess
        result = subprocess.run(
            ["git", "config", "user.email"],
            capture_output=True, text=True, timeout=5,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except Exception:
        pass
    return "unknown"


def main():
    # stdin에서 hook 데이터 읽기
    if sys.stdin.isatty():
        return

    stdin_data = sys.stdin.read().strip()
    if not stdin_data:
        return

    try:
        hook_data = json.loads(stdin_data)
    except json.JSONDecodeError:
        return

    transcript_path = hook_data.get("transcript_path")
    session_id = hook_data.get("session_id", "unknown")

    if not transcript_path or not os.path.exists(transcript_path):
        return

    # 1. transcript 파싱
    entries = parse_transcript(transcript_path)
    if not entries:
        return

    # 2. 토큰 합산
    totals = aggregate_tokens(entries)
    if not totals:
        return

    # 3. 비용 추정
    costs = estimate_cost(totals)

    # 4. 사용자 이메일
    user_email = detect_user_email()

    # 5. OTLP payload 생성 & 전송
    payload = build_otlp_payload(totals, costs, user_email, session_id)
    push_metrics(payload)


if __name__ == "__main__":
    main()
