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

		// Always recreate the demo session to ensure fresh password hash
		// Delete existing demo session if it exists
		const existingDemo = sessionStore.getSession(DEMO_SESSION_CONFIG.sessionId);
		if (existingDemo) {
			sessionStore.deleteSession(DEMO_SESSION_CONFIG.sessionId);
			console.log('Deleted existing demo session');
		}

		// Create new demo session with current password
		const demoSession = await createDemoSession();

		// Save to session store
		sessionStore.createSession(DEMO_SESSION_CONFIG.sessionId, demoSession);
		console.log('Demo session created with fresh password hash');

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
