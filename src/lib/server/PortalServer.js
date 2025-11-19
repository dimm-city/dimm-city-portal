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

const sessions = [];

// Validation constants
const MAX_SESSION_NAME_LENGTH = 100;
const MAX_PLAYER_NAME_LENGTH = 50;
const MAX_SESSION_ID_LENGTH = 50;
const MAX_PASSWORD_LENGTH = 100;
const MAX_DICE_COUNT = 100;
const MAX_DICE_TYPE = 1000;

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
 * Validate password
 * @param {string} password
 * @returns {string}
 */
function validatePassword(password) {
	const sanitized = sanitizeString(password, MAX_PASSWORD_LENGTH);
	if (!sanitized || sanitized.length < 1) {
		throw new Error('Password is required');
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
	const session = sessions[sessionId];
	return session?.host?.id == socketId;
}

const maxCommands = 9999;

export function createPortalServer(io) {
	io.on('connection', (socket) => {
		console.log('New client connected:', socket.id);

		// Session Management Events
		socket.on('createSession', (data) => {
			try {
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
				if (sessions[sessionId]) {
					throw new Error('Session ID already exists');
				}

				host.id = socket.id;
				host.token = { ...host.token, id: host.id };

				const state = {
					sessionId,
					password,
					name,
					host,
					players: [],
					diceRoles: [],
					tokens: [],
					commandData: [],
					idCounter: 0,
					createdAt: Date.now(),
					lastActivity: Date.now()
				};
				sessions[sessionId] = state;

				socket.join(sessionId);
				socket.emit('sessionCreated', state);
				console.log('Session created:', sessionId, 'by', host.name);
			} catch (error) {
				console.error('Create session error:', error.message);
				socket.emit('error', { message: error.message });
			}
		});

		socket.on('joinSession', (data) => {
			try {
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

				const session = sessions[sessionId];

				if (!session) {
					throw new Error('Session not found');
				}

				if (session.password !== password) {
					throw new Error('Invalid password');
				}

				player.id = socket.id;
				player.token = { ...player.token, id: player.id, playerToken: true };

				session.players.push(player);
				session.tokens.push(player.token);
				session.lastActivity = Date.now();

				socket.join(sessionId);
				socket.emit('sessionJoined', session);

				io.to(sessionId).emit('playerJoined', {
					sessionId,
					players: session.players,
					tokens: session.tokens
				});

				console.log('Player joined:', player.name, 'to session', sessionId);
			} catch (error) {
				console.error('Join session error:', error.message);
				socket.emit('error', { message: error.message });
			}
		});

		socket.on('leaveSession', (data) => {
			console.log('Leave session', data);
			const { sessionId } = data;
			const session = sessions[sessionId];

			if (session) {
				session.players = session?.players.filter((p) => p.id !== socket.id);
				session.tokens = session?.tokens.filter((t) => t.id !== socket.id);
				sessions[sessionId] = session;

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
			delete sessions[sessionId];
		});

		// Collaborative Editor Events
		socket.on('postCommand', (data) => handlePostCommand(data, socket));
		socket.on('commandsSince', (sessionId, sinceId, callback) => {
			const session = sessions[sessionId];
			if (!session) {
				//console.warn("No session found for ", socket?.id);
				callback(null, []);
				return;
			}
			handleCommandsSince(session, sinceId, callback);
		});

		function handlePostCommand(data, socket) {
			const session = sessions[data?.sessionId];

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
		socket.on('requestDiceRoll', (data) => {
			try {
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
				const session = sessions[sessionId];
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

				// Broadcast the roll result along with the player's theme
				io.to(sessionId).emit('diceRollResult', {
					sessionId,
					playerName,
					result,
					diceTheme
				});
			} catch (error) {
				console.error('Dice roll error:', error.message);
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
