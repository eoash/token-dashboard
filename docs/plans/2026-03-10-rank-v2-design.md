# /rank 페이지 v2 — 탐사기록 디벨롭

> 2026-03-10 | AchievementGrid 리디자인 + 신규 섹션 3개

## 전체 레이아웃

```
📡 Explorer's Log
[LOG] Monitoring N explorers in AI territory

1. JourneyMap (히어로) — 기존 유지
2. CharacterCard (좌) + RadarChart (우) — 2컬럼, 모바일 1컬럼
3. 주간 변화 요약 — KPI 4개 카드
4. 탐사 로그 — 활동 타임라인
5. PartyRanking — 기존 (이번 세션에서 개선 완료)
6. AchievementGrid — 리디자인
```

---

## 1. AchievementGrid 리디자인

### 상단 요약
- 전체 진행률 도트맵 (●=획득, ○=미획득)
- "다음 달성 가능" 추천 (미획득 중 progressPercent 최고)
- 시스템 로그: `[LOG] N field records documented. M remain uncharted.`

### 카테고리 헤더 강화
- 프로그레스 바 + 퍼센트 (`🔬 탐사 활동 ████░░ 3/5 60%`)
- 전체 완성 시 골드 보더 + "✦ COMPLETE"

### 업적 카드 3단계 비주얼
| 상태 | 비주얼 |
|------|--------|
| 미시작 (0~29%) | 어두운 카드, `?` 아이콘, 조건 숨김 |
| 진행중 (30%+) | 밝아지는 카드, 아이콘 공개, 프로그레스 바 + 수치, 레벨 컬러 테두리 힌트 |
| 획득 | 풀 컬러, 아이콘 크게, 획득 날짜, 레어도별 글로우 |

### 레어도 시스템
- `common` / `rare` / `epic` / `legendary`
- 전체 유저 달성률 기반 자동 분류:
  - legendary: <10% 달성
  - epic: 10~30%
  - rare: 30~60%
  - common: 60%+
- 글로우 색상: common=없음, rare=#C0C0C0, epic=#A855F7, legendary=#F59E0B

### 최근 획득 하이라이트
- 최근 7일 내 새 업적 → "NEW" 글로우 배지 (데이터 있을 때만)

---

## 2. 레이더 차트 (팀 비교)

- CharacterCard 오른쪽 (sm 이하: 아래)
- recharts `RadarChart` 사용
- 5축: 토큰 / 활동일 / 커밋 / 스트릭 / 업적
- 비교: 선택 유저(실선, 레벨 컬러) vs 팀 평균(점선, 회색)
- 정규화: 각 축 max값 기준 0~100%
- 하단 로그: `[LOG] Above average in N/5 dimensions.`

---

## 3. 활동 타임라인 (탐사 로그)

- 주간 변화 아래, PartyRanking 위
- 시스템 로그 스타일 피드
- 최근 14일, 최대 10건
- 모바일: 5건 + "더보기"

### 이벤트 타입
| 이벤트 | 소스 | 아이콘 |
|--------|------|--------|
| 일일 토큰 사용 (상위) | backfill/prometheus 날짜별 | 💬 |
| 스트릭 마일스톤 (3,7,14,30일) | currentStreak 역산 | 🔥 |
| 업적 획득 | earnedAchievements (날짜 추정) | 🏆 |
| 도구 첫 사용 | tools Set (날짜 추정) | 🛠️ |
| 레벨업 | XP 이력 추정 | ⬆ |

### 1단계 (현실적)
- backfill JSON의 날짜별 데이터에서 역산
- 스트릭은 currentStreak + daysSinceLastActivity로 시작일 계산
- 업적/레벨업 날짜는 정확하지 않으므로 생략 or "이번 달" 수준

---

## 4. 주간 변화 요약

- CharacterCard + 레이더 아래
- KPI 카드 4개 (2x2 그리드)

| KPI | 값 | 계산 방법 |
|-----|-----|----------|
| 이번 주 토큰 | `+197M` | API days=7 합산 |
| 활동일 | `5/7일` | days=7 중 데이터 있는 날 |
| 새 업적 | `+2개` | 1단계: 전체 count만 / 2단계: 주간 diff |
| 레벨 상태 | `Lv.4 → 39%` | 현재 progressPercent |

- 하단 시스템 로그: `[LOG] Significant progress detected this week.`

---

## 데이터 요구사항

| 기능 | 데이터 | 소스 |
|------|--------|------|
| 레이더 팀 평균 | 전 유저 5축 평균 | profiles 런타임 계산 |
| 업적 레어도 | 전 유저 달성률 | profiles 런타임 계산 |
| 다음 달성 추천 | 미획득 중 진행률 최고 | getAchievementProgress 기존 |
| 주간 토큰/활동일 | 최근 7일 데이터 | useAnalytics(days=7) or 기존 data 필터 |
| 타임라인 이벤트 | 날짜별 사용량 | backfill + prometheus 날짜별 |

---

## 구현 우선순위

| # | 항목 | 난이도 | 파일 |
|---|------|--------|------|
| 1 | AchievementGrid 리디자인 | 중 | AchievementGrid.tsx, gamification.ts |
| 2 | 레이더 차트 | 낮 | RadarComparison.tsx (신규) |
| 3 | 활동 타임라인 | 낮 | ActivityTimeline.tsx (신규) |
| 4 | 주간 변화 요약 | 중 | WeeklySummary.tsx (신규) |
| 5 | page.tsx 레이아웃 재배치 | 낮 | rank/page.tsx |
