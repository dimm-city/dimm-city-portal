import Editor, {
	getLocalizationTable,
	HandToolWidget,
	ImageComponent,
	makeEdgeToolbar,
	Mat33,
	PanZoomTool,
	ActionButtonWidget,
	SelectionTool,
	SelectionToolWidget,
	SerializableCommand,
	invertCommand,
	EditorEventType,
	Erase,
	Color4,
	BackgroundComponentBackgroundType
} from 'js-draw';
import { BootstrapIconProvider } from '../icons/BootstrapIconProvider.js';
import {
	copySessionUrl,
	leaveSession,
	showPlayerList,
	showSessionDetails,
	showMapBrowser,
	postSerializedCommand,
	editor,
	player,
	requestDiceRoll,
	saveScene,
	loadScene
} from '../PortalStore.js';
import { DiceIcon, GearIcon, LeaveIcon, PeopleIcon, PlayerIcon, SaveIcon, ShareIcon } from '../icons/DCIconProvider.js';
import { get } from 'svelte/store';
import { GridComponent } from './GridComponent.js';
import { SvelteWidget } from './SvelteWidget.js';
import TokenSelector from './TokenSelector.svelte';
import DOMPurify from 'dompurify';

/**
 * @type {import("js-draw").Editor}
 */
// @ts-ignore
let _editor = get(editor);

/**
 * @type {import("js-draw").AbstractToolbar}
 */
let toolbar;

/**
 * @type {GridComponent}
 */
let grid;

/**
 * @type {import("js-draw/dist/mjs/EventDispatcher").DispatcherEventListener}
 */
let selectListener;
/**
 * @type {ImageComponent | null}
 */
let playerToken;

/**
 * @param {boolean} isHost
 */
export function configureToolbar(isHost) {
	if (!_editor) return;
	if (toolbar) toolbar.remove();

	toolbar = makeEdgeToolbar(_editor);

	toolbar.addActionButton(
		{
			label: 'Leave Session',
			icon: LeaveIcon
		},
		() => {
			if (window.confirm('Are you sure you want to leave?')) {
				_editor?.remove();
				leaveSession();
			}
		}
	);
	// toolbar.addTaggedActionButton(
	// 	['host'],
	// 	{
	// 		label: 'host',
	// 		icon: _editor.icons.makeOverflowIcon()
	// 	},
	// 	() => {
	// 		player.update((p) => {
	// 			p.host = !p?.host;
	// 			return p;
	// 		});
	// 	}
	// );
	if (isHost) {
		// @ts-ignore
		if (selectListener?.remove) selectListener?.remove();

		// Save Scene button
		toolbar.addActionButton(
			{
				label: 'Save Scene',
				icon: SaveIcon
			},
			async () => {
				if (!_editor) return;
				try {
					const data = await _editor.toSVGAsync();

					// Sanitize SVG content before saving to prevent XSS
					const cleanSVG = DOMPurify.sanitize(data.innerHTML, {
						USE_PROFILES: { svg: true, svgFilters: true }
					});

					// Get scene name (you can add a UI input for this later)
					const sceneName = 'Scene ' + new Date().toLocaleString();

					// Save to server using the new saveScene function
					await saveScene(cleanSVG, sceneName);
					console.log('Scene saved to server');
				} catch (error) {
					console.error('Failed to save scene:', error);
				}
			}
		);

		// Load Scene button
		toolbar.addActionButton(
			{
				label: 'Load Scene',
				icon: _editor.icons.makeOpenIcon()
			},
			async () => {
				if (!_editor) return;
				try {
					const sceneData = await loadScene();
					if (sceneData.savedScene) {
						// Load the SVG into the editor
						await _editor.loadFrom(sceneData.savedScene);
						console.log('Scene loaded from server');
					} else {
						console.log('No saved scene found');
					}
				} catch (error) {
					console.error('Failed to load scene:', error);
				}
			}
		);

		// Map Browser button
		toolbar.addActionButton(
			{
				label: 'Maps',
				icon: _editor.icons.makeIconFromFactory((iconType) => {
					// Use Bootstrap Icons map icon
					const icon = document.createElement('i');
					icon.className = 'bi bi-map';
					icon.style.fontSize = '1.5em';
					return icon;
				})
			},
			() => {
				showMapBrowser.set(true);
			}
		);

		// Export Scene button
		toolbar.addActionButton(
			{
				label: 'Export SVG',
				icon: _editor.icons.makeDownloadIcon()
			},
			async () => {
				if (!_editor) return;
				try {
					const data = await _editor.toSVGAsync();

					// Sanitize SVG before export
					const cleanSVG = DOMPurify.sanitize(data.innerHTML, {
						USE_PROFILES: { svg: true, svgFilters: true }
					});

					// Create download link
					const blob = new Blob([cleanSVG], { type: 'image/svg+xml' });
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = 'scene-' + new Date().toISOString().split('T')[0] + '.svg';
					a.click();
					URL.revokeObjectURL(url);

					console.log('Scene exported as SVG');
				} catch (error) {
					console.error('Failed to export scene:', error);
				}
			}
		);
		toolbar.addDefaultEditorControlWidgets();
		toolbar.addWidgetsForPrimaryTools();
		toolbar.addTaggedActionButton(
			['settings'],
			{
				label: 'settings',
				icon: GearIcon
			},
			() => {
				showSessionDetails.set(true);
			}
		);
		toolbar.addTaggedActionButton(
			['players'],
			{
				label: 'players',
				icon: PeopleIcon
			},
			() => {
				showPlayerList.set(true);
			}
		);
		toolbar.addTaggedActionButton(
			['invite'],
			{
				label: 'invite',
				icon: ShareIcon
			},
			copySessionUrl
		);
		toolbar.addSpacer();
		toolbar.addActionButton(
			{
				label: getLocalizationTable().undo,
				icon: _editor.icons.makeUndoIcon()
			},
			() => {
				if (!_editor) return;
				_editor.history.undo();
			}
		);
	} else {

		toolbar.addWidget(new SvelteWidget(_editor,
			'Player Token',
			PlayerIcon,
			'TokenSelector',
			TokenSelector,
			{
				playerToken
			}));

		const selectionTools = _editor.toolController.getMatchingTools(SelectionTool);
		const selectionTool = selectionTools.at(0);
		if (!selectionTool) {
			throw new Error('No selection tool found');
		}

		selectListener = _editor.notifier.on(EditorEventType.SelectionUpdated, (evt) => {
			console.log('selectionUpdated', evt);
			if (
				!isHost &&
				// @ts-ignore
				evt.selectedComponents.length > 0 &&
				// @ts-ignore
				!evt.selectedComponents.every((c) => c == playerToken)
			) {
				const tokens = evt.selectedComponents.filter((c) => playerToken = c);

				if (tokens.length > 0) {
					evt.tool.setSelection(tokens);
				}else{
					evt.tool.clearSelection();				
				}
			}
		});

		const selectionToolWidget = new SelectionToolWidget(
			_editor,
			selectionTool,
			getLocalizationTable(['en'])
		);

		toolbar.addWidget(selectionToolWidget);

		const primaryPanZoomToolList = _editor.toolController
			.getPrimaryTools()
			.filter((tool) => tool instanceof PanZoomTool);
		const primaryPanZoomTool = primaryPanZoomToolList.at(0);
		if (!primaryPanZoomTool) {
			throw new Error('No primary pan-zoom tool found');
		}

		const handToolWidget = new HandToolWidget(
			_editor,
			primaryPanZoomTool,
			getLocalizationTable(['en'])
		);

		toolbar.addWidget(handToolWidget);
		primaryPanZoomTool.setEnabled(true);
	}
	toolbar.addActionButton(
		{
			label: 'Roll Dice',
			icon: DiceIcon
		},
		async () => {
			await requestDiceRoll();
		}
	);
}

/**
 * @param {HTMLElement} editorElement
 */
export async function configureEditor(editorElement, backgroundImageUrl = '') {
	if (!_editor) {
		_editor = new Editor(editorElement, {
			wheelEventsEnabled: 'only-if-focused',
			iconProvider: new BootstrapIconProvider()
		});

		_editor.dispatch(
			_editor.setBackgroundStyle({
				color: Color4.transparent,
				type: BackgroundComponentBackgroundType.None,
				autoresize: true
			})
		);
		_editor.getRootElement().style.minHeight = editorElement.parentElement?.clientHeight + 'px';

		// Event listener for when a command is done
		_editor.notifier.on(EditorEventType.CommandDone, (evt) => {
			console.log('Command done', evt);

			// @ts-ignore
			if (evt.command instanceof SerializableCommand) {
				// @ts-ignore
				postSerializedCommand(evt.command.serialize());
			} else {
				// @ts-ignore
				console.log('!', evt.command, 'is not an instance of SerializableCommand');
			}

			if (
				// @ts-ignore
				evt.command instanceof Erase &&
				// @ts-ignore
				evt.command.toRemove.at(0) == playerToken &&
				// @ts-ignore
				evt.command.applied
			) {
				playerTokenAdded = false;
				playerToken = null;
			}
		});

		// Event listener for when a command is undone
		_editor.notifier.on(EditorEventType.CommandUndone, (evt) => {
			// @ts-ignore
			if (!(evt.command instanceof SerializableCommand)) {
				// @ts-ignore
				console.log('Not serializable!', evt.command);
				return;
			}
			// @ts-ignore
			postSerializedCommand(invertCommand(evt.command).serialize());
		});

		if (backgroundImageUrl) {
			const image = new Image();
			image.crossOrigin = 'anonymous'; // Allows CORS images without tainting the canvas
			image.src = backgroundImageUrl;

			const comp = await ImageComponent.fromImage(image, Mat33.identity);

			_editor.dispatch(_editor.image.addElement(comp));
		}

		grid = new GridComponent(_editor);
		_editor.dispatch(_editor.image.addElement(grid));

		editor.set(_editor);

		// Auto-load saved scene if it exists
		try {
			const sceneData = await loadScene();
			if (sceneData.savedScene) {
				await _editor.loadFrom(sceneData.savedScene);
				console.log('Auto-loaded saved scene:', sceneData.sceneName);
			}
		} catch (error) {
			console.log('No saved scene to auto-load or error loading:', error.message);
		}

		configureToolbar(get(player)?.host);

		// Start auto-save interval for hosts (every 5 minutes)
		if (get(player)?.host) {
			const autoSaveInterval = setInterval(async () => {
				try {
					if (!_editor) return;
					const data = await _editor.toSVGAsync();
					const cleanSVG = DOMPurify.sanitize(data.innerHTML, {
						USE_PROFILES: { svg: true, svgFilters: true }
					});
					const sceneName = 'Auto-save ' + new Date().toLocaleString();
					await saveScene(cleanSVG, sceneName);
					console.log('Auto-saved scene at', new Date().toLocaleTimeString());
				} catch (error) {
					console.error('Auto-save failed:', error);
				}
			}, 5 * 60 * 1000); // 5 minutes

			// Clean up interval when editor is removed
			const originalRemove = _editor.remove.bind(_editor);
			_editor.remove = () => {
				clearInterval(autoSaveInterval);
				originalRemove();
			};
		}
	}
}

/**
 * Set background image dynamically
 * @param {Editor} editor
 * @param {string} imageUrl
 */
export async function setBackgroundImage(editor, imageUrl) {
	if (!editor) {
		console.error('Editor not initialized');
		return;
	}

	try {
		const image = new Image();
		image.crossOrigin = 'anonymous';
		image.src = imageUrl;

		// Wait for image to load
		await new Promise((resolve, reject) => {
			image.onload = resolve;
			image.onerror = reject;
		});

		const comp = await ImageComponent.fromImage(image, Mat33.identity);
		editor.dispatch(editor.image.addElement(comp));

		console.log('Background image loaded:', imageUrl);
	} catch (error) {
		console.error('Failed to load background image:', error);
	}
}
