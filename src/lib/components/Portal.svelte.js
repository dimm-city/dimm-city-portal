

/**
 * @type {import('$lib/types.js').PortalState}
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
      config: {
        assetPath: '/dice/',
        sounds: false,
        volume: 100,
        sound_dieMaterial: 'plastic',
        theme_customColorset: {
          name: 'pink',
          foreground: 'white',
          background: '#ef1ebf',
          texture: 'glass',
          description: 'Default pink dice',
          material: 'glass',
          scale: 0
        },
        theme_colorset: 'pink',
        baseScale: 110,
        strength: 1,
        onRollComplete: (/** @type {any} */ result) => {
          
          const e = new Event('rollCompleted', result);
          portal.ui.editorElement?.dispatchEvent(e);
        }
      }
    },
    plugins: [],
  },
  player: {
    id: '',
    name: '',
    isHost: false,
    availableSessions: [],
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
    log: [],
    chat:[]
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
