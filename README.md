# EO Studio — AI Token Dashboard

EO Studio 팀의 AI 코딩 도구 사용량을 실시간으로 모니터링하는 내부 대시보드입니다.
Claude Code / Codex 사용 현황을 팀원별·모델별·기간별로 추적합니다.

**Live →** https://token-dashboard-iota.vercel.app
**Repository →** https://github.com/eoash/token-dashboard

---

## 주요 기능

### Overview (`/`)
- **사용량 KPI**: Total Tokens, Cache Hit Rate, Active Users
- **생산성 KPI**: Avg Daily Sessions, Total Commits, Pull Requests
- **Top 3 Contributors**: 메달 카드 (골드/실버/브론즈)
- **일별 사용량 차트**: Input / Output / Cache 스택 영역 차트
- **모델별 파이 차트**: Opus / Sonnet / Haiku 비율

### Leaderboard (`/leaderboard`)
- **AI 도구 탭**: Claude Code / Codex 전환 (실데이터)
- **기간 필터**: Today / 7 Days / 30 Days / All Time
- **막대그래프**: 상위 3명 골드 하이라이트 + 평균선 + 하위 opacity 50%
- **Slack 프로필 아바타** 표시
- **30초 자동 갱신** (탭 포커스 시)

### Team (`/team`)
- 팀원 선택 드롭다운
- 개인별 KPI: 토큰, 비용, 세션, 커밋, PR
- 일별 사용 차트 + 모델 사용 비율

### Models (`/models`)
- 모델별 토큰/비용 집계 테이블
- 모델별 비용 추이 차트

### Utilization (`/utilization`)
- 토큰 사용량 추이 차트
- 팀원별·모델별 사용 분포

### Efficiency (`/efficiency`)
- Cache Hit Rate, Output Ratio, Cache Efficiency 분석
- 팀원별 효율성 비교

---

## 데이터 수집

### 추적 메트릭

| 메트릭 | 수집 방법 | 비고 |
|--------|----------|------|
| Input / Output / Cache Tokens | OTel (transcript 파싱) | 모델별 분리 |
| Sessions | otel_push.py 1회 실행 = 1세션 | |
| Commits | transcript에서 `git commit` 파싱 | |
| Pull Requests | transcript에서 `gh pr create` 파싱 | |
| Codex Tokens | codex_push.py (세션 로그 파싱) | cached + reasoning 포함 |

### 데이터 소스 (유저별 자동 분기)

각 유저의 backfill JSON에서 가장 마지막 날짜가 자동으로 cutoff가 됩니다.

| 구간 | 데이터 소스 | 설명 |
|------|-----------|------|
| cutoff 이전 | **Backfill JSON** (`src/lib/backfill/*.json`) | install-hook.sh 실행 시 transcript 파싱으로 생성 |
| cutoff 이후 | **Prometheus 실시간** | 세션 종료 시 hook이 자동 전송 |

---

## 팀원 설정 (1분)

대시보드에 **실제 사용량 데이터**를 표시하려면 각 팀원이 아래 명령어를 한 번만 실행합니다:

```bash
curl -sL https://raw.githubusercontent.com/eoash/token-dashboard/main/scripts/install-hook.sh | bash
```

### 설치 시 자동으로 수행되는 작업

| 단계 | 내용 |
|------|------|
| [1/5] | `otel_push.py` 다운로드 |
| [2/5] | Claude Code Stop hook 등록 (세션 종료 시 자동 수집) |
| [3/5] | 과거 transcript backfill → API 전송 |
| [4/5] | Codex CLI 세션 데이터 1회 수집 |
| [5/5] | Codex 자동 수집 cron 등록 (2시간마다) |

### 자동 수집 방식

| 도구 | 수집 트리거 | 방식 |
|------|-----------|------|
| Claude Code | 세션 종료 시 (Stop hook) | `otel_push.py` — transcript 파싱 → OTel 전송 |
| Codex CLI | 2시간마다 (cron) | `codex_push.py` — `~/.codex/sessions/` 파싱 → API 전송 |

### 참고사항

- GitHub 계정 불필요 — python3, curl, git만 있으면 OK
- hook/cron 모두 **자동 업데이트**: 실행할 때마다 GitHub에서 최신 스크립트를 다운로드
- 설치 제거: `rm ~/.claude/hooks/otel_push.py && crontab -l | grep -v eo-codex-push | crontab -`

---

## 시작하기 (개발)

### 1. 클론 및 설치

```bash
git clone https://github.com/eoash/token-dashboard.git
cd token-dashboard
npm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local`:
```env
PROMETHEUS_URL=https://prometheus-production-ae90.up.railway.app
```

> `PROMETHEUS_URL`이 없으면 Mock 모드로 자동 전환됩니다.

### 3. 로컬 실행

```bash
npm run dev
```

---

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx                  # Overview (/)
│   ├── leaderboard/page.tsx      # Leaderboard
│   ├── team/page.tsx             # Team
│   ├── models/page.tsx           # Models
│   ├── utilization/page.tsx      # Utilization
│   ├── efficiency/page.tsx       # Efficiency
│   └── api/
│       ├── analytics/route.ts    # GET /api/analytics?days=N
│       └── backfill/route.ts     # POST /api/backfill
├── components/
│   ├── layout/Sidebar.tsx        # 좌측 네비게이션
│   ├── cards/                    # KpiCard, TeamRankingCard
│   ├── charts/                   # Recharts 기반 차트
│   └── leaderboard/
│       └── LeaderboardTable.tsx  # 리더보드 (Claude + Codex 탭)
└── lib/
    ├── aggregators/              # overview, team, models, leaderboard, utilization, efficiency
    ├── backfill/                 # 유저별 backfill JSON (자동 생성)
    ├── hooks/useAnalytics.ts     # API fetch 공통 훅
    ├── prometheus.ts             # Prometheus PromQL 클라이언트
    ├── data-source.ts            # 데이터 소스 분기 (유저별 cutoff 자동 계산)
    ├── constants.ts              # 팀원, 모델, 색상 상수
    ├── types.ts                  # TypeScript 타입 정의
    └── utils.ts                  # 포맷팅 유틸리티

scripts/
├── install-hook.sh              # 팀원용 1분 설치 스크립트
├── otel_push.py                 # Claude Code Stop hook (transcript → OTel)
├── codex_push.py                # Codex 세션 로그 → API 전송
├── generate_backfill.py         # transcript → backfill JSON 생성
├── remind_install.py            # 미설치 팀원 Slack DM 리마인더 (cron 매일 13:00)
└── backfill_otel.py             # OTel 일괄 backfill 유틸리티
```

---

## 모니터링 인프라

```
Claude Code (Stop hook)
    ↓ otel_push.py → OTLP HTTP
OTel Collector (Railway)
    ↓ Prometheus remote_write
Prometheus (Railway)
    ↓ PromQL
Next.js Dashboard (Vercel)

Codex CLI (cron 2h)
    ↓ codex_push.py → REST API
Next.js Dashboard (Vercel) → backfill JSON
```

---

## 기술 스택

| 항목 | 기술 | 버전 |
|------|------|------|
| Framework | Next.js (App Router) | 16 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | v4 |
| Charts | Recharts | 3.x |
| Data | OTel + Prometheus + Backfill JSON | — |
| Deploy | Vercel (앱) + Railway (OTel, Prometheus) | — |

---

## 기여 가이드

이 레포는 **branch protection**이 적용되어 있습니다.

| 규칙 | 설정 |
|------|------|
| PR 필수 | 1명 이상 Approve |
| Force push | 차단 |
| Branch 삭제 | 차단 |

```bash
# 1. 새 브랜치 생성
git checkout -b feat/your-feature

# 2. 작업 후 커밋
git add .
git commit -m "feat: 기능 설명"

# 3. 원격에 push → GitHub에서 PR 생성
git push origin feat/your-feature
```

---

## 라이선스

Internal use only — EO Studio
