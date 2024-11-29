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
import { BootstrapIconProvider } from './BootstrapIconProvider.js';
import {
	copySessionUrl,
	leaveSession,
	showPlayerList,
	showSessionDetails,
	getPlayerToken,
	postSerializedCommand,
	editor,
	player
} from '../PortalStore.js';
import { GearIcon, LeaveIcon, PeopleIcon, PlayerIcon, SaveIcon, ShareIcon } from './DCIconProvider.js';
import { get } from 'svelte/store';
import { GridComponent } from './GridComponent.js';

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
let playerTokenAdded = false;
async function addPlayerToken() {
	if (playerTokenAdded && playerToken) {
		console.log('Token already added');
		const s = _editor?.toolController.getMatchingTools(SelectionTool)?.at(0);
		if (!s) {
			console.warn('No selection tool found');
			return;
		}
		_editor?.toolController.addPrimaryTool(s);
		s?.setEnabled(true);
		s?.setSelection([playerToken]);
	} else {
		const token = getPlayerToken();
		const imageUrl = token?.src;
		const image = new Image();
		image.crossOrigin = 'anonymous'; // Allows CORS images without tainting the canvas
		image.src = imageUrl;
		image.dataset.playerId = token?.id;
		image.classList.add('player-token');

		const comp = await ImageComponent.fromImage(image, Mat33.identity);
		comp.onRemoveFromImage = () => {
			if (playerToken && !_editor?.image.getAllElements().includes(playerToken)) {
				console.log('Player token removed');
				playerToken = null;
				playerTokenAdded = false;
			}
		};
		comp.attachLoadSaveData('player-id', [token.id]);

		playerToken = comp;
		playerTokenAdded = true;
		await _editor?.addAndCenterComponents([comp], true, 'Player token added');
		console.log('Player token added', playerToken);
	}
}

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

		toolbar.addActionButton(
			{
				label: getLocalizationTable().save,
				icon: SaveIcon
			},
			async () => {
				if (!_editor) return;
				const data = await _editor.toSVGAsync();
				localStorage.setItem('scene', data.innerHTML);
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
				// @ts-ignore
				evt.tool.clearSelection();
				// @ts-ignore
				evt.tool.setSelection(evt.selectedComponents.filter((c) => c == playerToken));
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
		toolbar.addWidget(
			new ActionButtonWidget(
				_editor,
				'Token',
				() => PlayerIcon,
				'Token',
				addPlayerToken,
				getLocalizationTable(),
				true,
				true
			)
		);
		primaryPanZoomTool.setEnabled(true);
	}
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
		configureToolbar(get(player)?.host);
	}
}
