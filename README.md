# EO Studio — AI Token Dashboard

EO Studio 팀의 AI 코딩 도구 사용량을 실시간으로 모니터링하는 내부 대시보드입니다.
Claude Code / Gemini / ChatGPT 사용 현황을 팀원별·모델별·기간별로 추적합니다.

**Live →** https://token-dashboard-iota.vercel.app
**Repository →** https://github.com/eoash/token-dashboard

---

## 스크린샷

| Overview | Leaderboard |
|----------|-------------|
| KPI 카드, 일별 차트, 모델 파이 | 팀원 순위, 기간 필터, 비용 추이 |

---

## 주요 기능

### Overview (`/`)
- **사용량 KPI**: 총 토큰, 총 비용, 활성 사용자
- **생산성 KPI**: 일평균 세션, 수락된 코드 라인, 수락률, 커밋 수, PR 수 *(현재 미추적 — N/A 표시)*
- **일별 사용량 차트**: Input / Output / Cache 스택 영역 차트
- **모델별 파이 차트**: Opus / Sonnet / Haiku 비율

### Developer Leaderboard (`/leaderboard`)
- **AI 도구 탭**: Claude Code / Gemini / ChatGPT 전환
- **기간 필터**: Today / 7 Days / 30 Days / All Time (Claude Code만)
- **메트릭 토글**: Cost($) / Tokens 전환
- **컬럼**: 순위, 팀원, Input, Output, Cache, Total, 수락률, 세션/일, 비용+추이(↑↓)
- **30초 자동 갱신** (Claude Code)

### Team (`/team`)
- 팀원 선택 드롭다운
- 개인별 KPI: 토큰, 비용 *(세션, 수락률, 코드 라인, 커밋, PR은 현재 미추적)*
- 일별 사용 차트 + 모델 사용 비율

### Models (`/models`)
- 모델별 토큰/비용 집계 테이블
- 모델별 비용 추이 차트

### Costs (`/costs`)
- 총 비용, 일평균, 월말 예상 비용
- 비용 추이 차트 (프로젝션 포함)
- 팀원별·모델별 비용 분포

---

## Mock 모드

`PROMETHEUS_URL` 환경변수가 없으면 자동으로 Mock 모드로 전환됩니다.

| 도구 | 데이터 출처 |
|------|------------|
| Claude Code | `src/lib/mock-data.ts` — 5명 × 30일 시뮬레이션 |
| Gemini | `src/lib/mock-ai-tools.ts` — 팀원별 고정 샘플 |
| ChatGPT | `src/lib/mock-ai-tools.ts` — 팀원별 고정 샘플 |

---

## 팀원 설정 (Claude Code 사용량 수집)

대시보드에 **실제 사용량 데이터**를 표시하려면 Claude Code를 사용하는 팀원 각자가 아래 설정을 한 번만 실행해야 합니다.

> **왜 필요한가요?**
> Claude Code는 기본적으로 사용량 데이터를 외부로 전송하지 않습니다.
> 아래 설정을 하면 팀의 OTel Collector로 텔레메트리가 전송되고, 대시보드에 반영됩니다.

### 설치 방법 (1분)

터미널을 열고 아래 명령어를 복사-붙여넣기 후 엔터:

```bash
curl -s https://raw.githubusercontent.com/eoash/token-dashboard/main/docker/managed-settings.example.json > ~/.claude/managed-settings.json && echo "✅ 완료! Claude Code를 재시작하세요"
```

완료 메시지가 뜨면 **Claude Code를 재시작**하면 끝입니다.

### 설정 내용

이 명령어는 `~/.claude/managed-settings.json` 파일을 생성하며, Claude Code가 시작될 때 자동으로 읽습니다:

```json
{
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_LOGS_EXPORTER": "otlp",
    "OTEL_EXPORTER_OTLP_PROTOCOL": "http/protobuf",
    "OTEL_EXPORTER_OTLP_ENDPOINT": "https://otel-collector-production-2dac.up.railway.app",
    "OTEL_RESOURCE_ATTRIBUTES": "team.name=eostudio,user.email=your@email.com"
  }
}
```

### 주의사항

- **Claude Code를 사용하는 팀원만** 설정하면 됩니다 (대시보드 관리자는 불필요)
- 같은 머신에서 팀 플랜 + 개인 계정 둘 다 사용하면 **합산**되어 트래킹됩니다
- 설정 후 데이터가 대시보드에 반영되기까지 최대 **15분** 소요될 수 있습니다
- 설정 제거: `rm ~/.claude/managed-settings.json`

---

## 시작하기

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

`.env.local`에 아래 키를 입력합니다:

```env
# Prometheus URL (Railway에 배포된 Prometheus)
# 없으면 Mock 모드로 자동 동작
PROMETHEUS_URL=https://prometheus-production-ae90.up.railway.app
```

### 3. 로컬 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

---

## 팀원 추가 / 수정

`src/lib/constants.ts`의 `TEAM_MEMBERS`에서 팀원 목록을 관리합니다:

```ts
export const TEAM_MEMBERS: TeamMember[] = [
  { email: "ash@eoeoeo.net", name: "Seohyun" },
  { email: "ash@eostudio.tv", name: "Seohyun" },  // 같은 사람 복수 이메일 가능
  { email: "jay@eostudio.tv", name: "Jay" },
  // 여기에 추가
];
```

> - 이메일은 Claude Code에 로그인한 이메일과 일치해야 합니다
> - 같은 사람이 여러 이메일을 쓰면 같은 `name`으로 여러 줄 추가 → 자동 합산
> - 팀원 추가 시 **이메일 등록 + 해당 팀원 머신에 `managed-settings.json` 설치** 둘 다 필요

---

## 모델 추가

`src/lib/constants.ts`의 `MODEL_CONFIG`에 새 모델을 추가합니다:

```ts
export const MODEL_CONFIG: Record<string, ModelConfig> = {
  "claude-opus-4-6":           { label: "Opus 4.6",   color: "#E8FF47", inputPricePerMillion: 15,   outputPricePerMillion: 75   },
  "claude-sonnet-4-6":         { label: "Sonnet 4.6", color: "#3B82F6", inputPricePerMillion: 3,    outputPricePerMillion: 15   },
  "claude-haiku-4-5-20251001": { label: "Haiku 4.5",  color: "#10B981", inputPricePerMillion: 0.25, outputPricePerMillion: 1.25 },
  // 새 모델 추가 시 여기에 입력
};
```

---

## 모니터링 인프라 (Railway)

실제 사용량 데이터는 Railway에 배포된 OTel 파이프라인을 통해 수집됩니다.

```
Claude Code 클라이언트 (managed-settings.json)
    ↓ OTLP HTTP
OTel Collector (Railway) → otel-collector-production-2dac.up.railway.app
    ↓ Prometheus scrape
Prometheus (Railway)     → prometheus-production-ae90.up.railway.app
    ↓ PromQL
Next.js Dashboard (Vercel, PROMETHEUS_URL 환경변수)
```

| 서비스 | Dockerfile | Railway 환경변수 |
|--------|-----------|----------------|
| OTel Collector | `docker/otel-collector/Dockerfile` | `RAILWAY_DOCKERFILE_PATH`, `PORT=4317` |
| Prometheus | `docker/prom/Dockerfile` | `RAILWAY_DOCKERFILE_PATH`, `PORT=9090` |
| Grafana | `docker/docker-compose.yml` 참조 | — |

---

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx                  # Overview (/)
│   ├── leaderboard/page.tsx      # Leaderboard (/leaderboard)
│   ├── team/page.tsx             # Team (/team)
│   ├── models/page.tsx           # Models (/models)
│   ├── costs/page.tsx            # Costs (/costs)
│   └── api/
│       └── analytics/route.ts    # GET /api/analytics?days=N
├── components/
│   ├── layout/Sidebar.tsx        # 좌측 네비게이션
│   ├── cards/                    # KpiCard, TeamRankingCard
│   ├── charts/                   # Recharts 기반 차트 4종
│   └── leaderboard/
│       └── LeaderboardTable.tsx  # 리더보드 메인 컴포넌트
└── lib/
    ├── aggregators/              # 데이터 집계 (overview, team, models, costs, leaderboard)
    ├── hooks/useAnalytics.ts     # API fetch 공통 훅
    ├── prometheus.ts             # Prometheus PromQL 클라이언트
    ├── data-source.ts            # 데이터 소스 분기 (Prometheus / Mock)
    ├── constants.ts              # 팀원, 모델 설정
    ├── mock-data.ts              # Claude Code Mock 데이터
    ├── mock-ai-tools.ts          # Gemini / GPT Mock 데이터
    ├── types.ts                  # TypeScript 타입 정의
    └── utils.ts                  # 포맷팅 유틸리티
```

---

## 기술 스택

| 항목 | 기술 | 버전 |
|------|------|------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | v4 |
| Charts | Recharts | 3.x |
| Data Source | OTel + Prometheus | — |
| Deploy | Vercel (앱) + Railway (모니터링) | — |

---

## 배포

### 자동 배포 (권장)

`main` 브랜치에 merge되면 Vercel이 자동으로 프로덕션 배포합니다.
PR 생성 시에는 Preview URL이 자동 생성됩니다.

### 환경변수 (Vercel)

Vercel Dashboard → `token-dashboard` → **Settings → Environment Variables**

```
PROMETHEUS_URL = https://prometheus-production-ae90.up.railway.app
```

### 수동 배포

```bash
npm run deploy
# 내부적으로 npx vercel --prod --yes 실행
```

---

## 기여 가이드

이 레포는 **PR 필수 정책**이 적용되어 있습니다.
`main` 브랜치에 직접 push 불가 — 반드시 아래 흐름을 따르세요.

```bash
# 1. 새 브랜치 생성
git checkout -b feat/your-feature

# 2. 작업 후 커밋
git add .
git commit -m "feat: 기능 설명"

# 3. 원격에 push
git push origin feat/your-feature

# 4. GitHub에서 PR 생성 → 리뷰 요청
```

> PR merge에는 **1명 이상의 Approve**가 필요합니다.

---

## 라이선스

Internal use only — EO Studio
