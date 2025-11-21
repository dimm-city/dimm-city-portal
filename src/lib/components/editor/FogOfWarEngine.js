/**
 * FogOfWarEngine - Canvas-based fog of war rendering engine
 *
 * Renders fog of war on a separate HTML5 canvas layer above the js-draw editor.
 * Supports paint mode (add fog), erase mode (reveal areas), and role-based opacity.
 *
 * Architecture:
 * - DM sees semi-transparent fog (50% opacity) and can edit
 * - Players see opaque fog (100% opacity) and cannot edit
 * - All fog data synced via WebSocket to ensure consistency
 */

export class FogOfWarEngine {
	/**
	 * @param {HTMLCanvasElement} canvas - The fog canvas element
	 * @param {boolean} isDM - Whether the current user is the Dream Master
	 */
	constructor(canvas, isDM = false) {
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d', { alpha: true });
		this.isDM = isDM;

		// Fog state
		this.fogPaths = []; // Array of {points: [{x, y}], operation: 'add'|'subtract'}
		this.mode = null; // 'paint' | 'erase' | null
		this.brushSize = 50;
		this.visibility = true;

		// Drawing state
		this.isDrawing = false;
		this.currentPath = [];

		// Transform state (synced with js-draw viewport)
		this.transform = {
			scale: 1,
			translateX: 0,
			translateY: 0
		};
	}

	/**
	 * Set the fog mode (paint or erase)
	 * @param {'paint'|'erase'|null} mode
	 */
	setMode(mode) {
		this.mode = mode;
	}

	/**
	 * Set brush size for painting/erasing
	 * @param {number} size
	 */
	setBrushSize(size) {
		this.brushSize = Math.max(10, Math.min(200, size));
	}

	/**
	 * Set fog visibility (DM only)
	 * @param {boolean} visible
	 */
	setVisibility(visible) {
		this.visibility = visible;
		this.render();
	}

	/**
	 * Update transform to match js-draw viewport
	 * @param {{scale: number, translateX: number, translateY: number}} transform
	 */
	setTransform(transform) {
		this.transform = transform;
		this.render();
	}

	/**
	 * Start drawing a fog path
	 * @param {{x: number, y: number}} point - Canvas coordinates
	 */
	startDrawing(point) {
		if (!this.isDM || !this.mode) return;

		this.isDrawing = true;
		this.currentPath = [this.screenToWorld(point)];
	}

	/**
	 * Continue drawing a fog path
	 * @param {{x: number, y: number}} point - Canvas coordinates
	 */
	continueDrawing(point) {
		if (!this.isDrawing || !this.isDM || !this.mode) return;

		const worldPoint = this.screenToWorld(point);
		this.currentPath.push(worldPoint);

		// Live preview while drawing
		this.render();
		this.drawCurrentPath();
	}

	/**
	 * Finish drawing a fog path
	 * @returns {{points: Array, operation: string} | null} The completed fog path or null
	 */
	finishDrawing() {
		if (!this.isDrawing || !this.isDM || !this.mode) return null;

		this.isDrawing = false;

		if (this.currentPath.length < 2) {
			this.currentPath = [];
			return null;
		}

		const fogPath = {
			points: [...this.currentPath],
			operation: this.mode === 'paint' ? 'add' : 'subtract',
			timestamp: Date.now()
		};

		this.fogPaths.push(fogPath);
		this.currentPath = [];
		this.render();

		return fogPath;
	}

	/**
	 * Convert screen coordinates to world coordinates
	 * @param {{x: number, y: number}} screenPoint
	 * @returns {{x: number, y: number}} World coordinates
	 */
	screenToWorld(screenPoint) {
		return {
			x: (screenPoint.x - this.transform.translateX) / this.transform.scale,
			y: (screenPoint.y - this.transform.translateY) / this.transform.scale
		};
	}

	/**
	 * Convert world coordinates to screen coordinates
	 * @param {{x: number, y: number}} worldPoint
	 * @returns {{x: number, y: number}} Screen coordinates
	 */
	worldToScreen(worldPoint) {
		return {
			x: worldPoint.x * this.transform.scale + this.transform.translateX,
			y: worldPoint.y * this.transform.scale + this.transform.translateY
		};
	}

	/**
	 * Draw the current path being created (live preview)
	 */
	drawCurrentPath() {
		if (this.currentPath.length < 2) return;

		const opacity = this.isDM ? 0.5 : 1.0;
		this.ctx.save();

		if (this.mode === 'erase') {
			this.ctx.globalCompositeOperation = 'destination-out';
			this.ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
		} else {
			this.ctx.globalCompositeOperation = 'source-over';
			this.ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
		}

		this.ctx.lineWidth = this.brushSize;
		this.ctx.lineCap = 'round';
		this.ctx.lineJoin = 'round';

		this.ctx.beginPath();
		const startScreen = this.worldToScreen(this.currentPath[0]);
		this.ctx.moveTo(startScreen.x, startScreen.y);

		for (let i = 1; i < this.currentPath.length; i++) {
			const pointScreen = this.worldToScreen(this.currentPath[i]);
			this.ctx.lineTo(pointScreen.x, pointScreen.y);
		}

		this.ctx.stroke();
		this.ctx.restore();
	}

	/**
	 * Render all fog paths to the canvas
	 */
	render() {
		// Clear canvas
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		if (!this.visibility || this.fogPaths.length === 0) {
			return;
		}

		const opacity = this.isDM ? 0.5 : 1.0;

		// Render each fog path
		for (const fogPath of this.fogPaths) {
			if (fogPath.points.length < 2) continue;

			this.ctx.save();

			if (fogPath.operation === 'subtract') {
				// Erase mode - remove fog
				this.ctx.globalCompositeOperation = 'destination-out';
				this.ctx.fillStyle = 'rgba(0, 0, 0, 1)';
			} else {
				// Add mode - paint fog
				this.ctx.globalCompositeOperation = 'source-over';
				this.ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
			}

			// Draw path
			this.ctx.beginPath();
			const startScreen = this.worldToScreen(fogPath.points[0]);
			this.ctx.moveTo(startScreen.x, startScreen.y);

			for (let i = 1; i < fogPath.points.length; i++) {
				const pointScreen = this.worldToScreen(fogPath.points[i]);
				this.ctx.lineTo(pointScreen.x, pointScreen.y);
			}

			this.ctx.closePath();
			this.ctx.fill();

			this.ctx.restore();
		}
	}

	/**
	 * Load fog paths from saved data
	 * @param {Array} fogPaths - Array of fog path objects
	 */
	loadFogPaths(fogPaths) {
		this.fogPaths = fogPaths || [];
		this.render();
	}

	/**
	 * Get all fog paths for serialization
	 * @returns {Array} Array of fog path objects
	 */
	getFogPaths() {
		return this.fogPaths;
	}

	/**
	 * Clear all fog paths
	 */
	clearAll() {
		this.fogPaths = [];
		this.currentPath = [];
		this.render();
	}

	/**
	 * Clear the most recent fog path (undo last)
	 */
	undoLast() {
		if (this.fogPaths.length > 0) {
			this.fogPaths.pop();
			this.render();
		}
	}

	/**
	 * Resize canvas to match container
	 * @param {number} width
	 * @param {number} height
	 */
	resize(width, height) {
		this.canvas.width = width;
		this.canvas.height = height;
		this.render();
	}

	/**
	 * Serialize fog data for saving/transmission
	 * @returns {{paths: Array, visibility: boolean, brushSize: number}}
	 */
	serialize() {
		return {
			paths: this.fogPaths,
			visibility: this.visibility,
			brushSize: this.brushSize
		};
	}

	/**
	 * Deserialize fog data from saved state
	 * @param {{paths: Array, visibility: boolean, brushSize: number}} data
	 */
	deserialize(data) {
		this.fogPaths = data.paths || [];
		this.visibility = data.visibility !== false;
		this.brushSize = data.brushSize || 50;
		this.render();
	}

	/**
	 * Check if a point is inside fog (for hit detection)
	 * @param {{x: number, y: number}} point - World coordinates
	 * @returns {boolean} True if point is inside fog
	 */
	isPointInFog(point) {
		// Create a temporary canvas for hit detection
		const testCanvas = document.createElement('canvas');
		testCanvas.width = 1;
		testCanvas.height = 1;
		const testCtx = testCanvas.getContext('2d');

		// Draw all fog paths
		for (const fogPath of this.fogPaths) {
			if (fogPath.operation === 'add' && fogPath.points.length >= 2) {
				testCtx.beginPath();
				testCtx.moveTo(fogPath.points[0].x, fogPath.points[0].y);
				for (let i = 1; i < fogPath.points.length; i++) {
					testCtx.lineTo(fogPath.points[i].x, fogPath.points[i].y);
				}
				testCtx.closePath();

				if (testCtx.isPointInPath(point.x, point.y)) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Get statistics about current fog coverage
	 * @returns {{pathCount: number, totalPoints: number, visibility: boolean}}
	 */
	getStats() {
		const totalPoints = this.fogPaths.reduce((sum, path) => sum + path.points.length, 0);

		return {
			pathCount: this.fogPaths.length,
			totalPoints,
			visibility: this.visibility
		};
	}
}
