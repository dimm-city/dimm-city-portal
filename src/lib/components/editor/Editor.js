import Editor, {
	getLocalizationTable,
	HandToolWidget,
	ImageComponent,
	makeEdgeToolbar,
	Mat33,
	PanZoomTool,
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
// import {
// 	copySessionUrl,
// 	leaveSession,
// 	postSerializedCommand,
// 	requestDiceRoll
// } from '../PortalStore.js';
import { DiceIcon, GearIcon, LeaveIcon, PeopleIcon, PlayerIcon, SaveIcon, ShareIcon } from '../icons/DCIconProvider.js';

import { GridComponent } from './GridComponent.js';
import { SvelteWidget } from './SvelteWidget.js';
import TokenSelector from './TokenSelector.svelte';
import { portal } from '$lib/components/Portal.svelte.js';
import {
	copySessionUrl,
	leaveSession,
	postSerializedCommand,
	requestDiceRoll
} from '$lib/components/Session.svelte.js';


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


export function configureToolbar() {
	if (!portal.ui.editor) return;
	if (toolbar) toolbar.remove();

	toolbar = makeEdgeToolbar(portal.ui.editor);

	toolbar.addActionButton(
		{
			label: 'Leave Session',
			icon: LeaveIcon
		},
		() => {
			if (window.confirm('Are you sure you want to leave?')) {
				portal.ui.editor?.remove();
				leaveSession();
			}
		}
	);
	// toolbar.addTaggedActionButton(
	// 	['host'],
	// 	{
	// 		label: 'host',
	// 		icon: portal.ui.editor.icons.makeOverflowIcon()
	// 	},
	// 	() => {
	// 		player.update((p) => {
	// 			p.host = !p?.host;
	// 			return p;
	// 		});
	// 	}
	// );
	if (portal.player.isHost) {
		// @ts-ignore
		if (selectListener?.remove) selectListener?.remove();

		toolbar.addActionButton(
			{
				label: getLocalizationTable().save,
				icon: SaveIcon
			},
			async () => {
				if (!portal.ui.editor) return;
				const data = await portal.ui.editor.toSVGAsync();
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
				portal.ui.showSessionDetails = true;
			}
		);
		toolbar.addTaggedActionButton(
			['players'],
			{
				label: 'players',
				icon: PeopleIcon
			},
			() => {
				portal.ui.showPlayerList = true;
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
				icon: portal.ui.editor.icons.makeUndoIcon()
			},
			() => {
				if (!portal.ui.editor) return;
				portal.ui.editor.history.undo();
			}
		);
	} else {

		toolbar.addWidget(new SvelteWidget(portal.ui.editor,
			'Player Token',
			PlayerIcon,
			'TokenSelector',
			TokenSelector,
			{
				playerToken
			}));

		const selectionTools = portal.ui.editor.toolController.getMatchingTools(SelectionTool);
		const selectionTool = selectionTools.at(0);
		if (!selectionTool) {
			throw new Error('No selection tool found');
		}

		selectListener = portal.ui.editor.notifier.on(EditorEventType.SelectionUpdated, (evt) => {
			console.log('selectionUpdated', evt);
			if (
				!portal.player.isHost &&
				// @ts-ignore
				evt.selectedComponents.length > 0 &&
				// @ts-ignore
				!evt.selectedComponents.every((c) => c == playerToken)
			) {
				const tokens = evt.selectedComponents.filter((c) => playerToken = c);

				if (tokens.length > 0) {
					evt.tool.setSelection(tokens);
				} else {
					evt.tool.clearSelection();
				}
			}
		});

		const selectionToolWidget = new SelectionToolWidget(
			portal.ui.editor,
			selectionTool,
			getLocalizationTable(['en'])
		);

		toolbar.addWidget(selectionToolWidget);

		const primaryPanZoomToolList = portal.ui.editor.toolController
			.getPrimaryTools()
			.filter((tool) => tool instanceof PanZoomTool);
		const primaryPanZoomTool = primaryPanZoomToolList.at(0);
		if (!primaryPanZoomTool) {
			throw new Error('No primary pan-zoom tool found');
		}

		const handToolWidget = new HandToolWidget(
			portal.ui.editor,
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

export async function configureEditor(backgroundImageUrl = '') {
	if (!portal.ui.editor && portal.ui.editorElement) {
		portal.ui.editor = new Editor(portal.ui.editorElement, {
			wheelEventsEnabled: 'only-if-focused',
			iconProvider: new BootstrapIconProvider()
		});

		portal.ui.editor.dispatch(
			portal.ui.editor.setBackgroundStyle({
				color: Color4.transparent,
				type: BackgroundComponentBackgroundType.None,
				autoresize: true
			})
		);
		portal.ui.editor.getRootElement().style.minHeight = portal.ui.editorElement.parentElement?.clientHeight + 'px';

		// Event listener for when a command is done
		portal.ui.editor.notifier.on(EditorEventType.CommandDone, (evt) => {
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
		portal.ui.editor.notifier.on(EditorEventType.CommandUndone, (evt) => {
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

			portal.ui.editor.dispatch(portal.ui.editor.image.addElement(comp));
		}

		grid = new GridComponent(portal.ui.editor);
		portal.ui.editor.dispatch(portal.ui.editor.image.addElement(grid));
		
		configureToolbar();
	}
}
