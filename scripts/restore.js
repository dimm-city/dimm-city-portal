#!/usr/bin/env node

/**
 * Restore script for Dimm City Portal
 * Restores a SQLite database from a backup file
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DB_PATH = process.env.SQLITE_DB_PATH || './data/sessions.db';
const BACKUP_DIR = process.env.BACKUP_DIR || './backups';

// Get backup file from command line argument
const backupFile = process.argv[2];

// Create readline interface for user prompts
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

function question(query) {
	return new Promise((resolve) => {
		rl.question(query, resolve);
	});
}

// Verify backup file is a SQLite database
function verifyBackupFile(filePath) {
	try {
		// Check file exists
		if (!fs.existsSync(filePath)) {
			console.error(`✗ Backup file not found: ${filePath}`);
			return false;
		}

		// Check file size
		const stats = fs.statSync(filePath);
		if (stats.size === 0) {
			console.error(`✗ Backup file is empty`);
			return false;
		}

		// Check SQLite magic number (first 16 bytes should be "SQLite format 3\0")
		const fd = fs.openSync(filePath, 'r');
		const buffer = Buffer.alloc(16);
		fs.readSync(fd, buffer, 0, 16, 0);
		fs.closeSync(fd);

		const sqliteMagic = 'SQLite format 3\0';
		const fileMagic = buffer.toString('utf8', 0, 16);

		if (fileMagic !== sqliteMagic) {
			console.error(`✗ File is not a valid SQLite database`);
			return false;
		}

		console.log(`✓ Backup file verified: ${path.basename(filePath)}`);
		console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
		return true;
	} catch (error) {
		console.error(`✗ Verification failed: ${error.message}`);
		return false;
	}
}

// Create backup of current database before restoring
function backupCurrent() {
	if (!fs.existsSync(DB_PATH)) {
		console.log('  No existing database to backup');
		return null;
	}

	const timestamp = new Date()
		.toISOString()
		.replace(/T/, '-')
		.replace(/\..+/, '')
		.replace(/:/g, '-');
	const backupFilename = `backup-before-restore-${timestamp}.db`;
	const backupPath = path.join(BACKUP_DIR, backupFilename);

	try {
		// Ensure backup directory exists
		if (!fs.existsSync(BACKUP_DIR)) {
			fs.mkdirSync(BACKUP_DIR, { recursive: true });
		}

		fs.copyFileSync(DB_PATH, backupPath);
		console.log(`✓ Current database backed up: ${backupFilename}`);
		return backupPath;
	} catch (error) {
		console.error(`✗ Failed to backup current database: ${error.message}`);
		return null;
	}
}

// Restore database from backup
function restoreDatabase(backupFilePath) {
	try {
		// Ensure data directory exists
		const dataDir = path.dirname(DB_PATH);
		if (!fs.existsSync(dataDir)) {
			fs.mkdirSync(dataDir, { recursive: true });
		}

		// Remove any WAL/SHM files
		const walPath = `${DB_PATH}-wal`;
		const shmPath = `${DB_PATH}-shm`;
		if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
		if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

		// Copy backup to database location
		fs.copyFileSync(backupFilePath, DB_PATH);

		console.log(`✓ Database restored successfully`);
		console.log(`  From: ${path.basename(backupFilePath)}`);
		console.log(`  To: ${DB_PATH}`);
		return true;
	} catch (error) {
		console.error(`✗ Restore failed: ${error.message}`);
		return false;
	}
}

// Verify restored database integrity
function verifyDatabase() {
	try {
		const Database = require('better-sqlite3');
		const db = new Database(DB_PATH, { readonly: true });

		// Run integrity check
		const result = db.pragma('integrity_check');

		// Get session count
		const sessions = db.prepare('SELECT COUNT(*) as count FROM sessions').get();

		db.close();

		if (result[0].integrity_check === 'ok') {
			console.log(`✓ Database integrity verified`);
			console.log(`  Sessions: ${sessions.count}`);
			return true;
		} else {
			console.error(`✗ Database integrity check failed`);
			return false;
		}
	} catch (error) {
		if (error.code === 'MODULE_NOT_FOUND') {
			console.log(`  Skipping integrity check (better-sqlite3 not available)`);
			return true;
		}
		console.error(`✗ Integrity verification failed: ${error.message}`);
		return false;
	}
}

// List available backups
function listBackups() {
	console.log('\nAvailable backups:\n');

	try {
		if (!fs.existsSync(BACKUP_DIR)) {
			console.log('  No backups found (backup directory does not exist)');
			return;
		}

		const files = fs.readdirSync(BACKUP_DIR);
		const backupFiles = files
			.filter((f) => f.startsWith('backup-') && f.endsWith('.db'))
			.map((f) => ({
				name: f,
				path: path.join(BACKUP_DIR, f),
				stats: fs.statSync(path.join(BACKUP_DIR, f))
			}))
			.sort((a, b) => b.stats.mtime - a.stats.mtime); // Newest first

		if (backupFiles.length === 0) {
			console.log('  No backups found');
			return;
		}

		backupFiles.forEach((file, index) => {
			const size = (file.stats.size / 1024).toFixed(2);
			const date = file.stats.mtime.toLocaleString();
			console.log(`  ${index + 1}. ${file.name}`);
			console.log(`     Date: ${date} | Size: ${size} KB`);
		});

		console.log(`\nUsage: npm run restore ${BACKUP_DIR}/backup-YYYY-MM-DD-HH-mm-ss.db`);
	} catch (error) {
		console.error(`✗ Failed to list backups: ${error.message}`);
	}
}

// Main execution
async function main() {
	console.log('=== Dimm City Portal Restore ===\n');

	// Check if backup file was provided
	if (!backupFile) {
		console.log('Error: No backup file specified\n');
		listBackups();
		rl.close();
		process.exit(1);
	}

	// Resolve backup file path
	const backupFilePath = path.resolve(backupFile);

	// Verify backup file
	if (!verifyBackupFile(backupFilePath)) {
		rl.close();
		process.exit(1);
	}

	// Check if server is running
	console.log('\n⚠️  WARNING: Make sure the server is stopped before restoring!\n');

	// Confirm restore
	const confirm = await question(
		'This will replace the current database. Continue? (yes/no): '
	);

	if (confirm.toLowerCase() !== 'yes') {
		console.log('\n✗ Restore cancelled');
		rl.close();
		process.exit(0);
	}

	console.log('');

	// Backup current database
	const currentBackup = backupCurrent();

	if (currentBackup) {
		console.log(`  Rollback available at: ${path.basename(currentBackup)}\n`);
	}

	// Restore database
	if (!restoreDatabase(backupFilePath)) {
		rl.close();
		process.exit(1);
	}

	// Verify restored database
	verifyDatabase();

	console.log('\n✓ Restore complete!\n');
	console.log('You can now restart the server.\n');

	rl.close();
}

// Run
main();
