/**
 * Demo Session Seed Data
 * Creates a pre-populated demo session to showcase VTT features
 */

import bcrypt from 'bcrypt';

const DEMO_SESSION_ID = 'demo-goblin-ambush';
const DEMO_PASSWORD = 'demo123';
const BCRYPT_SALT_ROUNDS = 10;

/**
 * Create demo session with pre-populated data
 * @returns {Promise<Object>} Demo session data
 */
export async function createDemoSession() {
	// Hash the demo password
	const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_SALT_ROUNDS);

	// Create demo host
	const demoHost = {
		id: 'demo-host',
		name: 'Demo DM',
		token: {
			id: 'demo-host',
			playerToken: false,
			x: 100,
			y: 100,
			color: '#6366f1'
		}
	};

	// Create demo session with all features showcased
	const demoSession = {
		sessionId: DEMO_SESSION_ID,
		name: 'Demo: The Goblin Ambush',
		passwordHash,
		host: demoHost,
		players: [],
		tokens: [demoHost.token],
		diceRoles: [],
		commandData: [],
		idCounter: 100,
		createdAt: Date.now(),
		lastActivity: Date.now(),

		// Scene persistence
		savedScene: null, // Will be populated with a simple scene
		sceneName: 'Forest Clearing',
		lastSaved: Date.now(),

		// Session discovery metadata
		isPublic: true,
		gameSystem: 'D&D 5e',
		maxPlayers: 6,
		description: 'Try out Dimm City Portal! This demo showcases combat tracking, dice rolling, and real-time collaboration.',

		// Chat history with welcome messages
		chatHistory: [
			{
				id: 'msg-demo-1',
				sessionId: DEMO_SESSION_ID,
				playerId: 'system',
				playerName: 'System',
				message: 'Welcome to the Dimm City Portal demo!',
				timestamp: Date.now() - 300000, // 5 minutes ago
				type: 'system',
				color: '#888888'
			},
			{
				id: 'msg-demo-2',
				sessionId: DEMO_SESSION_ID,
				playerId: 'system',
				playerName: 'System',
				message: '📖 Scenario: Your party encounters a group of goblins in a forest clearing. Roll for initiative!',
				timestamp: Date.now() - 240000, // 4 minutes ago
				type: 'system',
				color: '#888888'
			},
			{
				id: 'msg-demo-3',
				sessionId: DEMO_SESSION_ID,
				playerId: 'demo-host',
				playerName: 'Demo DM',
				message: 'Try using the Initiative Tracker to manage combat, roll dice, and chat with the group!',
				timestamp: Date.now() - 180000, // 3 minutes ago
				type: 'chat',
				color: '#6366f1'
			}
		],

		// Combat/Initiative tracker with pre-populated combatants
		combatants: [
			{
				id: 'combatant-pc1',
				name: 'Thorin (PC)',
				initiative: 18,
				type: 'PC',
				hp: 32,
				maxHp: 32,
				ac: 16,
				conditions: []
			},
			{
				id: 'combatant-pc2',
				name: 'Elara (PC)',
				initiative: 15,
				type: 'PC',
				hp: 24,
				maxHp: 24,
				ac: 14,
				conditions: []
			},
			{
				id: 'combatant-goblin1',
				name: 'Goblin Chief',
				initiative: 14,
				type: 'Monster',
				hp: 18,
				maxHp: 18,
				ac: 15,
				conditions: []
			},
			{
				id: 'combatant-pc3',
				name: 'Mira (PC)',
				initiative: 12,
				type: 'PC',
				hp: 28,
				maxHp: 28,
				ac: 13,
				conditions: []
			},
			{
				id: 'combatant-goblin2',
				name: 'Goblin Archer 1',
				initiative: 11,
				type: 'Monster',
				hp: 7,
				maxHp: 7,
				ac: 13,
				conditions: []
			},
			{
				id: 'combatant-goblin3',
				name: 'Goblin Archer 2',
				initiative: 10,
				type: 'Monster',
				hp: 7,
				maxHp: 7,
				ac: 13,
				conditions: []
			},
			{
				id: 'combatant-pc4',
				name: 'Garrick (PC)',
				initiative: 8,
				type: 'PC',
				hp: 35,
				maxHp: 35,
				ac: 18,
				conditions: []
			},
			{
				id: 'combatant-goblin4',
				name: 'Goblin Warrior',
				initiative: 6,
				type: 'Monster',
				hp: 7,
				maxHp: 7,
				ac: 15,
				conditions: []
			}
		],
		currentTurnIndex: 0,
		combatActive: true, // Combat is already active for demo

		// Fog of War with example paths (showing some revealed/hidden areas)
		fogData: {
			paths: [
				{
					points: [
						{ x: 50, y: 50 },
						{ x: 150, y: 50 },
						{ x: 200, y: 100 },
						{ x: 200, y: 200 },
						{ x: 150, y: 250 },
						{ x: 50, y: 250 },
						{ x: 0, y: 200 },
						{ x: 0, y: 100 },
						{ x: 50, y: 50 }
					],
					operation: 'add',
					timestamp: Date.now() - 120000 // 2 minutes ago
				},
				{
					points: [
						{ x: 500, y: 300 },
						{ x: 600, y: 300 },
						{ x: 650, y: 350 },
						{ x: 650, y: 450 },
						{ x: 600, y: 500 },
						{ x: 500, y: 500 },
						{ x: 450, y: 450 },
						{ x: 450, y: 350 },
						{ x: 500, y: 300 }
					],
					operation: 'add',
					timestamp: Date.now() - 90000 // 1.5 minutes ago
				}
			],
			visibility: true,
			brushSize: 50
		}
	};

	return demoSession;
}

/**
 * Get demo session info (without password hash)
 * @returns {Object} Demo session public info
 */
export function getDemoSessionInfo() {
	return {
		sessionId: DEMO_SESSION_ID,
		password: DEMO_PASSWORD,
		name: 'Demo: The Goblin Ambush',
		description: 'Pre-configured demo session showcasing all VTT features',
		features: [
			'Pre-populated combat with 4 heroes vs 4 goblins',
			'Active initiative tracker',
			'Example chat messages',
			'Forest clearing scene',
			'Fog of war demonstration',
			'Public session (discoverable)'
		]
	};
}

/**
 * Check if a session ID is the demo session
 * @param {string} sessionId
 * @returns {boolean}
 */
export function isDemoSession(sessionId) {
	return sessionId === DEMO_SESSION_ID;
}

export const DEMO_SESSION_CONFIG = {
	sessionId: DEMO_SESSION_ID,
	password: DEMO_PASSWORD
};
