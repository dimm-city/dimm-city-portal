<script>
	import { ImageComponent, Mat33, SelectionTool } from 'js-draw';
	import { portal } from '$lib/models/PortalState.svelte.js';
	let { editor, hideDropdown, playerToken = $bindable() } = $props();

	const token = portal.player.availableTokens?.at(0) ?? []; //HACK: do this better

	let playerTokenAdded = false;
	async function addPlayerToken() {
		if (!editor) {
			console.warn('No editor found');
			return;
		}
		if (playerTokenAdded && playerToken) {
			console.log('Token already added');
			const s = editor?.toolController.getMatchingTools(SelectionTool)?.at(0);
			if (!s) {
				console.warn('No selection tool found');
				return;
			}
			editor?.toolController.addPrimaryTool(s);
			s?.setEnabled(true);
			s?.setSelection([playerToken]);
		} else {
			const imageUrl = token?.src;
			const image = new Image();
			image.crossOrigin = 'anonymous'; // Allows CORS images without tainting the canvas
			image.src = imageUrl;
			image.dataset.playerId = token?.id;
			image.classList.add('player-token');

			const comp = await ImageComponent.fromImage(image, Mat33.identity);
			comp.onRemoveFromImage = () => {
				if (playerToken && !editor?.image.getAllElements().includes(playerToken)) {
					console.log('Player token removed');
					playerToken = null;
					playerTokenAdded = false;
				}
			};
			comp.attachLoadSaveData('player-id', [token.id]);

			playerToken = comp;
			playerTokenAdded = true;
			await editor?.addAndCenterComponents([comp], true, 'Player token added');
			console.log('Player token added', playerToken);
		}
		hideDropdown();
	}
</script>

<div class="token-selector-contianer">
	<ul>
		<li>
			<button onclick={addPlayerToken}>
				<img src={token?.src} alt="Player Token" />
			</button>
		</li>
	</ul>
</div>

<style>
	.token-selector-contianer ul li {
		display: inline-block;
		margin: 10px;
	}
	:global(.toolbar-edgemenu-container .toolbar-edgemenu button:has(img)) {
		border: 1px solid transparent;
		margin: 0;
		background-color: var(--color-primary-overlay);
		box-shadow: 0 1px 2px var(--shadow-accent-two);
	}
	img {
		max-height: 300px;
	}

	button{
		box-sizing: border-box;
	}
	.token-selector-contianer {
		width: 80svw;
	}

	:global(
			.editor-container .toolbar-edgemenu-container .toolbar-edgemenu:has(.token-selector-contianer)
		) {
		width: auto;
	}
</style>
