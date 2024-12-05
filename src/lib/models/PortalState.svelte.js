/**
 * @typedef {Object} DiceTheme
 * @property {string} foreground - The foreground color of the theme.
 * @property {string} background - The background color of the theme.
 * @property {string} material - The material type of the theme.
 * @property {string} name - The name of the theme.
 * @property {string} texture - The texture of the theme.
 * @property {string} description - The description of the theme.
 * @property {string} size - The size of the theme.
 */


/**
 * @typedef {Object} DiceType
 * @property {string} type - The dice type (e.g., '1d20').
 */

/**
 * @typedef {Object} Token
 * @property {string} id - The ID of the token.
 * @property {string} name - The name of the token.
 * @property {string} src - The source URL of the token image.
 */

/**
 * @typedef {Object} Chat
 * @property {*} [content] - The content of the chat message.
 */

/**
 * @typedef {Object} DiceRoll
 * @property {string} playerId - The ID of the player who rolled the dice.
 * @property {string} diceId - The ID of the dice roll, can be null.
 * @property {string} type - The type of dice rolled (e.g., '1d20').
 * @property {string} modifier - The modifier for the dice roll.
 * @property {number} result - The result of the dice roll.
 */

/**
 * @typedef {Object} Command
 * @property {*} [command] - The command executed in the session.
 */

/**
 * @typedef {Object} SessionDetails
 * @property {?number} id - The ID of the session, can be null.
 * @property {?string} name - The name of the session, can be null.
 * @property {string} password - The password for the session, initially an empty string.
 * @property {'password' | 'invited'} authenticationType  - The authentication type of the session.
 * @property {'create' | 'join' | 'active' | 'building' | 'start'} mode - The mode of the session.
 * @property {Player} host - The host player of the session.
 * @property {string[]} invitedPlayers - List of player IDs invited to the session.
 * @property {Player[]} activePlayers - List of player objects currently active in the session.
 * @property {boolean} allowViewers - Indicates whether viewers are allowed in the session.
 * @property {string} viewerUrl - URL to view the session in readonly mode.
 * @property {Viewer[]} viewers - List of active viewers.
 * @property {number} lastUpdateIndex - Index of the last update in the session log.
 * @property {Command[]} commands - List of commands executed in the session.
 * @property {DiceRoll[]} diceRolls - List of dice rolls in the session.
 * @property {Chat[]} log - Chat log of messages in the session.
 */

/**
 * @typedef {Object} Player
 * @property {string} id - The ID of the player.
 * @property {string} name - The name of the player.
 * @property {boolean} isHost - Indicates whether the player is the host.
 * @property {string} selectedDiceTheme - The selected dice theme for the player.
 * @property {string} diceNotation - The default dice notation for the player (e.g., '1d20').
 * @property {string} diceModifier - The default dice modifier for the player.
 * @property {string} diceRollType - The type of dice roll (e.g., 'success').
 * @property {DiceTheme[]} availableDiceThemes - An array of available dice themes for the player.
 * @property {Token[]} availableTokens - An array of available tokens for the player.
 * @property {Chat[]} chats - An array of chat messages for the player.
 */

/**
 * @typedef {Object} UiState
 * @property {HTMLElement | null} editorElement - An instance of the HTML element targeted by the Editor component.
 * @property {import("js-draw").Editor | null} editor - An instance of the Editor component. 
 * @property {null | any} diceBox - An instance of the DiceRoller component.
 * @property {boolean} rolling - Indicates whether dice are currently rolling.
 * @property {boolean} showSessionDetails - Indicates whether to show session details.
 * @property {boolean} showPlayerList - Indicates whether to show the player list.
 * @property {boolean} showPlayerSettings - Indicates whether to show player settings.
 * @property {boolean} showDiceConfig - Indicates whether to show dice configuration options.
 */

/**
 * @typedef {Object} Config
 * @property {{name: string, url: string, config: {path: string}}} selectedHub - The selected hub.
 * @property {{name: string, url: string, config: {path: string}}[]} availableHubs - An array of available hubs.
 * @property {SessionDetails[]} availableSessions - An array of available session details.
 * @property {DefaultScene} defaultScene - Details about the default scene.
 * @property {DiceConfig} dice - Configuration options for dice.
 * @property {import('@zerodevx/svelte-toast').SvelteToastOptions} toast - Configuration options for the toast alerts.
 * @property {Plugin[]} plugins - An array of plugins.
 */

/**
 * @typedef {Object} DefaultScene
 * @property {string} backgroundUrl - The URL of the background image for the default scene.
 */

/**
 * @typedef {Object} DiceConfig
 * @property {number} clearDiceDelay - The delay before clearing dice results, in milliseconds.
 * @property {boolean} showDiceResultToast - Indicates whether to show a toast notification with the dice result.
 * @property {DiceType[]} availableDiceTypes - An array of available dice types.
 * @property {DiceTheme[]} availableThemes - An array of available themes for dice.
 */

/**
 * @typedef {*} Plugin
 */

/**
 * @typedef {Object} PortalState
 * @property {Config} config - Configuration options for the portal state.
 * @property {Player} player - Details about the current player.
 * @property {SessionDetails} session - Details about the session.
 * @property {UiState} ui - The UI state.
 * @property {@import('socket-io.client').Socket} socket - The WebSocket instance.
 */



/**
 * @type {PortalState}
 */
export const portal = $state({
  config: {
    selectedHub: {
      name: 'local',
      url: 'http://localhost:5173',
      config: { path: '/portal-hub' }
    },
    availableHubs: [{
      name: 'local',
      url: 'http://localhost:5173',
      config: { path: '/portal-hub' }
    }],
    availableSessions: [],
    defaultScene: {
      backgroundUrl: '/assets/dc-banner-yellow.png',
    },
    toast: {
      classes: ['alert']
    },
    dice: {
      clearDiceDelay: 500,
      showDiceResultToast: true,
      availableDiceTypes: ['1d20'],
      availableThemes: [{
        foreground: '#ffffff',
        background: '#ef1ebf',
        material: 'glass',
        name: 'default',
        texture: 'glass',
        description: '',
        size: 'medium'
      }],
    },
    plugins: [],
  },
  player: {
    id: '',
    name: '',
    isHost: false,
    selectedDiceTheme: 'default',
    diceNotation: '1d20',
    diceModifier: '',
    diceRollType: 'success',
    availableDiceThemes: [],
    availableTokens: [{
      id: '',
      name: '',
      src: ''
    }], //list of token objects
    chats: []
  },
  session: {
    id: null,
    name: null,
    password: '',
    mode: 'create', //could also be 'join', 'active', 'building', or 'start'
    host: {}, //player object
    invitedPlayers: [], //list of player ids
    activePlayers: [], //list of player objects
    lastUpdateIndex: 0,
    commands: [],
    diceRolls: [{
      playerId: '',
      diceId: null,
      type: '1d20',
      modifier: '',
      result: 0,
    }],
    log: []
  },
  ui: {
    editor: null, // an inistance of the Editor component
    editorElement: null, //HTMLElement that hosts the editor
    diceBox: null, //an instance of the DiceRoller component
    rolling: false, //remove this from global state?
    showSessionDetails: false,
    showPlayerList: false,
    showPlayerSettings: false,
    showDiceConfig: false
  },
});
