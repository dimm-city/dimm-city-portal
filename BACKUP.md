# Backup & Restore Guide

This guide covers how to backup and restore your Dimm City Portal session data.

## Quick Reference

```bash
# Create a backup
npm run backup

# Restore from a backup
npm run restore backups/backup-2024-11-19-12-30-00.db

# List available backups
npm run restore
```

## Manual Backup

### Create a Backup

```bash
npm run backup
```

This will:
- ✓ Create a timestamped backup in `./backups/` directory
- ✓ Verify backup integrity
- ✓ Clean up backups older than 7 days (keeps last 7 days)
- ✓ Display backup size and location

**Example output:**
```
=== Dimm City Portal Backup ===

✓ Created backup directory: ./backups
✓ Backup created: backup-2024-11-19-12-30-00.db
  Source: 256.50 KB
  Backup: 256.50 KB
  Path: /app/backups/backup-2024-11-19-12-30-00.db
✓ Backup integrity verified
✓ Cleaned up 2 old backup(s) (older than 7 days)
  Total backups: 5

✓ Backup complete!
```

### Configure Backup Retention

By default, backups older than 7 days are automatically deleted. To change this:

```bash
# Keep backups for 30 days
BACKUP_KEEP_DAYS=30 npm run backup

# Or set in .env file
BACKUP_KEEP_DAYS=30
```

### Custom Backup Location

```bash
# Save backups to a different directory
BACKUP_DIR=/path/to/backups npm run backup

# Or set in .env file
BACKUP_DIR=/mnt/external/backups
```

## Automated Backups

### Option 1: Cron Job (Linux/macOS)

Set up daily backups at 2 AM:

```bash
# Edit crontab
crontab -e

# Add this line (adjust path to your installation)
0 2 * * * cd /path/to/dimm-city-portal && npm run backup:auto >> /var/log/dimm-backup.log 2>&1
```

**Verify cron job:**
```bash
crontab -l
```

### Option 2: systemd Timer (Linux)

Create a systemd service and timer for automated backups:

**1. Create service file:**
```bash
sudo nano /etc/systemd/system/dimm-backup.service
```

```ini
[Unit]
Description=Dimm City Portal Backup
After=network.target

[Service]
Type=oneshot
User=your-user
WorkingDirectory=/path/to/dimm-city-portal
ExecStart=/usr/bin/npm run backup:auto
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**2. Create timer file:**
```bash
sudo nano /etc/systemd/system/dimm-backup.timer
```

```ini
[Unit]
Description=Daily Dimm City Portal Backup
Requires=dimm-backup.service

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
```

**3. Enable and start timer:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable dimm-backup.timer
sudo systemctl start dimm-backup.timer

# Check timer status
sudo systemctl status dimm-backup.timer
sudo systemctl list-timers
```

### Option 3: Docker Compose with Cron Container

Add a backup container to your `docker-compose.yml`:

```yaml
services:
  # ... existing dimm-city-portal service ...

  backup:
    image: dimm-city-portal:latest
    container_name: dimm-city-backup
    restart: unless-stopped
    volumes:
      - ./data:/app/data
      - ./backups:/app/backups
    environment:
      - BACKUP_KEEP_DAYS=7
    command: >
      sh -c "while true; do
        npm run backup:auto;
        sleep 86400;
      done"
```

Or use a dedicated cron container:

```yaml
  backup-cron:
    image: alpine:latest
    container_name: dimm-city-backup-cron
    restart: unless-stopped
    volumes:
      - ./data:/data
      - ./backups:/backups
    command: >
      sh -c "echo '0 2 * * * cp /data/sessions.db /backups/backup-\$(date +\%Y-\%m-\%d-\%H-\%M-\%S).db && find /backups -name \"backup-*.db\" -mtime +7 -delete' | crontab - && crond -f"
```

## Restore from Backup

### List Available Backups

```bash
npm run restore
```

**Example output:**
```
=== Dimm City Portal Restore ===

Error: No backup file specified

Available backups:

  1. backup-2024-11-19-12-30-00.db
     Date: 11/19/2024, 12:30:00 PM | Size: 256.50 KB
  2. backup-2024-11-18-12-30-00.db
     Date: 11/18/2024, 12:30:00 PM | Size: 245.12 KB

Usage: npm run restore backups/backup-YYYY-MM-DD-HH-mm-ss.db
```

### Restore a Specific Backup

**⚠️ IMPORTANT:** Stop the server before restoring!

```bash
# Docker
docker-compose down

# Or Node.js
# Stop your Node.js process (Ctrl+C or systemctl stop)
```

**Run restore:**
```bash
npm run restore backups/backup-2024-11-19-12-30-00.db
```

**Example output:**
```
=== Dimm City Portal Restore ===

✓ Backup file verified: backup-2024-11-19-12-30-00.db
  Size: 256.50 KB

⚠️  WARNING: Make sure the server is stopped before restoring!

This will replace the current database. Continue? (yes/no): yes

✓ Current database backed up: backup-before-restore-2024-11-19-13-00-00.db
  Rollback available at: backup-before-restore-2024-11-19-13-00-00.db

✓ Database restored successfully
  From: backup-2024-11-19-12-30-00.db
  To: ./data/sessions.db
✓ Database integrity verified
  Sessions: 12

✓ Restore complete!

You can now restart the server.
```

**Restart server:**
```bash
# Docker
docker-compose up -d

# Or Node.js
npm start
```

## Offsite Backups

### Option 1: rsync to Remote Server

```bash
#!/bin/bash
# backup-to-remote.sh

# Create local backup
cd /path/to/dimm-city-portal
npm run backup:auto

# Sync to remote server
rsync -avz --delete ./backups/ user@backup-server:/backups/dimm-city/
```

**Add to cron:**
```bash
0 3 * * * /path/to/backup-to-remote.sh >> /var/log/dimm-backup-remote.log 2>&1
```

### Option 2: Upload to Cloud Storage

**AWS S3 Example:**
```bash
#!/bin/bash
# backup-to-s3.sh

# Create backup
cd /path/to/dimm-city-portal
npm run backup:auto

# Find latest backup
LATEST_BACKUP=$(ls -t backups/backup-*.db | head -1)

# Upload to S3
aws s3 cp "$LATEST_BACKUP" s3://your-bucket/dimm-backups/
```

**Google Cloud Storage Example:**
```bash
# Upload to GCS
gsutil cp "$LATEST_BACKUP" gs://your-bucket/dimm-backups/
```

### Option 3: Backup to Mounted Network Drive

```bash
# Mount network drive (add to /etc/fstab for persistence)
sudo mount -t cifs //nas-server/backups /mnt/backups -o username=user,password=pass

# Set backup directory to network drive
BACKUP_DIR=/mnt/backups npm run backup
```

## Disaster Recovery

### Complete System Restore

1. **Install fresh instance:**
   ```bash
   git clone https://github.com/dimm-city/dimm-city-portal.git
   cd dimm-city-portal
   npm install
   npm run build
   ```

2. **Copy backup file:**
   ```bash
   # From remote backup
   scp user@backup-server:/backups/dimm-city/backup-latest.db ./backups/

   # Or download from cloud
   aws s3 cp s3://your-bucket/dimm-backups/backup-latest.db ./backups/
   ```

3. **Restore database:**
   ```bash
   npm run restore backups/backup-latest.db
   ```

4. **Start server:**
   ```bash
   docker-compose up -d
   # or
   npm start
   ```

### Migration to New Server

1. **Create backup on old server:**
   ```bash
   npm run backup
   ```

2. **Transfer backup to new server:**
   ```bash
   scp backups/backup-*.db new-server:/path/to/dimm-city-portal/backups/
   ```

3. **Restore on new server:**
   ```bash
   # On new server
   npm run restore backups/backup-*.db
   docker-compose up -d
   ```

## Backup Best Practices

1. **Regular Backups**
   - Daily automated backups (minimum)
   - More frequent for active instances (hourly for high-traffic)

2. **3-2-1 Rule**
   - 3 copies of your data
   - 2 different storage types (local + remote)
   - 1 offsite backup (cloud or remote server)

3. **Test Restores**
   - Perform test restores monthly
   - Verify data integrity
   - Document restore procedures

4. **Retention Policy**
   - Keep 7 daily backups
   - Keep 4 weekly backups
   - Keep 12 monthly backups (archive)

5. **Monitor Backups**
   - Check backup logs regularly
   - Alert on backup failures
   - Verify backup file sizes

6. **Security**
   - Encrypt offsite backups
   - Secure backup credentials
   - Limit backup access

## Troubleshooting

### Backup Fails

**Problem:** `Database not found: ./data/sessions.db`

**Solution:**
```bash
# Check database path
ls -la ./data/

# Verify SQLITE_DB_PATH environment variable
echo $SQLITE_DB_PATH

# Set correct path
export SQLITE_DB_PATH=/path/to/sessions.db
npm run backup
```

### Database Locked Error

**Problem:** `SQLITE_BUSY: database is locked`

**Solution:**
```bash
# Stop the server first
docker-compose down

# Then create backup
npm run backup

# Restart server
docker-compose up -d
```

### Restore Fails - Invalid Database

**Problem:** `File is not a valid SQLite database`

**Solution:**
```bash
# Check file integrity
file backups/backup-*.db
# Should output: SQLite 3.x database

# Try different backup file
npm run restore backups/backup-older.db
```

### Backup Directory Permission Denied

**Problem:** `EACCES: permission denied, mkdir './backups'`

**Solution:**
```bash
# Create directory with correct permissions
mkdir -p backups
chmod 755 backups

# Or run with sudo (not recommended)
sudo npm run backup
```

## Advanced Usage

### Backup Specific Session

```javascript
// scripts/backup-session.js
import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./data/sessions.db');
const sessionId = process.argv[2];

const session = db.prepare('SELECT * FROM sessions WHERE sessionId = ?').get(sessionId);

if (session) {
  const filename = `backup-session-${sessionId}-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(session, null, 2));
  console.log(`✓ Session backup created: ${filename}`);
} else {
  console.error('✗ Session not found');
}

db.close();
```

**Usage:**
```bash
node scripts/backup-session.js session-12345
```

### Differential Backups

For large databases, consider differential backups:

```bash
#!/bin/bash
# Only backup if database changed since last backup

CURRENT_HASH=$(md5sum ./data/sessions.db | awk '{print $1}')
LAST_HASH=$(cat ./backups/.last-hash 2>/dev/null || echo "")

if [ "$CURRENT_HASH" != "$LAST_HASH" ]; then
  npm run backup:auto
  echo "$CURRENT_HASH" > ./backups/.last-hash
  echo "✓ Backup created (database changed)"
else
  echo "✓ No backup needed (database unchanged)"
fi
```

## Getting Help

- **Documentation:** [README.md](./README.md)
- **Docker Guide:** [DOCKER.md](./DOCKER.md)
- **Issues:** [GitHub Issues](https://github.com/dimm-city/dimm-city-portal/issues)

---

**Remember:** The best backup strategy is one that runs automatically and is tested regularly!
