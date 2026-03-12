# Token Dashboard - AI 도구 사용량 자동 수집 설치 (Windows PowerShell)
# Claude Code / Codex / Gemini CLI 토큰 사용량을 자동으로 대시보드에 수집합니다.
#
# 사용법:
#   powershell -Command "irm https://raw.githubusercontent.com/eoash/eoash/main/token-dashboard/scripts/install-hook.ps1 | iex"

$ErrorActionPreference = "Stop"

# Windows Python UTF-8 강제
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"

$HOOKS_DIR = "$env:USERPROFILE\.claude\hooks"
$SETTINGS = "$env:USERPROFILE\.claude\settings.json"
$HOOK_FILE = "$HOOKS_DIR\otel_push.py"
$BASE_URL = "https://raw.githubusercontent.com/eoash/eoash/main/token-dashboard/scripts"
$DASHBOARD_API = "https://token-dashboard-iota.vercel.app/api/backfill"
$OTEL_COLLECTOR = "https://otel-collector-production-2dac.up.railway.app"
$GEMINI_SETTINGS = "$env:USERPROFILE\.gemini\settings.json"
# python3 또는 python 실제 경로 감지 (Windows Store 스텁 우회)
$PYTHON_EXE = if (Get-Command python3 -ErrorAction SilentlyContinue) { "python3" } else { "python" }
# 자동 업데이트 hook 명령: bash가 없으므로 powershell로 실행
# UTF-8 강제 + python 경로 동적 감지
$HOOK_CMD = "powershell -NoProfile -Command `"`$env:PYTHONUTF8='1';`$env:PYTHONIOENCODING='utf-8';`$d=[Console]::In.ReadToEnd();Invoke-WebRequest -Uri '$BASE_URL/otel_push.py' -OutFile '$HOOK_FILE' -ErrorAction SilentlyContinue;`$d|$PYTHON_EXE '$HOOK_FILE'`""

Write-Host ""
Write-Host "  ╔═══════════════════════════════════════════════════════════╗"
Write-Host "  ║          EO Studio Token Dashboard Installer              ║"
Write-Host "  ╠═══════════════════════════════════════════════════════════╣"
Write-Host "  ║                                                           ║"
Write-Host "  ║  EO Studio 내부 전용 도구입니다.                         ║"
Write-Host "  ║  AI 도구(Claude/Codex/Gemini) 사용량만 수집하며,        ║"
Write-Host "  ║  코드·파일·개인정보는 일절 수집하지 않습니다.            ║"
Write-Host "  ║  모든 데이터는 EO Studio 내부 서버로만 전송됩니다.      ║"
Write-Host "  ║                                                           ║"
Write-Host "  ║  [!] 설치 중 아래 보안 경고가 뜰 수 있습니다:           ║"
Write-Host "  ║      • Windows SmartScreen 경고 → '추가 정보' → 실행    ║"
Write-Host "  ║      • 방화벽 네트워크 허용 요청 → 허용                  ║"
Write-Host "  ║      • Claude Code hook 승인 요청 → 허용                 ║"
Write-Host "  ║      모두 정상이며, EO Studio 대시보드 연동에 필요합니다 ║"
Write-Host "  ║                                                           ║"
Write-Host "  ║  대시보드: https://token-dashboard-iota.vercel.app        ║"
Write-Host "  ║  문의: 서현 (ash@eoeoeo.net)                              ║"
Write-Host "  ║                                                           ║"
Write-Host "  ╚═══════════════════════════════════════════════════════════╝"
Write-Host ""

# 0. 필수 도구 확인
foreach ($cmd in @($PYTHON_EXE, "curl", "git")) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        # python3이 없으면 python 시도
        if ($cmd -eq $PYTHON_EXE -and (Get-Command "python" -ErrorAction SilentlyContinue)) {
            Write-Host "[i] python3 대신 python 사용"
            $PYTHON_EXE = "python"
        } else {
            Write-Host "[!] $cmd 이 설치되어 있지 않습니다."
            exit 1
        }
    }
}

$GIT_EMAIL = git config user.email 2>$null
if (-not $GIT_EMAIL -or $GIT_EMAIL -notmatch "@eoeoeo\.net") {
    if ($GIT_EMAIL) {
        Write-Host "현재 이메일: $GIT_EMAIL (eoeoeo.net이 아닙니다)"
    }
    Write-Host ""
    Write-Host "본인의 @eoeoeo.net 이메일을 입력해주세요 (예: june)"
    $EMAIL_ID = Read-Host "이메일 아이디"
    if (-not $EMAIL_ID) {
        Write-Host "[!] 이메일을 입력하지 않았습니다."
        exit 1
    }
    if ($EMAIL_ID -match "@") {
        $GIT_EMAIL = $EMAIL_ID
    } else {
        $GIT_EMAIL = "${EMAIL_ID}@eoeoeo.net"
    }
    git config --global user.email $GIT_EMAIL
    Write-Host "-> git email 설정 완료: $GIT_EMAIL"
}

Write-Host "사용자: $GIT_EMAIL"

# 이메일을 파일로 저장 (git 없는 환경에서도 otel_push가 사용자를 식별하도록)
New-Item -ItemType Directory -Path $HOOKS_DIR -Force | Out-Null
[System.IO.File]::WriteAllText("$HOOKS_DIR\.otel_email", $GIT_EMAIL, [System.Text.Encoding]::UTF8)
Write-Host ""

# 1. hooks 디렉토리 생성
if (-not (Test-Path $HOOKS_DIR)) {
    New-Item -ItemType Directory -Path $HOOKS_DIR -Force | Out-Null
}

# 2. hook 파일 다운로드
Write-Host "[1/7] otel_push.py 다운로드 중..."
Invoke-WebRequest -Uri "$BASE_URL/otel_push.py" -OutFile $HOOK_FILE
Write-Host "      -> $HOOK_FILE"

# 3. settings.json에 Stop hook 등록
Write-Host "[2/7] Claude Code Stop hook 등록 중..."

$env:HOOK_CMD_ENV = $HOOK_CMD
$PYTHON_EXE -c @"
import json, os

path = os.path.expanduser('~/.claude/settings.json')
hook_cmd = os.environ['HOOK_CMD_ENV']

data = {}
if os.path.exists(path):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

if 'hooks' not in data:
    data['hooks'] = {}
if 'Stop' not in data['hooks']:
    data['hooks']['Stop'] = []

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

with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)
"@

# 4. 과거 transcript backfill
Write-Host "[3/7] 과거 transcript backfill 중..."

$CLAUDE_DIR = "$env:USERPROFILE\.claude\projects"
if (Test-Path $CLAUDE_DIR) {
    $transcripts = Get-ChildItem -Path $CLAUDE_DIR -Filter "*.jsonl" -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -notmatch "subagents" }
    $TRANSCRIPT_COUNT = ($transcripts | Measure-Object).Count

    if ($TRANSCRIPT_COUNT -gt 0) {
        Write-Host "      transcript 파일 ${TRANSCRIPT_COUNT}개 발견."

        $BACKFILL_SCRIPT = [System.IO.Path]::GetTempFileName() -replace '\.tmp$', '.py'
        $BACKFILL_JSON = [System.IO.Path]::GetTempFileName() -replace '\.tmp$', '.json'
        Invoke-WebRequest -Uri "$BASE_URL/generate_backfill.py" -OutFile $BACKFILL_SCRIPT
        $PYTHON_EXE $BACKFILL_SCRIPT --out $BACKFILL_JSON

        $DATA_COUNT = $PYTHON_EXE -c "import json; print(len(json.load(open(r'$BACKFILL_JSON', encoding='utf-8'))['data']))" 2>$null
        if (-not $DATA_COUNT) { $DATA_COUNT = "0" }

        if ([int]$DATA_COUNT -gt 0) {
            Write-Host "      ${DATA_COUNT}개 레코드 생성. 대시보드로 전송 중..."

            $PAYLOAD = $PYTHON_EXE -c @"
import json
with open(r'$BACKFILL_JSON', encoding='utf-8') as f:
    data = json.load(f)
data['email'] = '$GIT_EMAIL'
print(json.dumps(data))
"@

            try {
                $response = Invoke-WebRequest -Uri $DASHBOARD_API -Method POST -ContentType "application/json" -Body $PAYLOAD
                if ($response.StatusCode -eq 200) {
                    Write-Host "      -> 전송 완료! Vercel 재배포 후 대시보드에 표시됩니다."
                } else {
                    Write-Host "      -> 전송 실패 (HTTP $($response.StatusCode))"
                }
            } catch {
                Write-Host "      -> 전송 실패: $($_.Exception.Message)"
                Write-Host "      -> hook 설치는 완료되었습니다. 과거 데이터는 나중에 재시도 가능합니다."
            }
        } else {
            Write-Host "      파싱 가능한 데이터가 없습니다. 건너뜁니다."
        }

        Remove-Item -Path $BACKFILL_SCRIPT, $BACKFILL_JSON -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "      과거 transcript가 없습니다. 건너뜁니다."
    }
} else {
    Write-Host "      ~/.claude/projects 디렉토리가 없습니다. 건너뜁니다."
}

# 5. Codex CLI 세션 데이터 수집
Write-Host "[4/7] Codex CLI 데이터 수집 중..."

$CODEX_SESSIONS = "$env:USERPROFILE\.codex\sessions"
if (Test-Path $CODEX_SESSIONS) {
    $CODEX_SCRIPT = [System.IO.Path]::GetTempFileName() -replace '\.tmp$', '.py'
    Invoke-WebRequest -Uri "$BASE_URL/codex_push.py" -OutFile $CODEX_SCRIPT
    $PYTHON_EXE $CODEX_SCRIPT --email $GIT_EMAIL 2>&1 | ForEach-Object { "      $_" }
    Remove-Item -Path $CODEX_SCRIPT -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "      ~/.codex/sessions/ 없음. Codex를 사용하면 자동 수집됩니다."
}

# 6. Codex 자동 수집 + Hook 헬스체크 - Windows Task Scheduler (2시간마다)
Write-Host "[5/7] Codex 자동 수집 + Hook 헬스체크 스케줄 등록 중..."

$CODEX_PUSH_LOCAL = "$HOOKS_DIR\codex_push.py"
$HOOK_HEALTH_LOCAL = "$HOOKS_DIR\hook_health.py"
Invoke-WebRequest -Uri "$BASE_URL/codex_push.py" -OutFile $CODEX_PUSH_LOCAL
Invoke-WebRequest -Uri "$BASE_URL/hook_health.py" -OutFile $HOOK_HEALTH_LOCAL

$taskName = "EO-Codex-Push"
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

# $PYTHON_EXE 또는 python 경로
$pythonPath = (Get-Command $PYTHON_EXE -ErrorAction SilentlyContinue).Source
if (-not $pythonPath) { $pythonPath = (Get-Command python -ErrorAction SilentlyContinue).Source }

if ($pythonPath) {
    # 헬스체크 먼저 실행 후 Codex 수집
    $action = New-ScheduledTaskAction -Execute $pythonPath -Argument "`"$HOOK_HEALTH_LOCAL`"; $pythonPath `"$CODEX_PUSH_LOCAL`" --email `"$GIT_EMAIL`""
    $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 2)
    $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd

    if ($existingTask) {
        Set-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings | Out-Null
        Write-Host "      -> 기존 스케줄 업데이트 완료: 매 2시간마다 헬스체크 + 자동 수집"
    } else {
        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "EO Studio hook health check + Codex usage collector" | Out-Null
        Write-Host "      -> 스케줄 등록 완료: 매 2시간마다 헬스체크 + 자동 수집"
    }
} else {
    Write-Host "      [!] python 경로를 찾을 수 없어 스케줄 등록을 건너뜁니다."
}

# 7. Gemini CLI 텔레메트리 설정
Write-Host "[6/7] Gemini CLI 텔레메트리 설정 중..."

if (Get-Command gemini -ErrorAction SilentlyContinue) {
    $geminiDir = "$env:USERPROFILE\.gemini"
    if (-not (Test-Path $geminiDir)) {
        New-Item -ItemType Directory -Path $geminiDir -Force | Out-Null
    }

    $PYTHON_EXE -c @"
import json, os

path = os.path.expanduser('~/.gemini/settings.json')
otel_endpoint = '$OTEL_COLLECTOR'

data = {}
if os.path.exists(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except (json.JSONDecodeError, IOError):
        data = {}

existing = data.get('telemetry', {})
new_telemetry = {
    'enabled': True,
    'target': 'local',
    'otlpEndpoint': otel_endpoint,
    'otlpProtocol': 'http',
}

if existing.get('otlpEndpoint') == otel_endpoint:
    print('      -> 이미 설정되어 있습니다.')
else:
    data['telemetry'] = {**existing, **new_telemetry}
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    old_ep = existing.get('otlpEndpoint', '')
    if old_ep:
        print('      -> endpoint 업데이트: ' + old_ep + ' -> ' + otel_endpoint)
    else:
        print('      -> 텔레메트리 설정 완료: ' + otel_endpoint)
"@
} else {
    Write-Host "      Gemini CLI 미설치. 설치 후 install-hook.ps1를 다시 실행하면 자동 설정됩니다."
}

# 8. Gemini CLI 사용자 이메일 설정
Write-Host "[7/7] Gemini CLI 사용자 설정 중..."

if (Get-Command gemini -ErrorAction SilentlyContinue) {
    $PYTHON_EXE -c @"
import json, os

path = os.path.expanduser('~/.gemini/settings.json')
email = '$GIT_EMAIL'

data = {}
if os.path.exists(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except (json.JSONDecodeError, IOError):
        data = {}

if data.get('userEmail') == email:
    print('      -> 이미 설정되어 있습니다.')
else:
    data['userEmail'] = email
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print(f'      -> 사용자 이메일 설정: {email}')
"@
} else {
    Write-Host "      건너뜀 (Gemini CLI 미설치)"
}

Write-Host ""
Write-Host "=== 설치 완료 ==="
Write-Host "사용자: $GIT_EMAIL"
Write-Host "대시보드: https://token-dashboard-iota.vercel.app"
Write-Host ""
Write-Host "Claude Code: 세션 종료 시 자동 수집 (Stop hook)"
Write-Host "Codex CLI:   2시간마다 자동 수집 (Task Scheduler)"
Write-Host "Gemini CLI:  세션 중 실시간 전송 (네이티브 OTel)"
