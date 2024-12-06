// /**
//  * Represents the configuration for a dice theme.
//  * @typedef {Object} DiceThemeConfig
//  * @property {string} name - The name of the dice theme.
//  * @property {string} foreground - The color or identifier for the foreground of the dice.
//  * @property {string} background - The color or identifier for the background of the dice.
//  * @property {string} texture - The texture type for the dice.
//  * @property {string} description - A description of the dice theme.
//  * @property {string} material - The material type for the dice.
//  */

// /**
//  * Represents a character in the game.
//  * @typedef {Object} Character
//  * @property {string} name - The name of the character.
//  * @property {number} id - A unique identifier for the character.
//  * @property {string} src - The source URL or path to the character's image or avatar.
//  */

// /**
//  * Represents a token in the game, typically associated with a player or character.
//  * @typedef {Object} Token
//  * @property {string} type - The type of token (e.g., 'icon', 'image').
//  * @property {string} name - The name or identifier of the token.
//  * @property {number} id - A unique identifier for the token.
//  * @property {string} src - The source URL or path to the token's image.
//  */

// /**
//  * Represents a player in the game.
//  * @typedef {Object} Player
//  * @property {string} name - The name of the player.
//  * @property {Array<number>} diceId - An array containing the IDs of the player's dice.
//  * @property {string} diceTheme - The selected dice theme for the player.
//  * @property {DiceThemeConfig} diceThemeConfig - The configuration object for the selected dice theme.
//  * @property {Array<DiceThemeConfig>} diceThemes - An array containing available dice themes that the player can select from.
//  * @property {Array<Character>} characters - An array containing character objects associated with the player.
//  * @property {Token} token - The token object representing the player's avatar or image in the game.
//  * @property {boolean} host - A boolean value indicating whether the player is the session host.
//  */

// /**
//  * Represents the configuration for a portal hub, including the URL and available dice options and themes.
//  * @typedef {Object} PortalConfig
//  * @property {string} hubUrl - The URL of the portal hub server.
//  * @property {boolean} allowHubSwitching - A boolean value indicating whether the player can switch between hubs.
//  * @property {Array<{ label: string; value: string }>} diceOptions - An array containing objects representing available dice options, each with a 'label' and a 'value'.
//  * @property {Array<DiceThemeConfig>} diceThemes - An array containing configuration objects for available dice themes.
//  */

// /**
//  * Represents the configuration for a game session, including the session ID, name, and player data.
//  * @typedef {Object} SessionConfig
//  * @property {number | null} sessionId - A unique identifier for the session, or null if not in a session.
//  * @property {string} sessionName - The name of the game session.
//  * @property {Player} player - The configuration object representing the current player.
//  */
