# Rank 페이지 디자인 업그레이드 — 구현 계획

**Goal:** /rank 페이지를 탐사 로그북 톤으로 리디자인 — 여정맵, 레벨별 테마, 업적 힌트 시스템

**Architecture:** gamification.ts에 레벨 메타데이터(컬러, 로그텍스트, 아이콘) 추가 → 신규 JourneyMap 컴포넌트 → 기존 3개 컴포넌트 리디자인

**Tech Stack:** Next.js 16, Tailwind CSS v4, TypeScript

---

### Task 1: gamification.ts — 레벨 메타데이터 확장

**Files:**
- Modify: `src/lib/gamification.ts:6-57`

**Step 1: LevelInfo 타입에 컬러·로그텍스트 필드 추가**

```typescript
export interface LevelInfo {
  level: number;
  requiredXp: number;
  titleKo: string;
  titleEn: string;
  icon: string;
  color: [string, string]; // gradient [from, to]
  logEn: string;           // system log flavor text
}
```

**Step 2: LEVELS 배열 업데이트 (아이콘 + 컬러 + 로그)**

```typescript
export const LEVELS: LevelInfo[] = [
  { level: 1, requiredXp: 0,          titleKo: "스카우트",       titleEn: "Scout",        icon: "📡", color: ["#666","#888"],     logEn: "[LOG] New scout detected. Awaiting first contact." },
  { level: 2, requiredXp: 500,        titleKo: "레인저",         titleEn: "Ranger",       icon: "🛰️", color: ["#4A9EFF","#6BB5FF"], logEn: "[LOG] Basic tools acquired. Field operations authorized." },
  { level: 3, requiredXp: 5_000,      titleKo: "탐험가",         titleEn: "Explorer",     icon: "🌍", color: ["#00E87A","#4AFFA0"], logEn: "[LOG] Explorer protocol active. Mapping uncharted territory." },
  { level: 4, requiredXp: 50_000,     titleKo: "패스파인더",     titleEn: "Pathfinder",   icon: "🧬", color: ["#00CED1","#48D1CC"], logEn: "[LOG] Unique path divergence detected. Self-navigation engaged." },
  { level: 5, requiredXp: 500_000,    titleKo: "파이오니어",     titleEn: "Pioneer",      icon: "☄️", color: ["#A855F7","#C084FC"], logEn: "[LOG] Breakthrough pattern identified. New methods emerging." },
  { level: 6, requiredXp: 2_000_000,  titleKo: "뱅가드",         titleEn: "Vanguard",     icon: "🚀", color: ["#F59E0B","#FBBF24"], logEn: "[LOG] Vanguard status confirmed. Leading expedition team." },
  { level: 7, requiredXp: 10_000_000, titleKo: "트레일블레이저", titleEn: "Trailblazer",  icon: "🌌", color: ["#EF4444","#F97316"], logEn: "[LOG] ⚠ Anomaly: Subject producing AI-native artifacts." },
  { level: 8, requiredXp: 50_000_000, titleKo: "AI 네이티브",     titleEn: "AI Native",    icon: "✦",  color: ["#E8FF47","#00E87A"], logEn: "[LOG] ★ Transformation complete. Human-AI boundary dissolved." },
];
```

**Step 3: ACHIEVEMENTS 아이콘 업데이트 (milestone 카테고리)**

```typescript
// milestone achievements — 새 아이콘 반영
{ id: "wizard-class", ..., icon: "☄️", ... }  // Pioneer 아이콘
{ id: "transcendence", ..., icon: "✦", ... }   // AI Native 아이콘
```

**Step 4: 업적 진행률 계산 헬퍼 함수 추가 (파일 하단)**

```typescript
export function getAchievementProgress(achievementId: string, profile: UserProfile): { current: number; target: number; percent: number } | null {
  // streak achievements
  const streakMatch = achievementId.match(/^streak-(\d+)$/);
  if (streakMatch) { const t = Number(streakMatch[1]); return { current: Math.min(profile.maxStreak, t), target: t, percent: Math.min(100, Math.round(profile.maxStreak / t * 100)) }; }
  // volume achievements
  // (maxDailyOutput not in UserProfile — skip, return null)
  // cumulative
  if (achievementId === "commits-50") return prog(profile.totalCommits, 50);
  if (achievementId === "commits-200") return prog(profile.totalCommits, 200);
  if (achievementId === "commits-500") return prog(profile.totalCommits, 500);
  if (achievementId === "prs-50") return prog(profile.totalPRs, 50);
  // onboarding
  if (achievementId === "first-light") return prog(profile.totalTokens > 0 ? 1 : 0, 1);
  if (achievementId === "first-commit") return prog(profile.totalCommits > 0 ? 1 : 0, 1);
  if (achievementId === "first-pr") return prog(profile.totalPRs > 0 ? 1 : 0, 1);
  if (achievementId === "level-up") return prog(profile.level.level >= 2 ? 1 : 0, 1);
  // multi
  if (achievementId === "dual-wielder") return prog(profile.tools.size, 2);
  if (achievementId === "triple-threat") return prog(profile.tools.size, 3);
  if (achievementId === "polyglot") return prog(profile.models.size, 3);
  // milestone
  if (achievementId === "wizard-class") return prog(profile.level.level, 5);
  if (achievementId === "transcendence") return prog(profile.level.level, 8);
  return null;
}

function prog(current: number, target: number) {
  return { current: Math.min(current, target), target, percent: Math.min(100, Math.round(current / target * 100)) };
}
```

**Step 5: 빌드 확인**

Run: `cd token-dashboard && npx next build 2>&1 | tail -5`
Expected: 빌드 성공

**Step 6: 커밋**

```bash
git add src/lib/gamification.ts
git commit -m "feat(rank): 레벨 메타데이터 확장 — 아이콘/컬러/로그텍스트 + 업적 진행률 헬퍼"
```

---

### Task 2: JourneyMap 컴포넌트 (신규)

**Files:**
- Create: `src/components/rank/JourneyMap.tsx`

**Step 1: 컴포넌트 작성**

히어로 영역 — 8단계 수평 스텝바:
- 도달 레벨: 실선 + 레벨 컬러 + 아이콘 풀컬러
- 미도달 레벨: 점선 + opacity-30
- 현재→다음 구간: 그라데이션 프로그레스
- 현재 위치: 아바타 표시
- Lv.7/8: 🔒 오버레이 (AUTO_LEVEL_CAP 이상)
- 하단 시스템 로그: `[LOG] ... {진행률}% to next level.`
- 배경: 별자리 점 패턴 (CSS radial-gradient)
- 모바일: overflow-x-auto 가로 스크롤

Props:
```typescript
interface Props {
  profile: UserProfile;
}
```

**Step 2: 빌드 확인**

**Step 3: 커밋**

```bash
git add src/components/rank/JourneyMap.tsx
git commit -m "feat(rank): JourneyMap 여정 맵 히어로 컴포넌트 추가"
```

---

### Task 3: CharacterCard 리디자인

**Files:**
- Modify: `src/components/rank/CharacterCard.tsx`

**Step 1: 레벨별 그라데이션 보더 적용**

```typescript
const [from, to] = profile.level.color;
// 카드 래퍼: border 대신 배경 그라데이션 + 내부 패딩 트릭
// 또는: style={{ borderImage: `linear-gradient(135deg, ${from}, ${to}) 1` }}
```

- 외부 div: `border-2` + `borderImage: linear-gradient`
- Lv.7+: `animate-pulse` 클래스 추가 (미세한 글로우)

**Step 2: 시스템 로그 플레이버 텍스트 추가**

아바타 아래, 이름 + 레벨 배지 다음에:
```tsx
<p className="text-xs font-mono text-gray-500 mt-1">{profile.level.logEn}</p>
```

**Step 3: 아바타 링 컬러를 레벨 컬러로 변경**

```tsx
ring-2 ring-[#00E87A]/30  →  style={{ boxShadow: `0 0 0 2px ${from}40` }}
```

**Step 4: XP 바 컬러를 레벨 컬러로 변경**

```tsx
bg-[#00E87A] → style={{ backgroundColor: from }}
```

**Step 5: 빌드 확인 → 커밋**

```bash
git add src/components/rank/CharacterCard.tsx
git commit -m "feat(rank): CharacterCard 레벨별 테마 보더 + 시스템 로그 텍스트"
```

---

### Task 4: PartyRanking 등급별 그룹화

**Files:**
- Modify: `src/components/rank/PartyRanking.tsx`

**Step 1: 프로필을 레벨별로 그룹화**

```typescript
const grouped = useMemo(() => {
  const map = new Map<number, UserProfile[]>();
  profiles.forEach(p => {
    const lv = p.level.level;
    if (!map.has(lv)) map.set(lv, []);
    map.get(lv)!.push(p);
  });
  return [...map.entries()].sort((a, b) => b[0] - a[0]); // 높은 레벨 먼저
}, [profiles]);
```

**Step 2: 그룹 헤더 렌더링**

각 그룹 앞에 레벨 아이콘 + 칭호 + 테마 컬러로 섹션 헤더:
```tsx
<tr>
  <td colSpan={5} className="pt-4 pb-1">
    <span style={{ color: level.color[0] }}>
      {level.icon} {isKo ? level.titleKo : level.titleEn}
    </span>
  </td>
</tr>
```

**Step 3: 레벨업 배지**

- UserProfile에 `previousLevel` 필드 불필요 — 대신 단순히 XP와 다음 레벨 임계값 비교
- 최근 7일 이내 활동 + 현재 레벨 XP 기준 90%+ 달성 시 "⬆" 배지 (근사치)
- 또는 더 간단하게: 각 행에 레벨 아이콘 컬러로 약한 좌측 보더

**Step 4: 빌드 확인 → 커밋**

```bash
git add src/components/rank/PartyRanking.tsx
git commit -m "feat(rank): PartyRanking 등급별 그룹화 + 테마 컬러 섹션 헤더"
```

---

### Task 5: AchievementGrid 힌트 시스템

**Files:**
- Modify: `src/components/rank/AchievementGrid.tsx`

**Step 1: Props에 profile 추가**

```typescript
interface Props {
  earnedAchievements: string[];
  profile: UserProfile;  // 진행률 계산용
}
```

**Step 2: 3단계 상태 렌더링 로직**

```typescript
import { getAchievementProgress } from "@/lib/gamification";

// 각 업적:
const progress = getAchievementProgress(a.id, profile);
const earned = earnedSet.has(a.id);
const hinted = !earned && progress && progress.percent >= 30;
```

- **earned**: 풀 컬러 + 테마 보더 + 획득일 (획득일은 데이터 없으므로 체크마크만)
- **hinted (30%+)**: 이름 공개 + 미니 프로그레스바 + `{current}/{target}`
- **locked (0~29%)**: `???` + 흐리게 (현재와 동일)

**Step 3: 카테고리 헤더에 진행률 표시**

```tsx
<h3>
  {cat.label} <span className="text-gray-600">({earnedInCat}/{totalInCat})</span>
</h3>
```

**Step 4: page.tsx에서 profile prop 전달**

```tsx
<AchievementGrid earnedAchievements={selected.earnedAchievements} profile={selected} />
```

**Step 5: 빌드 확인 → 커밋**

```bash
git add src/components/rank/AchievementGrid.tsx src/app/rank/page.tsx
git commit -m "feat(rank): AchievementGrid 3단계 힌트 시스템 + 진행률 바"
```

---

### Task 6: page.tsx — 레이아웃 통합 + 배경

**Files:**
- Modify: `src/app/rank/page.tsx`

**Step 1: JourneyMap 추가 (타이틀 아래, CharacterCard 위)**

```tsx
import JourneyMap from "@/components/rank/JourneyMap";

// 타이틀 부제를 시스템 로그 톤으로 변경
<p className="text-sm font-mono text-gray-500 mt-1">
  [LOG] Monitoring {profiles.length} explorers in AI territory
</p>

// 타이틀 아래에 JourneyMap 추가
<JourneyMap profile={selected} />
```

**Step 2: 페이지 배경에 별자리 패턴**

page.tsx 최상위 div에 배경 스타일:
```tsx
<div className="space-y-4" style={{
  backgroundImage: "radial-gradient(circle, #333 1px, transparent 1px)",
  backgroundSize: "40px 40px",
}}>
```

**Step 3: 모바일 셀렉터의 레벨 아이콘 업데이트**

기존 `p.level.icon`은 자동으로 새 아이콘 반영됨 (gamification.ts에서 변경했으므로)

**Step 4: 빌드 확인 → 커밋**

```bash
git add src/app/rank/page.tsx
git commit -m "feat(rank): 여정맵 통합 + 시스템 로그 부제 + 별자리 배경"
```

---

### Task 7: 최종 빌드 & 배포

**Step 1: 전체 빌드 확인**

Run: `cd token-dashboard && npx next build 2>&1 | tail -20`
Expected: 모든 페이지 빌드 성공

**Step 2: 로컬 프리뷰**

Run: `npx next dev`
확인: `/rank` 페이지 — 여정맵, 캐릭터카드, 파티랭킹, 업적그리드 모두 정상

**Step 3: Vercel 배포**

```bash
git push origin main
cd /tmp/token-dashboard-sync && vercel --prod
```
