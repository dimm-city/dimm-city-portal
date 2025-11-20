/**
 * FogOfWarStore - Svelte store for fog of war state management
 *
 * Manages fog data, mode, and synchronization with WebSocket server.
 * Provides reactive stores for fog paths, visibility, and drawing mode.
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { socket, sessionId } from '../components/PortalStore.js';

/**
 * Fog data structure
 * @typedef {{
 *   paths: Array<{points: Array<{x: number, y: number}>, operation: 'add'|'subtract', timestamp: number}>,
 *   visibility: boolean,
 *   brushSize: number
 * }} FogData
 */

/**
 * Main fog data store
 * @type {import('svelte/store').Writable<FogData>}
 */
export const fogData = writable({
	paths: [],
	visibility: true,
	brushSize: 50
});

/**
 * Current fog mode: 'paint', 'erase', or null
 * @type {import('svelte/store').Writable<'paint'|'erase'|null>}
 */
export const fogMode = writable(null);

/**
 * Brush size for fog painting/erasing
 * @type {import('svelte/store').Writable<number>}
 */
export const fogBrushSize = writable(50);

/**
 * Fog visibility toggle (DM only)
 * @type {import('svelte/store').Writable<boolean>}
 */
export const fogVisibility = writable(true);

/**
 * Whether fog toolbar is expanded
 * @type {import('svelte/store').Writable<boolean>}
 */
export const fogToolbarExpanded = writable(false);

/**
 * Derived store - is fog mode active?
 * @type {import('svelte/store').Readable<boolean>}
 */
export const fogModeActive = derived(
	fogMode,
	($fogMode) => $fogMode !== null
);

/**
 * Derived store - fog statistics
 * @type {import('svelte/store').Readable<{pathCount: number, totalPoints: number}>}
 */
export const fogStats = derived(
	fogData,
	($fogData) => {
		const totalPoints = $fogData.paths.reduce(
			(sum, path) => sum + path.points.length,
			0
		);
		return {
			pathCount: $fogData.paths.length,
			totalPoints
		};
	}
);

/**
 * Add a fog path
 * @param {{points: Array<{x: number, y: number}>, operation: 'add'|'subtract'}} path
 */
export function addFogPath(path) {
	fogData.update((data) => {
		const newData = {
			...data,
			paths: [...data.paths, { ...path, timestamp: Date.now() }]
		};

		// Sync to server
		syncFogToServer(newData);

		return newData;
	});
}

/**
 * Remove the last fog path (undo)
 */
export function undoLastFogPath() {
	fogData.update((data) => {
		if (data.paths.length === 0) return data;
		return {
			...data,
			paths: data.paths.slice(0, -1)
		};
	});
}

/**
 * Clear all fog paths
 */
export function clearAllFog() {
	const currentSessionId = get(sessionId);
	if (currentSessionId && socket) {
		socket.emit('clearFog', { sessionId: currentSessionId });
	}

	fogData.update((data) => ({
		...data,
		paths: []
	}));
}

/**
 * Set fog visibility (DM only)
 * @param {boolean} visible
 */
export function setFogVisibility(visible) {
	fogData.update((data) => ({
		...data,
		visibility: visible
	}));
	fogVisibility.set(visible);
}

/**
 * Toggle fog visibility (DM only)
 */
export function toggleFogVisibility() {
	const current = get(fogData).visibility;
	const newVisibility = !current;

	// Sync to server
	const currentSessionId = get(sessionId);
	if (currentSessionId && socket) {
		socket.emit('toggleFogVisibility', {
			sessionId: currentSessionId,
			visibility: newVisibility
		});
	}

	setFogVisibility(newVisibility);
}

/**
 * Set brush size
 * @param {number} size
 */
export function setFogBrushSize(size) {
	const clampedSize = Math.max(10, Math.min(200, size));
	fogBrushSize.set(clampedSize);
	fogData.update((data) => ({
		...data,
		brushSize: clampedSize
	}));
}

/**
 * Set fog mode (paint/erase/null)
 * @param {'paint'|'erase'|null} mode
 */
export function setFogMode(mode) {
	fogMode.set(mode);
}

/**
 * Toggle fog mode between paint and null
 */
export function togglePaintMode() {
	const current = get(fogMode);
	fogMode.set(current === 'paint' ? null : 'paint');
}

/**
 * Toggle fog mode between erase and null
 */
export function toggleEraseMode() {
	const current = get(fogMode);
	fogMode.set(current === 'erase' ? null : 'erase');
}

/**
 * Load fog data from server/saved state
 * @param {FogData} data
 */
export function loadFogData(data) {
	if (!data) return;

	fogData.set({
		paths: data.paths || [],
		visibility: data.visibility !== false,
		brushSize: data.brushSize || 50
	});

	fogVisibility.set(data.visibility !== false);
	fogBrushSize.set(data.brushSize || 50);
}

/**
 * Serialize fog data for saving/transmission
 * @returns {FogData}
 */
export function serializeFogData() {
	return get(fogData);
}

/**
 * Reset fog store to initial state
 */
export function resetFogStore() {
	fogData.set({
		paths: [],
		visibility: true,
		brushSize: 50
	});
	fogMode.set(null);
	fogBrushSize.set(50);
	fogVisibility.set(true);
	fogToolbarExpanded.set(false);
}

/**
 * Get fog data snapshot (non-reactive)
 * @returns {FogData}
 */
export function getFogDataSnapshot() {
	return get(fogData);
}

/**
 * Check if fog has any paths
 * @returns {boolean}
 */
export function hasFogPaths() {
	return get(fogData).paths.length > 0;
}

/**
 * Sync fog data to server via WebSocket
 * @param {FogData} data
 */
function syncFogToServer(data) {
	const currentSessionId = get(sessionId);
	if (currentSessionId && socket) {
		socket.emit('updateFog', {
			sessionId: currentSessionId,
			fogData: data
		});
	}
}

// Sync fog brush size changes with fog data
if (browser) {
	fogBrushSize.subscribe((size) => {
		fogData.update((data) => ({
			...data,
			brushSize: size
		}));
	});

	fogVisibility.subscribe((visible) => {
		fogData.update((data) => ({
			...data,
			visibility: visible
		}));
	});

	// Listen for fog updates from server
	if (socket) {
		socket.on('fogUpdated', (data) => {
			if (data.fogData) {
				loadFogData(data.fogData);
			}
		});
	}
}
