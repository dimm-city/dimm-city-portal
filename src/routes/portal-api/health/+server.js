import { json } from '@sveltejs/kit';
import { SessionStore } from '$lib/server/SessionStore.js';
import { version } from '$app/environment';

// Track server start time
const serverStartTime = Date.now();

// Lazy initialize session store
let sessionStore;

/**
 * GET /portal-api/health
 * Health check endpoint for monitoring and uptime checks
 *
 * Returns:
 * - status: 'healthy' | 'degraded' | 'unhealthy'
 * - uptime: Server uptime in milliseconds
 * - timestamp: Current server time
 * - checks: Individual health check results
 *
 * Response codes:
 * - 200: Healthy (all checks passed)
 * - 503: Unhealthy (critical checks failed)
 */
export async function GET() {
	const checks = {
		database: { status: 'unknown', message: '' },
		memory: { status: 'unknown', message: '' },
		environment: { status: 'unknown', message: '' }
	};

	let overallStatus = 'healthy';

	// Check 1: Database connectivity
	try {
		if (!sessionStore) {
			sessionStore = new SessionStore();
		}

		// Test database read
		const sessionIds = sessionStore.getAllSessions();
		checks.database.status = 'healthy';
		checks.database.message = `Database accessible (${sessionIds.length} active sessions)`;
		checks.database.sessionCount = sessionIds.length;
	} catch (error) {
		checks.database.status = 'unhealthy';
		checks.database.message = `Database error: ${error.message}`;
		overallStatus = 'unhealthy';
	}

	// Check 2: Memory usage
	try {
		if (typeof process !== 'undefined' && process.memoryUsage) {
			const memUsage = process.memoryUsage();
			const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
			const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
			const heapUsedPercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

			checks.memory.heapUsedMB = heapUsedMB;
			checks.memory.heapTotalMB = heapTotalMB;
			checks.memory.heapUsedPercent = heapUsedPercent;

			// Warn if heap usage is high
			if (heapUsedPercent > 90) {
				checks.memory.status = 'unhealthy';
				checks.memory.message = `High memory usage: ${heapUsedPercent}% (${heapUsedMB}MB / ${heapTotalMB}MB)`;
				overallStatus = 'unhealthy';
			} else if (heapUsedPercent > 75) {
				checks.memory.status = 'degraded';
				checks.memory.message = `Elevated memory usage: ${heapUsedPercent}% (${heapUsedMB}MB / ${heapTotalMB}MB)`;
				if (overallStatus === 'healthy') overallStatus = 'degraded';
			} else {
				checks.memory.status = 'healthy';
				checks.memory.message = `Memory usage normal: ${heapUsedPercent}% (${heapUsedMB}MB / ${heapTotalMB}MB)`;
			}
		} else {
			checks.memory.status = 'healthy';
			checks.memory.message = 'Memory monitoring not available';
		}
	} catch (error) {
		checks.memory.status = 'degraded';
		checks.memory.message = `Memory check error: ${error.message}`;
		if (overallStatus === 'healthy') overallStatus = 'degraded';
	}

	// Check 3: Environment configuration
	try {
		const isProduction = process.env.NODE_ENV === 'production';
		const hasOriginConfig = !!process.env.ALLOWED_ORIGINS;

		checks.environment.status = 'healthy';
		checks.environment.nodeEnv = process.env.NODE_ENV || 'development';
		checks.environment.isProduction = isProduction;
		checks.environment.hasOriginConfig = hasOriginConfig;

		if (isProduction && !hasOriginConfig) {
			checks.environment.status = 'degraded';
			checks.environment.message = 'Production mode without ALLOWED_ORIGINS configured';
			if (overallStatus === 'healthy') overallStatus = 'degraded';
		} else {
			checks.environment.message = `Environment: ${checks.environment.nodeEnv}`;
		}
	} catch (error) {
		checks.environment.status = 'degraded';
		checks.environment.message = `Environment check error: ${error.message}`;
		if (overallStatus === 'healthy') overallStatus = 'degraded';
	}

	// Calculate uptime
	const uptimeMs = Date.now() - serverStartTime;
	const uptimeSeconds = Math.floor(uptimeMs / 1000);
	const uptimeMinutes = Math.floor(uptimeSeconds / 60);
	const uptimeHours = Math.floor(uptimeMinutes / 60);
	const uptimeDays = Math.floor(uptimeHours / 24);

	// Build response
	const response = {
		status: overallStatus,
		timestamp: Date.now(),
		uptime: {
			ms: uptimeMs,
			seconds: uptimeSeconds,
			human: uptimeDays > 0
				? `${uptimeDays}d ${uptimeHours % 24}h ${uptimeMinutes % 60}m`
				: uptimeHours > 0
				? `${uptimeHours}h ${uptimeMinutes % 60}m`
				: `${uptimeMinutes}m ${uptimeSeconds % 60}s`
		},
		version: {
			portal: '1.0.0',
			node: process.version || 'unknown'
		},
		checks
	};

	// Return appropriate status code
	const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

	return json(response, { status: statusCode });
}

/**
 * HEAD /portal-api/health
 * Lightweight health check (no body, just status code)
 * Useful for simple uptime monitoring
 */
export async function HEAD() {
	try {
		if (!sessionStore) {
			sessionStore = new SessionStore();
		}

		// Quick database check
		sessionStore.getAllSessions();

		// Return 200 OK if database is accessible
		return new Response(null, { status: 200 });
	} catch (error) {
		// Return 503 Service Unavailable if database check fails
		return new Response(null, { status: 503 });
	}
}
