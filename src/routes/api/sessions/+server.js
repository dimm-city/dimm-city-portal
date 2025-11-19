import { json } from '@sveltejs/kit';
import { SessionStore } from '$lib/server/SessionStore.js';

// Lazy initialize session store (only at runtime, not during build)
let sessionStore;

/**
 * GET /api/sessions
 * Returns list of public active sessions
 *
 * Query parameters:
 * - public: boolean - Only show public sessions (default: true)
 * - hasSlots: boolean - Only show sessions with available slots
 * - gameSystem: string - Filter by game system
 */
export async function GET({ url }) {
	try {
		// Lazy initialize session store at runtime
		if (!sessionStore) {
			sessionStore = new SessionStore();
		}

		// Parse query parameters
		const publicOnly = url.searchParams.get('public') !== 'false';
		const hasSlots = url.searchParams.get('hasSlots') === 'true';
		const gameSystem = url.searchParams.get('gameSystem');

		// Get all active session IDs
		const sessionIds = sessionStore.getAllSessions();

		// Map sessions to public data
		const sessions = sessionIds
			.map(sessionId => {
				const session = sessionStore.getSession(sessionId);
				if (!session) return null;

				// Filter: only public sessions if publicOnly is true
				if (publicOnly && session.isPublic === false) {
					return null;
				}

				// Filter: only sessions with available slots if hasSlots is true
				const currentPlayers = (session.players?.length || 0) + 1; // +1 for host
				const hasAvailableSlots = currentPlayers < session.maxPlayers;
				if (hasSlots && !hasAvailableSlots) {
					return null;
				}

				// Filter: by game system if specified
				if (gameSystem && session.gameSystem !== gameSystem) {
					return null;
				}

				// Return public session data (exclude sensitive info)
				return {
					sessionId: session.sessionId,
					name: session.name,
					gameSystem: session.gameSystem || 'Generic',
					hostName: session.host?.name || 'Unknown',
					currentPlayers: currentPlayers,
					maxPlayers: session.maxPlayers || 6,
					isPasswordProtected: !!session.passwordHash,
					isPublic: session.isPublic !== false,
					createdAt: session.createdAt,
					description: session.description || '',
					hasAvailableSlots: hasAvailableSlots,
					sceneName: session.sceneName || 'Untitled Scene',
					lastActivity: session.lastActivity
				};
			})
			.filter(session => session !== null) // Remove nulls (filtered out)
			.sort((a, b) => b.lastActivity - a.lastActivity); // Sort by most recent activity

		return json({
			success: true,
			sessions,
			count: sessions.length,
			timestamp: Date.now()
		});
	} catch (error) {
		console.error('Session list API error:', error);
		return json({
			success: false,
			error: 'Failed to fetch sessions',
			message: error.message
		}, { status: 500 });
	}
}
