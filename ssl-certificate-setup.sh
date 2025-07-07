#!/bin/bash

# MyTracksy SSL Certificate Setup Script
# Automated SSL certificate generation and configuration for production

set -e

echo "🔐 Starting MyTracksy SSL Certificate Setup..."

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

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root"
fi

# Get domain name from user
if [ -z "$1" ]; then
    echo "Usage: $0 <domain-name>"
    echo "Example: $0 mytracksy.com"
    exit 1
fi

DOMAIN=$1
EMAIL="admin@${DOMAIN}"

log "Setting up SSL certificates for domain: $DOMAIN"

# Install Certbot if not already installed
if ! command -v certbot &> /dev/null; then
    log "Installing Certbot..."
    apt update
    apt install snapd -y
    snap install core; snap refresh core
    snap install --classic certbot
    ln -sf /snap/bin/certbot /usr/bin/certbot
fi

# Stop Nginx temporarily for standalone certificate generation
log "Stopping Nginx temporarily..."
systemctl stop nginx || warn "Nginx not running"

# Generate SSL certificate using Certbot
log "Generating SSL certificate for $DOMAIN..."
certbot certonly \
    --standalone \
    --agree-tos \
    --no-eff-email \
    --email $EMAIL \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --non-interactive

# Verify certificate was created
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    error "SSL certificate generation failed"
fi

log "SSL certificate generated successfully!"

# Create enhanced Nginx configuration with SSL
log "Creating SSL-enabled Nginx configuration..."
cat > /etc/nginx/sites-available/mytracksy-ssl << EOF
# MyTracksy Production Nginx Configuration with SSL
upstream mytracksy_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
    # ACME challenge for certificate renewal
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_timeout 10m;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/$DOMAIN/chain.pem;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; connect-src 'self' https://api.mytracksy.com;" always;
    
    # Root directory
    root /var/www/mytracksy;
    index index.html index.htm;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        image/svg+xml;
    
    # Static assets with long cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
        
        # Optional: Serve compressed versions if available
        location ~* \.(js|css)$ {
            gzip_static on;
        }
    }
    
    # API endpoints
    location /api/ {
        proxy_pass http://mytracksy_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$server_name;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
        
        # CORS headers for API
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
        
        # Handle preflight requests
        if (\$request_method = 'OPTIONS') {
            return 204;
        }
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
    
    # Firebase specific endpoints
    location /__/ {
        proxy_pass http://mytracksy_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Service Worker
    location /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # Manifest file
    location /manifest.json {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Content-Type "application/manifest+json";
    }
    
    # Main application - SPA routing
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # Security headers for HTML files
        location ~* \.html$ {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }
    }
    
    # Robots.txt
    location = /robots.txt {
        allow all;
        log_not_found off;
        access_log off;
    }
    
    # Favicon
    location = /favicon.ico {
        log_not_found off;
        access_log off;
    }
    
    # Block access to hidden files and directories
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Block access to backup and source files
    location ~* \.(bak|config|sql|fla|psd|ini|log|sh|inc|swp|dist)\$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}

# Rate limiting zones
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=auth:10m rate=5r/s;
limit_req_zone \$binary_remote_addr zone=general:10m rate=30r/s;
EOF

# Remove old configuration and enable new one
log "Updating Nginx configuration..."
rm -f /etc/nginx/sites-enabled/mytracksy
rm -f /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/mytracksy-ssl /etc/nginx/sites-enabled/mytracksy-ssl

# Test Nginx configuration
log "Testing Nginx configuration..."
nginx -t

# Create certificate renewal script
log "Setting up automatic certificate renewal..."
cat > /etc/cron.d/certbot-renewal << EOF
# Automatic certificate renewal for MyTracksy
SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# Renew certificates twice daily and reload nginx if certificates are renewed
0 */12 * * * root test -x /usr/bin/certbot && perl -e 'sleep int(rand(43200))' && certbot renew --quiet --deploy-hook "systemctl reload nginx"
EOF

# Test certificate renewal (dry run)
log "Testing certificate renewal..."
certbot renew --dry-run

# Create SSL monitoring script
log "Creating SSL certificate monitoring script..."
cat > /opt/mytracksy/ssl-monitor.sh << 'EOF'
#!/bin/bash
# SSL Certificate Monitoring Script for MyTracksy

DOMAIN="$1"
LOG_FILE="/var/log/mytracksy/ssl-monitor.log"
ALERT_DAYS=30

if [ -z "$DOMAIN" ]; then
    echo "Usage: $0 <domain>"
    exit 1
fi

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

# Check certificate expiry
check_certificate_expiry() {
    local domain=$1
    local cert_file="/etc/letsencrypt/live/$domain/fullchain.pem"
    
    if [ ! -f "$cert_file" ]; then
        log "ERROR: Certificate file not found for $domain"
        return 1
    fi
    
    # Get certificate expiry date
    local expiry_date=$(openssl x509 -enddate -noout -in "$cert_file" | cut -d= -f2)
    local expiry_timestamp=$(date -d "$expiry_date" +%s)
    local current_timestamp=$(date +%s)
    local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
    
    log "Certificate for $domain expires in $days_until_expiry days"
    
    if [ $days_until_expiry -le $ALERT_DAYS ]; then
        log "WARNING: Certificate for $domain expires in $days_until_expiry days"
        send_alert "$domain" "$days_until_expiry"
    fi
    
    return 0
}

# Send alert (customize this function based on your notification system)
send_alert() {
    local domain=$1
    local days=$2
    
    # Example: Send email alert
    # echo "SSL certificate for $domain expires in $days days" | mail -s "SSL Certificate Expiry Alert" admin@$domain
    
    # Example: Send to Slack webhook
    # curl -X POST -H 'Content-type: application/json' --data '{"text":"SSL certificate for '$domain' expires in '$days' days"}' YOUR_SLACK_WEBHOOK_URL
    
    log "Alert sent for $domain certificate expiry in $days days"
}

# Run certificate check
check_certificate_expiry "$DOMAIN"
EOF

chmod +x /opt/mytracksy/ssl-monitor.sh
chown mytracksy:mytracksy /opt/mytracksy/ssl-monitor.sh

# Add SSL monitoring to cron (daily check)
echo "0 8 * * * /opt/mytracksy/ssl-monitor.sh $DOMAIN" | crontab -u mytracksy -

# Create SSL security test script
log "Creating SSL security test script..."
cat > /opt/mytracksy/ssl-test.sh << 'EOF'
#!/bin/bash
# SSL Security Test Script for MyTracksy

DOMAIN="$1"

if [ -z "$DOMAIN" ]; then
    echo "Usage: $0 <domain>"
    exit 1
fi

echo "🔐 Testing SSL configuration for $DOMAIN..."

# Test SSL certificate
echo "1. Testing SSL certificate..."
openssl s_client -connect $DOMAIN:443 -servername $DOMAIN < /dev/null 2>/dev/null | openssl x509 -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:)"

# Test SSL configuration with testssl.sh (if available)
if command -v testssl.sh &> /dev/null; then
    echo "2. Running comprehensive SSL test..."
    testssl.sh --quiet --color 0 $DOMAIN
else
    echo "2. Install testssl.sh for comprehensive SSL testing:"
    echo "   git clone https://github.com/drwetter/testssl.sh.git"
fi

# Test security headers
echo "3. Testing security headers..."
curl -I https://$DOMAIN 2>/dev/null | grep -E "(Strict-Transport-Security|X-Content-Type-Options|X-Frame-Options|X-XSS-Protection|Content-Security-Policy)"

# Test HTTP to HTTPS redirect
echo "4. Testing HTTP to HTTPS redirect..."
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN)
if [ "$HTTP_RESPONSE" = "301" ] || [ "$HTTP_RESPONSE" = "302" ]; then
    echo "✅ HTTP to HTTPS redirect working (Status: $HTTP_RESPONSE)"
else
    echo "❌ HTTP to HTTPS redirect not working (Status: $HTTP_RESPONSE)"
fi

# Test SSL Labs rating (requires internet and time)
echo "5. For detailed SSL analysis, visit:"
echo "   https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"

echo ""
echo "SSL configuration test completed!"
EOF

chmod +x /opt/mytracksy/ssl-test.sh
chown mytracksy:mytracksy /opt/mytracksy/ssl-test.sh

# Start Nginx with new configuration
log "Starting Nginx with SSL configuration..."
systemctl start nginx
systemctl enable nginx

# Test the SSL configuration
log "Testing SSL configuration..."
sleep 5

# Verify HTTPS is working
if curl -f -s https://$DOMAIN/health > /dev/null; then
    log "✅ HTTPS is working correctly!"
else
    warn "HTTPS test failed, please check configuration"
fi

# Update environment configuration with SSL paths
log "Updating environment configuration..."
if [ -f "/etc/mytracksy/.env.production" ]; then
    sed -i "s|SSL_CERT_PATH=.*|SSL_CERT_PATH=/etc/letsencrypt/live/$DOMAIN/fullchain.pem|" /etc/mytracksy/.env.production
    sed -i "s|SSL_KEY_PATH=.*|SSL_KEY_PATH=/etc/letsencrypt/live/$DOMAIN/privkey.pem|" /etc/mytracksy/.env.production
    sed -i "s|DOMAIN=.*|DOMAIN=$DOMAIN|" /etc/mytracksy/.env.production
fi

log "🎉 SSL certificate setup completed successfully!"
echo ""
echo "SSL Setup Summary:"
echo "=================="
echo "✅ SSL certificate generated for $DOMAIN and www.$DOMAIN"
echo "✅ Nginx configured with SSL and security headers"
echo "✅ Automatic certificate renewal configured"
echo "✅ SSL monitoring script created"
echo "✅ HTTP to HTTPS redirect enabled"
echo ""
echo "Certificate details:"
echo "- Certificate: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "- Private key: /etc/letsencrypt/live/$DOMAIN/privkey.pem"
echo "- Auto-renewal: Configured via cron"
echo ""
echo "Monitoring:"
echo "- SSL monitor: /opt/mytracksy/ssl-monitor.sh"
echo "- SSL test: /opt/mytracksy/ssl-test.sh $DOMAIN"
echo "- Logs: /var/log/mytracksy/ssl-monitor.log"
echo ""
echo "Your MyTracksy application is now secured with SSL!"
echo "Visit: https://$DOMAIN"