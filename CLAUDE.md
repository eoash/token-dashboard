# CLAUDE.md — Token Dashboard

## 프로젝트 개요

EO Studio 팀의 AI 코딩 도구(Claude Code / Codex / Gemini CLI) 사용량 실시간 대시보드.
팀원 AI 사용 촉진이 목적 — 많이 쓰는 사람 부각, 적게 쓰는 사람에게 자연스러운 동기부여.

- **Live**: https://token-dashboard-iota.vercel.app
- **Repo**: https://github.com/eoash/token-dashboard

---

## 기술 스택

| 항목 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 |
| Charts | Recharts 3 |
| Data | OTel + Prometheus + Backfill JSON |
| Deploy | Vercel (앱) + Railway (OTel Collector, Prometheus) |
| Path alias | `@/*` → `./src/*` |

---

## 데이터 파이프라인

```
Claude Code → otel_push.py → OTel Collector (Railway) → Prometheus → Next.js API
Codex CLI   → codex_push.py → REST API → backfill JSON
Gemini CLI  → 네이티브 OTel → OTel Collector (Railway) → Prometheus
```

### 유저별 데이터 분기 (자동)
- backfill JSON (`src/lib/backfill/*.json`)의 max(date)가 유저별 cutoff
- cutoff 이전 → JSON, cutoff+1일 이후 → Prometheus
- cutoff ~ cutoff+1일은 grace period (OTel increase([1d]) 외삽 보정)

---

## 디자인 컨벤션

- **다크 테마**: 배경 `#0A0A0A`, 액센트 `#E8FF47` (constants.ts `accent`)
- **KpiCard**: 공통 카드 컴포넌트 (tooltip은 `InfoTip`)
- **Slack 아바타**: `NAME_TO_AVATAR` (constants.ts)에서 URL 관리
- **이름 매핑**: `EMAIL_TO_NAME` + `resolveActorName` (이메일 lowercase 정규화)
- **한/영 전환**: `src/lib/i18n.ts` (140+ 키), `useT()` 훅으로 번역
- **모바일**: 햄버거 드로어 + `peer-focus:visible` 터치 tooltip

---

## 페이지 구조

| 경로 | 페이지 |
|------|--------|
| `/` | Overview (KPI + Top 3 + Weekly Champions + 차트) |
| `/leaderboard` | 리더보드 (Claude / Codex / Gemini 탭) |
| `/members` | 개인별 상세 (마지막 선택 localStorage 기억) |
| `/models` | 모델별 토큰/비용 집계 |
| `/utilization` | 사용량 추이 + 분포 |
| `/efficiency` | Cache Hit Rate, Output Ratio 분석 |
| `/setup` | Setup Guide (curl 원라이너 + 설명) |

---

## 주요 파일

| 파일 | 역할 |
|------|------|
| `src/lib/data-source.ts` | 데이터 소스 분기 (backfill vs Prometheus), `<synthetic>` 필터, 이메일 sanitize |
| `src/lib/prometheus.ts` | PromQL 클라이언트 |
| `src/lib/constants.ts` | 팀원 27명, 아바타(NAME_TO_AVATAR), 모델, 색상, resolveActorName |
| `src/lib/i18n.ts` | 한/영 번역 (140+ 키) |
| `src/lib/utils.ts` | formatTokens, formatDate, calcCacheHitRate 등 공통 유틸 |
| `src/lib/announcements.ts` | 공지 배너 설정 데이터 |
| `src/lib/mock-data.ts` | Prometheus 없을 때 Mock 데이터 |
| `src/lib/contexts/` | LanguageContext (한/영 전환) |
| `src/lib/aggregators/` | overview, team, models, leaderboard, utilization, efficiency 집계 |
| `src/components/layout/AnnouncementBanner.tsx` | 공지 배너 (id별 localStorage dismiss) |
| `src/components/layout/DateRangePicker.tsx` | 날짜 범위 선택 |
| `src/components/layout/Sidebar.tsx` | 좌측 네비게이션 (모바일 드로어) |
| `scripts/install-hook.sh` | 팀원용 원라이너 설치 Mac/Linux (7단계) |
| `scripts/install-hook.ps1` | 팀원용 원라이너 설치 Windows (7단계) |
| `scripts/otel_push.py` | Claude Code Stop hook |
| `scripts/codex_push.py` | Codex 세션 로그 → API 전송 |
| `scripts/remind_install.py` | 미설치 팀원 Slack DM (cron 매일 13:00) |

---

## 오답노트 (이 프로젝트 전용)

### Prometheus
- `increase([1d])` 외삽 주의: 카운터 첫째 날 데이터 부족 시 24시간으로 외삽 → cutoff+1일 grace period 필수
- **grace period `>` 절대 `>=`로 바꾸지 말 것**: 카운터 첫 등장일에 increase()가 전체 누적값을 외삽함 (실사례: ash 3/8 실제 622K → 외삽 6.9M, 10배 스파이크). `data-source.ts`의 `d.date > graceCutoff`는 의도적 설계
- Gemini 등 간헐적 메트릭: `last_over_time(metric[30d])`로 staleness 방지 (5분 규칙)

### Backfill cutoff
- **cutoff 계산에 Codex(gpt-*) 모델 포함 금지**: Codex backfill이 Claude cutoff를 오염시켜 Prometheus 데이터가 필터링됨 (실사례: ash Codex 3/8 데이터가 cutoff=3/8로 설정 → Claude 3/8 Prometheus 데이터 소실). `isCodexModel()` 가드 필수
- **backfill 누락 시 generate_backfill.py로 로컬 transcript에서 보충**: `python3 scripts/generate_backfill.py --out /tmp/result.json` → 해당 날짜 데이터 추출하여 ash.json에 수동 추가

### OTel Collector
- `metrics_url_path: /` — Gemini v0.32 HTTP 버그 우회. v0.33 이후 `/v1/metrics` 복원 필요

### install-hook.sh / install-hook.ps1 (셸→Python)
- `python3 -c "..."` 안에서 triple-quote + 변수 → 충돌 위험. 환경변수로 전달 후 `os.environ[]`로 읽기
- f-string `\"` 이스케이프 → `.get()` 또는 문자열 연결로 대체
- Windows: `PYTHONUTF8=1` + `encoding='utf-8'` 필수
- **Windows 설치 명령어**: `powershell -Command "irm URL | iex"` 형태로 래핑 필수. 단순 `irm URL | iex`만 안내하면 사용자가 `irm URL`만 실행하여 스크립트 본문이 출력만 됨

### 팀원 아이덴티티 (constants.ts)
- **chankim = 김찬호, chanhee = 김찬희** — 두 사람은 다른 팀원. 이메일·Slack ID·아바타 혼동 주의
- remind_install.py의 TEAM 목록과 constants.ts의 TEAM_MEMBERS 동기화 필수

### Backfill API
- path traversal 차단 필수 (사용자 입력 파일명 검증)
- error detail 클라이언트에 노출 금지
- **덮어쓰기 금지**: backfill POST는 반드시 기존 데이터와 date+model 키로 merge해야 함. replace 시 다른 소스(Claude/Codex) 데이터 소실됨 (2026-03-08 jemin·chiri 데이터 소실 사고)

### Codex 토큰 시맨틱
- Codex `input_tokens`는 `cached_input_tokens` 포함 (Claude와 다름). 순수 input = `input_tokens - cached_input_tokens`
- backfill 저장 시 반드시 차감 후 저장. 미차감 시 output ratio 등 효율 지표가 0에 수렴

### recharts
- Tooltip 타입: `TooltipContentProps<number, string>` → `any` 사용이 실용적

---

## 배포

```bash
# 자동 배포: GitHub push → Vercel 자동 빌드
# 수동 배포 (필요 시):
npx vercel --prod
```

### 환경변수 (Vercel)
- `PROMETHEUS_URL` — Railway Prometheus 엔드포인트 (없으면 Mock 모드 자동 전환)

### API 엔드포인트

| 경로 | 메서드 | 용도 |
|------|--------|------|
| `/api/analytics?days=N` | GET | Claude 메트릭 (Prometheus + backfill) |
| `/api/backfill` | POST | backfill JSON 업로드 |
| `/api/codex-usage` | GET | Codex 사용량 |
| `/api/gemini-usage` | GET | Gemini 사용량 |

---

## 브랜치 규칙

- PR 필수 (1명 이상 Approve)
- Force push 차단
- Branch 삭제 차단
