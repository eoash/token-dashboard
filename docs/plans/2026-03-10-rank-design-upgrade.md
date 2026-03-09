# /rank 페이지 디자인 업그레이드 — 탐사 로그북

> 2026-03-10 | 게임 디자이너 리뷰 기반 개선

## 디자인 방향

- **톤**: 탐사 로그북 — 현재 다크 테마 유지 + 별자리/그리드 텍스처 + 레벨별 컬러
- **텍스트 톤**: 시스템 로그 (`[LOG] ...`) — AI가 탐험가를 관측하는 느낌
- **아이콘 세트**: SF 탐사/우주 테마 (📡🛰️🌍🧬☄️🚀🌌✦)

## 1. 여정 맵 (히어로 영역, 페이지 최상단)

- 8단계 수평 스텝바, 전체 폭
- 도달 레벨: 실선 + 레벨 컬러 + 아이콘 풀컬러
- 미도달 레벨: 점선 + opacity-30 + 아이콘 흐리게
- 현재 위치: 아바타가 현재 레벨 노드 아래에 표시
- 현재→다음 구간: 그라데이션 프로그레스로 진행률 표시
- 하단 로그: `[LOG] {칭호} protocol active. {진행률}% to next level.`
- Lv.7/8: 🔒 자물쇠 오버레이
- 배경: 미세한 별자리 점 패턴 (radial-gradient dot pattern)
- 모바일: 가로 스크롤 또는 2줄 꺾기

## 2. CharacterCard — 레벨별 테마

### 레벨 컬러 & 시스템 로그

| Lv | 칭호 | 아이콘 | 보더 그라데이션 | 시스템 로그 |
|----|------|--------|----------------|-----------|
| 1 | Scout | 📡 | #666 → #888 | [LOG] New scout detected. Awaiting first contact. |
| 2 | Ranger | 🛰️ | #4A9EFF → #6BB5FF | [LOG] Basic tools acquired. Field operations authorized. |
| 3 | Explorer | 🌍 | #00E87A → #4AFFA0 | [LOG] Explorer protocol active. Mapping uncharted territory. |
| 4 | Pathfinder | 🧬 | #00CED1 → #48D1CC | [LOG] Unique path divergence detected. Self-navigation engaged. |
| 5 | Pioneer | ☄️ | #A855F7 → #C084FC | [LOG] Breakthrough pattern identified. New methods emerging. |
| 6 | Vanguard | 🚀 | #F59E0B → #FBBF24 | [LOG] Vanguard status confirmed. Leading expedition team. |
| 7 | Trailblazer | 🌌 | #EF4444 → #F97316 | [LOG] ⚠ Anomaly: Subject producing AI-native artifacts. |
| 8 | AI Native | ✦ | #E8FF47 → #00E87A | [LOG] ★ Transformation complete. Human-AI boundary dissolved. |

### 카드 변경
- 보더: 단색 #222 → 레벨별 그라데이션 2px
- 로그 텍스트: 아바타 아래 font-mono text-xs text-gray-500
- Lv.7+: 보더에 미세한 animate-pulse

## 3. PartyRanking — 등급별 시각 구분

- 같은 레벨끼리 그룹화 + 레벨 아이콘/칭호 섹션 헤더
- 그룹 헤더 색상: 해당 레벨 테마 컬러 (opacity-60)
- 레벨업 배지: 최근 7일 내 레벨업 시 ⬆ + 글로우
- XP 바: 그룹 내 상대 위치 시각화
- 행 클릭: CharacterCard 연동 (기존 유지)

## 4. AchievementGrid — 힌트 & 진행률

### 3단계 상태
- **미시작 (0~29%)**: ??? + 카테고리 아이콘 흐리게. 조건 비공개
- **진행중 (30%+)**: 이름+아이콘 공개. 미니 프로그레스바 + 수치 (32/50)
- **획득 완료**: 풀 컬러 + 카테고리 테마 보더. 획득일 표시

### 추가 디테일
- 카테고리 헤더: 아이콘 + 이름 + (3/5 획득) 진행률
- 호버 tooltip: 상세 조건 설명 (기존 유지)
- Boolean 업적: ○ 미달성 / ● 달성

## 5. 전체 분위기

- 페이지 부제: 시스템 로그 톤 (`[LOG] Monitoring N explorers in AI territory`)
- 배경: 미세한 별자리 dot pattern (radial-gradient)
- 다른 페이지와 톤 유지하면서 rank만 탐사 로그북 특별감
