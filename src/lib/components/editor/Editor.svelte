<script>
	import 'js-draw/bundledStyles';
	import './Editor.css';
	// import { onMount } from 'svelte';
	// import { fetchUpdates, player, inSession } from '../PortalStore.js';

	import { configureEditor, configureToolbar } from './Editor.js';
	import { portal } from '$lib/components/Portal.svelte.js';
	import { fetchUpdates } from '$lib/components/Session.svelte.js';
	import { onMount } from 'svelte';

	onMount(() => {
		if (portal.player?.id && portal.session.mode == 'active') configureToolbar(portal.player.isHost);

		console.log('Editor mounting...', portal.config.defaultScene.backgroundImageUrl);

		configureEditor(portal.config.defaultScene.backgroundUrl);
		fetchUpdates();
	});
</script>

<div class="editor-container">
	<div bind:this={portal.ui.editorElement}></div>
</div>

<style>
	.editor-container {
		display: grid;
		width: 100%;
		height: 100%;
		position: relative;
		container-type: inline-size;
	}
</style>
