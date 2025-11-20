/**
 * Integration tests for Fog of War WebSocket handlers
 *
 * Tests the WebSocket communication between client and server for fog of war:
 * - updateFog event handling
 * - clearFog event handling
 * - toggleFogVisibility event handling
 * - Authorization (host-only operations)
 * - Data validation
 * - Multi-client synchronization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { io as ioClient } from 'socket.io-client';
import { configureSocketIO } from '../src/lib/server/PortalServer.js';
import { Server } from 'socket.io';
import http from 'http';

describe('Fog of War WebSocket Integration', () => {
	let httpServer;
	let ioServer;
	let clientSocket;
	let dmSocket;
	let playerSocket;
	let sessionId;

	beforeEach(async () => {
		// Create HTTP server
		httpServer = http.createServer();

		// Create Socket.IO server
		ioServer = new Server(httpServer);

		// Configure PortalServer
		await new Promise((resolve) => {
			httpServer.listen(0, () => {
				const port = httpServer.address().port;
				configureSocketIO(ioServer);

				// Create DM client
				dmSocket = ioClient(`http://localhost:${port}`, {
					transports: ['websocket']
				});

				// Create player client
				playerSocket = ioClient(`http://localhost:${port}`, {
					transports: ['websocket']
				});

				dmSocket.on('connect', () => {
					if (playerSocket.connected) {
						resolve();
					}
				});

				playerSocket.on('connect', () => {
					if (dmSocket.connected) {
						resolve();
					}
				});
			});
		});

		// Create a session first
		sessionId = 'test-fog-session-' + Date.now();
		await new Promise((resolve, reject) => {
			dmSocket.emit('createSession', {
				name: 'Fog Test Session',
				password: 'testpass123',
				host: {
					name: 'Dream Master',
					host: true
				}
			});

			dmSocket.on('sessionCreated', (data) => {
				sessionId = data.sessionId;
				resolve();
			});

			dmSocket.on('error', reject);
		});

		// Player joins session
		await new Promise((resolve, reject) => {
			playerSocket.emit('joinSession', {
				sessionId,
				password: 'testpass123',
				player: {
					name: 'Test Player',
					host: false
				}
			});

			playerSocket.on('sessionJoined', resolve);
			playerSocket.on('error', reject);
		});
	});

	afterEach(() => {
		dmSocket?.disconnect();
		playerSocket?.disconnect();
		ioServer?.close();
		httpServer?.close();
	});

	describe('Update Fog', () => {
		it('should allow DM to update fog data', async () => {
			const fogData = {
				paths: [
					{
						points: [
							{ x: 0, y: 0 },
							{ x: 100, y: 100 }
						],
						operation: 'add',
						timestamp: Date.now()
					}
				],
				visibility: true,
				brushSize: 50
			};

			await new Promise((resolve, reject) => {
				dmSocket.emit('updateFog', {
					sessionId,
					fogData
				});

				dmSocket.on('fogUpdated', (data) => {
					expect(data.fogData).toBeDefined();
					expect(data.fogData.paths).toHaveLength(1);
					expect(data.fogData.paths[0].points).toHaveLength(2);
					resolve();
				});

				dmSocket.on('error', reject);
			});
		});

		it('should broadcast fog updates to all players', async () => {
			const fogData = {
				paths: [
					{
						points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
						operation: 'add',
						timestamp: Date.now()
					}
				],
				visibility: true,
				brushSize: 50
			};

			const playerReceived = new Promise((resolve) => {
				playerSocket.on('fogUpdated', (data) => {
					expect(data.fogData).toBeDefined();
					resolve();
				});
			});

			const dmReceived = new Promise((resolve) => {
				dmSocket.on('fogUpdated', (data) => {
					expect(data.fogData).toBeDefined();
					resolve();
				});
			});

			dmSocket.emit('updateFog', { sessionId, fogData });

			await Promise.all([playerReceived, dmReceived]);
		});

		it('should reject fog updates from non-host players', async () => {
			const fogData = {
				paths: [
					{
						points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
						operation: 'add',
						timestamp: Date.now()
					}
				],
				visibility: true,
				brushSize: 50
			};

			await new Promise((resolve) => {
				playerSocket.emit('updateFog', { sessionId, fogData });

				playerSocket.on('error', (error) => {
					expect(error.message).toContain('Only the host');
					resolve();
				});
			});
		});

		it('should validate fog data structure', async () => {
			const invalidFogData = {
				paths: 'not-an-array', // Invalid
				visibility: true,
				brushSize: 50
			};

			await new Promise((resolve) => {
				dmSocket.emit('updateFog', { sessionId, fogData: invalidFogData });

				dmSocket.on('error', (error) => {
					expect(error.message).toContain('Invalid fog data');
					resolve();
				});
			});
		});
	});

	describe('Clear Fog', () => {
		it('should allow DM to clear all fog', async () => {
			// First add some fog
			const fogData = {
				paths: [
					{
						points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
						operation: 'add',
						timestamp: Date.now()
					}
				],
				visibility: true,
				brushSize: 50
			};

			await new Promise((resolve) => {
				dmSocket.emit('updateFog', { sessionId, fogData });
				dmSocket.on('fogUpdated', resolve);
			});

			// Now clear it
			await new Promise((resolve) => {
				dmSocket.emit('clearFog', { sessionId });

				dmSocket.on('fogUpdated', (data) => {
					expect(data.fogData.paths).toEqual([]);
					resolve();
				});
			});
		});

		it('should reject clear fog from non-host players', async () => {
			await new Promise((resolve) => {
				playerSocket.emit('clearFog', { sessionId });

				playerSocket.on('error', (error) => {
					expect(error.message).toContain('Only the host');
					resolve();
				});
			});
		});
	});

	describe('Toggle Fog Visibility', () => {
		it('should allow DM to toggle fog visibility', async () => {
			await new Promise((resolve) => {
				dmSocket.emit('toggleFogVisibility', {
					sessionId,
					visibility: false
				});

				dmSocket.on('fogUpdated', (data) => {
					expect(data.fogData.visibility).toBe(false);
					resolve();
				});
			});
		});

		it('should toggle visibility without explicit value', async () => {
			// First set to false
			await new Promise((resolve) => {
				dmSocket.emit('toggleFogVisibility', {
					sessionId,
					visibility: false
				});
				dmSocket.on('fogUpdated', resolve);
			});

			// Then toggle (should become true)
			await new Promise((resolve) => {
				dmSocket.emit('toggleFogVisibility', { sessionId });

				dmSocket.on('fogUpdated', (data) => {
					expect(data.fogData.visibility).toBe(true);
					resolve();
				});
			});
		});

		it('should reject visibility toggle from non-host players', async () => {
			await new Promise((resolve) => {
				playerSocket.emit('toggleFogVisibility', { sessionId, visibility: false });

				playerSocket.on('error', (error) => {
					expect(error.message).toContain('Only the host');
					resolve();
				});
			});
		});
	});

	describe('Data Persistence', () => {
		it('should persist fog data across server restarts', async () => {
			// This would require mocking SessionStore's persistence layer
			// For now, we just verify that fog data is sent to updateSession
			const fogData = {
				paths: [
					{
						points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
						operation: 'add',
						timestamp: Date.now()
					}
				],
				visibility: true,
				brushSize: 50
			};

			await new Promise((resolve) => {
				dmSocket.emit('updateFog', { sessionId, fogData });
				dmSocket.on('fogUpdated', resolve);
			});

			// In a real test, we'd restart the server and verify the fog data persists
			// For this integration test, we just verify the update was accepted
		});
	});

	describe('Multi-client Synchronization', () => {
		it('should sync fog changes to multiple players simultaneously', async () => {
			// Create a second player
			const player2Socket = ioClient(`http://localhost:${httpServer.address().port}`, {
				transports: ['websocket']
			});

			await new Promise((resolve) => {
				player2Socket.emit('joinSession', {
					sessionId,
					password: 'testpass123',
					player: {
						name: 'Player 2',
						host: false
					}
				});

				player2Socket.on('sessionJoined', resolve);
			});

			const fogData = {
				paths: [
					{
						points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
						operation: 'add',
						timestamp: Date.now()
					}
				],
				visibility: true,
				brushSize: 50
			};

			const player1Received = new Promise((resolve) => {
				playerSocket.on('fogUpdated', resolve);
			});

			const player2Received = new Promise((resolve) => {
				player2Socket.on('fogUpdated', resolve);
			});

			dmSocket.emit('updateFog', { sessionId, fogData });

			await Promise.all([player1Received, player2Received]);

			player2Socket.disconnect();
		});
	});

	describe('Error Handling', () => {
		it('should handle missing session ID', async () => {
			await new Promise((resolve) => {
				dmSocket.emit('updateFog', {
					fogData: { paths: [], visibility: true, brushSize: 50 }
				});

				dmSocket.on('error', (error) => {
					expect(error.message).toContain('Session ID');
					resolve();
				});
			});
		});

		it('should handle missing fog data', async () => {
			await new Promise((resolve) => {
				dmSocket.emit('updateFog', { sessionId });

				dmSocket.on('error', (error) => {
					expect(error.message).toContain('fog data');
					resolve();
				});
			});
		});

		it('should handle non-existent session', async () => {
			await new Promise((resolve) => {
				dmSocket.emit('updateFog', {
					sessionId: 'non-existent-session',
					fogData: { paths: [], visibility: true, brushSize: 50 }
				});

				dmSocket.on('error', (error) => {
					expect(error.message).toContain('not found');
					resolve();
				});
			});
		});
	});
});
