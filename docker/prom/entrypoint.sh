#!/bin/sh
# 환경변수로 scrape target 동적 치환
# 로컬 docker-compose: OTEL_COLLECTOR_HOST=otel-collector:8889 (기본값)
# Railway: OTEL_COLLECTOR_HOST=otel-collector.railway.internal:8889
OTEL_HOST="${OTEL_COLLECTOR_HOST:-otel-collector:8889}"
sed -i "s|__OTEL_COLLECTOR_HOST__|${OTEL_HOST}|g" /etc/prometheus/prometheus.yml

exec /bin/prometheus \
  --config.file=/etc/prometheus/prometheus.yml \
  --web.listen-address=":${PORT:-9090}" \
  --web.enable-remote-write-receiver \
  --storage.tsdb.retention.time=90d
