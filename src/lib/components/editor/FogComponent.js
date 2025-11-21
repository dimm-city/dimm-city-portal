import {
	AbstractComponent,
	Color4,
	Mat33,
	Path,
	PathCommandType,
	Rect2
} from 'js-draw';

/**
 * FogComponent - Represents a fog of war layer on the canvas
 * DMs see semi-transparent fog, players see opaque black fog
 */
export class FogComponent extends AbstractComponent {
	/**
	 * @param {import("js-draw").Editor} editor
	 * @param {boolean} isDM - Whether the current user is the DM
	 * @param {Path[]} fogPaths - Array of fog paths
	 */
	constructor(editor, isDM = false, fogPaths = []) {
		super(FogComponent.componentId);
		this._editor = editor;
		this._isDM = isDM;
		this._fogPaths = fogPaths;
		this._visible = true;
	}

	static componentId = 'fog-of-war';

	/**
	 * Get the bounding box of all fog paths
	 * @returns {Rect2}
	 */
	getBBox() {
		if (this._fogPaths.length === 0) {
			return Rect2.empty;
		}

		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;

		for (const path of this._fogPaths) {
			const bbox = path.bbox;
			minX = Math.min(minX, bbox.x);
			minY = Math.min(minY, bbox.y);
			maxX = Math.max(maxX, bbox.x + bbox.w);
			maxY = Math.max(maxY, bbox.y + bbox.h);
		}

		return new Rect2(minX, minY, maxX - minX, maxY - minY);
	}

	/**
	 * Render the fog component
	 * @param {import("js-draw").RenderingContext} ctx
	 * @param {import("js-draw").RenderingMode} _renderingMode
	 */
	render(ctx, _renderingMode) {
		if (!this._visible || this._fogPaths.length === 0) {
			return;
		}

		// Determine fog color and opacity based on user role
		const fogColor = this._isDM
			? Color4.ofRGBA(0, 0, 0, 0.5) // Semi-transparent for DM
			: Color4.ofRGBA(0, 0, 0, 1.0); // Opaque for players

		// Render each fog path
		for (const path of this._fogPaths) {
			ctx.fillPath(path, fogColor);
		}
	}

	/**
	 * Add a fog path
	 * @param {Path} path
	 */
	addFogPath(path) {
		this._fogPaths.push(path);
	}

	/**
	 * Clear all fog paths
	 */
	clearAll() {
		this._fogPaths = [];
	}

	/**
	 * Set fog visibility (DM only)
	 * @param {boolean} visible
	 */
	setVisible(visible) {
		this._visible = visible;
	}

	/**
	 * Get current visibility state
	 * @returns {boolean}
	 */
	isVisible() {
		return this._visible;
	}

	/**
	 * Set whether current user is DM
	 * @param {boolean} isDM
	 */
	setIsDM(isDM) {
		this._isDM = isDM;
	}

	/**
	 * Get all fog paths
	 * @returns {Path[]}
	 */
	getFogPaths() {
		return this._fogPaths;
	}

	/**
	 * Serialize the component for saving
	 * @returns {object}
	 */
	serialize() {
		return {
			name: FogComponent.componentId,
			visible: this._visible,
			paths: this._fogPaths.map(path => ({
				parts: path.parts.map(part => ({
					commands: part.startPoint ? [
						{ kind: PathCommandType.MoveTo, point: part.startPoint },
						...part.commands
					] : part.commands
				}))
			}))
		};
	}

	/**
	 * Deserialize and create a FogComponent from saved data
	 * @param {object} data
	 * @param {import("js-draw").Editor} editor
	 * @param {boolean} isDM
	 * @returns {FogComponent}
	 */
	static deserialize(data, editor, isDM = false) {
		const paths = (data.paths || []).map(pathData => {
			const parts = pathData.parts.map(partData => {
				const commands = partData.commands || [];
				let startPoint = null;

				// Extract MoveTo command if present
				if (commands.length > 0 && commands[0].kind === PathCommandType.MoveTo) {
					startPoint = commands[0].point;
					return {
						startPoint,
						commands: commands.slice(1)
					};
				}

				return {
					startPoint,
					commands
				};
			});

			return new Path(parts);
		});

		const component = new FogComponent(editor, isDM, paths);
		component.setVisible(data.visible !== false); // Default to visible
		return component;
	}

	/**
	 * Component is not in background layer
	 * @returns {boolean}
	 */
	isBackground() {
		return false;
	}
}
