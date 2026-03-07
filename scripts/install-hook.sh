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
BASE_URL="https://raw.githubusercontent.com/eoash/token-dashboard/main/scripts"
REPO="eoash/token-dashboard"

echo "=== EO Studio Token Dashboard - Hook Installer ==="
echo ""

# 0. 필수 도구 확인
GIT_EMAIL=$(git config user.email 2>/dev/null || echo "")
if [ -z "$GIT_EMAIL" ]; then
  echo "[!] git config user.email 이 설정되어 있지 않습니다."
  echo "    먼저 실행: git config --global user.email \"your@eoeoeo.net\""
  exit 1
fi

if ! command -v gh &>/dev/null; then
  echo "[!] gh (GitHub CLI) 가 설치되어 있지 않습니다."
  echo "    설치: brew install gh && gh auth login"
  exit 1
fi

# gh 인증 확인
if ! gh auth status &>/dev/null 2>&1; then
  echo "[!] gh 인증이 필요합니다. 먼저 실행: gh auth login"
  exit 1
fi

USERNAME=$(echo "$GIT_EMAIL" | cut -d@ -f1)
echo "사용자: $GIT_EMAIL ($USERNAME)"
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

# 4. 과거 transcript backfill → JSON 생성 → GitHub repo push
echo "[3/3] 과거 transcript backfill 중..."

TRANSCRIPT_COUNT=$(find "$HOME/.claude/projects" -name "*.jsonl" 2>/dev/null | grep -v subagents | wc -l | tr -d ' ')

if [ "$TRANSCRIPT_COUNT" -gt 0 ]; then
  echo "      transcript 파일 ${TRANSCRIPT_COUNT}개 발견."

  # generate_backfill.py 다운로드 & 실행
  BACKFILL_SCRIPT=$(mktemp)
  curl -sL "$BASE_URL/generate_backfill.py" -o "$BACKFILL_SCRIPT"

  BACKFILL_JSON=$(mktemp)
  python3 "$BACKFILL_SCRIPT" --out "$BACKFILL_JSON"

  # JSON이 비어있지 않으면 GitHub에 push
  DATA_COUNT=$(python3 -c "import json; print(len(json.load(open('$BACKFILL_JSON'))['data']))" 2>/dev/null || echo "0")

  if [ "$DATA_COUNT" -gt 0 ]; then
    echo "      ${DATA_COUNT}개 레코드 생성. GitHub에 업로드 중..."

    # base64 인코딩
    if [[ "$OSTYPE" == "darwin"* ]]; then
      B64_CONTENT=$(base64 -i "$BACKFILL_JSON")
    else
      B64_CONTENT=$(base64 -w0 "$BACKFILL_JSON")
    fi

    # 기존 파일 SHA 확인 (업데이트 시 필요)
    EXISTING_SHA=$(gh api "repos/$REPO/contents/src/lib/backfill/$USERNAME.json" --jq '.sha' 2>/dev/null || echo "")

    if [ -n "$EXISTING_SHA" ]; then
      # 파일 업데이트
      gh api "repos/$REPO/contents/src/lib/backfill/$USERNAME.json" \
        -X PUT \
        -f message="backfill: $GIT_EMAIL 데이터 업데이트" \
        -f content="$B64_CONTENT" \
        -f sha="$EXISTING_SHA" \
        --silent
    else
      # 새 파일 생성
      gh api "repos/$REPO/contents/src/lib/backfill/$USERNAME.json" \
        -X PUT \
        -f message="backfill: $GIT_EMAIL 데이터 추가" \
        -f content="$B64_CONTENT" \
        --silent
    fi

    echo "      -> src/lib/backfill/$USERNAME.json 업로드 완료"
    echo "      -> Vercel 자동 재배포가 트리거됩니다."
  else
    echo "      파싱 가능한 데이터가 없습니다. 건너뜁니다."
  fi

  rm -f "$BACKFILL_SCRIPT" "$BACKFILL_JSON"
else
  echo "      과거 transcript가 없습니다. 건너뜁니다."
fi

echo ""
echo "=== 설치 완료 ==="
echo "사용자: $GIT_EMAIL"
echo "대시보드: https://token-dashboard-iota.vercel.app"
echo ""
echo "이제 Claude Code 세션이 끝날 때마다 토큰 사용량이 자동으로 수집됩니다."
echo "과거 데이터는 Vercel 재배포 후 대시보드에 표시됩니다."
