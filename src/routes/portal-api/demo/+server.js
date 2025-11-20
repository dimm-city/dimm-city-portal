import { json } from '@sveltejs/kit';
import { SessionStore } from '$lib/server/SessionStore.js';
import { createDemoSession, getDemoSessionInfo, DEMO_SESSION_CONFIG } from '$lib/server/demoSession.js';

let sessionStore;

/**
 * GET /portal-api/demo - Get demo session info
 */
export async function GET() {
	try {
		const demoInfo = getDemoSessionInfo();
		return json({
			success: true,
			demo: demoInfo
		});
	} catch (error) {
		console.error('Get demo info error:', error);
		return json(
			{
				success: false,
				error: error.message
			},
			{ status: 500 }
		);
	}
}

/**
 * POST /portal-api/demo - Create or reset demo session
 */
export async function POST({ request }) {
	try {
		// Lazy initialize session store
		if (!sessionStore) {
			sessionStore = new SessionStore();
		}

		// Check if demo session already exists
		const existingDemo = sessionStore.getSession(DEMO_SESSION_CONFIG.sessionId);

		// If it exists and was created less than 1 hour ago, return existing
		if (existingDemo && Date.now() - existingDemo.createdAt < 3600000) {
			console.log('Demo session already exists, returning existing session');
			return json({
				success: true,
				sessionId: DEMO_SESSION_CONFIG.sessionId,
				password: DEMO_SESSION_CONFIG.password,
				message: 'Demo session already exists',
				existing: true
			});
		}

		// Create new demo session
		const demoSession = await createDemoSession();

		// Save to session store (will overwrite if exists)
		if (existingDemo) {
			sessionStore.updateSession(DEMO_SESSION_CONFIG.sessionId, demoSession);
			console.log('Demo session reset');
		} else {
			sessionStore.createSession(DEMO_SESSION_CONFIG.sessionId, demoSession);
			console.log('Demo session created');
		}

		return json({
			success: true,
			sessionId: DEMO_SESSION_CONFIG.sessionId,
			password: DEMO_SESSION_CONFIG.password,
			message: 'Demo session ready',
			existing: false
		});
	} catch (error) {
		console.error('Create demo session error:', error);
		return json(
			{
				success: false,
				error: error.message
			},
			{ status: 500 }
		);
	}
}
