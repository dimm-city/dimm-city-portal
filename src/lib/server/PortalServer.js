/**
 * Represents the state of a portal session.
 * @typedef {Object} DC.PortalState
 * @property {string} sessionId - The unique identifier for the session.
 * @property {string} sessionName - The name of the session.
 * @property {string} sessionPassword - The password for the session.
 * @property {DC.PortalPlayer[]} players - Additional data related to the player.
 * @property {DC.PortalDreamMaster} host - The DM for the session.
 */

import { randomInt } from 'crypto';
import bcrypt from 'bcrypt';
import { SessionStore } from './SessionStore.js';
import {
	sessionCreationLimiter,
	sessionJoinLimiter,
	diceRollLimiter,
	commandLimiter,
	passwordAttemptLimiter,
	handleRateLimitError,
	logRateLimiterConfig
} from './RateLimiter.js';

// Initialize session store with SQLite
const sessionStore = new SessionStore();

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

function isHost(sessionId, socketId) {
	const session = sessionStore.getSession(sessionId);
	return session?.host?.id == socketId;
}

const maxCommands = 9999;

export function createPortalServer(io) {
	// Log rate limiter configuration on server start
	logRateLimiterConfig();

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

				let { sessionId, name, password, host } = data;

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
				};

				// Save to persistent storage
				sessionStore.createSession(sessionId, state);

				socket.join(sessionId);
				socket.emit('sessionCreated', state);
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

				player.id = socket.id;
				player.token = { ...player.token, id: player.id, playerToken: true };

				session.players.push(player);
				session.tokens.push(player.token);
				session.lastActivity = Date.now();

				// Update session in persistent storage
				sessionStore.updateSession(sessionId, session);

				socket.join(sessionId);
				socket.emit('sessionJoined', session);

				io.to(sessionId).emit('playerJoined', {
					sessionId,
					players: session.players,
					tokens: session.tokens
				});

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
			const session = sessionStore.getSession(data?.sessionId);

			if (!session) {
				//console.warn(`No session found for socket ${socket?.id}`);
				return;
			}
			session.idCounter += 1;
			const command = {
				id: session.idCounter,
				data: data
			};
			session.commandData.push(command);

			// Limit the number of commands stored
			if (session.commandData.length > maxCommands) {
				session.commandData.shift();
			}

			session.lastActivity = Date.now();

			// Update session in persistent storage
			sessionStore.updateSession(data.sessionId, session);

			// Broadcast the new command to all clients except the sender
			socket.broadcast.emit('newCommand', command);
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

				// Update session with scene data
				session.savedScene = sceneData;
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
