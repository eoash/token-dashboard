#!/bin/bash
# Token Dashboard - OTel Push Hook 설치 + 과거 데이터 Backfill
# 팀원 PC에서 실행하면 Claude Code 세션 종료 시 토큰 사용량을 자동 수집합니다.
# 기존 transcript가 있으면 과거 데이터도 자동으로 대시보드에 전송합니다.
#
# 필요: python3, curl, git (GitHub 계정 불필요)
#
# 사용법:
#   curl -sL https://raw.githubusercontent.com/eoash/token-dashboard/main/scripts/install-hook.sh | bash

set -e

# Windows 환경 감지 → Python UTF-8 모드 강제
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OS" == "Windows_NT" ]]; then
  export PYTHONUTF8=1
  export PYTHONIOENCODING=utf-8
  chcp.com 65001 > /dev/null 2>&1 || true
fi

HOOKS_DIR="$HOME/.claude/hooks"
SETTINGS="$HOME/.claude/settings.json"
HOOK_FILE="$HOOKS_DIR/otel_push.py"
BASE_URL="https://raw.githubusercontent.com/eoash/token-dashboard/main/scripts"
DASHBOARD_API="https://token-dashboard-iota.vercel.app/api/backfill"

echo "=== EO Studio Token Dashboard - Hook Installer ==="
echo ""

# 0. 필수 도구 확인
for cmd in python3 curl git; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "[!] $cmd 이 설치되어 있지 않습니다."
    exit 1
  fi
done

GIT_EMAIL=$(git config user.email 2>/dev/null || echo "")
if [ -z "$GIT_EMAIL" ] || ! echo "$GIT_EMAIL" | grep -q "@eoeoeo.net"; then
  if [ -n "$GIT_EMAIL" ]; then
    echo "현재 이메일: $GIT_EMAIL (eoeoeo.net이 아닙니다)"
  fi
  echo ""
  echo "본인의 @eoeoeo.net 이메일을 입력해주세요 (예: june)"
  printf "이메일 아이디: "
  read -r EMAIL_ID </dev/tty
  if [ -z "$EMAIL_ID" ]; then
    echo "[!] 이메일을 입력하지 않았습니다."
    exit 1
  fi
  GIT_EMAIL="${EMAIL_ID}@eoeoeo.net"
  git config --global user.email "$GIT_EMAIL"
  echo "-> git email 설정 완료: $GIT_EMAIL"
fi

echo "사용자: $GIT_EMAIL"
echo ""

# 1. hooks 디렉토리 생성
mkdir -p "$HOOKS_DIR"

# 2. hook 파일 다운로드
echo "[1/3] otel_push.py 다운로드 중..."
curl -sL "$BASE_URL/otel_push.py" -o "$HOOK_FILE"
chmod +x "$HOOK_FILE"
echo "      -> $HOOK_FILE"

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

# 4. 과거 transcript backfill → JSON 생성 → Dashboard API로 전송
echo "[3/3] 과거 transcript backfill 중..."

CLAUDE_DIR="$HOME/.claude/projects"
if [ ! -d "$CLAUDE_DIR" ]; then
  echo "      ~/.claude/projects 디렉토리가 없습니다. 건너뜁니다."
else
  TRANSCRIPT_COUNT=$(find "$CLAUDE_DIR" -name "*.jsonl" 2>/dev/null | grep -v subagents | wc -l | tr -d ' ')

  if [ "$TRANSCRIPT_COUNT" -gt 0 ]; then
    echo "      transcript 파일 ${TRANSCRIPT_COUNT}개 발견."

    # generate_backfill.py 다운로드 & 실행
    BACKFILL_SCRIPT=$(mktemp)
    BACKFILL_JSON=$(mktemp)
    curl -sL "$BASE_URL/generate_backfill.py" -o "$BACKFILL_SCRIPT"
    python3 "$BACKFILL_SCRIPT" --out "$BACKFILL_JSON"

    DATA_COUNT=$(python3 -c "import json; print(len(json.load(open('$BACKFILL_JSON'))['data']))" 2>/dev/null || echo "0")

    if [ "$DATA_COUNT" -gt 0 ]; then
      echo "      ${DATA_COUNT}개 레코드 생성. 대시보드로 전송 중..."

      # email 필드 추가해서 API에 POST
      PAYLOAD=$(python3 -c "
import json
with open('$BACKFILL_JSON') as f:
    data = json.load(f)
data['email'] = '$GIT_EMAIL'
print(json.dumps(data))
")

      RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$DASHBOARD_API" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD")

      HTTP_CODE=$(echo "$RESPONSE" | tail -1)
      BODY=$(echo "$RESPONSE" | head -1)

      if [ "$HTTP_CODE" = "200" ]; then
        echo "      -> 전송 완료! Vercel 재배포 후 대시보드에 표시됩니다."
      else
        echo "      -> 전송 실패 (HTTP $HTTP_CODE): $BODY"
        echo "      -> hook 설치는 완료되었습니다. 과거 데이터는 나중에 재시도 가능합니다."
      fi
    else
      echo "      파싱 가능한 데이터가 없습니다. 건너뜁니다."
    fi

    rm -f "$BACKFILL_SCRIPT" "$BACKFILL_JSON"
  else
    echo "      과거 transcript가 없습니다. 건너뜁니다."
  fi
fi

echo ""
echo "=== 설치 완료 ==="
echo "사용자: $GIT_EMAIL"
echo "대시보드: https://token-dashboard-iota.vercel.app"
echo ""
echo "이제 Claude Code 세션이 끝날 때마다 토큰 사용량이 자동으로 수집됩니다."
