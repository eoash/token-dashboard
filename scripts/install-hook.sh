#!/bin/bash
# Token Dashboard - OTel Push Hook 설치 + 과거 데이터 Backfill
# 팀원 PC에서 실행하면 Claude Code 세션 종료 시 토큰 사용량을 자동 수집합니다.
# 기존 transcript가 있으면 과거 데이터도 자동으로 전송합니다.
#
# 사용법:
#   curl -sL https://raw.githubusercontent.com/eoash/token-dashboard/main/scripts/install-hook.sh | bash

set -e

HOOKS_DIR="$HOME/.claude/hooks"
SETTINGS="$HOME/.claude/settings.json"
HOOK_FILE="$HOOKS_DIR/otel_push.py"
BACKFILL_FILE="$HOOKS_DIR/backfill_otel.py"
BASE_URL="https://raw.githubusercontent.com/eoash/token-dashboard/main/scripts"

echo "=== EO Studio Token Dashboard - Hook Installer ==="
echo ""

# 0. git email 확인
GIT_EMAIL=$(git config user.email 2>/dev/null || echo "")
if [ -z "$GIT_EMAIL" ]; then
  echo "[!] git config user.email 이 설정되어 있지 않습니다."
  echo "    먼저 실행: git config --global user.email \"your@eoeoeo.net\""
  exit 1
fi
echo "사용자: $GIT_EMAIL"
echo ""

# 1. hooks 디렉토리 생성
mkdir -p "$HOOKS_DIR"

# 2. 파일 다운로드
echo "[1/3] hook 파일 다운로드 중..."
curl -sL "$BASE_URL/otel_push.py" -o "$HOOK_FILE"
curl -sL "$BASE_URL/backfill_otel.py" -o "$BACKFILL_FILE"
chmod +x "$HOOK_FILE" "$BACKFILL_FILE"
echo "      -> $HOOK_FILE"
echo "      -> $BACKFILL_FILE"

# 3. settings.json에 Stop hook 등록
echo "[2/3] settings.json에 Stop hook 등록 중..."

if [ ! -f "$SETTINGS" ]; then
  cat > "$SETTINGS" << 'ENDJSON'
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.claude/hooks/otel_push.py"
          }
        ]
      }
    ]
  }
}
ENDJSON
  echo "      -> settings.json 새로 생성됨"
else
  if grep -q "otel_push" "$SETTINGS" 2>/dev/null; then
    echo "      -> 이미 등록되어 있습니다. 건너뜁니다."
  else
    python3 -c "
import json, os

path = os.path.expanduser('~/.claude/settings.json')

with open(path, 'r') as f:
    data = json.load(f)

hook_entry = {
    'hooks': [
        {
            'type': 'command',
            'command': 'python3 ~/.claude/hooks/otel_push.py'
        }
    ]
}

if 'hooks' not in data:
    data['hooks'] = {}
if 'Stop' not in data['hooks']:
    data['hooks']['Stop'] = []

data['hooks']['Stop'].append(hook_entry)

with open(path, 'w') as f:
    json.dump(data, f, indent=2)

print('      -> Stop hook 추가 완료')
"
  fi
fi

# 4. 과거 transcript backfill
echo "[3/3] 과거 transcript 데이터 backfill 중..."

TRANSCRIPT_COUNT=$(find "$HOME/.claude/projects" -name "*.jsonl" 2>/dev/null | grep -v subagents | wc -l | tr -d ' ')

if [ "$TRANSCRIPT_COUNT" -gt 0 ]; then
  echo "      transcript 파일 ${TRANSCRIPT_COUNT}개 발견. 전송 시작..."
  python3 "$BACKFILL_FILE" --push --quiet
else
  echo "      과거 transcript가 없습니다. 건너뜁니다."
fi

echo ""
echo "=== 설치 완료 ==="
echo "사용자: $GIT_EMAIL"
echo "대시보드: https://token-dashboard-iota.vercel.app"
echo ""
echo "이제 Claude Code 세션이 끝날 때마다 토큰 사용량이 자동으로 수집됩니다."
