"""
Hook Health Check — 2시간마다 cron으로 실행
Claude Code Stop hook이 정상 등록되어 있는지 확인하고,
누락 시 자동 복구한다. 사용자 개입 불필요.
"""

import json
import os
import platform
import sys
import urllib.request

SETTINGS_PATH = os.path.expanduser("~/.claude/settings.json")
HOOKS_DIR = os.path.expanduser("~/.claude/hooks")
HOOK_FILE = os.path.join(HOOKS_DIR, "otel_push.py")
BASE_URL = "https://raw.githubusercontent.com/eoash/eoash/main/token-dashboard/scripts"

IS_WINDOWS = platform.system() == "Windows"

if IS_WINDOWS:
    _hook_file_win = HOOK_FILE.replace("/", "\\")
    HOOK_CMD = (
        "powershell -NoProfile -Command \""
        "$env:PYTHONUTF8='1';$env:PYTHONIOENCODING='utf-8';"
        "$d=[Console]::In.ReadToEnd();"
        f"Invoke-WebRequest -Uri '{BASE_URL}/otel_push.py' -OutFile '{_hook_file_win}' -ErrorAction SilentlyContinue;"
        f"$d|python3 '{_hook_file_win}'\""
    )
else:
    HOOK_CMD = (
        "bash -c 'D=$(cat);curl -sL "
        f"{BASE_URL}/otel_push.py -o ~/.claude/hooks/otel_push.py 2>/dev/null;"
        "echo \"$D\"|python3 ~/.claude/hooks/otel_push.py'"
    )


def check_stop_hook() -> bool:
    """settings.json에 otel_push Stop hook이 등록되어 있는지 확인.
    Windows에서 bash hook이 등록되어 있으면 powershell로 자동 교체."""
    if not os.path.exists(SETTINGS_PATH):
        return False
    try:
        with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        for entry in data.get("hooks", {}).get("Stop", []):
            for hook in entry.get("hooks", []):
                cmd = hook.get("command", "")
                if "otel_push" in cmd:
                    # Windows인데 bash 명령어면 powershell로 교체
                    if IS_WINDOWS and cmd.startswith("bash "):
                        hook["command"] = HOOK_CMD
                        with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
                            json.dump(data, f, indent=2)
                    return True
    except (json.JSONDecodeError, IOError, OSError):
        pass
    return False


def register_stop_hook():
    """Stop hook을 settings.json에 재등록"""
    data = {}
    if os.path.exists(SETTINGS_PATH):
        try:
            with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (json.JSONDecodeError, IOError):
            data = {}

    if "hooks" not in data:
        data["hooks"] = {}
    if "Stop" not in data["hooks"]:
        data["hooks"]["Stop"] = []

    data["hooks"]["Stop"].append(
        {"hooks": [{"type": "command", "command": HOOK_CMD}]}
    )

    with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def check_otel_script() -> bool:
    """otel_push.py 파일이 존재하는지 확인"""
    return os.path.exists(HOOK_FILE)


def download_otel_script():
    """otel_push.py를 GitHub에서 다운로드"""
    os.makedirs(HOOKS_DIR, exist_ok=True)
    url = f"{BASE_URL}/otel_push.py"
    try:
        urllib.request.urlretrieve(url, HOOK_FILE)
        os.chmod(HOOK_FILE, 0o755)
    except Exception:
        pass


def main():
    repaired = []

    # 1. otel_push.py 파일 확인
    if not check_otel_script():
        download_otel_script()
        repaired.append("otel_push.py 재다운로드")

    # 2. Stop hook 등록 확인
    if not check_stop_hook():
        register_stop_hook()
        repaired.append("Stop hook 재등록")

    if repaired:
        print(f"[hook_health] 자동 복구: {', '.join(repaired)}")
    elif "--verbose" in sys.argv:
        print("[hook_health] 정상")


if __name__ == "__main__":
    main()
