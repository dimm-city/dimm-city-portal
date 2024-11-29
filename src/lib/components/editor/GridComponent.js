import {
	BackgroundComponent,
	BackgroundComponentBackgroundType,
	Color4,
	EditorEventType
} from 'js-draw';

export class GridComponent extends BackgroundComponent {
	/**
     * @param {import("js-draw").Editor} _editor
     */
	constructor(_editor) {
		super(BackgroundComponentBackgroundType.Grid, Color4.ofRGBA(0, 0, 0, 0));
		this._editor = _editor;
        
		this._editor.notifier.on(EditorEventType.CommandDone, (evt) => {
			// @ts-ignore
			if (this._editor && evt.command.component != this) {
				this.bringGridToFront();
			}
		});

		// Event listener for when a command is undone
		this._editor.notifier.on(EditorEventType.CommandUndone, (evt) => {
			// @ts-ignore
			if (this._editor && evt.command.component != this) {
				this.bringGridToFront();
			}
		});

		this._editor.notifier.on(EditorEventType.SelectionUpdated, () => {
			this.bringGridToFront();
		});
	}

	// Add copies of the component to the foreground layer, rather
	// than the background layer.
	isBackground() {
		return false;
	}

	bringGridToFront() {
		const indexes = this._editor?.image.getAllElements().flatMap((e) => e?.getZIndex()) ?? [];
		const highestZ = Math.max(...indexes);
		this._editor?.dispatchNoAnnounce(this.setZIndex(highestZ + 100));
	}
	// TODO: If using collaborative editing, also override `serialize`
	// and register a deserialization callback with `registerComponent`.
}
