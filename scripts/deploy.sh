#!/bin/bash
# token-dashboard 배포 파이프라인
# 빌드 → 로컬 테스트 → Vercel 배포 → 프로덕션 검증
set -euo pipefail

PORT=3999
API_URL="http://localhost:$PORT/api/analytics?start=2026-03-01&end=2026-03-08"
PROD_URL="https://token-dashboard-iota.vercel.app/api/analytics?start=2026-03-01&end=2026-03-08"

echo "=== [1/4] 빌드 ==="
npx next build

echo "=== [2/4] 로컬 API 테스트 ==="
PROMETHEUS_URL="${PROMETHEUS_URL:-https://prometheus-production-ae90.up.railway.app}" \
  npx next start -p $PORT &
SERVER_PID=$!
sleep 3

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" 2>/dev/null || echo "000")
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

if [ "$STATUS" != "200" ]; then
  echo "❌ 로컬 API 테스트 실패 (HTTP $STATUS). 배포 중단."
  exit 1
fi
echo "✅ 로컬 API 정상 (HTTP 200)"

echo "=== [3/4] Vercel 배포 ==="
npx vercel --prod

echo "=== [4/4] 프로덕션 검증 ==="
sleep 5
PROD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL" 2>/dev/null || echo "000")
if [ "$PROD_STATUS" != "200" ]; then
  echo "⚠️ 프로덕션 API 응답 이상 (HTTP $PROD_STATUS). 확인 필요."
  exit 1
fi
echo "✅ 프로덕션 배포 완료 + 검증 통과"
