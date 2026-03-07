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

HOOKS_DIR="$HOME/.claude/hooks"
SETTINGS="$HOME/.claude/settings.json"
HOOK_FILE="$HOOKS_DIR/otel_push.py"
BASE_URL="https://raw.githubusercontent.com/eoash/token-dashboard/main/scripts"
DASHBOARD_API="https://token-dashboard-iota.vercel.app/api/backfill"
# 자동 업데이트 hook 명령: 매 실행마다 GitHub에서 최신 otel_push.py를 다운로드 후 실행
HOOK_CMD="bash -c 'D=\$(cat);curl -sL $BASE_URL/otel_push.py -o ~/.claude/hooks/otel_push.py 2>/dev/null;echo \"\$D\"|python3 ~/.claude/hooks/otel_push.py'"

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
  # 풀 이메일 입력 시 중복 도메인 방지
  if echo "$EMAIL_ID" | grep -q "@"; then
    GIT_EMAIL="$EMAIL_ID"
  else
    GIT_EMAIL="${EMAIL_ID}@eoeoeo.net"
  fi
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

# 3. settings.json에 Stop hook 등록 (자동 업데이트 명령)
echo "[2/3] settings.json에 Stop hook 등록 중..."

python3 -c "
import json, os

path = os.path.expanduser('~/.claude/settings.json')
hook_cmd = '''$HOOK_CMD'''

# settings.json 읽기 (없으면 빈 객체)
data = {}
if os.path.exists(path):
    with open(path, 'r') as f:
        data = json.load(f)

if 'hooks' not in data:
    data['hooks'] = {}
if 'Stop' not in data['hooks']:
    data['hooks']['Stop'] = []

# 기존 otel_push 항목 찾아서 command 업데이트, 없으면 추가
updated = False
for entry in data['hooks']['Stop']:
    for hook in entry.get('hooks', []):
        if 'otel_push' in hook.get('command', ''):
            old_cmd = hook['command']
            hook['command'] = hook_cmd
            updated = True
            if old_cmd != hook_cmd:
                print('      -> 기존 hook 명령 업데이트 완료 (자동 업데이트 활성화)')
            else:
                print('      -> 이미 최신 상태입니다.')

if not updated:
    data['hooks']['Stop'].append({
        'hooks': [{'type': 'command', 'command': hook_cmd}]
    })
    print('      -> Stop hook 새로 추가 완료')

with open(path, 'w') as f:
    json.dump(data, f, indent=2)
"

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

# 5. Codex CLI 세션 데이터 수집 (1회 즉시 실행)
echo "[4/5] Codex CLI 데이터 수집 중..."

CODEX_SESSIONS="$HOME/.codex/sessions"
if [ -d "$CODEX_SESSIONS" ]; then
  CODEX_SCRIPT=$(mktemp)
  curl -sL "$BASE_URL/codex_push.py" -o "$CODEX_SCRIPT"
  python3 "$CODEX_SCRIPT" --email "$GIT_EMAIL" 2>&1 | sed 's/^/      /'
  rm -f "$CODEX_SCRIPT"
else
  echo "      ~/.codex/sessions/ 없음. Codex를 사용하면 자동 수집됩니다."
fi

# 6. Codex 자동 수집 cron 등록 (2시간마다)
echo "[5/5] Codex 자동 수집 cron 등록 중..."

CODEX_PUSH_LOCAL="$HOOKS_DIR/codex_push.py"
curl -sL "$BASE_URL/codex_push.py" -o "$CODEX_PUSH_LOCAL"
chmod +x "$CODEX_PUSH_LOCAL"

# cron 명령: 실행 전 최신 스크립트 다운로드 후 실행
CRON_CMD="curl -sL $BASE_URL/codex_push.py -o $CODEX_PUSH_LOCAL 2>/dev/null; python3 $CODEX_PUSH_LOCAL --email $GIT_EMAIL"
CRON_LINE="0 */2 * * * $CRON_CMD # eo-codex-push"

# 기존 eo-codex-push cron 제거 후 새로 등록 (temp file 방식 — zsh/bash 호환)
CRON_TMP=$(mktemp)
crontab -l > "$CRON_TMP" 2>/dev/null
grep -v "eo-codex-push" "$CRON_TMP" > "${CRON_TMP}.new" 2>/dev/null
echo "$CRON_LINE" >> "${CRON_TMP}.new"
crontab "${CRON_TMP}.new"
rm -f "$CRON_TMP" "${CRON_TMP}.new"
echo "      -> cron 등록 완료: 매 2시간마다 자동 수집"

echo ""
echo "=== 설치 완료 ==="
echo "사용자: $GIT_EMAIL"
echo "대시보드: https://token-dashboard-iota.vercel.app"
echo ""
echo "Claude Code: 세션 종료 시 자동 수집"
echo "Codex CLI:   2시간마다 자동 수집 (cron)"
