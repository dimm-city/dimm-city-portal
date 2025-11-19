# Self-Hosting Guide

Complete guide for deploying and managing your own Dimm City Portal instance.

---

## Table of Contents

- [Why Self-Host?](#why-self-host)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Deployment Options](#deployment-options)
  - [Docker Compose (Recommended)](#option-1-docker-compose-recommended)
  - [systemd Service](#option-2-systemd-service-nodejs)
  - [PM2 Process Manager](#option-3-pm2-process-manager)
- [Reverse Proxy Setup](#reverse-proxy-setup)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Firewall Configuration](#firewall-configuration)
- [Domain Setup](#domain-setup)
- [Backup & Maintenance](#backup--maintenance)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Advanced Topics](#advanced-topics)

---

## Why Self-Host?

**Privacy & Control:**
- Your data stays on your server
- No third-party access to game content
- Full control over features and updates

**Cost Savings:**
- No monthly subscriptions
- Runs on modest hardware ($5/month VPS)
- Scales with your group size

**Customization:**
- Modify code to your needs
- Add custom features
- Integrate with your existing tools

**Reliability:**
- No dependency on external services
- Works offline (local network)
- You control uptime

---

## Requirements

### Minimum Hardware
- **CPU:** 1 core (2+ recommended)
- **RAM:** 512MB minimum (1GB recommended)
- **Storage:** 1GB for application + variable for sessions
- **Network:** 1Mbps upload minimum (for 4-6 players)

**Tested Platforms:**
- ✅ Raspberry Pi 4 (4GB)
- ✅ $5/month VPS (Digital Ocean, Linode, Vultr)
- ✅ Home server (Ubuntu, Debian, etc.)
- ✅ NAS (Synology, QNAP with Docker)

### Software Requirements
- **Option 1 (Docker):** Docker 20.10+ and Docker Compose 2.0+
- **Option 2 (Node.js):** Node.js 20+ and npm 9+
- **OS:** Linux (Ubuntu 22.04+ recommended), macOS, Windows with WSL2

---

## Quick Start

### 5-Minute Setup (Docker)

```bash
# 1. Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt-get install docker-compose-plugin

# 2. Clone repository
git clone https://github.com/dimm-city/dimm-city-portal.git
cd dimm-city-portal

# 3. Start application
docker-compose up -d

# 4. Access at http://localhost:3000
```

**That's it!** For production with custom domain, continue reading.

---

## Deployment Options

### Option 1: Docker Compose (Recommended)

**Advantages:** Easy updates, isolated environment, automatic restarts

#### 1. Install Docker

**Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Log out and back in
```

**Alternative (manual):**
```bash
sudo apt-get update
sudo apt-get install docker.io docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
```

#### 2. Clone and Configure

```bash
git clone https://github.com/dimm-city/dimm-city-portal.git
cd dimm-city-portal

# Edit configuration
nano docker-compose.yml
# Update ALLOWED_ORIGINS with your domain
```

#### 3. Start Container

```bash
docker-compose up -d
```

#### 4. View Logs

```bash
docker-compose logs -f
```

#### 5. Stop/Restart

```bash
# Stop
docker-compose down

# Restart
docker-compose restart

# Update to latest
git pull
docker-compose up -d --build
```

**See [DOCKER.md](./DOCKER.md) for advanced Docker configuration.**

---

### Option 2: systemd Service (Node.js)

**Advantages:** Native performance, direct system integration

#### 1. Install Node.js 20

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should show v20.x
```

#### 2. Clone and Build

```bash
git clone https://github.com/dimm-city/dimm-city-portal.git
cd dimm-city-portal
npm install
npm run build
```

#### 3. Create systemd Service

```bash
sudo nano /etc/systemd/system/dimm-city-portal.service
```

**Service file:**
```ini
[Unit]
Description=Dimm City Portal VTT
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/dimm-city-portal
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/node build/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=dimm-city-portal

[Install]
WantedBy=multi-user.target
```

**Replace:**
- `your-username` with your actual username
- `/path/to/dimm-city-portal` with actual path

#### 4. Enable and Start

```bash
sudo systemctl daemon-reload
sudo systemctl enable dimm-city-portal
sudo systemctl start dimm-city-portal

# Check status
sudo systemctl status dimm-city-portal

# View logs
sudo journalctl -u dimm-city-portal -f
```

#### 5. Manage Service

```bash
# Stop
sudo systemctl stop dimm-city-portal

# Restart
sudo systemctl restart dimm-city-portal

# Update application
cd /path/to/dimm-city-portal
git pull
npm install
npm run build
sudo systemctl restart dimm-city-portal
```

---

### Option 3: PM2 Process Manager

**Advantages:** Auto-restart, clustering, monitoring dashboard

#### 1. Install PM2

```bash
sudo npm install -g pm2
```

#### 2. Create Ecosystem File

```bash
nano ecosystem.config.js
```

**Configuration:**
```javascript
module.exports = {
  apps: [{
    name: 'dimm-city-portal',
    script: 'build/index.js',
    cwd: '/path/to/dimm-city-portal',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

#### 3. Start with PM2

```bash
# Start application
pm2 start ecosystem.config.js

# Save configuration
pm2 save

# Setup startup script
pm2 startup
# Run the command it outputs
```

#### 4. Manage with PM2

```bash
# Status
pm2 status

# Logs
pm2 logs dimm-city-portal

# Restart
pm2 restart dimm-city-portal

# Stop
pm2 stop dimm-city-portal

# Monitoring dashboard
pm2 monit
```

---

## Reverse Proxy Setup

**Why use a reverse proxy?**
- SSL/TLS termination (HTTPS)
- Domain name routing
- Load balancing (future)
- Static file caching

### nginx Configuration

#### 1. Install nginx

```bash
sudo apt-get update
sudo apt-get install nginx
```

#### 2. Create Site Configuration

```bash
sudo nano /etc/nginx/sites-available/dimm-city-portal
```

**Configuration:**
```nginx
# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name vtt.yourdomain.com;

    # Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name vtt.yourdomain.com;

    # SSL certificates (get with certbot, see below)
    ssl_certificate /etc/letsencrypt/live/vtt.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vtt.yourdomain.com/privkey.pem;

    # SSL configuration (Mozilla Intermediate)
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;

    # HSTS (optional, uncomment after testing)
    # add_header Strict-Transport-Security "max-age=63072000" always;

    # Proxy to Node.js application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # WebSocket support (critical for Socket.IO)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for WebSocket connections
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;

        # Buffering (disable for real-time)
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
    }

    # Optional: Serve static files directly
    # location /assets/ {
    #     alias /path/to/dimm-city-portal/build/client/assets/;
    #     expires 1y;
    #     add_header Cache-Control "public, immutable";
    # }
}
```

#### 3. Enable Site

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/dimm-city-portal /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Caddy Configuration (Simpler Alternative)

**Advantages:** Automatic HTTPS with Let's Encrypt, zero configuration

#### 1. Install Caddy

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

#### 2. Configure Caddy

```bash
sudo nano /etc/caddy/Caddyfile
```

**Configuration (incredibly simple!):**
```
vtt.yourdomain.com {
    reverse_proxy localhost:3000
}
```

**That's it!** Caddy automatically:
- Gets SSL certificate from Let's Encrypt
- Renews certificate automatically
- Redirects HTTP to HTTPS
- Handles WebSocket connections

#### 3. Reload Caddy

```bash
sudo systemctl reload caddy
```

---

## SSL/TLS Configuration

### Why HTTPS is Critical
- **Security:** Encrypts all data in transit
- **PWA Requirement:** Service workers only work over HTTPS
- **Browser Trust:** No "insecure" warnings
- **WebSocket Security:** wss:// instead of ws://

### Get Free SSL Certificate (Let's Encrypt)

#### Option 1: Certbot with nginx

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate (interactive)
sudo certbot --nginx -d vtt.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

Certbot will:
- Validate domain ownership
- Get SSL certificate
- Configure nginx automatically
- Setup auto-renewal (runs twice daily)

#### Option 2: Manual Certificate

```bash
# Get certificate only (manual nginx config)
sudo certbot certonly --webroot -w /var/www/html -d vtt.yourdomain.com

# Certificate files will be at:
# /etc/letsencrypt/live/vtt.yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/vtt.yourdomain.com/privkey.pem
```

### Test SSL Configuration

**SSL Labs Test:**
https://www.ssllabs.com/ssltest/analyze.html?d=vtt.yourdomain.com

**Aim for A or A+ rating.**

---

## Firewall Configuration

### UFW (Ubuntu/Debian)

```bash
# Install UFW
sudo apt-get install ufw

# Allow SSH (important: do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

**Do NOT expose port 3000 directly!** Use reverse proxy.

### firewalld (CentOS/RHEL)

```bash
# Allow services
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## Domain Setup

### 1. Register or Use Existing Domain

Options:
- **New domain:** Namecheap, Cloudflare, Google Domains
- **Subdomain:** `vtt.yourdomain.com`
- **Free options:** DuckDNS (dynamic DNS for home servers)

### 2. Configure DNS

**A Record:** Point domain to your server IP

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | vtt | 123.456.789.012 | 3600 |

Or for root domain:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 123.456.789.012 | 3600 |

**For IPv6:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| AAAA | vtt | 2001:db8::1 | 3600 |

### 3. Wait for DNS Propagation

```bash
# Check DNS propagation
dig vtt.yourdomain.com +short

# Should return your server IP
```

Usually takes 5-30 minutes, up to 48 hours in rare cases.

### 4. Test Domain

```bash
curl http://vtt.yourdomain.com
# Should connect to your server
```

---

## Backup & Maintenance

### Automated Backups

**Setup daily backups at 2 AM:**

```bash
crontab -e
```

Add:
```
0 2 * * * cd /path/to/dimm-city-portal && npm run backup:auto >> /var/log/dimm-backup.log 2>&1
```

### Offsite Backups

**Sync to remote server:**
```bash
# Create backup script
nano /path/to/backup-sync.sh
```

```bash
#!/bin/bash
cd /path/to/dimm-city-portal
npm run backup:auto
rsync -avz backups/ user@backup-server:/backups/dimm-city/
```

```bash
chmod +x /path/to/backup-sync.sh

# Add to cron
0 3 * * * /path/to/backup-sync.sh
```

### Updates

**Docker:**
```bash
cd /path/to/dimm-city-portal
git pull
docker-compose up -d --build
```

**Node.js (systemd):**
```bash
cd /path/to/dimm-city-portal
git pull
npm install
npm run build
sudo systemctl restart dimm-city-portal
```

**PM2:**
```bash
cd /path/to/dimm-city-portal
git pull
npm install
npm run build
pm2 restart dimm-city-portal
```

### Health Checks

**Check if service is running:**
```bash
# Docker
docker-compose ps

# systemd
sudo systemctl status dimm-city-portal

# PM2
pm2 status
```

**HTTP health check:**
```bash
curl http://localhost:3000
# Should return HTML
```

See [BACKUP.md](./BACKUP.md) for complete backup/restore guide.

---

## Monitoring

### Basic Monitoring

**View logs:**
```bash
# Docker
docker-compose logs -f --tail=100

# systemd
sudo journalctl -u dimm-city-portal -f

# PM2
pm2 logs dimm-city-portal
```

**Resource usage:**
```bash
# Docker
docker stats

# System
htop
```

### uptime-kuma (Recommended)

Free, self-hosted monitoring with alerts.

```bash
docker run -d \
  --name uptime-kuma \
  -p 3001:3001 \
  -v uptime-kuma:/app/data \
  louislam/uptime-kuma:1
```

Access at http://localhost:3001 and add:
- **HTTP(s)** monitor for your VTT
- Alerts via email, Discord, Slack, etc.

### Log Rotation

**Prevent log files from filling disk:**

```bash
sudo nano /etc/logrotate.d/dimm-city-portal
```

```
/var/log/dimm-city-portal/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload dimm-city-portal > /dev/null 2>&1 || true
    endscript
}
```

---

## Troubleshooting

### Port 3000 Already in Use

```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or change port in docker-compose.yml or .env
```

### WebSocket Connection Failed

**Symptoms:** Can't join sessions, real-time features don't work

**Checks:**
1. **CORS:** Ensure `ALLOWED_ORIGINS` includes your domain
2. **Reverse Proxy:** Verify WebSocket headers in nginx/Caddy config
3. **Firewall:** Check if WebSocket connections are blocked
4. **SSL:** wss:// (secure) vs ws:// (insecure) mismatch

**Test WebSocket:**
```bash
# Check if Socket.IO endpoint responds
curl http://localhost:3000/socket.io/
# Should return: {"code":0,"message":"Transport unknown"}
```

### Database Locked Error

```bash
# Stop all processes accessing the database
docker-compose down
# or
sudo systemctl stop dimm-city-portal

# Remove lock files
rm -f data/*.db-wal data/*.db-shm

# Restart
docker-compose up -d
```

### 502 Bad Gateway (nginx)

**Application not running:**
```bash
# Check if app is running
curl http://localhost:3000

# If not, start it
docker-compose up -d
# or
sudo systemctl start dimm-city-portal
```

**nginx can't connect:**
```bash
# Check nginx error log
sudo tail -f /var/log/nginx/error.log

# Common issue: SELinux blocking connection (CentOS/RHEL)
sudo setsebool -P httpd_can_network_connect 1
```

### High Memory Usage

**Normal:** ~100-200MB per instance

**If excessive:**
```bash
# Restart application
docker-compose restart
# or
sudo systemctl restart dimm-city-portal

# Check for memory leaks
docker stats --no-stream
```

### Can't Access from Internet

**Checklist:**
1. [ ] Firewall allows ports 80/443
2. [ ] DNS points to correct IP
3. [ ] nginx/Caddy configured and running
4. [ ] Application running on port 3000
5. [ ] Router port forwarding (home servers)

**Test from external:**
```bash
# From another computer/phone (not on your network)
curl https://vtt.yourdomain.com
```

---

## Advanced Topics

### Running on Raspberry Pi

**Recommended:** Raspberry Pi 4 (4GB or 8GB)

**Setup:**
```bash
# Install Docker
curl -sSL https://get.docker.com | sh
sudo usermod -aG docker pi

# Clone and run
git clone https://github.com/dimm-city/dimm-city-portal.git
cd dimm-city-portal
docker-compose up -d
```

**Performance tips:**
- Use wired Ethernet (not WiFi)
- Enable memory overcommit: `echo 1 | sudo tee /proc/sys/vm/overcommit_memory`
- Limit sessions: `MAX_SESSIONS=20` in docker-compose.yml

### Home Server (Behind NAT)

**Port Forwarding:**
1. Login to your router (usually 192.168.1.1)
2. Find "Port Forwarding" or "Virtual Server"
3. Forward ports 80 and 443 to your server's local IP

**Dynamic DNS (for changing IP):**
- Use DuckDNS, No-IP, or Dynu
- Update DNS automatically when IP changes

```bash
# DuckDNS example (cron job)
echo "*/5 * * * * curl 'https://www.duckdns.org/update?domains=YOUR_DOMAIN&token=YOUR_TOKEN'" | crontab -
```

### Horizontal Scaling (Future)

Currently uses SQLite (single instance). For horizontal scaling:

**Requirements:**
- Replace SQLite with PostgreSQL
- Use Redis for session storage
- Add load balancer (nginx, HAProxy)

**Example architecture:**
```
nginx (load balancer)
├── Dimm City Portal instance 1
├── Dimm City Portal instance 2
└── Dimm City Portal instance 3
     ├── PostgreSQL (sessions)
     └── Redis (real-time state)
```

### Custom Domain with Cloudflare

**Advantages:**
- Free SSL
- DDoS protection
- CDN caching
- Analytics

**Setup:**
1. Add site to Cloudflare (free plan)
2. Update nameservers at domain registrar
3. Create A record pointing to your server
4. Enable "Proxy" (orange cloud icon)
5. SSL/TLS mode: "Full (strict)"

**nginx with Cloudflare:**
- Get origin certificate from Cloudflare
- Use in nginx instead of Let's Encrypt

### Resource Limits (Docker)

Prevent resource exhaustion:

```yaml
# docker-compose.yml
services:
  dimm-city-portal:
    # ... existing config ...
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

---

## Security Checklist

Before going live, verify:

- [ ] **HTTPS enabled** (SSL certificate installed)
- [ ] **Firewall configured** (only 80/443 exposed)
- [ ] **Strong passwords** enforced on sessions
- [ ] **CORS restricted** to your domain only
- [ ] **Regular backups** automated
- [ ] **Updates** scheduled (weekly check)
- [ ] **Monitoring** setup with alerts
- [ ] **Logs** rotated and reviewed
- [ ] **Access logs** enabled in nginx
- [ ] **Rate limiting** configured (already in app)

---

## Getting Help

- **Documentation:** [README.md](./README.md)
- **Docker Guide:** [DOCKER.md](./DOCKER.md)
- **Backup Guide:** [BACKUP.md](./BACKUP.md)
- **Issues:** [GitHub Issues](https://github.com/dimm-city/dimm-city-portal/issues)

---

## Example: Complete Production Setup

**Full walkthrough from VPS to production:**

```bash
# 1. Provision VPS
# Create Ubuntu 22.04 droplet ($5/month) at DigitalOcean/Linode/Vultr

# 2. Initial setup
ssh root@your-server-ip
apt-get update && apt-get upgrade -y
apt-get install -y ufw curl git

# 3. Create user
adduser dimm
usermod -aG sudo dimm
su - dimm

# 4. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker dimm
# Log out and back in

# 5. Clone repository
git clone https://github.com/dimm-city/dimm-city-portal.git
cd dimm-city-portal

# 6. Configure environment
nano docker-compose.yml
# Change ALLOWED_ORIGINS to your domain

# 7. Start application
docker-compose up -d

# 8. Install and configure nginx
sudo apt-get install -y nginx certbot python3-certbot-nginx
sudo nano /etc/nginx/sites-available/dimm-city-portal
# Paste nginx config from above

sudo ln -s /etc/nginx/sites-available/dimm-city-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 9. Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 10. Get SSL certificate
sudo certbot --nginx -d vtt.yourdomain.com

# 11. Setup automated backups
crontab -e
# Add: 0 2 * * * cd /home/dimm/dimm-city-portal && npm run backup:auto

# 12. Test
curl https://vtt.yourdomain.com
# Should see the application!

# 13. Monitor
docker-compose logs -f
```

**Total time:** ~30 minutes

---

<p align="center">
  <strong>Happy Hosting!</strong><br>
  <sub>Questions? Open an issue on GitHub</sub>
</p>
