# Rank Worldbuilding Design — AI Explorer's Log

> AI라는 미지의 세계를 탐사하며, 최종적으로 AI Native Human이 되는 여정

## 1. Core Narrative

**컨셉**: 탐험대 로그북 (Expedition Field Log)
**톤**: 차분하고 다큐멘터리적. 미지의 영역을 기록하는 탐사 보고서.
**무대**: "AI"라는 미지의 세계. 외부 행성이 아니라 인간 내면의 변화가 진짜 여정.
**결말**: 탐험가가 더 이상 탐험가가 아니게 됨 — AI와 자신이 구분되지 않는 AI Native.

### Story Arc
```
Lv.1-2: 첫 접촉 — AI를 처음 만지고, 기본을 익힘
Lv.3-4: 본격 탐사 — 자기만의 방법을 찾고 길을 개척
Lv.5-6: 선봉 — 팀을 이끌고 새로운 활용법을 발견
Lv.7-8: 변환 — 도구 사용을 넘어 AI와 하나가 됨
```

## 2. Level System (확정)

| Lv | Ko | En | Icon | 여정 단계 |
|----|----|----|------|----------|
| 1 | 스카우트 | Scout | 🔭 | AI 세계 첫 정찰 |
| 2 | 레인저 | Ranger | 🏹 | 기본 도구 다룸 |
| 3 | 탐험가 | Explorer | 🧭 | 본격 탐사 시작 |
| 4 | 패스파인더 | Pathfinder | 🛤️ | 자기만의 길 개척 |
| 5 | 파이오니어 | Pioneer | ⚡ | 새로운 활용법 발견 |
| 6 | 뱅가드 | Vanguard | 🛡️ | 팀의 선봉, 다른 사람을 이끔 |
| 7 | 트레일블레이저 | Trailblazer | 🔥 | AI로 결과물 창출 (심사) |
| 8 | AI 네이티브 | AI Native | 🌟 | AI와 하나가 된 존재 (심사) |

### XP Table (기존 유지)
```
Lv.1:          0 XP
Lv.2:        500 XP
Lv.3:      5,000 XP
Lv.4:     50,000 XP
Lv.5:    500,000 XP
Lv.6:  2,000,000 XP
Lv.7: 10,000,000 XP (심사 필수)
Lv.8: 50,000,000 XP (심사 필수)
```

### XP Formula (기존 유지)
```
XP = tokens/10K + days×50 + commits×10 + PRs×30 + streak_bonus
Decay: 7일 유예 후 일 1% 복리 감소
AUTO_LEVEL_CAP = 6 (Lv.7+ 심사제)
```

## 3. Achievement Categories (확정)

| Key | Ko | En | 대상 |
|-----|----|----|------|
| onboarding | 첫 발자국 | First Steps | 온보딩 |
| streak | 탐사 일지 | Field Log | 연속 사용 |
| volume | 에너지원 | Energy Source | 일일 output |
| cumulative | 탐사 성과 | Discoveries | 누적 커밋/PR |
| multi | 멀티툴 | Multi-Tool | 도구 다양성 |
| champion | 선봉대장 | Expedition Lead | 주간 1위 |
| time | 야간 탐사 | Night Watch | 시간대 |
| milestone | 변환점 | Transformation | 레벨 도달 |

## 4. Achievements (38개, 확정)

### First Steps (4)
| ID | Name | Icon | Ko | En |
|----|------|------|----|----|
| first-light | First Contact | 🔭 | 첫 토큰 사용 | First token usage |
| first-commit | First Mark | 🏁 | AI로 첫 커밋 | First AI commit |
| first-pr | First Report | 📋 | AI로 첫 PR | First AI PR |
| level-up | Base Camp | ⛺ | Lv.2 달성 | Reach Lv.2 |

### Field Log (13)
| ID | Name | Icon | Ko | En |
|----|------|------|----|----|
| streak-2 | Two Steps | 👣 | 2일 연속 사용 | 2 consecutive days |
| streak-3 | Trail Found | 🔍 | 3일 연속 사용 | 3 consecutive days |
| streak-5 | Steady Pace | 🥾 | 5일 연속 사용 | 5 consecutive days |
| streak-7 | Weekly Log | 📓 | 7일 연속 사용 | 7 consecutive days |
| streak-14 | Deep Trail | 🗺️ | 14일 연속 사용 | 14 consecutive days |
| streak-30 | Expedition | 🏕️ | 30일 연속 사용 | 30 consecutive days |
| streak-60 | Long March | 🚶 | 60일 연속 사용 | 60 consecutive days |
| streak-100 | Cartographer | 🗺️ | 100일 연속 사용 | 100 consecutive days |
| streak-150 | Chronicler | 📜 | 150일 연속 사용 | 150 consecutive days |
| streak-200 | Wayfinder | 🧭 | 200일 연속 사용 | 200 consecutive days |
| streak-365 | Year One | 📅 | 365일 연속 사용 | 365 consecutive days |
| streak-500 | Living Map | 🌐 | 500일 연속 사용 | 500 consecutive days |
| streak-1000 | Eternal Log | ♾️ | 1000일 연속 사용 | 1000 consecutive days |

### Energy Source (5)
| ID | Name | Icon | Ko | En |
|----|------|------|----|----|
| vol-100k | Spark | ✨ | 일일 output 100K | Daily output 100K |
| vol-1m | Generator | ⚙️ | 일일 output 1M | Daily output 1M |
| vol-5m | Reactor | ⚛️ | 일일 output 5M | Daily output 5M |
| vol-10m | Supernova | 💥 | 일일 output 10M | Daily output 10M |
| vol-20m | Singularity Burst | 🌑 | 일일 output 20M | Daily output 20M |

### Discoveries (4)
| ID | Name | Icon | Ko | En |
|----|------|------|----|----|
| commits-50 | Sample Collected | 🧪 | 누적 커밋 50건 | 50 cumulative commits |
| commits-200 | Archive Built | 🗄️ | 누적 커밋 200건 | 200 cumulative commits |
| commits-500 | Library | 📚 | 누적 커밋 500건 | 500 cumulative commits |
| prs-50 | Published | 📰 | 누적 PR 50건 | 50 cumulative PRs |

### Multi-Tool (3)
| ID | Name | Icon | Ko | En |
|----|------|------|----|----|
| dual-wielder | Dual Lens | 🔍 | 2개 도구 사용 | 2 tools used |
| triple-threat | Swiss Knife | 🔧 | 3개 도구 모두 사용 | All 3 tools used |
| polyglot | Polyglot | 🌐 | 3개 이상 모델 사용 | 3+ models used |

### Expedition Lead (4)
| ID | Name | Icon | Ko | En |
|----|------|------|----|----|
| weekly-champ-1 | Point Person | 🎯 | 주간 1위 1회 | Weekly #1 once |
| weekly-champ-3 | Lead Scout | 🏅 | 주간 1위 3회 연속 | Weekly #1 3x consecutive |
| weekly-champ-10 | Chief Explorer | ⭐ | 주간 1위 누적 10회 | Weekly #1 10x total |
| weekly-champ-20 | Grand Navigator | 👑 | 주간 1위 누적 20회 | Weekly #1 20x total |

### Night Watch (3)
| ID | Name | Icon | Ko | En |
|----|------|------|----|----|
| night-owl | Midnight Recon | 🌙 | 자정~6시 활동 | Activity 00:00-06:00 |
| early-bird | Dawn Watch | 🌅 | 6시~8시 활동 | Activity 06:00-08:00 |
| weekend-warrior | Off-Grid Expedition | 🏕️ | 주말 활동 | Weekend activity |

### Transformation (2)
| ID | Name | Icon | Ko | En |
|----|------|------|----|----|
| wizard-class | Awakening | ⚡ | Lv.5 파이오니어 달성 | Reach Lv.5 Pioneer |
| transcendence | AI Native | 🌟 | Lv.8 AI Native 달성 | Reach Lv.8 AI Native |

## 5. UI Theming

### Page Title
- 현재: "🚀 Mission Control" → **"🔭 Explorer's Log"**
- 부제: "AI 세계 탐사 기록 — Scout에서 AI Native까지의 여정"

### Component Naming
| 현재 | 변경 |
|------|------|
| Mission Control | Explorer's Log |
| 크루 랭킹 / Crew Ranking | 탐험대 / Expedition |
| 미션 로그 / Mission Log | 탐사 기록 / Field Records |

### Visual Design (기존 유지)
- 다크 배경: #0A0A0A ~ #111
- 액센트: #E8FF47 (네온 라임)
- 톤: 탐사 장비 디스플레이 느낌

## 6. Design Decisions

- **왜 오리지널 세계관?**: 팀원 대부분 SF 레퍼런스(스타워즈/듄) 비인지 → 설명 없이 직관적인 칭호
- **왜 탐험가?**: "나는 Explorer다" — 사람에게 붙이기 자연스러운 역할명
- **왜 AI Native가 최종?**: 도구 숙련이 아니라 존재 방식의 변화가 진짜 목표
- **기존 XP/Decay 유지**: 밸런스는 이미 4회 조정 완료, 세계관만 리스킨

---

*Created: 2026-03-09*
