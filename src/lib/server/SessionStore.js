/**
 * Session Storage with SQLite
 * Provides persistent session storage that survives server restarts
 */

import Database from 'better-sqlite3';
import path from 'path';

// Session TTL: 24 hours in seconds
const SESSION_TTL = 24 * 60 * 60;

export class SessionStore {
	constructor(dbPath = null) {
		// Default to data/sessions.db in project root
		// Use process.cwd() instead of import.meta.url for better CJS/ESM compatibility
		const defaultPath = path.join(process.cwd(), 'data/sessions.db');
		this.dbPath = dbPath || defaultPath;

		// Initialize database
		this.db = new Database(this.dbPath);
		this.db.pragma('journal_mode = WAL'); // Better concurrency

		// Create sessions table if it doesn't exist
		this.initializeDatabase();

		// Clean up expired sessions on startup and periodically
		this.cleanupExpiredSessions();
		this.startCleanupInterval();

		console.log(`SessionStore initialized with database: ${this.dbPath}`);
	}

	/**
	 * Initialize database schema
	 */
	initializeDatabase() {
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS sessions (
				session_id TEXT PRIMARY KEY,
				session_data TEXT NOT NULL,
				created_at INTEGER NOT NULL,
				last_activity INTEGER NOT NULL,
				expires_at INTEGER NOT NULL
			);

			CREATE INDEX IF NOT EXISTS idx_expires_at ON sessions(expires_at);
			CREATE INDEX IF NOT EXISTS idx_last_activity ON sessions(last_activity);
		`);
	}

	/**
	 * Create a new session
	 * @param {string} sessionId - Unique session identifier
	 * @param {object} sessionData - Session data to store
	 */
	createSession(sessionId, sessionData) {
		const now = Date.now();
		const expiresAt = now + SESSION_TTL * 1000;

		const stmt = this.db.prepare(`
			INSERT INTO sessions (session_id, session_data, created_at, last_activity, expires_at)
			VALUES (?, ?, ?, ?, ?)
			ON CONFLICT(session_id) DO UPDATE SET
				session_data = excluded.session_data,
				last_activity = excluded.last_activity,
				expires_at = excluded.expires_at
		`);

		stmt.run(sessionId, JSON.stringify(sessionData), now, now, expiresAt);
	}

	/**
	 * Get a session by ID
	 * @param {string} sessionId - Session identifier
	 * @returns {object|null} Session data or null if not found/expired
	 */
	getSession(sessionId) {
		const stmt = this.db.prepare(`
			SELECT session_data, expires_at
			FROM sessions
			WHERE session_id = ?
		`);

		const row = stmt.get(sessionId);

		if (!row) {
			return null;
		}

		// Check if session has expired
		if (row.expires_at < Date.now()) {
			this.deleteSession(sessionId);
			return null;
		}

		return JSON.parse(row.session_data);
	}

	/**
	 * Update an existing session
	 * @param {string} sessionId - Session identifier
	 * @param {object} sessionData - Updated session data
	 */
	updateSession(sessionId, sessionData) {
		const now = Date.now();
		const expiresAt = now + SESSION_TTL * 1000;

		const stmt = this.db.prepare(`
			UPDATE sessions
			SET session_data = ?,
			    last_activity = ?,
			    expires_at = ?
			WHERE session_id = ?
		`);

		stmt.run(JSON.stringify(sessionData), now, expiresAt, sessionId);
	}

	/**
	 * Delete a session
	 * @param {string} sessionId - Session identifier
	 */
	deleteSession(sessionId) {
		const stmt = this.db.prepare('DELETE FROM sessions WHERE session_id = ?');
		stmt.run(sessionId);
	}

	/**
	 * Touch a session to extend its TTL
	 * @param {string} sessionId - Session identifier
	 */
	touchSession(sessionId) {
		const now = Date.now();
		const expiresAt = now + SESSION_TTL * 1000;

		const stmt = this.db.prepare(`
			UPDATE sessions
			SET last_activity = ?,
			    expires_at = ?
			WHERE session_id = ?
		`);

		stmt.run(now, expiresAt, sessionId);
	}

	/**
	 * Get all active sessions
	 * @returns {Array} Array of session IDs
	 */
	getAllSessions() {
		const stmt = this.db.prepare(`
			SELECT session_id
			FROM sessions
			WHERE expires_at > ?
		`);

		const rows = stmt.all(Date.now());
		return rows.map((row) => row.session_id);
	}

	/**
	 * Get session count
	 * @returns {number} Number of active sessions
	 */
	getSessionCount() {
		const stmt = this.db.prepare(`
			SELECT COUNT(*) as count
			FROM sessions
			WHERE expires_at > ?
		`);

		const row = stmt.get(Date.now());
		return row.count;
	}

	/**
	 * Clean up expired sessions
	 */
	cleanupExpiredSessions() {
		const stmt = this.db.prepare('DELETE FROM sessions WHERE expires_at < ?');
		const result = stmt.run(Date.now());

		if (result.changes > 0) {
			console.log(`Cleaned up ${result.changes} expired sessions`);
		}
	}

	/**
	 * Start periodic cleanup of expired sessions
	 */
	startCleanupInterval() {
		// Clean up every hour
		this.cleanupInterval = setInterval(() => {
			this.cleanupExpiredSessions();
		}, 60 * 60 * 1000);
	}

	/**
	 * Stop cleanup interval and close database
	 */
	close() {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
		}
		this.db.close();
		console.log('SessionStore closed');
	}

	/**
	 * Get database statistics
	 * @returns {object} Database statistics
	 */
	getStats() {
		const activeCount = this.getSessionCount();
		const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM sessions');
		const totalCount = totalStmt.get().count;

		const sizeStmt = this.db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()");
		const size = sizeStmt.get().size;

		return {
			activeSessions: activeCount,
			totalSessions: totalCount,
			expiredSessions: totalCount - activeCount,
			databaseSize: size,
			databaseSizeFormatted: this.formatBytes(size)
		};
	}

	/**
	 * Format bytes to human-readable string
	 * @param {number} bytes - Number of bytes
	 * @returns {string} Formatted string
	 */
	formatBytes(bytes) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
	}
}
