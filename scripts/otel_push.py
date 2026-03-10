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
# Gemini CLI v0.33+ 표준 경로 복원 (v0.32 버그 우회 해제)
OTLP_METRICS_PATH = "/v1/metrics"

# 팀 메타데이터
SERVICE_NAME = "claude-code"
TEAM_NAME = "eostudio"


def parse_transcript(transcript_path: str) -> list[dict]:
    """transcript JSONL에서 assistant 메시지의 model/usage 추출 (message ID 중복 제거)

    Claude Code transcript는 하나의 API 호출에 대해 여러 JSONL 행을 기록
    (thinking block, tool_use block, text block 등). 같은 message.id는
    동일한 usage를 공유하므로 마지막 항목만 사용하여 2-4x 과다집계 방지.
    """
    # message ID별로 마지막 항목만 유지 (last-wins 전략)
    seen: dict[str, dict] = {}
    no_id_entries: list[dict] = []
    try:
        with open(transcript_path, "r", encoding="utf-8", errors="replace") as f:
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

                msg_id = msg.get("id")
                entry = {"model": model, "usage": usage}
                if msg_id:
                    seen[msg_id] = entry  # 같은 ID는 마지막 값으로 덮어쓰기
                else:
                    no_id_entries.append(entry)
    except (IOError, OSError):
        pass
    return list(seen.values()) + no_id_entries


def count_bash_commands(transcript_path: str):
    """transcript에서 git commit / gh pr create 실행 횟수 카운트 (fallback용)"""
    commits = 0
    prs = 0
    try:
        with open(transcript_path, "r", encoding="utf-8", errors="replace") as f:
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
                for block in record.get("message", {}).get("content", []):
                    if block.get("type") == "tool_use" and block.get("name") == "Bash":
                        cmd = block.get("input", {}).get("command", "")
                        if "git commit" in cmd:
                            commits += 1
                        if "gh pr create" in cmd:
                            prs += 1
    except (IOError, OSError):
        pass
    return commits, prs


def count_git_activity(transcript_path: str, user_email: str):
    """git log 기반 세션 중 실제 커밋 카운트.
    transcript 파일 생성 시점 이후의 커밋을 git history에서 직접 조회.
    Claude Code 밖에서 만든 커밋도 포함되므로 전 팀원 커버 가능.
    """
    import subprocess
    import datetime

    # 세션 시작 시간: transcript 파일 생성 시간
    try:
        stat = os.stat(transcript_path)
        start_time = getattr(stat, "st_birthtime", stat.st_ctime)
        start_iso = datetime.datetime.fromtimestamp(start_time).isoformat()
    except Exception:
        return 0

    # git log로 세션 중 커밋 카운트
    try:
        result = subprocess.run(
            ["git", "log", "--oneline", f"--after={start_iso}", f"--author={user_email}"],
            capture_output=True, text=True, timeout=5,
        )
        if result.returncode == 0 and result.stdout.strip():
            return len(result.stdout.strip().split("\n"))
    except Exception:
        pass
    return 0


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


def build_otlp_payload(totals: dict, costs: dict, user_email: str, session_id: str, commits: int = 0, prs: int = 0) -> dict:
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

    # 세션 카운트: otel_push.py 1회 실행 = 1 세션
    metrics.append({
        "name": "claude_code_session_count_total",
        "description": "Claude Code session count",
        "sum": {
            "dataPoints": [{
                "attributes": [
                    {"key": "user_email", "value": {"stringValue": user_email}},
                ],
                "timeUnixNano": str(now_ns),
                "startTimeUnixNano": str(now_ns),
                "asInt": "1",
            }],
            "aggregationTemporality": 1,
            "isMonotonic": True,
        },
    })

    if commits > 0:
        metrics.append({
            "name": "claude_code_commit_count_total",
            "description": "Git commits made during Claude Code sessions",
            "sum": {
                "dataPoints": [{
                    "attributes": [
                        {"key": "user_email", "value": {"stringValue": user_email}},
                    ],
                    "timeUnixNano": str(now_ns),
                    "startTimeUnixNano": str(now_ns),
                    "asInt": str(commits),
                }],
                "aggregationTemporality": 1,
                "isMonotonic": True,
            },
        })

    if prs > 0:
        metrics.append({
            "name": "claude_code_pull_request_count_total",
            "description": "Pull requests created during Claude Code sessions",
            "sum": {
                "dataPoints": [{
                    "attributes": [
                        {"key": "user_email", "value": {"stringValue": user_email}},
                    ],
                    "timeUnixNano": str(now_ns),
                    "startTimeUnixNano": str(now_ns),
                    "asInt": str(prs),
                }],
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


def sanitize_email(email: str) -> str:
    """중복 도메인 제거 (예: user@eoeoeo.net@eoeoeo.net → user@eoeoeo.net)"""
    at_count = email.count("@")
    if at_count > 1:
        parts = email.split("@")
        return f"{parts[0]}@{parts[-1]}"
    return email


def detect_user_email() -> str:
    """git config에서 이메일 추출"""
    try:
        import subprocess
        result = subprocess.run(
            ["git", "config", "user.email"],
            capture_output=True, text=True, timeout=5,
        )
        if result.returncode == 0 and result.stdout.strip():
            return sanitize_email(result.stdout.strip())
    except Exception:
        pass
    return "unknown"


BACKFILL_MARKER = os.path.expanduser("~/.claude/hooks/.backfill_v3_done")
BACKFILL_SCRIPT_URL = "https://raw.githubusercontent.com/eoash/token-dashboard/main/scripts/generate_backfill.py"
BACKFILL_API_URL = "https://token-dashboard-iota.vercel.app/api/backfill"


def maybe_rebackfill(user_email: str):
    """1회성 re-backfill: marker 파일이 없으면 최신 generate_backfill.py로 재생성 후 API에 전송"""
    if os.path.exists(BACKFILL_MARKER):
        return

    import subprocess
    import tempfile

    try:
        # 최신 generate_backfill.py 다운로드
        script_path = os.path.join(tempfile.gettempdir(), "generate_backfill_v2.py")
        urllib.request.urlretrieve(BACKFILL_SCRIPT_URL, script_path)

        # 실행하여 backfill JSON 생성
        out_path = os.path.join(tempfile.gettempdir(), "backfill_v2.json")
        subprocess.run(
            ["python3", script_path, "--out", out_path],
            capture_output=True, text=True, timeout=60,
        )

        if not os.path.exists(out_path):
            return

        with open(out_path, "r", encoding="utf-8") as f:
            backfill_data = json.load(f)

        if not backfill_data.get("data"):
            return

        # API에 POST
        backfill_data["email"] = user_email
        payload = json.dumps(backfill_data).encode("utf-8")
        req = urllib.request.Request(
            BACKFILL_API_URL,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            if resp.status == 200:
                # marker 파일 생성 — 다음부터 실행 안 함
                os.makedirs(os.path.dirname(BACKFILL_MARKER), exist_ok=True)
                with open(BACKFILL_MARKER, "w", encoding="utf-8") as m:
                    m.write("v3")
    except Exception:
        pass  # 실패해도 메인 로직에 영향 없음
    finally:
        for p in [script_path, out_path]:
            try:
                os.remove(p)
            except Exception:
                pass


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

    # 4. 사용자 이메일 (git activity 조회에 필요하므로 먼저 감지)
    user_email = detect_user_email()

    # 5. 커밋/PR 카운트
    #    git log 기반 (실제 커밋) vs transcript 기반 (Claude Code 내 커밋)
    #    둘 중 큰 값 사용 → git log가 더 정확하지만, fallback 보장
    git_commits = count_git_activity(transcript_path, user_email)
    transcript_commits, prs = count_bash_commands(transcript_path)
    commits = max(git_commits, transcript_commits)

    # 6. OTLP payload 생성 & 전송
    payload = build_otlp_payload(totals, costs, user_email, session_id, commits, prs)
    push_metrics(payload)

    # 7. 1회성 re-backfill
    maybe_rebackfill(user_email)


if __name__ == "__main__":
    main()
