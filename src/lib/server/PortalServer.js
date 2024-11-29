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

function rollDiceExpression(expression) {
	if (!expression) return;
	// Simple dice rolling logic; you can expand this as needed
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
			if (!data) {
				console.warn('Failed to create session, no data provided.');
				return;
			}
			console.log('Starting session', data);

			const { sessionId, name, password, host } = data;

			host.id = socket.id;
			host.token = { ...host.token, id: host.id };

			const state = {
				sessionId,
				password,
				name: name || 'Unnamed Session',
				host,
				players: [],
				diceRoles: [],
				tokens: [],
				commandData: [],
				idCounter: 0
			};
			sessions[sessionId] = state;

			socket.join(sessionId);
			socket.emit('sessionCreated', state);
		});

		socket.on('joinSession', (data) => {
			const { sessionId, password, player } = data;

			const session = sessions[sessionId];
			if (session && session.password === password) {
				player.id = socket.id;
				player.token = { ...player.token, id: player.id, playerToken: true };

				session.players.push(player);
				session.tokens.push(player.token);

				socket.join(sessionId);
				socket.emit('sessionJoined', session);

				io.to(sessionId).emit('playerJoined', {
					sessionId,
					players: session.players,
					tokens: session.tokens
				});
			} else {
				socket.emit('error', { message: 'Invalid portal ID or password' });
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
			const { sessionId, diceExpression, playerName, diceTheme } = data;

			// Get the session
			const session = sessions[sessionId];
			if (!session) return;

			// Generate the dice roll result
			const result = rollDiceExpression(diceExpression);

			console.log('Dice roll result', result, socket.id, diceTheme);

			session.diceRoles = [...session.diceRoles, { playerId: socket.id, diceTheme, result }];

			sessions[sessionId] = session;

			// Broadcast the roll result along with the player's theme
			io.to(sessionId).emit('diceRollResult', {
				sessionId,
				playerName,
				result,
				diceTheme
			});
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
