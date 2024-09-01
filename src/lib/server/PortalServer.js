const sessions = [];

function rollDiceExpression(expression) {
	if (!expression) return;
	// Simple dice rolling logic; you can expand this as needed
	const [numDice, diceType] = expression.split('d').map(Number);
	let result = [];
	for (let i = 0; i < numDice; i++) {
		result.push(Math.ceil(Math.random() * diceType));
	}
	return `${expression}@${result.join(',')}`;
}

function isHost(sessionId, socketId) {
	const session = sessions[sessionId];
	return session?.players.find((p) => p.id === socketId)?.host;
}

export function createPortalServer(io) {
	io.on('connection', (socket) => {
		console.log('New client connected');

		socket.on('createSession', (data) => {
			const { sessionId, sessionName, password, player } = data;

			player.id = socket.id;
			player.token = { ...player.token, id: player.id };
			player.host = true;

			sessions[sessionId] = {
				sessionId,
				password,
				name: sessionName || 'Unnamed Session',
				players: [player],
				diceRoles: [],
				tokens: []
			};

			socket.join(sessionId);
			socket.emit('sessionCreated', {
				sessionId,
				session: sessions[sessionId],
				player
			});
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
				socket.emit('sessionJoined', { sessionId, session, player });

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
			console.log('ending session', sessionId);

			socket.emit('sessionEnded', { sessionId });
			// Broadcast the roll result along with the player's theme
			io.to(sessionId).emit('sessionEnded', {
				sessionId
			});
			delete sessions[sessionId];
		});

		socket.on('disconnect', () => {
			console.log('Client disconnected');
		});

		socket.on('changeBackground', (data) => {
			if (!isHost(data?.sessionId, socket.id)) return;

			const { sessionId, backgroundUrl } = data;

			const session = sessions[sessionId];
			if (session) {
				console.log(
					`Background change received for session ${sessionId}. Data size: ${Buffer.byteLength(
						backgroundUrl,
						'utf8'
					)} bytes`
				);

				try {
					io.to(sessionId).emit('backgroundChanged', {
						sessionId,
						backgroundUrl
					});
				} catch (error) {
					console.error('Error broadcasting background change:', error);
					socket.emit('error', {
						message: 'Failed to change background. Please try again.'
					});
				}
			} else {
				socket.emit('error', { message: 'Session not found' });
			}
		});
		socket.on('requestDiceRoll', (data) => {
			const { sessionId, diceExpression, playerName, diceTheme } = data;

			// Get the session
			const session = sessions[sessionId];
			if (!session) return;

			// Generate the dice roll result
			const result = rollDiceExpression(diceExpression);

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
		socket.on('addToken', (data) => {
			try {
				const { sessionId } = data;
				const session = sessions[sessionId];

				if (!session || !isHost(data?.sessionId, socket.id)) return;

				if (data.token.id == '-1')
					data.token.id = socket.id + '|' + new Date().getTime().toString();

				const index = session?.tokens.findIndex((t) => t.id == data.id);

				data.token.playerToken = false;

				if (index > -1) {
					session.tokens[index] = data.token;
				} else {
					session?.tokens.push(data.token);
				}
				sessions[sessionId] = { ...session };

				io.to(sessionId).emit('tokenAdded', data);
			} catch (error) {
				console.error('Error broadcasting token added:', error);
			}
		});
		socket.on('removeToken', (data) => {
			try {
				const { sessionId, tokenId } = data;

				const session = sessions[sessionId];
				if (!session) return;

				console.log('Removing Token', data);

				if (socket.id !== data.tokenId && !isHost(data?.sessionId, socket.id)) {
					console.log('Remove Token Not Allowed');
					return;
				}
				let sessionTokenIndex = session?.tokens.findIndex((t) => t.id == tokenId);

				if (sessionTokenIndex < 0) {
					console.log('Token Not Found', tokenId, session.tokens);
					return;
				}
				session.tokens = session.tokens.filter((t, i) => i != sessionTokenIndex);

				sessions[sessionId] = session;

				io.to(sessionId).emit('tokenRemoved', { tokenId });
			} catch (error) {
				console.error('Error broadcasting token added:', error);
			}
		});
		socket.on('tokenUpdating', (data) => {
			const { sessionId, token } = data;

			const session = sessions[sessionId];
			if (!session) return;

			console.log('Updating Token', data);

			if (socket.id !== data.token.id && !isHost(data?.sessionId, socket.id)) {
				console.log('Token Update Not Allowed');

				return;
			}
			let sessionTokenIndex = session?.tokens.findIndex((t) => t.id == token.id);

			if (sessionTokenIndex < 0) {
				console.log('Token Not Found', token, session.tokens);
				return;
			}

			session.tokens[sessionTokenIndex] = token;

			console.log('Token Updated', token);

			io.to(sessionId).emit('tokenUpdated', {
				sessionId,
				token
			});
		});
		socket.on('tokenMoving', (data) => {
			const { sessionId, tokenId, x, y } = data;

			const session = sessions[sessionId];
			if (!session) return;

			console.log('Moving Token', data);

			if (socket.id !== tokenId && !isHost(data?.sessionId, socket.id)) {
				console.log('Token Move Not Allowed');

				return;
			}
			let sessionTokenIndex = session?.tokens.findIndex((t) => t.id == tokenId);

			if (sessionTokenIndex < 0) {
				console.log('Token Not Found', tokenId, session.tokens);
				return;
			}

			session.tokens[sessionTokenIndex] = {
				...session.tokens[sessionTokenIndex],
				x: x,
				y: y
			};

			console.log('Token Moved', data);

			io.to(sessionId).emit('tokenMoved', {
				sessionId,
				tokenId,
				x,
				y
			});
		});
	});

	return {
		version: '0.0.1',
		io
	}
}
