#!/bin/sh
exec /bin/prometheus \
  --config.file=/etc/prometheus/prometheus.yml \
  --web.listen-address=":${PORT:-9090}" \
  --web.enable-remote-write-receiver \
  --storage.tsdb.retention.time=90d
