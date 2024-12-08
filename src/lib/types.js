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
 * @property {Chat[]} log - Session log.
 * @property {Chat[]} chat - Chat log of messages in the session.
 */

/**
 * @typedef {Object} Player
 * @property {string} id - The ID of the player.
 * @property {string} name - The name of the player.
 * @property {boolean} isHost - Indicates whether the player is the host.
 * @property {DiceTheme} selectedDiceTheme - The selected dice theme for the player.
 * @property {string} diceNotation - The default dice notation for the player (e.g., '1d20').
 * @property {string} diceModifier - The default dice modifier for the player.
 * @property {string} diceRollType - The type of dice roll (e.g., 'success').
 * @property {DiceTheme[]} availableDiceThemes - An array of available dice themes for the player.
 * @property {Token[]} availableTokens - An array of available tokens for the player.
 * @property {Chat[]} chats - An array of chat messages for the player.
 * @property {SessionDetails[]} availableSessions - An array of available session details.
 */

/**
 * @typedef {Object} UiState
 * @property {HTMLElement | null} editorElement - An instance of the HTML element targeted by the Editor component.
 * @property {import("js-draw").Editor | null} editor - An instance of the Editor component. 
 * @property {import("@3d-dice/dice-box-threejs").default} diceBox - An instance of the DiceRoller component.
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
 * @property {DiceBoxConfig} config - Configuration options for the dice box.
 */

/**
 * @typedef {Object} ThemeCustomColorset
 * @property {string} name - The name of the theme.
 * @property {string} foreground - The foreground color of the theme.
 * @property {string} background - The background color of the theme in hex format.
 * @property {string} texture - The texture type of the theme.
 * @property {string} description - A description of the theme.
 * @property {string} material - The material type of the theme.
 * @property {number} scale - The scale factor for the theme.
 */

/**
 * @typedef {Object} DiceBoxConfig
 * @property {string} assetPath - The path to the dice assets.
 * @property {boolean} sounds - Whether sounds are enabled or not.
 * @property {number} volume - The volume level of the sounds (0-100).
 * @property {string} sound_dieMaterial - The material type for die sounds.
 * @property {ThemeCustomColorset} theme_customColorset - Custom color set details for the theme.
 * @property {string} theme_colorset - The name of the color set theme.
 * @property {number} baseScale - The base scale factor for the dice.
 * @property {number} strength - The strength of the dice roll (likely a multiplier).
 * @property {function(any): void} onRollComplete - Callback function to be called when the roll is complete.
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
 * @namespace DC
 */


/**
 * @typedef {Object} DC.PortalToken
 * @property {string} name - The name of the token.
 * @property {string} type - The type of the token.
 * @property {Boolean} playerToken - Does this token represent a player.
 * @property {string|number} id - The ID of the token.
 * @property {number} [x] - The x position of the token.
 * @property {number} [y] - The y position of the token.
 * @property {number} [size] - The size modifier of the token.
 * @property {string} src - The source of the token image.
 */

/**
 * @typedef {Object} DC.PortalPlayer
 * @property {string} id - The id of the player. Should be set by socket.io server.
 * @property {string} name - The name of the dice object.
 * @property {string} diceTheme - The theme of the dice.
 * @property {DC.DiceColorSet} diceThemeConfig - The configuration of the dice theme.
 * @property {Array<number>} diceId - An array containing the ID of the dice.
 * @property {DC.PortalToken | null} token - The token associated with the dice object.
 * @property {boolean} host - A boolean indicating whether the user is the host or not.
 */

/**
 * @typedef {Object} DC.PortalDreamMaster
 * @property {string} id - The id of the player. Should be set by socket.io server.
 * @property {string} name - The name of the dice object.
 * @property {string} diceTheme - The theme of the dice.
 * @property {DC.DiceColorSet} diceThemeConfig - The configuration of the dice theme.
 * @property {Array<number>} diceId - An array containing the ID of the dice.
 */


/**
 * Represents the state of a portal session.
 * @typedef {Object} DC.PortalState
 * @property {string} sessionId - The unique identifier for the session.
 * @property {string} name - The name of the session.
 * @property {string} password - The password for the session.
 * @property {DC.PortalPlayer[]} players - Additional data related to the player.
 * @property {DC.PortalPlayer} player - Current player.
 * @property {DC.PortalPlayer} host - Additional data related to the host.
 */

/**
 * @typedef {object} DC.PortalEditorCommand
 * @property {object} data - The command data.
 * @property {string} data.sessionId - The session ID.
 * @property {string} data.clientId - The client ID.
 * @property {(string | Record<string, any>)} data.data - Additional data for the command, either as a string or an object.
 * @property {number} id - The command ID.
 */

/**
 * Represents the data structure for a session in the portal server.
 * @typedef {Object} DC.PlayersUpdatedData
 * @property {string} sessionId - The unique identifier for the session.
 * @property {DC.PortalPlayer[]} players - An object containing players and tokens of the session.
 */

/**
 * Represents the data passed when a portal session ends.
 * @typedef {Object} DC.PortalSessionEndedData
 * @property {string} sessionId - The unique identifier for the session.
 * 
 * */