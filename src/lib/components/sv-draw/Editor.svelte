<script>
	import 'js-draw/bundledStyles';
	import './Editor.css';
	import { onMount } from 'svelte';
	import { fetchUpdates, player, inSession } from '../PortalStore';
	import { configureEditor, configureToolbar } from './Editor';

	let {backgroundImageUrl} = $props();
	/**
	 * @type {HTMLElement}
	 */
	let editorElement = $state();

	player.subscribe((p) => {
		if (p?.id && $inSession) configureToolbar(p.host);
	});

	onMount(() => {
		console.log('Editor mounting...', backgroundImageUrl);
		
		configureEditor(editorElement, backgroundImageUrl);
		fetchUpdates(0);
	});
</script>

<div class="editor-container">
	<div bind:this={editorElement}></div>
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
