#!/bin/bash

# MyTracksy Monitoring Dashboard Deployment Script
# Complete monitoring stack with Prometheus, Grafana, and custom dashboards

set -e

echo "📊 Deploying MyTracksy Monitoring Dashboards..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    error "Docker is required but not installed"
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose is required but not installed"
fi

log "Creating monitoring infrastructure..."

# Create monitoring directory structure
mkdir -p /opt/mytracksy/monitoring/{prometheus,grafana,alertmanager,loki,node-exporter}
cd /opt/mytracksy/monitoring

# Create Prometheus configuration
log "Configuring Prometheus..."
cat > prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  # MyTracksy Application
  - job_name: 'mytracksy-app'
    static_configs:
      - targets: ['host.docker.internal:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  # Node Exporter for system metrics
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  # Prometheus itself
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Firebase/Firestore metrics (if available)
  - job_name: 'firebase-metrics'
    static_configs:
      - targets: ['host.docker.internal:8080']
    metrics_path: '/metrics'
    scrape_interval: 30s

  # Nginx metrics
  - job_name: 'nginx'
    static_configs:
      - targets: ['host.docker.internal:9113']
    metrics_path: '/metrics'
    scrape_interval: 15s
EOF

# Create Prometheus alert rules
cat > prometheus/alert_rules.yml << 'EOF'
groups:
  - name: mytracksy_alerts
    rules:
      # Application alerts
      - alert: ApplicationDown
        expr: up{job="mytracksy-app"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "MyTracksy application is down"
          description: "MyTracksy application has been down for more than 1 minute"

      - alert: HighErrorRate
        expr: (rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])) > 0.05
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 5% for more than 2 minutes"

      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "Slow response time"
          description: "95th percentile response time is above 2 seconds"

      # System alerts
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
          description: "CPU usage is above 80% for more than 5 minutes"

      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High memory usage"
          description: "Memory usage is above 85% for more than 5 minutes"

      - alert: LowDiskSpace
        expr: (1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100 > 90
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Low disk space"
          description: "Disk usage is above 90%"

      # Business logic alerts
      - alert: TaxCalculationFailures
        expr: increase(tax_calculation_errors_total[5m]) > 5
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Tax calculation failures"
          description: "More than 5 tax calculation failures in the last 5 minutes"

      - alert: GovernmentPortalDown
        expr: government_portal_status == 0
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Government portal connection failed"
          description: "Unable to connect to government portals for filing"

      - alert: HighUserRegistrations
        expr: increase(user_registrations_total[1h]) > 100
        for: 0m
        labels:
          severity: info
        annotations:
          summary: "High user registration rate"
          description: "More than 100 user registrations in the last hour"
EOF

# Create Grafana configuration
log "Configuring Grafana..."
mkdir -p grafana/{dashboards,provisioning/{dashboards,datasources}}

# Grafana datasource configuration
cat > grafana/provisioning/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    orgId: 1
    url: http://prometheus:9090
    basicAuth: false
    isDefault: true
    editable: true
EOF

# Grafana dashboard provisioning
cat > grafana/provisioning/dashboards/dashboard.yml << 'EOF'
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF

# Create MyTracksy Application Dashboard
cat > grafana/dashboards/mytracksy-app-dashboard.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "MyTracksy Application Dashboard",
    "tags": ["mytracksy", "application"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Application Status",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"mytracksy-app\"}",
            "legendFormat": "App Status"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {"color": "red", "value": null},
                {"color": "green", "value": 1}
              ]
            },
            "mappings": [
              {"options": {"0": {"text": "DOWN"}}, "type": "value"},
              {"options": {"1": {"text": "UP"}}, "type": "value"}
            ]
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "Requests/sec"
          }
        ],
        "gridPos": {"h": 8, "w": 18, "x": 6, "y": 0}
      },
      {
        "id": 3,
        "title": "Response Time (95th percentile)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
      },
      {
        "id": 4,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m])",
            "legendFormat": "Error Rate"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8}
      },
      {
        "id": 5,
        "title": "Active Users",
        "type": "stat",
        "targets": [
          {
            "expr": "active_users_total",
            "legendFormat": "Active Users"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 0, "y": 16}
      },
      {
        "id": 6,
        "title": "Tax Calculations",
        "type": "stat",
        "targets": [
          {
            "expr": "increase(tax_calculations_total[1h])",
            "legendFormat": "Last Hour"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 6, "y": 16}
      },
      {
        "id": 7,
        "title": "Government Filings",
        "type": "stat",
        "targets": [
          {
            "expr": "increase(government_filings_total[1h])",
            "legendFormat": "Last Hour"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 12, "y": 16}
      },
      {
        "id": 8,
        "title": "Database Connections",
        "type": "stat",
        "targets": [
          {
            "expr": "db_connections_active",
            "legendFormat": "Active Connections"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 18, "y": 16}
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
EOF

# Create System Metrics Dashboard
cat > grafana/dashboards/system-metrics-dashboard.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "MyTracksy System Metrics",
    "tags": ["mytracksy", "system"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "100 - (avg by(instance) (irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU Usage %"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
            "legendFormat": "Memory Usage %"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
      },
      {
        "id": 3,
        "title": "Disk Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100",
            "legendFormat": "Disk Usage %"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
      },
      {
        "id": 4,
        "title": "Network I/O",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(node_network_receive_bytes_total[5m])",
            "legendFormat": "Receive"
          },
          {
            "expr": "rate(node_network_transmit_bytes_total[5m])",
            "legendFormat": "Transmit"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8}
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
EOF

# Create Business Metrics Dashboard
cat > grafana/dashboards/business-metrics-dashboard.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "MyTracksy Business Metrics",
    "tags": ["mytracksy", "business"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "User Registrations",
        "type": "graph",
        "targets": [
          {
            "expr": "increase(user_registrations_total[1h])",
            "legendFormat": "Hourly Registrations"
          }
        ],
        "gridPos": {"h": 8, "w": 8, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Expense Entries",
        "type": "graph",
        "targets": [
          {
            "expr": "increase(expense_entries_total[1h])",
            "legendFormat": "Hourly Entries"
          }
        ],
        "gridPos": {"h": 8, "w": 8, "x": 8, "y": 0}
      },
      {
        "id": 3,
        "title": "Tax Calculations",
        "type": "graph",
        "targets": [
          {
            "expr": "increase(tax_calculations_total[1h])",
            "legendFormat": "Hourly Calculations"
          }
        ],
        "gridPos": {"h": 8, "w": 8, "x": 16, "y": 0}
      },
      {
        "id": 4,
        "title": "Government Filings by Type",
        "type": "piechart",
        "targets": [
          {
            "expr": "government_filings_total",
            "legendFormat": "{{type}}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
      },
      {
        "id": 5,
        "title": "Revenue Impact",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(subscription_revenue_total)",
            "legendFormat": "Total Revenue"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8}
      }
    ],
    "time": {
      "from": "now-24h",
      "to": "now"
    },
    "refresh": "1m"
  }
}
EOF

# Create Alertmanager configuration
log "Configuring Alertmanager..."
cat > alertmanager/alertmanager.yml << 'EOF'
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@mytracksy.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
  - name: 'web.hook'
    email_configs:
      - to: 'admin@mytracksy.com'
        subject: '[MyTracksy Alert] {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}
    
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#alerts'
        title: 'MyTracksy Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'dev', 'instance']
EOF

# Create Docker Compose file for monitoring stack
log "Creating monitoring stack Docker Compose..."
cat > docker-compose.monitoring.yml << 'EOF'
version: '3.8'

networks:
  monitoring:
    driver: bridge

volumes:
  prometheus_data:
  grafana_data:
  alertmanager_data:

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: mytracksy-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus:/etc/prometheus
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - monitoring
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: mytracksy-grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
      - ./grafana/dashboards:/var/lib/grafana/dashboards
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=mytracksy123
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    networks:
      - monitoring
    restart: unless-stopped

  alertmanager:
    image: prom/alertmanager:latest
    container_name: mytracksy-alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager:/etc/alertmanager
      - alertmanager_data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
      - '--web.external-url=http://localhost:9093'
    networks:
      - monitoring
    restart: unless-stopped

  node-exporter:
    image: prom/node-exporter:latest
    container_name: mytracksy-node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - monitoring
    restart: unless-stopped

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: mytracksy-cadvisor
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:rw
      - /sys:/sys:ro
      - /var/lib/docker:/var/lib/docker:ro
    privileged: true
    devices:
      - /dev/kmsg:/dev/kmsg
    networks:
      - monitoring
    restart: unless-stopped

  nginx-exporter:
    image: nginx/nginx-prometheus-exporter:latest
    container_name: mytracksy-nginx-exporter
    ports:
      - "9113:9113"
    command:
      - -nginx.scrape-uri=http://host.docker.internal/nginx_status
    networks:
      - monitoring
    restart: unless-stopped
EOF

# Create monitoring deployment script
cat > deploy-monitoring.sh << 'EOF'
#!/bin/bash

echo "🚀 Deploying MyTracksy monitoring stack..."

# Start monitoring services
docker-compose -f docker-compose.monitoring.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🔍 Checking service health..."
if curl -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
    echo "✅ Prometheus is healthy"
else
    echo "❌ Prometheus health check failed"
fi

if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Grafana is healthy"
else
    echo "❌ Grafana health check failed"
fi

if curl -f http://localhost:9093/-/healthy > /dev/null 2>&1; then
    echo "✅ Alertmanager is healthy"
else
    echo "❌ Alertmanager health check failed"
fi

echo ""
echo "🎉 Monitoring stack deployed successfully!"
echo ""
echo "Access URLs:"
echo "- Prometheus: http://localhost:9090"
echo "- Grafana: http://localhost:3001 (admin/mytracksy123)"
echo "- Alertmanager: http://localhost:9093"
echo ""
echo "Next steps:"
echo "1. Configure alert notification channels"
echo "2. Set up custom dashboards"
echo "3. Configure backup for monitoring data"
EOF

chmod +x deploy-monitoring.sh

# Create monitoring backup script
cat > backup-monitoring.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/mytracksy/backups/monitoring"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "📊 Backing up monitoring data..."

# Backup Prometheus data
docker-compose -f docker-compose.monitoring.yml exec -T prometheus promtool tsdb snapshot /prometheus
docker cp mytracksy-prometheus:/prometheus/snapshots $BACKUP_DIR/prometheus_$DATE

# Backup Grafana dashboards and config
docker cp mytracksy-grafana:/var/lib/grafana $BACKUP_DIR/grafana_$DATE

# Backup Alertmanager config
cp -r alertmanager $BACKUP_DIR/alertmanager_$DATE

echo "✅ Monitoring backup completed: $BACKUP_DIR"

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -type d -mtime +7 -name "*_*" -exec rm -rf {} +
EOF

chmod +x backup-monitoring.sh

# Create monitoring health check script
cat > health-check-monitoring.sh << 'EOF'
#!/bin/bash

LOG_FILE="/var/log/mytracksy/monitoring-health.log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Check Prometheus
if curl -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
    log "✅ Prometheus is healthy"
else
    log "❌ Prometheus is down - attempting restart"
    docker-compose -f /opt/mytracksy/monitoring/docker-compose.monitoring.yml restart prometheus
fi

# Check Grafana
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    log "✅ Grafana is healthy"
else
    log "❌ Grafana is down - attempting restart"
    docker-compose -f /opt/mytracksy/monitoring/docker-compose.monitoring.yml restart grafana
fi

# Check Alertmanager
if curl -f http://localhost:9093/-/healthy > /dev/null 2>&1; then
    log "✅ Alertmanager is healthy"
else
    log "❌ Alertmanager is down - attempting restart"
    docker-compose -f /opt/mytracksy/monitoring/docker-compose.monitoring.yml restart alertmanager
fi

# Check disk space for monitoring data
DISK_USAGE=$(df /opt/mytracksy/monitoring | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    log "⚠️ High disk usage for monitoring data: ${DISK_USAGE}%"
fi
EOF

chmod +x health-check-monitoring.sh

# Set proper ownership
chown -R mytracksy:mytracksy /opt/mytracksy/monitoring
chmod +x *.sh

# Deploy the monitoring stack
log "Deploying monitoring stack..."
./deploy-monitoring.sh

# Setup cron job for health checks
echo "*/5 * * * * /opt/mytracksy/monitoring/health-check-monitoring.sh" | crontab -u mytracksy -

# Setup daily backup
echo "0 3 * * * /opt/mytracksy/monitoring/backup-monitoring.sh" | crontab -u mytracksy -

log "🎉 Monitoring dashboard deployment completed!"
echo ""
echo "Deployment Summary:"
echo "=================="
echo "✅ Prometheus deployed on port 9090"
echo "✅ Grafana deployed on port 3001"
echo "✅ Alertmanager deployed on port 9093"
echo "✅ Node Exporter deployed on port 9100"
echo "✅ cAdvisor deployed on port 8080"
echo "✅ Nginx Exporter deployed on port 9113"
echo ""
echo "Access Information:"
echo "- Prometheus: http://localhost:9090"
echo "- Grafana: http://localhost:3001"
echo "  - Username: admin"
echo "  - Password: mytracksy123"
echo "- Alertmanager: http://localhost:9093"
echo ""
echo "Dashboards Available:"
echo "- MyTracksy Application Dashboard"
echo "- System Metrics Dashboard"
echo "- Business Metrics Dashboard"
echo ""
echo "Monitoring Features:"
echo "✅ Real-time application metrics"
echo "✅ System resource monitoring"
echo "✅ Business intelligence metrics"
echo "✅ Automated alerting"
echo "✅ Health checks and auto-recovery"
echo "✅ Daily backups"
echo ""
echo "Your MyTracksy monitoring system is now operational!"