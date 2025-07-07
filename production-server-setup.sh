#!/bin/bash

# MyTracksy Production Server Setup Script
# This script configures a Ubuntu 20.04 LTS server for MyTracksy production deployment

set -e

echo "🚀 Starting MyTracksy Production Server Setup..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log function
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

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root"
fi

# Update system packages
log "Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
log "Installing essential packages..."
apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    build-essential \
    htop \
    vim \
    ufw \
    fail2ban

# Install Node.js 18.x
log "Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
log "Node.js installed: $NODE_VERSION"
log "npm installed: $NPM_VERSION"

# Install PM2 for process management
log "Installing PM2..."
npm install pm2 -g

# Install Nginx
log "Installing Nginx..."
apt install nginx -y

# Install PostgreSQL
log "Installing PostgreSQL..."
apt install postgresql postgresql-contrib -y

# Install Redis
log "Installing Redis..."
apt install redis-server -y

# Install Docker
log "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install docker-ce docker-ce-cli containerd.io -y

# Install Docker Compose
log "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create mytracksy user
log "Creating mytracksy user..."
useradd -m -s /bin/bash mytracksy
usermod -aG sudo mytracksy
usermod -aG docker mytracksy

# Create application directories
log "Creating application directories..."
mkdir -p /var/www/mytracksy
mkdir -p /var/log/mytracksy
mkdir -p /etc/mytracksy
mkdir -p /opt/mytracksy/backups

# Set proper permissions
chown -R mytracksy:mytracksy /var/www/mytracksy
chown -R mytracksy:mytracksy /var/log/mytracksy
chown -R mytracksy:mytracksy /etc/mytracksy
chown -R mytracksy:mytracksy /opt/mytracksy

# Configure UFW firewall
log "Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Configure fail2ban
log "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
EOF

systemctl enable fail2ban
systemctl start fail2ban

# Configure PostgreSQL
log "Configuring PostgreSQL..."
sudo -u postgres createuser --createdb --pwprompt mytracksy || warn "PostgreSQL user may already exist"
sudo -u postgres createdb mytracksy_prod || warn "PostgreSQL database may already exist"

# Configure Redis
log "Configuring Redis..."
sed -i 's/# requirepass foobared/requirepass mytracksy_redis_secure_password/' /etc/redis/redis.conf
systemctl restart redis-server
systemctl enable redis-server

# Configure Nginx basic setup
log "Configuring Nginx..."
rm -f /etc/nginx/sites-enabled/default

cat > /etc/nginx/sites-available/mytracksy << 'EOF'
# MyTracksy Nginx Configuration
server {
    listen 80;
    server_name localhost;
    
    # Temporary configuration - will be updated with SSL
    location / {
        root /var/www/mytracksy;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

ln -s /etc/nginx/sites-available/mytracksy /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# Install SSL certificate tools (Certbot)
log "Installing Certbot for SSL certificates..."
apt install snapd -y
snap install core; snap refresh core
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot

# Create systemd service for MyTracksy
log "Creating MyTracksy systemd service..."
cat > /etc/systemd/system/mytracksy.service << EOF
[Unit]
Description=MyTracksy Application
After=network.target postgresql.service redis-server.service

[Service]
Type=forking
User=mytracksy
WorkingDirectory=/var/www/mytracksy
ExecStart=/usr/bin/pm2 start ecosystem.config.js --env production
ExecReload=/usr/bin/pm2 restart all
ExecStop=/usr/bin/pm2 stop all
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable mytracksy

# Configure log rotation
log "Configuring log rotation..."
cat > /etc/logrotate.d/mytracksy << EOF
/var/log/mytracksy/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 0644 mytracksy mytracksy
    postrotate
        systemctl reload mytracksy
    endscript
}
EOF

# Install monitoring tools
log "Installing monitoring tools..."
apt install htop iotop nethogs -y

# Create environment file template
log "Creating environment configuration..."
cat > /etc/mytracksy/.env.production.template << 'EOF'
# MyTracksy Production Environment Configuration
NODE_ENV=production
PORT=3000
DOMAIN=your-domain.com

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mytracksy_prod
DB_USER=mytracksy
DB_PASSWORD=your-secure-db-password
DB_SSL=false

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=mytracksy_redis_secure_password

# Security
JWT_SECRET=your-super-secure-jwt-secret-key-min-32-chars
ENCRYPTION_KEY=your-32-character-encryption-key
SESSION_SECRET=your-session-secret

# SSL Configuration
SSL_CERT_PATH=/etc/letsencrypt/live/your-domain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/your-domain.com/privkey.pem

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Government API Keys (Sri Lankan)
IRD_API_KEY=your-ird-api-key
EPF_API_KEY=your-epf-api-key
ETF_API_KEY=your-etf-api-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-newrelic-key
EOF

chmod 600 /etc/mytracksy/.env.production.template
chown mytracksy:mytracksy /etc/mytracksy/.env.production.template

# Create deployment script
log "Creating deployment script..."
cat > /opt/mytracksy/deploy.sh << 'EOF'
#!/bin/bash
# MyTracksy Deployment Script

set -e

APP_DIR="/var/www/mytracksy"
BACKUP_DIR="/opt/mytracksy/backups"
LOG_FILE="/var/log/mytracksy/deploy.log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Create backup
log "Creating backup..."
BACKUP_NAME="mytracksy_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR/$BACKUP_NAME
cp -r $APP_DIR/* $BACKUP_DIR/$BACKUP_NAME/ 2>/dev/null || true

# Stop application
log "Stopping application..."
pm2 stop all || true

# Deploy new version
log "Deploying application..."
cd $APP_DIR

# Install dependencies
log "Installing dependencies..."
npm ci --only=production

# Run database migrations
log "Running database migrations..."
npm run migrate:production || log "Migration command not found, skipping..."

# Start application
log "Starting application..."
pm2 start ecosystem.config.js --env production

# Verify deployment
log "Verifying deployment..."
sleep 10
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    log "Deployment successful!"
else
    log "Deployment verification failed, rolling back..."
    pm2 stop all
    cp -r $BACKUP_DIR/$BACKUP_NAME/* $APP_DIR/
    pm2 start ecosystem.config.js --env production
    exit 1
fi

# Cleanup old backups (keep last 5)
log "Cleaning up old backups..."
ls -t $BACKUP_DIR | tail -n +6 | xargs -I {} rm -rf $BACKUP_DIR/{}

log "Deployment completed successfully!"
EOF

chmod +x /opt/mytracksy/deploy.sh
chown mytracksy:mytracksy /opt/mytracksy/deploy.sh

# Create backup script
log "Creating backup script..."
cat > /opt/mytracksy/backup.sh << 'EOF'
#!/bin/bash
# MyTracksy Backup Script

set -e

BACKUP_DIR="/opt/mytracksy/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_BACKUP_DIR="$BACKUP_DIR/db_$DATE"

mkdir -p $DB_BACKUP_DIR

# Backup database
echo "Backing up database..."
sudo -u postgres pg_dump mytracksy_prod > $DB_BACKUP_DIR/mytracksy_prod.sql

# Backup application files
echo "Backing up application files..."
tar -czf $DB_BACKUP_DIR/app_files.tar.gz -C /var/www mytracksy

# Backup configuration
echo "Backing up configuration..."
cp /etc/mytracksy/.env.production $DB_BACKUP_DIR/ 2>/dev/null || true

echo "Backup completed: $DB_BACKUP_DIR"

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -type d -mtime +7 -name "db_*" -exec rm -rf {} +
EOF

chmod +x /opt/mytracksy/backup.sh
chown mytracksy:mytracksy /opt/mytracksy/backup.sh

# Setup daily backup cron job
log "Setting up backup cron job..."
echo "0 2 * * * /opt/mytracksy/backup.sh >> /var/log/mytracksy/backup.log 2>&1" | crontab -u mytracksy -

# Create health check script
log "Creating health check script..."
cat > /opt/mytracksy/health-check.sh << 'EOF'
#!/bin/bash
# MyTracksy Health Check Script

HEALTH_URL="http://localhost:3000/health"
LOG_FILE="/var/log/mytracksy/health.log"

check_health() {
    if curl -f $HEALTH_URL > /dev/null 2>&1; then
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] Health check passed" >> $LOG_FILE
        return 0
    else
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] Health check failed" >> $LOG_FILE
        return 1
    fi
}

# Run health check
if ! check_health; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Attempting to restart application..." >> $LOG_FILE
    systemctl restart mytracksy
    sleep 30
    
    if check_health; then
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] Application restarted successfully" >> $LOG_FILE
    else
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] Failed to restart application, manual intervention required" >> $LOG_FILE
        # Send alert (implement notification system)
    fi
fi
EOF

chmod +x /opt/mytracksy/health-check.sh
chown mytracksy:mytracksy /opt/mytracksy/health-check.sh

# Setup health check cron job (every 5 minutes)
echo "*/5 * * * * /opt/mytracksy/health-check.sh" | crontab -u mytracksy -

# Display system information
log "Server setup completed! System information:"
echo "=================================="
echo "OS: $(lsb_release -d | cut -f2)"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "Docker: $(docker --version | cut -d' ' -f3 | tr -d ',')"
echo "PostgreSQL: $(sudo -u postgres psql --version | cut -d' ' -f3)"
echo "Redis: $(redis-server --version | cut -d' ' -f3)"
echo "Nginx: $(nginx -v 2>&1 | cut -d' ' -f3 | tr -d 'nginx/')"
echo "=================================="

log "🎉 MyTracksy production server setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Copy your application files to /var/www/mytracksy"
echo "2. Configure /etc/mytracksy/.env.production with your settings"
echo "3. Obtain SSL certificates with: certbot --nginx -d your-domain.com"
echo "4. Deploy your application with: /opt/mytracksy/deploy.sh"
echo ""
echo "Important files:"
echo "- Application directory: /var/www/mytracksy"
echo "- Configuration: /etc/mytracksy/.env.production"
echo "- Logs: /var/log/mytracksy/"
echo "- Backups: /opt/mytracksy/backups/"
echo "- Scripts: /opt/mytracksy/"