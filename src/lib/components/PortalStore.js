import { roller, processDiceResult, selectedDiceTheme } from './DiceStore';
import { env } from "$env/dynamic/public";
import { toast } from '@zerodevx/svelte-toast';
// eslint-disable-next-line no-unused-vars
import Editor, { SerializableCommand } from 'js-draw';
import { io } from 'socket.io-client';
import { derived, get, writable } from 'svelte/store';

export let backgroundUrl = '/assets/dc-banner-yellow.png';
const hubUrl = env.PUBLIC_PORTAL_HUB_URL ?? 'http://localhost:5173';
export let socket = io(hubUrl, {
	path: '/portal-hub'
});

/**
 * @type {import('svelte/store').Writable<null|string>}
 */
export let sessionName = writable(null);
/**
 * @type {import('svelte/store').Writable<null|string>}
 */
export let sessionId = writable(null);

export let sessionPassword = writable('');

export const showSessionDetails = writable(false);

// Keep track of the last command ID received
export let lastUpdateIndex = writable(0);
/**
 * @type {import('svelte/store').Writable<null|string>}
 */
export let sessionMode = writable();

/**
 * @type {import('svelte/store').Writable<DC.PortalPlayer[]|any[]>}
 */
export let players = writable([]);

/**
 * @type {import('svelte/store').Writable<DC.PortalPlayer>}
 */
export let player = writable();
/**
 * @type {import('svelte/store').Writable<DC.PortalPlayer|any>}
 */
export const host = writable(null);

export let showPlayerList = writable(false);
export let showPlayerSettings = writable(false);
export let showSceneSettings = writable(false);

export let inSession = derived([sessionId], ($sessionId) => {
	return $sessionId != null && $sessionId.toString() > '';
});

export const isHost = derived([sessionId, player, host], ([$sessionId, $player, $host]) => {
	return $sessionId && $player.id === $host?.id;
});

export let diceRoller = get(roller);
/**
 * @type {import('svelte/store').Writable<Editor|null>}
 */
export let editor = writable(null);

export function getPlayerToken() {
	const p = get(player);
	return {
		id: p.id,
		src: p.token?.src ?? '/assets/missing-image.png'
	};
}
/**
 * @param {DC.PortalState} sessionData
 */
export function handleCreateSession(sessionData) {
	try {
		console.log('Emitting createSession', sessionData);

		lastUpdateIndex.set(0);
		socket.emit('createSession', sessionData);
	} catch (error) {
		console.error('Failed to create session:', error);
		toast.push('Failed to create session. Please try again.', { classes: ['error'] });
	}
}

/**
 * @param {{ sessionId: string; password: string; player: any; }} sessionData
 */
export function handleJoinSession(sessionData) {
	try {
		lastUpdateIndex.set(0);
		socket.emit('joinSession', sessionData);
	} catch (error) {
		console.error('Failed to join session:', error);
		toast.push('Failed to join session. Please try again.', { classes: ['error'] });
	}
}

// Send a serialized command to the server
export function postSerializedCommand(/** @type {Record<string | symbol, any>} */ data) {
	try {
		const _player = get(player);
		const _sessionId = get(sessionId);

		socket.emit('postCommand', {
			clientId: _player.id,
			sessionId: _sessionId,
			data
		});
		console.log('Posted', JSON.stringify(data).length);
	} catch (error) {
		console.error('Failed to post command:', error);
		// Don't show toast for every command failure - just log it
	}
}
// Request commands since a specific ID
export function fetchUpdates(/** @type {number} */ lastIndex) {
	socket.emit(
		'commandsSince',
		get(sessionId),
		lastIndex,
		(/** @type {{ commands: DC.PortalEditorCommand[]; }} */ response) => {
			if (response && response.commands) {
				response.commands.forEach((commandJSON) => {
					handleNewCommand(commandJSON);
				});
				lastUpdateIndex.set(
					response.commands
						.map((c) => c.id)
						.sort((a, b) => a - b)
						.at(0) ?? 0
				);
			}
		}
	);
}
// Handle incoming commands from the server
function handleNewCommand(/** @type {DC.PortalEditorCommand} */ command) {
	const _editor = get(editor);
	if (!_editor) {
		console.error('No editor found');
		return;
	}
	if (command.data.clientId === get(player).id) {
		console.log('ignoring own command');

		// Ignore commands sent by this client
		return;
	}

	try {
		const deserializedCommand = SerializableCommand.deserialize(command.data.data, _editor);
		console.log('Applying', deserializedCommand);
		deserializedCommand.apply(_editor);
		lastUpdateIndex.set(command.id); // Update the last command ID
	} catch (e) {
		console.warn('Error parsing command', e);
	}
}
export function leaveSession() {
	try {
		console.log('Leaving session');

		socket.emit('leaveSession', { sessionId: get(sessionId), player: get(player) });
		players.set([]);
		sessionId.set(null);
		lastUpdateIndex.set(0);
	} catch (error) {
		console.error('Failed to leave session:', error);
		// Still reset state even if emit fails
		players.set([]);
		sessionId.set(null);
		lastUpdateIndex.set(0);
	}
}

export function endSession() {
	try {
		lastUpdateIndex.set(0);
		socket.emit('endSession', { sessionId });
	} catch (error) {
		console.error('Failed to end session:', error);
		toast.push('Failed to end session. Please try again.', { classes: ['error'] });
	}
}

export function copySessionUrl() {
	const sessionUrl = `${window.location.href.split('?')[0]}?mode=join&session=${get(sessionId)}`;
	navigator.clipboard.writeText(sessionUrl).then(
		() => {
			toast.push(`Send this URL to the player(s) you would like to invite: ${sessionUrl}`, {});
			// showToast(
			// 	`Send this URL to the player(s) you would like to invite: ${sessionUrl}`,
			// 	'Copied to clipboard!',
			// 	'success'
			// );
		},
		() => {
			toast.push('Failed to copy session URL', { classes: ['error'] });
		}
	);
}

export function requestDiceRoll(expression = '1d20') {
	try {
		const _player = get(player);
		console.log('requestDiceRoll', expression, _player);

		if (!_player) {
			console.warn('Cannot roll dice: no player found');
			return;
		}
		socket.emit('requestDiceRoll', {
			sessionId: get(sessionId),
			diceExpression: expression,
			playerName: _player.name,
			diceTheme: get(selectedDiceTheme),
			diceId: _player.diceId
		});
	} catch (error) {
		console.error('Failed to request dice roll:', error);
		toast.push('Failed to roll dice. Please try again.', { classes: ['error'] });
	}
}

/**
 * Save current scene to the server
 * @param {string} sceneData - Sanitized SVG data
 * @param {string} sceneName - Name of the scene
 * @returns {Promise<void>}
 */
export function saveScene(sceneData, sceneName = 'Untitled Scene') {
	return new Promise((resolve, reject) => {
		try {
			const _sessionId = get(sessionId);
			if (!_sessionId) {
				throw new Error('No active session');
			}

			socket.emit('saveScene', {
				sessionId: _sessionId,
				sceneData,
				sceneName
			});

			// Listen for save confirmation
			socket.once('sceneSaved', (data) => {
				if (data.success) {
					console.log('Scene saved successfully:', data);
					toast.push(`Scene "${sceneName}" saved successfully!`, { classes: ['success'] });
					resolve();
				} else {
					reject(new Error('Failed to save scene'));
				}
			});

			// Handle errors
			const errorHandler = (error) => {
				if (error.message.includes('scene')) {
					reject(new Error(error.message));
					socket.off('error', errorHandler);
				}
			};
			socket.on('error', errorHandler);

			// Timeout after 10 seconds
			setTimeout(() => {
				reject(new Error('Save scene timeout'));
			}, 10000);
		} catch (error) {
			console.error('Failed to save scene:', error);
			toast.push('Failed to save scene. Please try again.', { classes: ['error'] });
			reject(error);
		}
	});
}

/**
 * Load saved scene from the server
 * @returns {Promise<{savedScene: string, sceneName: string, lastSaved: number}>}
 */
export function loadScene() {
	return new Promise((resolve, reject) => {
		try {
			const _sessionId = get(sessionId);
			if (!_sessionId) {
				throw new Error('No active session');
			}

			socket.emit('loadScene', {
				sessionId: _sessionId
			});

			// Listen for load response
			socket.once('sceneLoaded', (data) => {
				if (data.success) {
					console.log('Scene loaded successfully:', data);
					if (data.savedScene) {
						toast.push(`Scene "${data.sceneName}" loaded!`, { classes: ['success'] });
					}
					resolve(data);
				} else {
					reject(new Error('Failed to load scene'));
				}
			});

			// Handle errors
			const errorHandler = (error) => {
				if (error.message.includes('scene') || error.message.includes('Session')) {
					reject(new Error(error.message));
					socket.off('error', errorHandler);
				}
			};
			socket.on('error', errorHandler);

			// Timeout after 10 seconds
			setTimeout(() => {
				reject(new Error('Load scene timeout'));
			}, 10000);
		} catch (error) {
			console.error('Failed to load scene:', error);
			toast.push('Failed to load scene. Please try again.', { classes: ['error'] });
			reject(error);
		}
	});
}
/**
 * @param {{ result: any; diceTheme: any; }} data
 */
async function onDiceRollResult(data) {
	try {
		const { result, diceTheme } = data;
		await processDiceResult(result, diceTheme);
	} catch (error) {
		console.error('Failed to process dice roll result:', error);
		toast.push('Failed to display dice roll result.', { classes: ['error'] });
	}
}

socket.on('connect', () => {
	console.log('Connected to the server');
});

socket.on('disconnect', () => {
	console.log('Disconnected from the server');
});

socket.on('diceRollResult', onDiceRollResult);
socket.on('newCommand', handleNewCommand);
socket.on('sessionCreated', onSessionCreated);
socket.on('sessionEnded', onSessionEnded);
socket.on('sessionJoined', onSessionJoined);
socket.on('playerJoined', onPlayerJoined);
socket.on('playerLeft', onPlayerLeft);
socket.on('disconnect', onDisconnect);
socket.on('error', onPortalError);

/**
 * @param {{ message: string; } | undefined} [error]
 */
function onPortalError(error) {
	console.error('Error:', error?.message ?? 'unknown error');
	toast.push(error?.message ?? 'unknown error', {
		classes: ['error']
	});
}

/**
 * @param {import('socket.io-client').Socket.DisconnectReason} reason
 * @param {any | undefined} details
 */
function onDisconnect(reason, details) {
	if (details && details.context.type === 'close') {
		console.error('Connection closed', reason, details);
	} else {
		console.warn('Disconnected from the server');
	}
}
/**
 * @param {DC.PortalState} data
 */
function onSessionCreated(data) {
	console.log('You have created the session', data);
	sessionId.set(data.sessionId);
	sessionName.set(data.name);
	sessionPassword.set(data.password);
	players.set([]);
	player.set({ ...data.host });
	host.set({ ...data.host });
}

/**
 * @param {DC.PortalState} data
 */
function onSessionJoined(data) {
	console.log('You have joined the session', data);
	sessionId.set(data.sessionId);
	sessionName.set(data.name);
	players.set([...data.players]);
	player.set({ ...data.player });
	host.set({ ...data.host });
}
/**
 * @param {DC.PlayersUpdatedData} data
 */
function onPlayerLeft(data) {
	console.log('Player left', data);
	players.set([...data.players]);
}
/**
 * @param {DC.PlayersUpdatedData} data
 */
function onPlayerJoined(data) {
	console.log('Player joined', data);
	players.set([...data.players]);
}
/**
 * @param {DC.PortalSessionEndedData} data
 */
function onSessionEnded(data) {
	console.log('Session ended', data.sessionId);
	sessionId.set(null);
	sessionName.set(null);
}
