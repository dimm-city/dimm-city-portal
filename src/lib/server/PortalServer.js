/**
 * Represents the state of a portal session.
 * @typedef {Object} DC.PortalState
 * @property {string} sessionId - The unique identifier for the session.
 * @property {string} sessionName - The name of the session.
 * @property {string} sessionPassword - The password for the session.
 * @property {DC.PortalPlayer[]} players - Additional data related to the player.
 * @property {DC.PortalDreamMaster} host - The DM for the session.
 */

import { randomInt, randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { Mutex } from 'async-mutex';
import { SessionStore } from './SessionStore.js';
import {
	sessionCreationLimiter,
	sessionJoinLimiter,
	diceRollLimiter,
	commandLimiter,
	chatMessageLimiter,
	passwordAttemptLimiter,
	handleRateLimitError,
	logRateLimiterConfig
} from './RateLimiter.js';

// Initialize session store with SQLite
const sessionStore = new SessionStore();

// Mutex locks for race condition protection (APPLIED to all critical sections)
const sessionMutexes = new Map();

function getSessionMutex(sessionId) {
	if (!sessionMutexes.has(sessionId)) {
		sessionMutexes.set(sessionId, new Mutex());
	}
	return sessionMutexes.get(sessionId);
}

async function withSessionLock(sessionId, callback) {
	const mutex = getSessionMutex(sessionId);
	return await mutex.runExclusive(callback);
}

// Validation constants
const MAX_SESSION_NAME_LENGTH = 100;
const MAX_PLAYER_NAME_LENGTH = 50;
const MAX_SESSION_ID_LENGTH = 50;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 100;
const MAX_DICE_COUNT = 100;
const MAX_DICE_TYPE = 1000;
const BCRYPT_SALT_ROUNDS = 10;

/**
 * Sanitize string input by removing potentially dangerous characters
 * @param {string} input
 * @param {number} maxLength
 * @returns {string}
 */
function sanitizeString(input, maxLength) {
	if (typeof input !== 'string') return '';
	// Remove null bytes and limit length
	return input.replace(/\0/g, '').trim().slice(0, maxLength);
}

/**
 * Sanitize session data for client transmission - removes sensitive fields
 * @param {Object} session
 * @returns {Object}
 */
function sanitizeSessionForClient(session) {
	if (!session) return null;
	const { passwordHash, ...sanitized } = session;
	return sanitized;
}

/**
 * Escape HTML entities to prevent XSS attacks
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
	if (typeof text !== 'string') return '';
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

/**
 * Validate and sanitize hex color value to prevent CSS injection
 * @param {string} color
 * @returns {string}
 */
function sanitizeColor(color) {
	if (!color || typeof color !== 'string') return '#888888';
	const hexColorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
	return hexColorRegex.test(color) ? color : '#888888';
}

/**
 * Validate and sanitize session name
 * @param {string} name
 * @returns {string}
 */
function validateSessionName(name) {
	const sanitized = sanitizeString(name, MAX_SESSION_NAME_LENGTH);
	if (!sanitized || sanitized.length < 1) {
		throw new Error('Session name must be at least 1 character');
	}
	// Allow alphanumeric, spaces, hyphens, underscores
	if (!/^[a-zA-Z0-9\s\-_]+$/.test(sanitized)) {
		throw new Error('Session name contains invalid characters');
	}
	return sanitized;
}

/**
 * Validate and sanitize player name
 * @param {string} name
 * @returns {string}
 */
function validatePlayerName(name) {
	const sanitized = sanitizeString(name, MAX_PLAYER_NAME_LENGTH);
	if (!sanitized || sanitized.length < 1) {
		throw new Error('Player name must be at least 1 character');
	}
	// Allow alphanumeric, spaces, hyphens, underscores
	if (!/^[a-zA-Z0-9\s\-_]+$/.test(sanitized)) {
		throw new Error('Player name contains invalid characters');
	}
	return sanitized;
}

/**
 * Validate session ID format
 * @param {string} sessionId
 * @returns {string}
 */
function validateSessionId(sessionId) {
	const sanitized = sanitizeString(sessionId, MAX_SESSION_ID_LENGTH);
	if (!sanitized || sanitized.length < 1) {
		throw new Error('Session ID is required');
	}
	// Only allow alphanumeric characters for session ID
	if (!/^[a-zA-Z0-9]+$/.test(sanitized)) {
		throw new Error('Session ID contains invalid characters');
	}
	return sanitized;
}

/**
 * Validate password strength and format
 * @param {string} password
 * @returns {string}
 */
function validatePassword(password) {
	const sanitized = sanitizeString(password, MAX_PASSWORD_LENGTH);

	if (!sanitized || sanitized.length < 1) {
		throw new Error('Password is required');
	}

	if (sanitized.length < MIN_PASSWORD_LENGTH) {
		throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
	}

	// Check for basic complexity (at least one letter and one number)
	const hasLetter = /[a-zA-Z]/.test(sanitized);
	const hasNumber = /[0-9]/.test(sanitized);

	if (!hasLetter || !hasNumber) {
		throw new Error('Password must contain at least one letter and one number');
	}

	return sanitized;
}

/**
 * Validate dice expression format and prevent DOS
 * @param {string} expression
 * @returns {string}
 */
function validateDiceExpression(expression) {
	if (!expression || typeof expression !== 'string') {
		throw new Error('Dice expression is required');
	}

	// Remove modifiers for validation
	const baseExpression = expression.replace(/\{[^}]+\}/g, '');

	// Validate format: NdM where N and M are positive integers
	const diceRegex = /^(\d{1,3})d(\d{1,4})$/;
	const match = baseExpression.match(diceRegex);

	if (!match) {
		throw new Error('Invalid dice expression format. Use format: NdM (e.g., 2d20)');
	}

	const [, numDice, diceType] = match;
	const numDiceInt = parseInt(numDice, 10);
	const diceTypeInt = parseInt(diceType, 10);

	// Prevent DOS attacks with excessive dice
	if (numDiceInt > MAX_DICE_COUNT) {
		throw new Error(`Number of dice cannot exceed ${MAX_DICE_COUNT}`);
	}

	if (diceTypeInt > MAX_DICE_TYPE) {
		throw new Error(`Dice type cannot exceed ${MAX_DICE_TYPE}`);
	}

	if (numDiceInt < 1 || diceTypeInt < 1) {
		throw new Error('Dice count and type must be positive numbers');
	}

	return expression;
}

/**
 * Validate and sanitize conditions array for combatants
 * @param {any} conditions
 * @returns {string[]}
 */
function validateConditions(conditions) {
	if (!Array.isArray(conditions)) return [];
	if (conditions.length > 20) {
		throw new Error('Too many conditions (max 20)');
	}

	return conditions
		.filter(c => typeof c === 'string')
		.map(c => sanitizeString(c, 50))
		.slice(0, 20);
}

/**
 * Sanitize SVG content to remove potentially malicious elements
 * @param {string} svgContent
 * @returns {string}
 */
function sanitizeSVG(svgContent) {
	if (typeof svgContent !== 'string') return '';

	// Remove dangerous tags that can execute scripts
	const dangerousPatterns = [
		/<script[\s\S]*?<\/script>/gi,
		/<iframe[\s\S]*?<\/iframe>/gi,
		/<object[\s\S]*?<\/object>/gi,
		/<embed[\s\S]*?<\/embed>/gi,
		/<style[\s\S]*?javascript[\s\S]*?<\/style>/gi,
		/on\w+\s*=\s*["'][^"']*["']/gi, // onclick, onerror, etc.
		/on\w+\s*=\s*[^\s>]*/gi,
		/javascript:/gi,
		/data:text\/html/gi,
		/<foreignObject[\s\S]*?<\/foreignObject>/gi
	];

	let sanitized = svgContent;
	for (const pattern of dangerousPatterns) {
		sanitized = sanitized.replace(pattern, '');
	}

	return sanitized;
}

function rollDiceExpression(expression) {
	if (!expression) return null;

	// Validate the expression
	try {
		validateDiceExpression(expression);
	} catch (error) {
		throw error;
	}

	// Simple dice rolling logic
	let modifiers = '';
	if (expression.includes('{')) {
		modifiers = expression.substring(expression.indexOf('{'));
		expression = expression.replace(modifiers, '');
	}

	const [numDice, diceType] = expression.split('d').map(Number);
	let result = [];
	for (let i = 0; i < numDice; i++) {
		result.push(randomInt(1, diceType + 1));
	}
	return `${expression}${modifiers}@${result.join(',')}`;
}

/**
 * Check if a socket connection is the host of a session
 * @param {string} sessionId - The session to check
 * @param {string} socketId - The socket ID to verify
 * @returns {boolean} True if the socket is the session host
 * @security Authorization check - uses strict equality
 */
function isHost(sessionId, socketId) {
	const session = sessionStore.getSession(sessionId);
	return session?.host?.id === socketId;
}

const maxCommands = 9999;

/**
 * Create a system message for chat
 * @param {string} sessionId
 * @param {string} message
 * @param {string} type - 'system', 'dice', etc.
 */
function createSystemMessage(sessionId, message, type = 'system') {
	return {
		id: `msg-${randomUUID()}`,
		sessionId,
		playerId: 'system',
		playerName: 'System',
		message: escapeHtml(message),
		timestamp: Date.now(),
		type,
		color: '#888888'
	};
}

export function createPortalServer(io) {
	// Log rate limiter configuration on server start
	logRateLimiterConfig();

	// CSRF/Origin validation middleware
	io.use((socket, next) => {
		const origin = socket.handshake.headers.origin || socket.handshake.headers.referer;

		// In production, validate against allowed origins
		const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

		// In development, allow localhost
		const isDevelopment = process.env.NODE_ENV !== 'production';
		const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1|::1)(:\d+)?$/;

		if (isDevelopment && (!origin || localhostRegex.test(origin))) {
			return next();
		}

		// In production, check allowed origins
		if (allowedOrigins.length > 0) {
			if (!origin || !allowedOrigins.includes(origin)) {
				console.warn(`WebSocket connection rejected from origin: ${origin}`);
				return next(new Error('Forbidden origin'));
			}
		}

		next();
	});

	io.on('connection', (socket) => {
		console.log('New client connected:', socket.id);

		// Session Management Events
		socket.on('createSession', async (data) => {
			try {
				// Rate limiting by IP address
				const clientIP = socket.handshake.address;
				await sessionCreationLimiter.consume(clientIP);

				if (!data) {
					throw new Error('No session data provided');
				}

				let { sessionId, name, password, host, isPublic, gameSystem, maxPlayers, description } = data;

				// Validate and sanitize all inputs
				sessionId = validateSessionId(sessionId);
				name = validateSessionName(name);
				password = validatePassword(password);

				if (!host || !host.name) {
					throw new Error('Host information is required');
				}

				host.name = validatePlayerName(host.name);

				// Check if session already exists
				if (sessionStore.getSession(sessionId)) {
					throw new Error('Session ID already exists');
				}

				// Hash password before storage
				const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

				host.id = socket.id;
				host.token = { ...host.token, id: host.id };

				const state = {
					sessionId,
					passwordHash, // Store hashed password
					name,
					host,
					players: [],
					diceRoles: [],
					tokens: [],
					commandData: [],
					idCounter: 0,
					createdAt: Date.now(),
					lastActivity: Date.now(),
					// Scene persistence
					savedScene: null, // SVG data
					sceneName: 'Untitled Scene',
					lastSaved: null
					,
					// Session discovery metadata
					isPublic: isPublic !== false, // Default to public
					gameSystem: gameSystem || 'Generic',
					maxPlayers: maxPlayers || 6,
					description: description || '',
					// Chat system
					chatHistory: [], // Store last 100 messages
					// Combat/Initiative tracking
					combatants: [], // Array of combatants in initiative order
					currentTurnIndex: 0, // Index of current turn
					combatActive: false, // Whether combat is currently active
					// Fog of War
					fogData: {
						paths: [], // Array of fog path objects
						visibility: true, // Whether fog is visible
						brushSize: 50 // Current brush size
					}
				};

				// Save to persistent storage
				sessionStore.createSession(sessionId, state);

				socket.join(sessionId);
				socket.emit('sessionCreated', sanitizeSessionForClient(state));
				console.log('Session created:', sessionId, 'by', host.name);
			} catch (error) {
				// Handle rate limit errors
				if (handleRateLimitError(error, socket, 'sessionCreation')) {
					return;
				}

				console.error('Create session error:', error.message);
				socket.emit('error', { message: error.message });
			}
		});

		socket.on('joinSession', async (data) => {
			const clientIP = socket.handshake.address;

			try {
				// Rate limiting by IP address
				await sessionJoinLimiter.consume(clientIP);

				if (!data) {
					throw new Error('No session data provided');
				}

				let { sessionId, password, player } = data;

				// Validate inputs
				sessionId = validateSessionId(sessionId);
				password = validatePassword(password);

				if (!player || !player.name) {
					throw new Error('Player information is required');
				}

				player.name = validatePlayerName(player.name);

				const session = sessionStore.getSession(sessionId);

				if (!session) {
					throw new Error('Session not found');
				}

				// Verify password using bcrypt
				const isPasswordValid = await bcrypt.compare(password, session.passwordHash);

				if (!isPasswordValid) {
					// Track failed password attempts
					await passwordAttemptLimiter.consume(clientIP);
					throw new Error('Invalid password');
				}

				// Reset password attempt counter on success
				await passwordAttemptLimiter.delete(clientIP);

				// Critical section: Protect session modifications with mutex lock
				await withSessionLock(sessionId, async () => {
					// Refresh session data inside lock to avoid stale data
					const currentSession = sessionStore.getSession(sessionId);

					player.id = socket.id;
					player.token = { ...player.token, id: player.id, playerToken: true };

					currentSession.players.push(player);
					currentSession.tokens.push(player.token);
					currentSession.lastActivity = Date.now();

					// Send system message to chat
					const joinMessage = createSystemMessage(
						sessionId,
						`${player.name} joined the session`
					);
					if (!currentSession.chatHistory) currentSession.chatHistory = [];
					currentSession.chatHistory.push(joinMessage);
					if (currentSession.chatHistory.length > 100) currentSession.chatHistory.shift();

					// Update session in persistent storage
					sessionStore.updateSession(sessionId, currentSession);

					// Update session variable for later use
					Object.assign(session, currentSession);
				});

				socket.join(sessionId);
				socket.emit('sessionJoined', sanitizeSessionForClient(session));

				io.to(sessionId).emit('playerJoined', {
					sessionId,
					players: session.players,
					tokens: session.tokens
				});

				// Emit join message (already added to chat history in lock)
				const joinMessage = session.chatHistory[session.chatHistory.length - 1];
				io.to(sessionId).emit('newMessage', joinMessage);

				console.log('Player joined:', player.name, 'to session', sessionId);
			} catch (error) {
				// Handle rate limit errors (check if it's a password attempt error or join error)
				const action = error.message === 'Invalid password' ? 'passwordAttempt' : 'sessionJoin';
				if (handleRateLimitError(error, socket, action)) {
					return;
				}

				console.error('Join session error:', error.message);
				socket.emit('error', { message: error.message });
			}
		});

		socket.on('leaveSession', (data) => {
			console.log('Leave session', data);
			const { sessionId } = data;
			const session = sessionStore.getSession(sessionId);
			
			if (!session) return;
			
			// Find the player who is leaving
			const leavingPlayer = session.host.id === socket.id
				? session.host
				: session.players.find(p => p.id === socket.id);
			
			if (leavingPlayer) {
				// Send system message to chat
				const leaveMessage = createSystemMessage(
					sessionId,
					`${leavingPlayer.name} left the session`
				);
				if (!session.chatHistory) session.chatHistory = [];
				session.chatHistory.push(leaveMessage);
				if (session.chatHistory.length > 100) session.chatHistory.shift();
				sessionStore.updateSession(sessionId, session);
				io.to(sessionId).emit('newMessage', leaveMessage);
			}

			if (session) {
				session.players = session?.players.filter((p) => p.id !== socket.id);
				session.tokens = session?.tokens.filter((t) => t.id !== socket.id);
				session.lastActivity = Date.now();

				// Update session in persistent storage
				sessionStore.updateSession(sessionId, session);

				io.to(sessionId).emit('playerLeft', {
					sessionId,
					players: session?.players,
					tokens: session?.tokens
				});
			}
		});

		socket.on('endSession', (data) => {
			if (!isHost(data?.sessionId, socket.id)) return;

			const { sessionId } = data;
			console.log('Ending session', sessionId);

			socket.emit('sessionEnded', { sessionId });
			io.to(sessionId).emit('sessionEnded', {
				sessionId
			});

			// Delete session from persistent storage
			sessionStore.deleteSession(sessionId);
		});

		// Collaborative Editor Events
		socket.on('postCommand', async (data) => {
			try {
				// Rate limiting by socket ID
				await commandLimiter.consume(socket.id);
				await handlePostCommand(data, socket);
			} catch (error) {
				// Handle rate limit errors
				if (handleRateLimitError(error, socket, 'command')) {
					return;
				}
				console.error('Post command error:', error.message);
			}
		});

		socket.on('commandsSince', (sessionId, sinceId, callback) => {
			const session = sessionStore.getSession(sessionId);
			if (!session) {
				//console.warn("No session found for ", socket?.id);
				callback(null, []);
				return;
			}
			handleCommandsSince(session, sinceId, callback);
		});

		async function handlePostCommand(data, socket) {
			const sessionId = data?.sessionId;
			if (!sessionId) return;

			// Critical section: Protect command counter and array with mutex lock
			const command = await withSessionLock(sessionId, async () => {
				const session = sessionStore.getSession(sessionId);

				if (!session) {
					//console.warn(`No session found for socket ${socket?.id}`);
					return null;
				}

				session.idCounter += 1;
				const cmd = {
					id: session.idCounter,
					data: data
				};
				session.commandData.push(cmd);

				// Limit the number of commands stored
				if (session.commandData.length > maxCommands) {
					session.commandData.shift();
				}

				session.lastActivity = Date.now();

				// Update session in persistent storage
				sessionStore.updateSession(sessionId, session);

				return cmd;
			});

			// Broadcast the new command to all clients except the sender
			if (command) {
				socket.broadcast.emit('newCommand', command);
			}
		}

		function handleCommandsSince(session, sinceId, callback) {
			const minId = parseInt(sinceId, 10) + 1;
			const commands = session.commandData.filter((cmd) => cmd.id >= minId);
			if (callback) {
				callback({ commands });
			}
		}

		// Dice Roll Event
		socket.on('requestDiceRoll', async (data) => {
			try {
				// Rate limiting by socket ID
				await diceRollLimiter.consume(socket.id);

				if (!data) {
					throw new Error('No dice roll data provided');
				}

				let { sessionId, diceExpression, playerName, diceTheme } = data;

				// Validate inputs
				sessionId = validateSessionId(sessionId);
				diceExpression = validateDiceExpression(diceExpression);

				if (playerName) {
					playerName = validatePlayerName(playerName);
				}

				// Get the session
				const session = sessionStore.getSession(sessionId);
				if (!session) {
					throw new Error('Session not found');
				}

				// Verify the player is in the session
				const isPlayerInSession = socket.id === session.host.id ||
					session.players.some(p => p.id === socket.id);

				if (!isPlayerInSession) {
					throw new Error('Player not authorized for this session');
				}

				// Generate the dice roll result
				const result = rollDiceExpression(diceExpression);
				session.lastActivity = Date.now();

				console.log('Dice roll:', playerName, result, 'in session', sessionId);

				session.diceRoles = [...session.diceRoles, {
					playerId: socket.id,
					diceTheme,
					result,
					timestamp: Date.now()
				}];

				// Update session in persistent storage
				sessionStore.updateSession(sessionId, session);

				// Broadcast the roll result along with the player's theme
				io.to(sessionId).emit('diceRollResult', {
					sessionId,
					playerName,
					result,
					diceTheme
				});

				// Send dice roll as chat message
				const diceMessage = createSystemMessage(
					sessionId,
					`${playerName} rolled ${diceExpression}: ${result}`,
					'dice'
				);
				if (!session.chatHistory) session.chatHistory = [];
				session.chatHistory.push(diceMessage);
				if (session.chatHistory.length > 100) session.chatHistory.shift();
				sessionStore.updateSession(sessionId, session);
				io.to(sessionId).emit('newMessage', diceMessage);
			} catch (error) {
				// Handle rate limit errors
				if (handleRateLimitError(error, socket, 'diceRoll')) {
					return;
				}

				console.error('Dice roll error:', error.message);
				socket.emit('error', { message: error.message });
			}
		});


		// Scene Management Events
		socket.on('saveScene', async (data) => {
			try {
				const { sessionId, sceneData, sceneName } = data;

				// Validate inputs
				if (!sessionId || !sceneData) {
					throw new Error('Session ID and scene data are required');
				}

				// Verify socket is host
				if (!isHost(sessionId, socket.id)) {
					throw new Error('Only the host can save scenes');
				}

				// Get session
				const session = sessionStore.getSession(sessionId);
				if (!session) {
					throw new Error('Session not found');
				}

				// Validate SVG size (prevent DOS) - 10MB limit
				if (sceneData.length > 10 * 1024 * 1024) {
					throw new Error('Scene data too large (max 10MB)');
				}

				// Sanitize SVG content to remove malicious scripts
				const sanitizedScene = sanitizeSVG(sceneData);

				// Update session with sanitized scene data
				session.savedScene = sanitizedScene;
				session.lastSaved = Date.now();
				session.sceneName = sceneName || 'Untitled Scene';
				session.sceneVersion = (session.sceneVersion || 0) + 1;
				session.lastActivity = Date.now();

				// Save to database
				sessionStore.updateSession(sessionId, session);

				// Confirm to client
				socket.emit('sceneSaved', {
					success: true,
					lastSaved: session.lastSaved,
					sceneVersion: session.sceneVersion,
					sceneName: session.sceneName
				});

				// Notify all players that scene metadata was updated
				io.to(sessionId).emit('sceneMetadataUpdated', {
					sceneName: session.sceneName,
					lastSaved: session.lastSaved
				});

				console.log(`Scene saved for session ${sessionId}: "${sceneName}"`);
			} catch (error) {
				console.error('Save scene error:', error.message);
				socket.emit('error', { message: error.message });
			}
		});

		socket.on('loadScene', (data) => {
			try {
				const { sessionId } = data;

				// Validate
				if (!sessionId) {
					throw new Error('Session ID is required');
				}

				// Get session
				const session = sessionStore.getSession(sessionId);
				if (!session) {
					throw new Error('Session not found');
				}

				// Return saved scene data
				socket.emit('sceneLoaded', {
					success: true,
					savedScene: session.savedScene,
					sceneName: session.sceneName,
					lastSaved: session.lastSaved
				});

				console.log(`Scene loaded for session ${sessionId}`);
			} catch (error) {
				console.error('Load scene error:', error.message);
				socket.emit('error', { message: error.message });
			}
		});


		// Chat Message Handler
		socket.on('sendMessage', async (data) => {
			try {
				// Rate limiting by socket ID
				await chatMessageLimiter.consume(socket.id);

				const { sessionId, message, type = 'chat' } = data;

				// Validate inputs
				if (!sessionId || !message) {
					throw new Error('Session ID and message are required');
				}

				// Validate message length (prevent spam/DOS)
				if (message.length > 1000) {
					throw new Error('Message too long (max 1000 characters)');
				}

				// Get session
				const session = sessionStore.getSession(sessionId);
				if (!session) {
					throw new Error('Session not found');
				}

				// Verify player is in session
				const isPlayerInSession = socket.id === session.host.id ||
					session.players.some(p => p.id === socket.id);

				if (!isPlayerInSession) {
					throw new Error('Player not in session');
				}

				// Get player info
				const player = socket.id === session.host.id
					? session.host
					: session.players.find(p => p.id === socket.id);

				// Sanitize message
				const basicSanitized = sanitizeString(message.trim(), 1000);
				const sanitizedMessage = escapeHtml(basicSanitized);

				// Create message object
				const messageObj = {
					id: `msg-${randomUUID()}`,
					sessionId,
					playerId: socket.id,
					playerName: player.name,
					message: sanitizedMessage,
					timestamp: Date.now(),
					type,
					color: sanitizeColor(player.color || '#FFFFFF')
				};

				// Store in session history (keep last 100 messages)
				if (!session.chatHistory) {
					session.chatHistory = [];
				}
				session.chatHistory.push(messageObj);
				if (session.chatHistory.length > 100) {
					session.chatHistory.shift();
				}

				// Update session
				session.lastActivity = Date.now();
				sessionStore.updateSession(sessionId, session);

				// Broadcast to all players in session
				io.to(sessionId).emit('newMessage', messageObj);

				console.log(`Message in ${sessionId} from ${player.name}: ${sanitizedMessage}`);
			} catch (error) {
				// Handle rate limit errors
				if (handleRateLimitError(error, socket, 'chatMessage')) {
					return;
				}

				console.error('Send message error:', error.message);
				socket.emit('error', { message: error.message });
			}
		});

		// Combat/Initiative Tracker Events
		socket.on('addCombatant', async (data) => {
			try {
				const { sessionId, combatant } = data;

				if (!sessionId || !combatant) {
					throw new Error('Session ID and combatant data are required');
				}

				// Validate session exists
				const session = sessionStore.getSession(sessionId);
				if (!session) {
					throw new Error('Session not found');
				}

				// Only host can add combatants
				if (!isHost(sessionId, socket.id)) {
					throw new Error('Only the host can add combatants');
				}

				// Validate and sanitize combatant data outside lock
				const newCombatant = {
					id: `combatant-${randomUUID()}`,
					name: validatePlayerName(combatant.name || 'Combatant'),
					initiative: parseInt(combatant.initiative) || 0,
					type: ['PC', 'NPC', 'Monster'].includes(combatant.type) ? combatant.type : 'NPC',
					hp: parseInt(combatant.hp) || null,
					maxHp: parseInt(combatant.maxHp) || null,
					ac: parseInt(combatant.ac) || null,
					conditions: validateConditions(combatant.conditions || [])
				};

				// Critical section: Protect combatants array with mutex lock
				await withSessionLock(sessionId, async () => {
					const currentSession = sessionStore.getSession(sessionId);

					// Add to combatants array
					currentSession.combatants.push(newCombatant);

					// Sort by initiative (descending)
					currentSession.combatants.sort((a, b) => b.initiative - a.initiative);

					// Update session
					sessionStore.updateSession(sessionId, currentSession);

					// Update session variable for broadcast
					Object.assign(session, currentSession);
				});

				// Broadcast to all players
				io.to(sessionId).emit('combatantAdded', {
					combatant: newCombatant,
					combatants: session.combatants
				});

				console.log(`Combatant added to ${sessionId}: ${newCombatant.name} (Initiative: ${newCombatant.initiative})`);
			} catch (error) {
				console.error('Add combatant error:', error.message);
				socket.emit('error', { message: error.message });
			}
		});

		socket.on('removeCombatant', async (data) => {
			try {
				const { sessionId, combatantId } = data;

				if (!sessionId || !combatantId) {
					throw new Error('Session ID and combatant ID are required');
				}

				// Validate session exists
				const session = sessionStore.getSession(sessionId);
				if (!session) {
					throw new Error('Session not found');
				}

				// Only host can remove combatants
				if (!isHost(sessionId, socket.id)) {
					throw new Error('Only the host can remove combatants');
				}

				// Critical section: Protect combatants array with mutex lock
				const removed = await withSessionLock(sessionId, async () => {
					const currentSession = sessionStore.getSession(sessionId);

					// Find and remove combatant
					const index = currentSession.combatants.findIndex(c => c.id === combatantId);
					if (index === -1) {
						throw new Error('Combatant not found');
					}

					const removedCombatant = currentSession.combatants.splice(index, 1)[0];

					// Adjust current turn index if needed
					if (currentSession.currentTurnIndex >= currentSession.combatants.length && currentSession.combatants.length > 0) {
						currentSession.currentTurnIndex = currentSession.combatants.length - 1;
					}

					// Update session
					sessionStore.updateSession(sessionId, currentSession);

					// Update session variable for broadcast
					Object.assign(session, currentSession);

					return removedCombatant;
				});

				// Broadcast to all players
				io.to(sessionId).emit('combatantRemoved', {
					combatantId,
					combatants: session.combatants,
					currentTurnIndex: session.currentTurnIndex
				});

				console.log(`Combatant removed from ${sessionId}: ${removed.name}`);
			} catch (error) {
				console.error('Remove combatant error:', error.message);
				socket.emit('error', { message: error.message });
			}
		});

		socket.on('nextTurn', async (data) => {
			try {
				const { sessionId } = data;

				if (!sessionId) {
					throw new Error('Session ID is required');
				}

				// Validate session exists
				const session = sessionStore.getSession(sessionId);
				if (!session) {
					throw new Error('Session not found');
				}

				// Only host can advance turn
				if (!isHost(sessionId, socket.id)) {
					throw new Error('Only the host can advance turns');
				}

				if (!session.combatActive) {
					throw new Error('Combat is not active');
				}

				if (session.combatants.length === 0) {
					throw new Error('No combatants in initiative tracker');
				}

				// Critical section: Protect turn index with mutex lock
				const result = await withSessionLock(sessionId, async () => {
					const currentSession = sessionStore.getSession(sessionId);

					// Advance to next turn (wrap around)
					currentSession.currentTurnIndex = (currentSession.currentTurnIndex + 1) % currentSession.combatants.length;

					const currentCombatant = currentSession.combatants[currentSession.currentTurnIndex];

					// Send system message to chat
					const systemMessage = createSystemMessage(
						sessionId,
						`${currentCombatant.name}'s turn!`,
						'system'
					);
					currentSession.chatHistory.push(systemMessage);
					if (currentSession.chatHistory.length > 100) currentSession.chatHistory.shift();

					// Update session
					sessionStore.updateSession(sessionId, currentSession);

					// Update session variable for broadcast
					Object.assign(session, currentSession);

					return { currentCombatant, systemMessage };
				});

				// Broadcast to all players
				io.to(sessionId).emit('turnChanged', {
					currentTurnIndex: session.currentTurnIndex,
					currentCombatant: result.currentCombatant
				});
				io.to(sessionId).emit('newMessage', result.systemMessage);

				console.log(`Turn advanced in ${sessionId}: ${result.currentCombatant.name}'s turn`);
			} catch (error) {
				console.error('Next turn error:', error.message);
				socket.emit('error', { message: error.message });
			}
		});

		socket.on('previousTurn', async (data) => {
			try {
				const { sessionId } = data;

				if (!sessionId) {
					throw new Error('Session ID is required');
				}

				// Validate session exists
				const session = sessionStore.getSession(sessionId);
				if (!session) {
					throw new Error('Session not found');
				}

				// Only host can change turn
				if (!isHost(sessionId, socket.id)) {
					throw new Error('Only the host can change turns');
				}

				if (!session.combatActive) {
					throw new Error('Combat is not active');
				}

				if (session.combatants.length === 0) {
					throw new Error('No combatants in initiative tracker');
				}

				// Critical section: Protect turn index with mutex lock
				const result = await withSessionLock(sessionId, async () => {
					const currentSession = sessionStore.getSession(sessionId);

					// Go to previous turn (wrap around)
					currentSession.currentTurnIndex = currentSession.currentTurnIndex - 1;
					if (currentSession.currentTurnIndex < 0) {
						currentSession.currentTurnIndex = currentSession.combatants.length - 1;
					}

					const currentCombatant = currentSession.combatants[currentSession.currentTurnIndex];

					// Update session
					sessionStore.updateSession(sessionId, currentSession);

					// Update session variable for broadcast
					Object.assign(session, currentSession);

					return { currentCombatant };
				});

				// Broadcast to all players
				io.to(sessionId).emit('turnChanged', {
					currentTurnIndex: session.currentTurnIndex,
					currentCombatant: result.currentCombatant
				});

				console.log(`Turn moved back in ${sessionId}: ${result.currentCombatant.name}'s turn`);
			} catch (error) {
				console.error('Previous turn error:', error.message);
				socket.emit('error', { message: error.message });
			}
		});

		socket.on('toggleCombat', async (data) => {
			try {
				const { sessionId } = data;

				if (!sessionId) {
					throw new Error('Session ID is required');
				}

				// Validate session exists
				const session = sessionStore.getSession(sessionId);
				if (!session) {
					throw new Error('Session not found');
				}

				// Only host can toggle combat
				if (!isHost(sessionId, socket.id)) {
					throw new Error('Only the host can start/end combat');
				}

				// Toggle combat state
				session.combatActive = !session.combatActive;

				// Reset to first turn when starting combat
				if (session.combatActive && session.combatants.length > 0) {
					session.currentTurnIndex = 0;
				}

				// Update session
				sessionStore.updateSession(sessionId, session);

				// Send system message to chat
				const statusMessage = session.combatActive ? 'Combat started!' : 'Combat ended.';
				const systemMessage = createSystemMessage(sessionId, statusMessage, 'system');
				session.chatHistory.push(systemMessage);
				if (session.chatHistory.length > 100) session.chatHistory.shift();
				sessionStore.updateSession(sessionId, session);

				// Broadcast to all players
				io.to(sessionId).emit('combatStatusChanged', {
					combatActive: session.combatActive,
					currentTurnIndex: session.currentTurnIndex,
					currentCombatant: session.combatActive && session.combatants.length > 0
						? session.combatants[session.currentTurnIndex]
						: null
				});
				io.to(sessionId).emit('newMessage', systemMessage);

				console.log(`Combat ${session.combatActive ? 'started' : 'ended'} in ${sessionId}`);
			} catch (error) {
				console.error('Toggle combat error:', error.message);
				socket.emit('error', { message: error.message });
			}
		});

		socket.on('updateCombatant', async (data) => {
			try {
				const { sessionId, combatantId, updates } = data;

				if (!sessionId || !combatantId || !updates) {
					throw new Error('Session ID, combatant ID, and updates are required');
				}

				// Validate session exists
				const session = sessionStore.getSession(sessionId);
				if (!session) {
					throw new Error('Session not found');
				}

				// Only host can update combatants
				if (!isHost(sessionId, socket.id)) {
					throw new Error('Only the host can update combatants');
				}

				// Critical section: Protect combatant updates with mutex lock
				const updatedCombatant = await withSessionLock(sessionId, async () => {
					const currentSession = sessionStore.getSession(sessionId);

					// Find combatant
					const combatant = currentSession.combatants.find(c => c.id === combatantId);
					if (!combatant) {
						throw new Error('Combatant not found');
					}

					// Update allowed fields
					if (updates.hp !== undefined) combatant.hp = parseInt(updates.hp) || null;
					if (updates.ac !== undefined) combatant.ac = parseInt(updates.ac) || null;
					if (updates.initiative !== undefined) {
						combatant.initiative = parseInt(updates.initiative) || 0;
						// Re-sort if initiative changed
						currentSession.combatants.sort((a, b) => b.initiative - a.initiative);
					}
					if (updates.conditions !== undefined) combatant.conditions = validateConditions(updates.conditions);

					// Update session
					sessionStore.updateSession(sessionId, currentSession);

					// Update session variable for broadcast
					Object.assign(session, currentSession);

					return combatant;
				});

				// Broadcast to all players
				io.to(sessionId).emit('combatantUpdated', {
					combatant: updatedCombatant,
					combatants: session.combatants
				});

				console.log(`Combatant updated in ${sessionId}: ${updatedCombatant.name}`);
			} catch (error) {
				console.error('Update combatant error:', error.message);
				socket.emit('error', { message: error.message });
			}
		});

		// Fog of War Handlers
		socket.on('updateFog', async (data) => {
			try {
				const { sessionId, fogData } = data;

				if (!sessionId || !fogData) {
					throw new Error('Session ID and fog data are required');
				}

				// Validate session exists
				const session = sessionStore.getSession(sessionId);
				if (!session) {
					throw new Error('Session not found');
				}

				// Only host can update fog
				if (!isHost(sessionId, socket.id)) {
					throw new Error('Only the host can update fog of war');
				}

				// Validate fog data structure
				if (!Array.isArray(fogData.paths)) {
					throw new Error('Invalid fog data: paths must be an array');
				}

				// Critical section: Protect fog updates with mutex lock
				await withSessionLock(sessionId, async () => {
					const currentSession = sessionStore.getSession(sessionId);
					if (!currentSession) {
						throw new Error('Session not found during update');
					}

					// Update fog data
					currentSession.fogData = {
						paths: fogData.paths,
						visibility: fogData.visibility !== false,
						brushSize: fogData.brushSize || 50
					};

					// Save to persistent storage
					sessionStore.updateSession(sessionId, currentSession);

					// Update session variable for broadcast
					Object.assign(session, currentSession);
				});

				// Broadcast to all players
				// DM gets full fog data, players get filtered fog
				const dmSockets = [];
				const playerSockets = [];

				const socketsInRoom = await io.in(sessionId).fetchSockets();
				for (const s of socketsInRoom) {
					if (isHost(sessionId, s.id)) {
						dmSockets.push(s);
					} else {
						playerSockets.push(s);
					}
				}

				// Send full fog data to DM
				dmSockets.forEach(s => {
					s.emit('fogUpdated', {
						fogData: session.fogData
					});
				});

				// Send full fog data to players (they render it opaque client-side)
				playerSockets.forEach(s => {
					s.emit('fogUpdated', {
						fogData: session.fogData
					});
				});

				console.log(`Fog updated in ${sessionId}: ${session.fogData.paths.length} paths`);
			} catch (error) {
				console.error('Update fog error:', error.message);
				socket.emit('error', { message: error.message });
			}
		});

		socket.on('clearFog', async (data) => {
			try {
				const { sessionId } = data;

				if (!sessionId) {
					throw new Error('Session ID is required');
				}

				// Validate session exists
				const session = sessionStore.getSession(sessionId);
				if (!session) {
					throw new Error('Session not found');
				}

				// Only host can clear fog
				if (!isHost(sessionId, socket.id)) {
					throw new Error('Only the host can clear fog of war');
				}

				// Critical section: Protect fog clear with mutex lock
				await withSessionLock(sessionId, async () => {
					const currentSession = sessionStore.getSession(sessionId);
					if (!currentSession) {
						throw new Error('Session not found during clear');
					}

					// Clear fog paths but keep other settings
					currentSession.fogData = {
						paths: [],
						visibility: currentSession.fogData?.visibility !== false,
						brushSize: currentSession.fogData?.brushSize || 50
					};

					// Save to persistent storage
					sessionStore.updateSession(sessionId, currentSession);

					// Update session variable for broadcast
					Object.assign(session, currentSession);
				});

				// Broadcast to all players
				io.to(sessionId).emit('fogUpdated', {
					fogData: session.fogData
				});

				console.log(`Fog cleared in ${sessionId}`);
			} catch (error) {
				console.error('Clear fog error:', error.message);
				socket.emit('error', { message: error.message });
			}
		});

		socket.on('toggleFogVisibility', async (data) => {
			try {
				const { sessionId, visibility } = data;

				if (!sessionId) {
					throw new Error('Session ID is required');
				}

				// Validate session exists
				const session = sessionStore.getSession(sessionId);
				if (!session) {
					throw new Error('Session not found');
				}

				// Only host can toggle fog visibility
				if (!isHost(sessionId, socket.id)) {
					throw new Error('Only the host can toggle fog visibility');
				}

				// Critical section: Protect fog visibility with mutex lock
				await withSessionLock(sessionId, async () => {
					const currentSession = sessionStore.getSession(sessionId);
					if (!currentSession) {
						throw new Error('Session not found during visibility toggle');
					}

					// Toggle or set visibility
					if (typeof visibility === 'boolean') {
						currentSession.fogData.visibility = visibility;
					} else {
						currentSession.fogData.visibility = !currentSession.fogData.visibility;
					}

					// Save to persistent storage
					sessionStore.updateSession(sessionId, currentSession);

					// Update session variable for broadcast
					Object.assign(session, currentSession);
				});

				// Broadcast to all players
				io.to(sessionId).emit('fogUpdated', {
					fogData: session.fogData
				});

				console.log(`Fog visibility toggled in ${sessionId}: ${session.fogData.visibility}`);
			} catch (error) {
				console.error('Toggle fog visibility error:', error.message);
				socket.emit('error', { message: error.message });
			}
		});

		// Disconnect Event
		socket.on('disconnect', () => {
			console.log('Client disconnected:', socket.id);
			// Handle client disconnection if necessary
		});
	});
	return {
		version: '0.1.0',
		io
	};
}
