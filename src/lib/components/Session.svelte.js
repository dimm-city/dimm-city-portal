
import { portal } from './Portal.svelte.js';
import { io } from 'socket.io-client';
import { SerializableCommand } from 'js-draw';
import { showAlert, showError } from '$lib/components/StoreUtils.js';

let initialized = false;
export function init() {
  if (!initialized) {
    portal.socket = io(portal.config.selectedHub.url, portal.config.selectedHub.config);
    portal.socket.on('connect', onConnect);
    portal.socket.on('diceRollResult', onDiceRollResult);
    portal.socket.on('disconnect', onDisconnect);
    portal.socket.on('newCommand', onNewCommand);
    portal.socket.on('sessionCreated', onSessionCreated);
    portal.socket.on('sessionJoined', onSessionJoined);
    portal.socket.on('playerJoined', onPlayerJoined);
    portal.socket.on('playerLeft', onPlayerLeft);
    portal.socket.on('sessionEnded', onSessionEnded);
    portal.socket.on('error', onPortalError);
    initialized = true;
  }
  return initialized;
}

function onConnect() {
  console.log('Connected to the hub');
}

export function handleCreateSession(sessionData) {
  console.log('Emitting createSession', sessionData);
  portal.session.lastUpdateIndex = 0;
  portal.socket.emit('createSession', sessionData);
}

/**
 * @param {DC.PortalState} data
 */
function onSessionCreated(data) {
  console.log('You have created the session', data);
  portal.session.mode = 'active';
  portal.session.id = data.sessionId;
  portal.session.name = data.name;
  portal.session.password = data.password;
  portal.session.activePlayers = [data.host];
  portal.player = data.host;
  portal.player.isHost = true;
  portal.session.host = data.host;
}

export function handleJoinSession(sessionData) {
  portal.session.lastUpdateIndex = 0;
  portal.socket.emit('joinSession', sessionData);
}
/**
 * @param {import('$lib/types.js').DC.PortalState} data
 */
function onSessionJoined(data) {
  console.log('You have joined the session', data);
  portal.session.mode = 'active';
  portal.session.id = data.sessionId;
  portal.session.name = data.name;
  portal.session.host = data.host;
  portal.player.isHost = false;
  portal.session.activePlayers.push(data.player);
}

/**
 * @param {import('$lib/types.js').DC.PlayersUpdatedData} data
 */
function onPlayerJoined(data) {
  console.log('Player joined', data);
  portal.session.activePlayers = [...data.players];
}


export function copySessionUrl() {
  const sessionUrl = `${window.location.href.split('?')[0]}?mode=join&session=${portal.session.id}`;
  navigator.clipboard.writeText(sessionUrl).then(
    () => {
      showAlert(`Send this URL to the player(s) you would like to invite: ${sessionUrl}`);
    },
    () => {
      showError('Failed to copy session URL');
    }
  );
}
// Send a serialized command to the server
export function postSerializedCommand(/** @type {Record<string | symbol, any>} */ data) {
  portal.socket.emit('postCommand', {
    clientId: portal.player.id,
    sessionId: portal.session.id,
    data
  });
  console.log('Posted', JSON.stringify(data).length);
}

// Request commands since a specific ID
export function fetchUpdates(/** @type {number|null} */ lastIndex = null) {
  portal.socket.emit(
    'commandsSince',
    portal.session.id,
    lastIndex ?? portal.session.lastUpdateIndex,
    (/** @type {{ commands: DC.PortalEditorCommand[]; }} */ response) => {
      if (response && response.commands) {
        response.commands.forEach((commandJSON) => {
          onNewCommand(commandJSON);
        });
        portal.session.lastUpdateIndex = (
          response.commands
            .map((c) => c.id)
            .sort((a, b) => a - b)
            .at(0) ?? 0
        );
      }
    }
  );
}

/**
 * Called when the editor is updated by the server
* @param {import('$lib/types.js').DC.PortalEditorCommand} command  
 * @returns 
 */
function onNewCommand(command) {

  if (!portal.ui.editor) {
    console.error('No editor found');
    return;
  }
  if (command.data.clientId === portal.player.id) {
    console.log('Ignoring own command');
    return;
  }

  try {
    const deserializedCommand = SerializableCommand.deserialize(command.data.data, portal.ui.editor);
    console.log('Applying', deserializedCommand);
    deserializedCommand.apply(portal.ui.editor);
    portal.session.lastUpdateIndex = command.id;
    portal.session.commands.push(command.data.data);
  } catch (e) {
    console.warn('Error parsing command', e);
  }
}


export function requestDiceRoll(expression = '1d20') {
  console.log('Requesting dice roll', expression, portal.player);

  if (!portal.player) return;
  portal.socket.emit('requestDiceRoll', {
    sessionId: portal.session.id,
    diceExpression: expression,
    playerName: portal.player.name,
    diceTheme: portal.player.selectedDiceTheme,
    diceId: portal.player.diceId, //HACK: ensure diceIds allow for rerolls
  });
}

/**
 * @param {{ result: any; diceTheme: any; }} data
 */
async function onDiceRollResult(data) {
  const { result, diceTheme } = data;
  await processDiceResult(result, diceTheme);
}
/**
 * @param {string} diceString
 * @param {import('$lib/types.js').DiceTheme} theme
 */
async function processDiceResult(diceString, theme) {
  portal.ui.rolling = true;

  const result = await portal.ui.diceBox.roll(diceString, theme, -1);
  console.log('Result', result);

  //TODO: abstract this out to dice config to allow for custom dice roll mechanics
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

  let delay = portal.config.dice.clearDiceDelay;
  setTimeout(() => {
    //TODO: refine this and ensure that it supports rerolls and multiple dice in a roll
    portal.session.diceRolls.push({
      playerId: portal.player.id,
      diceId: '',
      type: '',
      modifer: '',
      result: resultNumber,
      diceExpression: diceString,
      theme: portal.player.selectedDiceTheme,
      outcome
    });
    portal.ui.rolling = false;
    if (portal.config.dice.showDiceResultToast)
      showAlert(`${outcome} (${resultNumber})`);
  }, delay);
}


export function leaveSession() {
  console.log('Leaving session');
  portal.socket.emit('leaveSession', { sessionId: portal.session.id, player: portal.player });
  portal.session.players = [];
  portal.session.id = null;
  portal.session.mode = 'join';
  portal.session.lastUpdateIndex = 0;
}

/**
 * @param {import('$lib/types.js').DC.PlayersUpdatedData} data
 */
function onPlayerLeft(data) {
  console.log('Player left', data);
  portal.session.activePlayers = [...data.players];
}

export function endSession() {
  portal.session.lastUpdateIndex = 0;
  portal.socket.emit('endSession', { sessionId: portal.session.id });
}

/**
 * @param {import('$lib/types.js').DC.PortalSessionEndedData} data
 */
function onSessionEnded(data) {
  console.log('Session ended', data.sessionId);
  portal.session.id = null;
  portal.session.name = null;
  portal.session.mode = 'create';
}

/**
 * @param {import('socket.io-client').Socket.DisconnectReason} reason
 * @param {any | undefined} details
 */
function onDisconnect(reason, details) {
  if (details && details.context.type === 'close') {
    console.error('Connection closed', reason, details);
  } else {
    console.warn('Disconnected from the hub');
  }
}





/**
 * @param {{ message: string; } | undefined} [error]
 */
function onPortalError(error) {
  console.error('Error:', error?.message ?? 'unknown error');
  showError(error?.message ?? 'Unknown portal error');
}



