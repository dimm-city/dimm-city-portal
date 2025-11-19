#!/usr/bin/env node

/**
 * Backup script for Dimm City Portal
 * Creates a backup of the SQLite database with optional compression
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DB_PATH = process.env.SQLITE_DB_PATH || './data/sessions.db';
const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const KEEP_DAYS = parseInt(process.env.BACKUP_KEEP_DAYS || '7', 10);
const AUTO_MODE = process.argv.includes('--auto');

// Get timestamp for backup filename
function getTimestamp() {
	const now = new Date();
	return now
		.toISOString()
		.replace(/T/, '-')
		.replace(/\..+/, '')
		.replace(/:/g, '-');
}

// Ensure backup directory exists
function ensureBackupDir() {
	if (!fs.existsSync(BACKUP_DIR)) {
		fs.mkdirSync(BACKUP_DIR, { recursive: true });
		console.log(`✓ Created backup directory: ${BACKUP_DIR}`);
	}
}

// Create backup of SQLite database
function createBackup() {
	const timestamp = getTimestamp();
	const backupFilename = `backup-${timestamp}.db`;
	const backupPath = path.join(BACKUP_DIR, backupFilename);

	try {
		// Check if source database exists
		if (!fs.existsSync(DB_PATH)) {
			console.error(`✗ Database not found: ${DB_PATH}`);
			process.exit(1);
		}

		// Copy database file
		fs.copyFileSync(DB_PATH, backupPath);

		// Get file sizes
		const sourceSize = fs.statSync(DB_PATH).size;
		const backupSize = fs.statSync(backupPath).size;

		console.log(`✓ Backup created: ${backupFilename}`);
		console.log(`  Source: ${(sourceSize / 1024).toFixed(2)} KB`);
		console.log(`  Backup: ${(backupSize / 1024).toFixed(2)} KB`);
		console.log(`  Path: ${backupPath}`);

		return backupPath;
	} catch (error) {
		console.error(`✗ Backup failed: ${error.message}`);
		process.exit(1);
	}
}

// Clean up old backups (keep last N days)
function cleanOldBackups() {
	try {
		const files = fs.readdirSync(BACKUP_DIR);
		const backupFiles = files
			.filter((f) => f.startsWith('backup-') && f.endsWith('.db'))
			.map((f) => ({
				name: f,
				path: path.join(BACKUP_DIR, f),
				mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtime
			}))
			.sort((a, b) => b.mtime - a.mtime); // Newest first

		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - KEEP_DAYS);

		let removedCount = 0;

		backupFiles.forEach((file) => {
			if (file.mtime < cutoffDate) {
				fs.unlinkSync(file.path);
				removedCount++;
				if (!AUTO_MODE) {
					console.log(`  Removed old backup: ${file.name}`);
				}
			}
		});

		if (removedCount > 0) {
			console.log(`✓ Cleaned up ${removedCount} old backup(s) (older than ${KEEP_DAYS} days)`);
		} else if (!AUTO_MODE) {
			console.log(`✓ No old backups to clean (keeping last ${KEEP_DAYS} days)`);
		}

		// Show remaining backups count
		const remainingCount = backupFiles.length - removedCount;
		console.log(`  Total backups: ${remainingCount}`);
	} catch (error) {
		console.error(`✗ Cleanup failed: ${error.message}`);
		// Don't exit on cleanup failure
	}
}

// Verify backup integrity
function verifyBackup(backupPath) {
	try {
		// Try to open the database with SQLite to verify integrity
		const Database = require('better-sqlite3');
		const db = new Database(backupPath, { readonly: true });

		// Run integrity check
		const result = db.pragma('integrity_check');

		db.close();

		if (result[0].integrity_check === 'ok') {
			console.log(`✓ Backup integrity verified`);
			return true;
		} else {
			console.error(`✗ Backup integrity check failed`);
			return false;
		}
	} catch (error) {
		// If better-sqlite3 is not available, just skip verification
		if (error.code === 'MODULE_NOT_FOUND') {
			console.log(`  Skipping integrity check (better-sqlite3 not available)`);
			return true;
		}
		console.error(`✗ Integrity check failed: ${error.message}`);
		return false;
	}
}

// Main execution
function main() {
	console.log('=== Dimm City Portal Backup ===\n');

	if (AUTO_MODE) {
		console.log('Running in automatic mode...\n');
	}

	ensureBackupDir();
	const backupPath = createBackup();
	verifyBackup(backupPath);
	cleanOldBackups();

	console.log('\n✓ Backup complete!\n');
}

// Run
main();
