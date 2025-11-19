# Docker Deployment Guide

This guide will help you deploy Dimm City Portal using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose 2.0+ ([Install Docker Compose](https://docs.docker.com/compose/install/))

## Quick Start

### 1. One-Command Deployment

```bash
docker-compose up -d
```

That's it! The application will be available at http://localhost:3000

### 2. View Logs

```bash
docker-compose logs -f
```

Press `Ctrl+C` to exit log viewing.

### 3. Stop the Application

```bash
docker-compose down
```

### 4. Stop and Remove Data

**⚠️ Warning: This will delete all session data!**

```bash
docker-compose down -v
```

## Configuration

### Environment Variables

Edit the `docker-compose.yml` file to customize the configuration:

```yaml
environment:
  # Change the port (default: 3000)
  - PORT=3000

  # Configure CORS origins for your domain
  - ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

  # Session timeout in seconds (default: 24 hours)
  - SESSION_TTL=86400

  # Maximum concurrent sessions
  - MAX_SESSIONS=100

  # Enable/disable public session browser
  - ENABLE_SESSION_BROWSER=true
```

For a complete list of environment variables, see `.env.example`.

### Custom .env File

Alternatively, create a `.env` file and mount it:

1. Copy `.env.example` to `.env`
2. Edit your `.env` file
3. Uncomment the volume mount in `docker-compose.yml`:
   ```yaml
   volumes:
     - ./.env:/app/.env:ro
   ```
4. Restart: `docker-compose up -d`

## Data Persistence

Session data is stored in SQLite and persists in the `./data` directory on your host machine.

**Backup your data:**
```bash
cp -r ./data ./data-backup-$(date +%Y%m%d)
```

**Restore from backup:**
```bash
docker-compose down
cp -r ./data-backup-20241119/* ./data/
docker-compose up -d
```

## Updates

### Update to Latest Version

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build
```

### Update Docker Image Only

```bash
docker-compose pull
docker-compose up -d
```

## Port Configuration

To run on a different port, change the port mapping in `docker-compose.yml`:

```yaml
ports:
  - "8080:3000"  # Host port 8080 -> Container port 3000
```

Then update `ALLOWED_ORIGINS` to include the new port.

## Production Deployment

### Reverse Proxy Setup

For production, use a reverse proxy (nginx/Caddy) for SSL/TLS termination.

**Example nginx configuration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Resource Limits

Uncomment the resource limits in `docker-compose.yml` to prevent the container from using too much CPU/memory:

```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
```

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker-compose logs
```

**Common issues:**
- Port 3000 already in use → Change port mapping
- Permission issues with `./data` → `chmod 755 ./data`
- Missing dependencies → Rebuild: `docker-compose up -d --build`

### Database Locked Error

**Stop the container:**
```bash
docker-compose down
```

**Remove lock files:**
```bash
rm -f ./data/*.db-wal ./data/*.db-shm
```

**Restart:**
```bash
docker-compose up -d
```

### WebSocket Connection Failed

**Check CORS configuration:**
- Ensure `ALLOWED_ORIGINS` includes your domain
- Check reverse proxy WebSocket settings
- Verify firewall allows WebSocket connections

### View Container Status

```bash
docker-compose ps
```

### Inspect Container

```bash
docker exec -it dimm-city-portal sh
```

### Check Health Status

```bash
docker inspect dimm-city-portal | grep -A 5 Health
```

## Advanced Usage

### Custom Build

Build with custom Dockerfile:
```bash
docker build -t dimm-city-portal:custom .
```

### Multi-Container Setup

For horizontal scaling (future feature), you can run multiple instances with a load balancer:

```yaml
# docker-compose-scale.yml
version: '3.8'
services:
  dimm-city-portal:
    # ... existing config ...
    deploy:
      replicas: 3
```

**Note:** Currently, this requires Redis or PostgreSQL instead of SQLite for shared session storage.

### Development Mode

For development with hot reload:
```bash
# Run locally with npm
npm run dev

# Or use Docker with volume mount
docker run -it --rm \
  -v $(pwd):/app \
  -p 5173:5173 \
  -w /app \
  node:20-alpine \
  npm run dev -- --host
```

## Security Best Practices

1. **Use HTTPS** - Always use SSL/TLS in production
2. **Set Strong Passwords** - Enforce password complexity on sessions
3. **Configure CORS** - Restrict `ALLOWED_ORIGINS` to your domain only
4. **Update Regularly** - Keep Docker images and dependencies updated
5. **Backup Data** - Automate daily backups of `./data` directory
6. **Resource Limits** - Set CPU/memory limits to prevent DoS
7. **Firewall** - Only expose necessary ports (80, 443)

## Getting Help

- **Documentation:** [README.md](./README.md)
- **Issues:** [GitHub Issues](https://github.com/dimm-city/dimm-city-portal/issues)
- **Configuration:** [CONFIGURATION.md](./CONFIGURATION.md) (coming soon)

## Example: Full Production Setup

```bash
# 1. Clone repository
git clone https://github.com/dimm-city/dimm-city-portal.git
cd dimm-city-portal

# 2. Configure environment
cp .env.example .env
nano .env  # Edit configuration

# 3. Update CORS in docker-compose.yml
nano docker-compose.yml
# Set ALLOWED_ORIGINS=https://yourdomain.com

# 4. Start application
docker-compose up -d

# 5. Check logs
docker-compose logs -f

# 6. Setup nginx reverse proxy (see above)

# 7. Configure SSL with Let's Encrypt
sudo certbot --nginx -d yourdomain.com

# 8. Setup automated backups (cron)
crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh
```

---

**Need more help?** See [SELF_HOSTING.md](./SELF_HOSTING.md) for comprehensive deployment instructions.
