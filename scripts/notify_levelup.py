"""
레벨업 알림: 레벨 변동 감지 → Slack 채널 공지.

동작 방식:
  1. Analytics API에서 전체 데이터 조회
  2. 유저별 XP → 레벨 계산 (gamification.ts와 동일 공식)
  3. level-state.json과 비교하여 레벨업 감지
  4. 레벨업한 유저가 있으면 Slack 채널에 축하 메시지 발송
  5. level-state.json 업데이트

사용법:
  python3 scripts/notify_levelup.py              # dry-run
  python3 scripts/notify_levelup.py --send       # 실제 발송
"""

import json
import os
import sys
import urllib.request
import urllib.error
from datetime import date, datetime
from pathlib import Path

# --- 설정 ---
SLACK_BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN", "")
SLACK_CHANNEL = "C0ADUGUNV99"
API_URL = "https://token-dashboard-iota.vercel.app/api/analytics?days=365"
STATE_FILE = Path(__file__).parent / "level-state.json"

# --- 레벨 테이블 (gamification.ts와 동기화 필수) ---
LEVELS = [
    (1, 0,          "Scout",        "📡", "[LOG] New scout detected. Awaiting first contact."),
    (2, 15_000,     "Ranger",       "🛰️", "[LOG] Basic tools acquired. Field operations authorized."),
    (3, 80_000,     "Explorer",     "🌍", "[LOG] Explorer protocol active. Mapping uncharted territory."),
    (4, 300_000,    "Pathfinder",   "🧬", "[LOG] Unique path divergence detected. Self-navigation engaged."),
    (5, 1_000_000,  "Pioneer",      "☄️", "[LOG] Breakthrough pattern identified. New methods emerging."),
    (6, 3_000_000,  "Vanguard",     "🚀", "[LOG] Vanguard status confirmed. Leading expedition team."),
    (7, 10_000_000, "Trailblazer",  "🌌", "[LOG] ⚠ Anomaly: Subject producing AI-native artifacts."),
    (8, 50_000_000, "AI Native",    "✦",  "[LOG] ★ Transformation complete. Human-AI boundary dissolved."),
]
AUTO_LEVEL_CAP = 6

# --- XP Decay ---
DECAY_GRACE_DAYS = 7
DECAY_RATE = 0.01

# --- 이름 매핑 (constants.ts EMAIL_TO_NAME과 동기화) ---
EMAIL_TO_NAME = {
    "ash@eoeoeo.net": "Ash",
    "chiri@eoeoeo.net": "Chiri",
    "cw.lim@eoeoeo.net": "CW",
    "izzy@eoeoeo.net": "Izzy",
    "jemin@eoeoeo.net": "Jemin",
    "june@eoeoeo.net": "June",
    "jy.lim@eoeoeo.net": "JY",
    "songsh@eoeoeo.net": "Song",
    "chaenn@eoeoeo.net": "Chaenn",
    "chanhee@eoeoeo.net": "Chanhee",
    "grace@eoeoeo.net": "Grace",
    "hyunahk@eoeoeo.net": "Hyunah",
}


def fetch_analytics() -> list[dict]:
    """Analytics API에서 전체 데이터 조회."""
    req = urllib.request.Request(API_URL, headers={"User-Agent": "levelup-notify"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = json.loads(resp.read())
        # API returns { data: [...], _source, ... }
        return body["data"] if isinstance(body, dict) else body


def detect_tool(model: str) -> str:
    if model.startswith("gpt"):
        return "codex"
    if model.startswith("gemini"):
        return "gemini"
    return "claude"


def calc_max_streak(dates: list[str]) -> int:
    """최대 연속 사용일 계산."""
    if not dates:
        return 0
    sorted_dates = sorted(set(dates))
    max_streak = 1
    current = 1
    for i in range(1, len(sorted_dates)):
        prev = datetime.strptime(sorted_dates[i - 1], "%Y-%m-%d")
        curr = datetime.strptime(sorted_dates[i], "%Y-%m-%d")
        diff = (curr - prev).days
        if diff == 1:
            current += 1
            max_streak = max(max_streak, current)
        else:
            current = 1
    return max_streak


def get_level(xp: int) -> tuple[int, str, str, str]:
    """XP로 레벨 결정. (level, title, icon, log) 반환."""
    result = LEVELS[0]
    for lv_num, required_xp, title, icon, log in LEVELS:
        if xp < required_xp:
            break
        if lv_num > AUTO_LEVEL_CAP:
            break
        result = (lv_num, required_xp, title, icon, log)
    return (result[0], result[2], result[3], result[4])


def build_user_levels(data: list[dict]) -> dict[str, dict]:
    """유저별 XP → 레벨 계산. gamification.ts buildProfiles()와 동일 공식."""
    users: dict[str, dict] = {}

    for d in data:
        actor = d.get("actor", {})
        email = (actor.get("email_address") or actor.get("id", "")).lower()
        if not email:
            continue

        if email not in users:
            users[email] = {
                "tokens": 0, "commits": 0, "prs": 0,
                "dates": set(), "tools": set(), "models": set(),
            }

        u = users[email]
        u["tokens"] += d.get("input_tokens", 0) + d.get("output_tokens", 0) + d.get("cache_read_tokens", 0)
        u["commits"] += d.get("commits", 0)
        u["prs"] += d.get("pull_requests", 0)
        if d.get("date"):
            u["dates"].add(d["date"])
        u["tools"].add(detect_tool(d.get("model", "")))
        u["models"].add(d.get("model", ""))

    results = {}
    today = date.today()

    for email, u in users.items():
        active_days = len(u["dates"])
        max_streak = calc_max_streak(list(u["dates"]))

        # XP 계산 (gamification.ts와 동일)
        token_xp = u["tokens"] // 10_000
        day_xp = active_days * 50
        commit_xp = u["commits"] * 10
        pr_xp = u["prs"] * 30
        streak_bonus = int(max(0, max_streak - 2) * 50 * 0.5)
        raw_xp = token_xp + day_xp + commit_xp + pr_xp + streak_bonus

        # Decay 적용
        sorted_dates = sorted(u["dates"])
        if sorted_dates:
            last_active = datetime.strptime(sorted_dates[-1], "%Y-%m-%d").date()
            days_since = (today - last_active).days
        else:
            days_since = 0

        if days_since > DECAY_GRACE_DAYS:
            decay_days = days_since - DECAY_GRACE_DAYS
            xp = int(raw_xp * ((1 - DECAY_RATE) ** decay_days))
        else:
            xp = raw_xp

        lv_num, title, icon, log = get_level(xp)
        name = EMAIL_TO_NAME.get(email, email.split("@")[0])

        results[email] = {
            "name": name,
            "level": lv_num,
            "title": title,
            "icon": icon,
            "log": log,
            "xp": xp,
        }

    return results


def load_state() -> dict:
    """이전 레벨 상태 로드."""
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    return {}


def save_state(state: dict) -> None:
    """레벨 상태 저장."""
    STATE_FILE.write_text(
        json.dumps(state, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def detect_levelups(current: dict[str, dict], prev_state: dict) -> list[dict]:
    """레벨업 감지. 새 유저 포함."""
    levelups = []
    for email, info in current.items():
        prev_level = prev_state.get(email, 0)
        if info["level"] > prev_level:
            levelups.append({
                "email": email,
                "name": info["name"],
                "prev_level": prev_level,
                "new_level": info["level"],
                "title": info["title"],
                "icon": info["icon"],
                "log": info["log"],
                "xp": info["xp"],
            })
    return levelups


def send_slack_message(text: str) -> bool:
    """Slack 채널에 메시지 발송."""
    url = "https://slack.com/api/chat.postMessage"
    payload = json.dumps({
        "channel": SLACK_CHANNEL,
        "text": text,
        "unfurl_links": False,
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {SLACK_BOT_TOKEN}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read())
            return result.get("ok", False)
    except Exception as e:
        print(f"  ❌ Slack 전송 실패: {e}")
        return False


def format_levelup_message(lu: dict) -> str:
    """레벨업 축하 메시지 포맷."""
    return (
        f"🎉 *{lu['name']}* 님이 {lu['icon']} *Lv.{lu['new_level']} {lu['title']}* 에 도달했습니다!\n"
        f"> {lu['log']}\n"
        f"📊 <https://token-dashboard-iota.vercel.app/rank|대시보드에서 확인>"
    )


def main():
    do_send = "--send" in sys.argv

    print(f"{'📨 SEND 모드' if do_send else '👀 DRY-RUN 모드 (--send로 실제 발송)'}")
    print()

    # 1. 데이터 조회
    print("📡 Analytics API 조회 중...")
    try:
        data = fetch_analytics()
    except Exception as e:
        print(f"❌ API 조회 실패: {e}")
        return
    print(f"   {len(data)}건 로드")

    # 2. 레벨 계산
    current = build_user_levels(data)
    print(f"\n👥 유저 {len(current)}명 레벨 계산 완료:")
    for email, info in sorted(current.items(), key=lambda x: -x[1]["xp"]):
        print(f"   {info['icon']} Lv.{info['level']} {info['title']:12s} — {info['name']:10s} (XP: {info['xp']:>12,})")

    # 3. 이전 상태와 비교
    prev_state = load_state()
    levelups = detect_levelups(current, prev_state)

    # Lv.1 첫 등장은 알림 제외 (Scout는 기본 레벨)
    levelups = [lu for lu in levelups if lu["new_level"] >= 2]

    if not levelups:
        print("\n✅ 레벨 변동 없음")
    else:
        print(f"\n🆙 레벨업 감지: {len(levelups)}건")
        for lu in levelups:
            prev_str = f"Lv.{lu['prev_level']}" if lu["prev_level"] > 0 else "신규"
            print(f"   {lu['name']}: {prev_str} → Lv.{lu['new_level']} {lu['title']}")

            if do_send:
                if not SLACK_BOT_TOKEN:
                    print("   ❌ SLACK_BOT_TOKEN 미설정")
                else:
                    msg = format_levelup_message(lu)
                    ok = send_slack_message(msg)
                    print(f"   {'✅ Slack 발송 완료' if ok else '❌ Slack 발송 실패'}")

    # 4. 상태 저장
    new_state = {email: info["level"] for email, info in current.items()}
    save_state(new_state)
    print(f"\n💾 level-state.json 업데이트 완료")


if __name__ == "__main__":
    main()
