FROM prom/prometheus:latest
COPY docker/prom/prometheus.yml /etc/prometheus/prometheus.yml
COPY docker/prom/entrypoint.sh /entrypoint.sh
USER root
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/bin/sh", "/entrypoint.sh"]
