#!/bin/bash
# Token Dashboard - OTel Push Hook 설치 스크립트
# 팀원 PC에서 실행하면 Claude Code 세션 종료 시 토큰 사용량을 자동 수집합니다.
#
# 사용법:
#   curl -sL https://raw.githubusercontent.com/eoash/token-dashboard/main/scripts/install-hook.sh | bash

set -e

HOOKS_DIR="$HOME/.claude/hooks"
SETTINGS="$HOME/.claude/settings.json"
HOOK_FILE="$HOOKS_DIR/otel_push.py"
HOOK_URL="https://raw.githubusercontent.com/eoash/token-dashboard/main/scripts/otel_push.py"

echo "=== EO Studio Token Dashboard - Hook Installer ==="
echo ""

# 1. hooks 디렉토리 생성
mkdir -p "$HOOKS_DIR"

# 2. otel_push.py 다운로드
echo "[1/2] otel_push.py 다운로드 중..."
curl -sL "$HOOK_URL" -o "$HOOK_FILE"
chmod +x "$HOOK_FILE"
echo "      -> $HOOK_FILE"

# 3. settings.json에 Stop hook 등록
echo "[2/2] settings.json에 Stop hook 등록 중..."

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

echo ""
echo "=== 설치 완료 ==="
echo "이제 Claude Code 세션이 끝날 때마다 토큰 사용량이 자동으로 수집됩니다."
echo ""
echo "확인: git config user.email 이 @eoeoeo.net 이메일인지 체크해주세요."
echo "      (대시보드에서 이메일로 팀원을 식별합니다)"
