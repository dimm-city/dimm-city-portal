import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * Keyboard shortcuts configuration
 * Each shortcut has: key, description, handler, and optional modifiers
 */
export const shortcuts = {
	// Editor tools
	HAND_TOOL: {
		key: ' ', // Space
		name: 'Hand Tool',
		description: 'Pan around the canvas',
		category: 'Tools'
	},
	SELECT_TOOL: {
		key: 'v',
		name: 'Select Tool',
		description: 'Select and move objects',
		category: 'Tools'
	},
	DRAW_TOOL: {
		key: 'd',
		name: 'Draw Tool',
		description: 'Draw freehand',
		category: 'Tools'
	},
	ERASE_TOOL: {
		key: 'e',
		name: 'Eraser',
		description: 'Erase objects',
		category: 'Tools'
	},
	TEXT_TOOL: {
		key: 't',
		name: 'Text Tool',
		description: 'Add text',
		category: 'Tools'
	},

	// Actions
	SAVE: {
		key: 's',
		ctrl: true,
		name: 'Save Scene',
		description: 'Save current scene',
		category: 'Actions'
	},
	UNDO: {
		key: 'z',
		ctrl: true,
		name: 'Undo',
		description: 'Undo last action',
		category: 'Actions'
	},
	REDO: {
		key: 'y',
		ctrl: true,
		name: 'Redo',
		description: 'Redo last undone action',
		category: 'Actions'
	},
	DELETE: {
		key: 'Delete',
		name: 'Delete',
		description: 'Delete selected objects',
		category: 'Actions'
	},
	BACKSPACE: {
		key: 'Backspace',
		name: 'Delete',
		description: 'Delete selected objects',
		category: 'Actions'
	},

	// UI
	HELP: {
		key: '?',
		shift: true, // ? requires shift
		name: 'User Guide',
		description: 'Open user guide and documentation',
		category: 'UI'
	},
	MAPS: {
		key: 'm',
		ctrl: true,
		name: 'Maps Browser',
		description: 'Open maps browser',
		category: 'UI'
	},

	// Fog of War (DM only)
	FOG_PAINT: {
		key: 'f',
		name: 'Fog Paint Mode',
		description: 'Toggle fog painting mode (DM only)',
		category: 'Tools'
	},
	FOG_ERASE: {
		key: 'r',
		name: 'Fog Reveal Mode',
		description: 'Toggle fog revealing mode (DM only)',
		category: 'Tools'
	},
	FOG_TOGGLE: {
		key: 'h',
		ctrl: true,
		name: 'Toggle Fog Visibility',
		description: 'Show/hide all fog (DM only)',
		category: 'Actions'
	}
};

/**
 * Format shortcut for display
 * @param {Object} shortcut - Shortcut configuration
 * @returns {string} Formatted shortcut string
 */
export function formatShortcut(shortcut) {
	const parts = [];

	if (shortcut.ctrl) parts.push('Ctrl');
	if (shortcut.alt) parts.push('Alt');
	if (shortcut.shift && shortcut.key !== '?') parts.push('Shift');

	// Special key names
	const keyName = shortcut.key === ' ' ? 'Space' : shortcut.key;
	parts.push(keyName);

	return parts.join(' + ');
}

/**
 * Check if a keyboard event matches a shortcut
 * @param {KeyboardEvent} event
 * @param {Object} shortcut
 * @returns {boolean}
 */
export function matchesShortcut(event, shortcut) {
	// Check modifiers
	if (shortcut.ctrl && !event.ctrlKey && !event.metaKey) return false;
	if (!shortcut.ctrl && (event.ctrlKey || event.metaKey)) return false;

	if (shortcut.alt && !event.altKey) return false;
	if (!shortcut.alt && event.altKey) return false;

	if (shortcut.shift && !event.shiftKey) return false;

	// Check key (case insensitive for letters)
	const eventKey = event.key.toLowerCase();
	const shortcutKey = shortcut.key.toLowerCase();

	return eventKey === shortcutKey;
}

/**
 * Create keyboard shortcuts store
 */
function createKeyboardShortcutsStore() {
	const { subscribe, set, update } = writable({
		enabled: true,
		handlers: {},
		showHelp: false
	});

	return {
		subscribe,

		/**
		 * Register a handler for a shortcut
		 * @param {string} shortcutId - ID from shortcuts object
		 * @param {Function} handler - Handler function
		 */
		register(shortcutId, handler) {
			update(state => ({
				...state,
				handlers: {
					...state.handlers,
					[shortcutId]: handler
				}
			}));
		},

		/**
		 * Unregister a handler
		 * @param {string} shortcutId
		 */
		unregister(shortcutId) {
			update(state => {
				const { [shortcutId]: removed, ...rest } = state.handlers;
				return {
					...state,
					handlers: rest
				};
			});
		},

		/**
		 * Handle keyboard event
		 * @param {KeyboardEvent} event
		 * @returns {boolean} True if event was handled
		 */
		handleKeydown(event) {
			let currentState;
			subscribe(s => { currentState = s; })();

			if (!currentState.enabled) return false;

			// Don't handle shortcuts when typing in inputs
			const target = event.target;
			if (target && (
				target.tagName === 'INPUT' ||
				target.tagName === 'TEXTAREA' ||
				target.isContentEditable
			)) {
				// Allow Ctrl+S even in inputs
				if (event.ctrlKey && event.key === 's') {
					// Let it through
				} else {
					return false;
				}
			}

			// Check each shortcut
			for (const [id, shortcut] of Object.entries(shortcuts)) {
				if (matchesShortcut(event, shortcut)) {
					const handler = currentState.handlers[id];
					if (handler) {
						event.preventDefault();
						event.stopPropagation();
						handler(event);
						return true;
					}
				}
			}

			return false;
		},

		/**
		 * Enable/disable shortcuts
		 * @param {boolean} enabled
		 */
		setEnabled(enabled) {
			update(state => ({ ...state, enabled }));
		},

		/**
		 * Show/hide help dialog
		 * @param {boolean} show
		 */
		setShowHelp(show) {
			update(state => ({ ...state, showHelp: show }));
		},

		/**
		 * Toggle help dialog
		 */
		toggleHelp() {
			update(state => ({ ...state, showHelp: !state.showHelp }));
		}
	};
}

export const keyboardShortcuts = createKeyboardShortcutsStore();

/**
 * Install global keyboard event listener
 * Should be called once in app initialization
 */
export function installKeyboardShortcuts() {
	if (!browser) return;

	const handleKeydown = (event) => {
		keyboardShortcuts.handleKeydown(event);
	};

	window.addEventListener('keydown', handleKeydown);

	// Return cleanup function
	return () => {
		window.removeEventListener('keydown', handleKeydown);
	};
}
