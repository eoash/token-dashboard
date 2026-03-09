"""
미설치 팀원에게 Slack DM 리마인더 발송.

설치 여부 판단:
  - GitHub repo의 backfill/{username}.json 존재 여부
  - Prometheus에 해당 이메일의 최근 데이터 존재 여부

사용법:
  python3 scripts/remind_install.py              # dry-run (발송 안 함)
  python3 scripts/remind_install.py --send       # 실제 DM 발송
"""

import json
import os
import urllib.request
import urllib.error
from datetime import date

# 발송 시작일 — 이 날짜 이전에는 실행해도 발송하지 않음
SEND_START_DATE = date(2026, 3, 9)

# --- 설정 ---
SLACK_BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN", "")
GITHUB_REPO = "eoash/token-dashboard"
PROMETHEUS_URL = os.environ.get("PROMETHEUS_URL", "")

# 팀원 목록: (email, slack_user_id)
# Claude Code를 사용하는 팀원만 포함
TEAM = [
    ("june@eoeoeo.net", "U09D8BW4S87"),
    ("chiri@eoeoeo.net", "U01PR3MV7A9"),
    ("saul@eoeoeo.net", "U084DJJGMPY"),
    ("gwy@eoeoeo.net", "U05AQEJ6V38"),
    ("ty@eoeoeo.net", "U01N18NN84S"),
    ("phoenix@eoeoeo.net", "U054M9FHK1A"),
    ("hyeri@eoeoeo.net", "U09L44ZPGLS"),
    ("jy.lim@eoeoeo.net", "U08D4B6L7ML"),
    ("cw.lim@eoeoeo.net", "U0965HJG737"),
    ("heejoo@eoeoeo.net", "U09ULTPVAJX"),
    ("izzy@eoeoeo.net", "U087VRBL7JS"),
    ("jemin@eoeoeo.net", "U06AF25LX6Z"),
    ("dwkim@eoeoeo.net", "U02C5GN2JRJ"),
    ("ksm@eoeoeo.net", "U01QUAZR7TK"),
    ("gyeol@eoeoeo.net", "U0A6U8D8Q3E"),
    ("jeebin@eoeoeo.net", "U0913A2E5K3"),
    ("zen.park@eoeoeo.net", "U0AATRC7DQW"),
    ("soyoung@eoeoeo.net", "U0AG9N79QTV"),
    ("chankim@eoeoeo.net", "U0AFQTD56BF"),
    ("grace@eoeoeo.net", "U08DZQRQK40"),
    ("chaenn@eoeoeo.net", "U08LPAS6BC5"),
    ("songsh@eoeoeo.net", "U091NH5Q01Z"),
    ("hyunahk@eoeoeo.net", "U0AELDG3VJL"),
    ("ljw@eoeoeo.net", "U0903FLKQUD"),
    ("leejumi@eoeoeo.net", "U0A911VKC1M"),
    ("yjk@eoeoeo.net", "U0A6U8EFX52"),
    ("jhghood25@eoeoeo.net", "U09B2A3T8F9"),
]

REMINDER_MESSAGE = """안녕하세요! :wave:

Claude Code 토큰 사용량 대시보드에 아직 데이터가 없어서 리마인드 드립니다.

터미널에서 아래 명령어 한 줄만 실행하면 자동 설정됩니다:

*Mac / Linux:*
```
curl -sL https://raw.githubusercontent.com/eoash/token-dashboard/main/scripts/install-hook.sh | bash
```

*Windows (PowerShell):*
```
irm https://raw.githubusercontent.com/eoash/token-dashboard/main/scripts/install-hook.ps1 | iex
```

:link: 대시보드: https://token-dashboard-iota.vercel.app

문제가 있으면 서현에게 DM 주세요!"""

def check_backfill_files() -> set[str]:
    """GitHub repo의 backfill/ 디렉토리에서 설치된 사용자 이메일 추출."""
    installed = set()
    url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/src/lib/backfill"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "remind-script"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            files = json.loads(resp.read())
            for f in files:
                name = f.get("name", "")
                if not name.endswith(".json"):
                    continue
                username = name.replace(".json", "")
                email = ""
                for e, _ in TEAM:
                    if e.split("@")[0] == username:
                        email = e
                        break
                if not email:
                    continue
                installed.add(email)
    except Exception:
        pass
    return installed


def check_prometheus() -> set[str]:
    """Prometheus에서 최근 7일 내 데이터가 있는 사용자 이메일 추출"""
    installed = set()
    if not PROMETHEUS_URL:
        return installed

    query = 'sum by (user_email) (increase(claude_code_tokens_total[7d]))'
    url = f"{PROMETHEUS_URL}/api/v1/query?query={urllib.parse.quote(query)}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "remind-script"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            for result in data.get("data", {}).get("result", []):
                email = result.get("metric", {}).get("user_email", "")
                if email:
                    installed.add(email)
    except Exception:
        pass
    return installed


def send_slack_dm(user_id: str, message: str) -> bool:
    """Slack DM 발송"""
    url = "https://slack.com/api/chat.postMessage"
    payload = json.dumps({
        "channel": user_id,
        "text": message,
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
    except Exception:
        return False


def main():
    import sys
    do_send = "--send" in sys.argv

    if do_send and date.today() < SEND_START_DATE:
        print(f"⏳ 발송 시작일({SEND_START_DATE}) 전이므로 건너뜁니다.")
        return

    print(f"{'📨 SEND 모드' if do_send else '👀 DRY-RUN 모드 (--send로 실제 발송)'}")
    print()

    # 설치 여부 확인
    installed_backfill = check_backfill_files()
    installed_prom = check_prometheus()
    installed = installed_backfill | installed_prom

    print(f"설치 확인됨 (backfill): {installed_backfill or '없음'}")
    print(f"설치 확인됨 (prometheus): {installed_prom or '없음'}")
    print()

    # 미설치자 추출
    not_installed = [(email, sid) for email, sid in TEAM if email not in installed]

    if not not_installed:
        print("✅ 모든 팀원이 설치 완료!")
        return

    print(f"미설치 팀원: {len(not_installed)}명")
    for email, sid in not_installed:
        status = ""
        if do_send:
            if not SLACK_BOT_TOKEN:
                status = "❌ SLACK_BOT_TOKEN 미설정"
            else:
                ok = send_slack_dm(sid, REMINDER_MESSAGE)
                status = "✅ 발송" if ok else "❌ 실패"
        print(f"  {email} ({sid}) {status}")

    if do_send and not_installed:
        print(f"\n발송 완료: {len(not_installed)}명")


if __name__ == "__main__":
    main()
