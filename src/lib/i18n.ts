export type Locale = "ko" | "en";

const translations = {
  // ── Sidebar ──
  "sidebar.title": { ko: "AI Native", en: "AI Native" },
  "sidebar.subtitle": { ko: "EO Studio Dashboard", en: "EO Studio Dashboard" },
  "nav.overview": { ko: "Overview", en: "Overview" },
  "nav.leaderboard": { ko: "Leaderboard", en: "Leaderboard" },
  "nav.members": { ko: "Members", en: "Members" },
  "nav.models": { ko: "Models", en: "Models" },
  "nav.utilization": { ko: "Utilization", en: "Utilization" },
  "nav.efficiency": { ko: "Efficiency", en: "Efficiency" },
  "nav.setup": { ko: "설치 가이드", en: "Setup Guide" },

  // ── Common ──
  "common.loading": { ko: "불러오는 중...", en: "Loading..." },
  "common.error": { ko: "데이터를 불러오지 못했습니다.", en: "Failed to load data." },
  "common.copy": { ko: "복사", en: "Copy" },
  "common.copied": { ko: "복사됨!", en: "Copied!" },

  // ── Announcement badges ──
  "announce.new": { ko: "New", en: "New" },
  "announce.update": { ko: "업데이트", en: "Update" },
  "announce.info": { ko: "안내", en: "Info" },
  "announce.close": { ko: "닫기", en: "Close" },
  "announce.setup": {
    ko: "아직 설치 전이라면 터미널에서 한 줄이면 완료!",
    en: "Not installed yet? Just one command in your terminal!",
  },
  "announce.setupLink": { ko: "설치 가이드 →", en: "Setup Guide →" },

  // ── Overview KPI ──
  "kpi.totalTokens": { ko: "전체 토큰", en: "Total Tokens" },
  "kpi.totalTokens.sub": { ko: "입력 + 출력 + 캐시", en: "input + output + cache" },
  "kpi.totalTokens.tip": {
    ko: "입력·출력·캐시를 포함한 전체 토큰 사용량. 팀 전체가 Claude에게 보내고 받은 텍스트의 총량입니다.",
    en: "Total token usage including input, output, and cache. The total volume of text the team sent to and received from Claude.",
  },
  "kpi.cacheHitRate": { ko: "캐시 적중률", en: "Cache Hit Rate" },
  "kpi.cacheHitRate.sub": { ko: "캐시 재활용 효율", en: "cache reuse efficiency" },
  "kpi.cacheHitRate.tip": {
    ko: "캐시된 프롬프트를 재활용한 비율. 높을수록 동일 컨텍스트 재전송이 줄어 응답이 빨라지고 비용 효율이 올라갑니다.",
    en: "Ratio of cached prompts reused. Higher means less redundant context, faster responses, and better cost efficiency.",
  },
  "kpi.activeUsers": { ko: "활성 사용자", en: "Active Users" },
  "kpi.activeUsers.sub": { ko: "고유 팀원 수", en: "unique team members" },
  "kpi.activeUsers.tip": {
    ko: "선택 기간 중 Claude를 1회 이상 사용한 팀원 수입니다.",
    en: "Number of team members who used Claude at least once in the selected period.",
  },
  "kpi.avgDailySessions": { ko: "일 평균 세션", en: "Avg Daily Sessions" },
  "kpi.avgDailySessions.sub": { ko: "하루 세션 수", en: "sessions per day" },
  "kpi.avgDailySessions.tip": {
    ko: "하루 평균 Claude 세션 수입니다.",
    en: "Average number of Claude sessions per day.",
  },
  "kpi.totalCommits": { ko: "전체 커밋", en: "Total Commits" },
  "kpi.totalCommits.sub": { ko: "기간 내 커밋 수", en: "commits in period" },
  "kpi.totalCommits.tip": {
    ko: "Claude 세션에서 발생한 Git 커밋 수입니다.",
    en: "Number of Git commits made during Claude sessions.",
  },
  "kpi.pullRequests": { ko: "Pull Requests", en: "Pull Requests" },
  "kpi.pullRequests.sub": { ko: "생성된 PR 수", en: "PRs created" },
  "kpi.pullRequests.tip": {
    ko: "Claude 세션에서 생성된 PR 수입니다.",
    en: "Number of PRs created during Claude sessions.",
  },

  // ── Charts ──
  "chart.dailyUsage": { ko: "일별 토큰 사용량", en: "Daily Token Usage" },
  "chart.cacheRead": { ko: "캐시 읽기", en: "Cache Read" },
  "chart.output": { ko: "출력", en: "Output" },
  "chart.input": { ko: "입력", en: "Input" },
  "chart.modelDist": { ko: "모델 분포", en: "Model Distribution" },
  "chart.totalTokens": { ko: "전체 토큰", en: "total tokens" },

  // ── Weekly Champions ──
  "weekly.title": { ko: "주간 챔피언", en: "Weekly Champions" },

  // ── Leaderboard ──
  "lb.developer": { ko: "개발자", en: "DEVELOPER" },
  "lb.total": { ko: "합계", en: "TOTAL" },
  "lb.cacheHit": { ko: "캐시 적중", en: "CACHE HIT" },
  "lb.teamAvg": { ko: "팀 평균", en: "TEAM AVG" },
  "lb.members": { ko: "명", en: " members" },
  "lb.autoRefresh": { ko: "자동 새로고침: 30초", en: "Auto-refresh: 30s" },
  "lb.noDataCodex": { ko: "Codex 사용 데이터가 없습니다", en: "No Codex usage data available" },
  "lb.codexNote": { ko: "Codex는 캐시에서 재사용한 토큰도 input에 포함하여 집계합니다. Claude는 이를 별도(Cache Read)로 분리하기 때문에, 같은 작업이라도 Codex의 input이 더 높게 표시됩니다.", en: "Codex counts cached (reused) tokens as part of input, while Claude separates them into Cache Read. This makes Codex input appear higher for the same workload." },
  "lb.noDataGemini": { ko: "Gemini CLI 사용 데이터가 없습니다", en: "No Gemini CLI usage data available" },
  "lb.mockMode": {
    ko: "샘플 데이터로 표시 중 — PROMETHEUS_URL 설정 후 실제 데이터를 확인하세요",
    en: "Showing sample data — Set PROMETHEUS_URL to see real data",
  },

  // ── Team page ──
  "team.allMembers": { ko: "전체 팀원", en: "All Members" },
  "team.tokens.tip": {
    ko: "이 팀원이 사용한 전체 토큰(입력+출력+캐시) 합계입니다.",
    en: "Total tokens (input + output + cache) used by this member.",
  },
  "team.cacheHit.tip": {
    ko: "이 팀원의 캐시 재활용 비율. 높을수록 동일 컨텍스트 재전송이 줄어 효율적입니다.",
    en: "Cache reuse ratio for this member. Higher means less redundant context and better efficiency.",
  },
  "team.sessions": { ko: "세션", en: "Sessions" },
  "team.sessions.tip": {
    ko: "이 팀원의 Claude Code 세션 수입니다.",
    en: "Number of Claude Code sessions for this member.",
  },
  "team.commits.tip": {
    ko: "이 팀원의 Claude 세션에서 발생한 Git 커밋 수입니다.",
    en: "Number of Git commits from this member's Claude sessions.",
  },
  "team.prs.tip": {
    ko: "이 팀원이 Claude 세션에서 생성한 PR 수입니다.",
    en: "Number of PRs created during this member's Claude sessions.",
  },

  // ── Models page ──
  "models.breakdown": { ko: "토큰 상세", en: "Token Breakdown" },
  "models.model": { ko: "모델", en: "Model" },

  // ── Utilization page ──
  "util.byMember": { ko: "팀원별 토큰 사용량", en: "Tokens by Team Member" },
  "util.avgDailyTokens": { ko: "일 평균 토큰", en: "Avg Daily Tokens" },
  "util.avgDailyTokens.sub": { ko: "하루 토큰 수", en: "tokens per day" },
  "util.avgDailyTokens.tip": {
    ko: "일 평균 토큰 사용량. 전체 토큰을 활성 일수로 나눈 값입니다.",
    en: "Average daily token usage. Total tokens divided by active days.",
  },

  // ── Efficiency page ──
  "eff.dailyCacheHit": { ko: "일별 캐시 적중률", en: "Daily Cache Hit Rate" },
  "eff.dailyCacheHit.tip": {
    ko: "팀 전체의 일별 캐시 재활용률 추이. 꾸준히 높으면 프롬프트와 컨텍스트 설계가 안정적이라는 뜻입니다.",
    en: "Daily cache reuse rate trend. Consistently high means stable prompt and context design.",
  },
  "eff.memberComparison": { ko: "팀원별 효율 비교", en: "Member Efficiency Comparison" },
  "eff.cacheHitByMember": { ko: "팀원별 캐시 적중률", en: "Cache Hit Rate by Member" },
  "eff.cacheHitByMember.tip": {
    ko: "팀원별 캐시 재활용률 비교. CLAUDE.md, 스킬 등 컨텍스트를 잘 설계한 사람일수록 높게 나옵니다.",
    en: "Cache reuse rate by member. Members with well-designed CLAUDE.md and skills score higher.",
  },
  "eff.outputRatioByMember": { ko: "팀원별 출력 비율", en: "Output Ratio by Member" },
  "eff.outputRatioByMember.tip": {
    ko: "팀원별 출력/입력 토큰 비율. 코드 생성 작업이 많으면 높고, 탐색·리뷰 위주면 낮습니다. 역할에 따라 다르므로 높낮이가 좋고 나쁨을 의미하지 않습니다.",
    en: "Output/input token ratio by member. Higher for code generation, lower for exploration. Neither is inherently better — it depends on the role.",
  },
  "eff.breakdown": { ko: "효율성 상세", en: "Efficiency Breakdown" },
  "eff.breakdown.tip": {
    ko: "팀원별 효율성 지표 상세 테이블. 각 컬럼 헤더에 마우스를 올리면 설명을 볼 수 있습니다.",
    en: "Detailed efficiency metrics by member. Hover over column headers for descriptions.",
  },
  "eff.outputRatio": { ko: "출력 비율", en: "Output Ratio" },
  "eff.outputRatio.sub": { ko: "출력 / 입력", en: "output / input" },
  "eff.outputRatio.tip": {
    ko: "입력 토큰 대비 출력 토큰 비율. 높을수록 적은 프롬프트로 많은 결과를 얻고 있다는 뜻입니다.",
    en: "Output to input token ratio. Higher means more output from fewer prompts.",
  },
  "eff.cacheEff": { ko: "캐시 효율", en: "Cache Efficiency" },
  "eff.cacheEff.sub": { ko: "캐시 읽기 / 생성", en: "cache read / creation" },
  "eff.cacheEff.tip": {
    ko: "캐시 생성 대비 재사용 배수. 1x = 만든 만큼만 씀, 10x = 한번 만들어 10번 재활용. 높을수록 컨텍스트 설계가 잘 되어 있다는 뜻입니다.",
    en: "Cache reuse multiplier. 1x = used as much as created, 10x = created once, reused 10 times. Higher means better context design.",
  },
  "eff.member": { ko: "팀원", en: "Member" },
  "eff.totalTokens.tip": {
    ko: "input + output + cache_read + cache_creation 합계",
    en: "Sum of input + output + cache_read + cache_creation",
  },
  "eff.cacheHit.tip": {
    ko: "cache_read / (cache_read + cache_creation + input). 높을수록 좋음",
    en: "cache_read / (cache_read + cache_creation + input). Higher is better",
  },
  "eff.outputRatioCol.tip": {
    ko: "output / input 비율. 역할에 따라 다름",
    en: "output / input ratio. Varies by role",
  },
  "eff.cacheEffCol.tip": {
    ko: "cache_read / cache_creation. 캐시를 얼마나 재활용하는지",
    en: "cache_read / cache_creation. How much cache is reused",
  },
  "eff.reasoningRatio": { ko: "추론 비율", en: "Reasoning Ratio" },
  "eff.reasoningRatio.sub": { ko: "추론 / 출력", en: "reasoning / output" },
  "eff.reasoningRatio.tip": {
    ko: "출력 토큰 중 추론(thinking) 비중. Codex는 응답 전 내부 추론을 수행하며, 이 비율이 높으면 더 깊이 사고한 후 답변한 것입니다.",
    en: "Proportion of reasoning (thinking) tokens in output. Higher means more deliberation before responding.",
  },
  "eff.codexNote": {
    ko: "Codex는 캐시 구조가 Claude와 다릅니다. Cache Efficiency(생성 대비 재사용) 대신 Reasoning Ratio(추론 토큰 비율)를 표시합니다.",
    en: "Codex has a different caching model than Claude. Reasoning Ratio is shown instead of Cache Efficiency.",
  },
  "eff.noDaily": {
    ko: "일별 추이 데이터가 부족합니다",
    en: "Not enough daily trend data",
  },
  "eff.activeUsers": { ko: "사용자 수", en: "Active Users" },
  "eff.activeUsers.sub": { ko: "도구 사용 팀원", en: "tool users" },

  // ── Setup page ──
  "setup.title": { ko: "설치 가이드", en: "Setup Guide" },
  "setup.desc": {
    ko: "터미널에서 아래 명령어 한 줄이면 설치 완료! Claude Code · Codex · Gemini 사용량이 자동으로 대시보드에 수집됩니다.",
    en: "Just one command in your terminal! Claude Code, Codex, and Gemini usage will be automatically collected to the dashboard.",
  },
  "setup.installCmd": { ko: "설치 명령어", en: "Install Command" },
  "setup.prereq": { ko: "사전 요구사항", en: "Prerequisites" },
  "setup.whatInstalled": { ko: "설치 항목", en: "What Gets Installed" },
  "setup.step1": { ko: "Claude Code Stop Hook", en: "Claude Code Stop Hook" },
  "setup.step1.desc": {
    ko: "세션 종료 시 토큰 사용량을 자동 전송합니다.",
    en: "Automatically sends token usage when a session ends.",
  },
  "setup.step2": { ko: "과거 데이터 Backfill", en: "Historical Data Backfill" },
  "setup.step2.desc": {
    ko: "기존 transcript에서 과거 사용량을 추출해 대시보드에 반영합니다.",
    en: "Extracts past usage from existing transcripts and sends to the dashboard.",
  },
  "setup.step3": { ko: "Codex CLI 수집", en: "Codex CLI Collection" },
  "setup.step3.desc": {
    ko: "Codex 세션 로그를 수집하고, 2시간마다 자동 전송하는 cron을 등록합니다.",
    en: "Collects Codex session logs and registers a cron job for auto-collection every 2 hours.",
  },
  "setup.step4": { ko: "Gemini CLI 텔레메트리", en: "Gemini CLI Telemetry" },
  "setup.step4.desc": {
    ko: "Gemini 네이티브 OTel을 활성화해 실시간으로 사용량을 전송합니다.",
    en: "Enables Gemini native OTel for real-time usage transmission.",
  },
  "setup.afterInstall": { ko: "설치 후 동작", en: "After Installation" },
  "setup.claude.after": {
    ko: "세션 종료 시 자동 수집 (Stop hook)",
    en: "Auto-collected on session end (Stop hook)",
  },
  "setup.codex.after": {
    ko: "2시간마다 자동 수집 (cron)",
    en: "Auto-collected every 2 hours (cron)",
  },
  "setup.gemini.after": {
    ko: "세션 중 실시간 전송 (네이티브 OTel)",
    en: "Real-time during sessions (native OTel)",
  },
  "setup.troubleshooting": { ko: "문제 해결", en: "Troubleshooting" },
  "setup.trouble1.title": {
    ko: "git email이 @eoeoeo.net이 아닌 경우",
    en: "git email is not @eoeoeo.net",
  },
  "setup.trouble1.desc": {
    ko: "설치 스크립트가 자동으로 물어봅니다. 본인 이메일 아이디만 입력하세요.",
    en: "The install script will prompt you. Just enter your email ID.",
  },
  "setup.trouble2.title": {
    ko: "이미 설치했는데 데이터가 안 보이는 경우",
    en: "Already installed but data not showing",
  },
  "setup.trouble2.desc": {
    ko: "Claude Code 세션을 한 번 종료해보세요. Stop hook이 실행되면서 데이터가 전송됩니다.",
    en: "Try ending a Claude Code session. The Stop hook will send the data.",
  },
  "setup.trouble3.title": {
    ko: "업데이트가 필요한 경우",
    en: "Need to update",
  },
  "setup.trouble3.desc": {
    ko: "같은 명령어를 다시 실행하면 자동으로 최신 버전으로 업데이트됩니다.",
    en: "Run the same command again to auto-update to the latest version.",
  },

  // ── DateRangePicker ──
  "date.7d": { ko: "7일", en: "7D" },
  "date.30d": { ko: "30일", en: "30D" },
  "date.90d": { ko: "90일", en: "90D" },

  // ── Leaderboard periods ──
  "period.today": { ko: "오늘", en: "Today" },
  "period.7days": { ko: "7일", en: "7 Days" },
  "period.30days": { ko: "30일", en: "30 Days" },
  "period.allTime": { ko: "전체", en: "All Time" },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, locale: Locale): string {
  return translations[key][locale];
}
