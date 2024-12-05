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