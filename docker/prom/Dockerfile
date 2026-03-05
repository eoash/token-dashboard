FROM prom/prometheus:latest
COPY prometheus.yml /etc/prometheus/prometheus.yml
COPY entrypoint.sh /entrypoint.sh
USER root
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/bin/sh", "/entrypoint.sh"]
