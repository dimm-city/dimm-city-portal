
import { env } from "$env/dynamic/public";
import { toast } from '@zerodevx/svelte-toast';
// eslint-disable-next-line no-unused-vars
import Editor, { SerializableCommand } from 'js-draw';
import { io } from 'socket.io-client';
import { derived, get, writable } from 'svelte/store';

import { getDiceThemes } from '../../routes/getDiceThemes.js';
import { getLocalValue, setLocalValue, showAlert } from '../components/StoreUtils.js';

export let showDiceConfig = writable(false);

/** @type {import("svelte/store").Writable<DiceTheme[]>} */
export const availableDiceThemes = writable([]);

/** @type{DiceTheme} */
const defaultDiceTheme = {
	foreground: '#ffffff',
	background: '#ef1ebf',
	material: 'glass',
	name: 'glass 01',
	texture: 'glass',
	description: '',
	size: 'medium'
};
/** @type {import("svelte/store").Writable<DiceTheme>} */
export let selectedDiceTheme = writable(getLocalValue('selectedDiceTheme') ?? defaultDiceTheme);
selectedDiceTheme.subscribe((value) => {
	setLocalValue('selectedDiceTheme', value);
});

export async function loadAvailableDiceThemes() {
	const themes = await getDiceThemes();
	availableDiceThemes.set(themes);
	if (!themes.some((t) => t.name === get(selectedDiceTheme).name)) {
		// if the current theme is not in the list, set it to the first one
		selectedDiceTheme.set(defaultDiceTheme);
	}
}

export let lastRoll = writable('awaiting roll');
export let lastRollNumber = writable(null);
export let diceNotation = writable('1d20');
export let diceModifier = writable('');
export let diceRollType = writable('success');

export const diceString = derived([diceModifier, diceRollType], ([modifier, diceType]) => {
	let output = '1d20';

	if (diceType === '') {
		output = '1d20';
	} else if (diceType === '2d20') {
		output = '2d20';
	} else {
		if (modifier === '') {
			output = `1d20{${diceType}}`;
		} else {
			output = `2d20{${diceType}}`;
		}
	}
	if (modifier !== '') {
		output += `{${modifier}}`;
	}
	return output;
});

/**
 * @type {import('svelte/store').Writable<import('$lib/components/DiceRoller.svelte').default>}
 */
export let roller = writable();
export let rolling = writable(false);

export let clearDiceDelay = writable(500);
export let showDiceResultToast = writable(true);

export async function rollDice() {
	console.log('rolling...');

	const rollerInstance = get(roller);

	if (get(rolling) || !rollerInstance) return;

	rollerInstance.clear();
	rolling.set(true);
	let theme = get(selectedDiceTheme);
	let notation = get(diceString);
	// let modifier = get(diceModifier);
	// let diceType = get(diceRollType);

	// if (diceType === '') {
	// 	notation = '1d20';
	// } else if (diceType === '2d20') {
	// 	notation = '2d20';
	// } else {
	// 	if (modifier === '') {
	// 		notation = `1d20{${diceType}}`;
	// 	} else {
	// 		notation = `2d20{${diceType}}`;
	// 	}
	// }
	// if (modifier !== '') {
	// 	notation += `{${modifier}}`;
	// }

	setTimeout(async () => {
		processDiceResult(notation, theme);
	}, 500);
}

/**
 * @param {string} diceString
 * @param {DiceTheme} theme
 */
export async function processDiceResult(diceString, theme) {
	rolling.set(true);
	const rollerInstance = get(roller);

	const result = await rollerInstance.roll(diceString, theme, -1);
	console.log('Result', result);

	let resultNumber = result.total ?? 0;
	let outcome = '';
	if (result.notation.includes('{l}')) {
		// @ts-ignore
		resultNumber = Math.max(...result.sets.flatMap((s) => s.rolls).map((r) => r.value));
	} else if (result.notation.includes('{s}')) {
		// @ts-ignore
		resultNumber = Math.min(...result.sets.flatMap((s) => s.rolls).map((r) => r.value));
	}

	console.log('calc output');

	if (result.notation.includes('{success}')) {
		if (resultNumber === 20) {
			outcome = 'lucid success';
			diceModifier.set('l');
		} else if (resultNumber >= 11 && resultNumber < 20) {
			outcome = 'success';
		} else if (resultNumber >= 6 && resultNumber < 11) {
			outcome = 'success with cost';
		} else if (resultNumber >= 2 && resultNumber < 6) {
			outcome = 'failure';
		} else if (resultNumber === 1) {
			outcome = 'surreal failure';
			diceModifier.set('s');
		}
	}

	let delay = get(clearDiceDelay);
	setTimeout(() => {
		lastRollNumber.set(resultNumber);
		lastRoll.set(`${outcome} (${resultNumber})`);
		rolling.set(false);
		if (get(showDiceResultToast))
			showAlert(`${outcome} (${resultNumber})`);
	}, delay);
}



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

export let inSession = derived([sessionId], ($sessionId) => {
	return $sessionId != null && $sessionId.toString() > '';
});

export const isHost = derived([sessionId, player, host], ([$sessionId, $player, $host]) => {
	return $sessionId && $player.id === $host?.id;
});

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
	console.log('Emitting createSession', sessionData);
	
	lastUpdateIndex.set(0);
	socket.emit('createSession', sessionData);
}

/**
 * @param {{ sessionId: string; password: string; player: any; }} sessionData
 */
export function handleJoinSession(sessionData) {
	lastUpdateIndex.set(0);
	socket.emit('joinSession', sessionData);
}

// Send a serialized command to the server
export function postSerializedCommand(/** @type {Record<string | symbol, any>} */ data) {
	const _player = get(player);
	const _sessionId = get(sessionId);

	socket.emit('postCommand', {
		clientId: _player.id,
		sessionId: _sessionId,
		data
	});
	console.log('Posted', JSON.stringify(data).length);
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
	console.log('Leaving session');

	socket.emit('leaveSession', { sessionId: get(sessionId), player: get(player) });
	players.set([]);
	sessionId.set(null);
	lastUpdateIndex.set(0);
}

export function endSession() {
	lastUpdateIndex.set(0);
	socket.emit('endSession', { sessionId });
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
	const _player = get(player);
	console.log('requestDiceRoll', expression, _player);

	if (!_player) return;
	socket.emit('requestDiceRoll', {
		sessionId: get(sessionId),
		diceExpression: expression,
		playerName: _player.name,
		diceTheme: get(selectedDiceTheme),
		diceId: _player.diceId
	});
}
/**
 * @param {{ result: any; diceTheme: any; }} data
 */
async function onDiceRollResult(data) {
	const { result, diceTheme } = data;
	await processDiceResult(result, diceTheme);
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
