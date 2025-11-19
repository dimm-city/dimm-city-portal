<script>
	import 'js-draw/bundledStyles';
	import './Editor.css';
	import { onMount } from 'svelte';
	import { fetchUpdates, player, inSession, showMapBrowser, editor } from '../PortalStore.js';
	import { configureEditor, configureToolbar, setBackgroundImage } from './Editor.js';
	import MapBrowser from '../MapBrowser.svelte';

	let {backgroundImageUrl} = $props();
	/**
	 * @type {HTMLElement}
	 */
	let editorElement = $state();

	player.subscribe((p) => {
		if (p?.id && $inSession) configureToolbar(p.host);
	});

	onMount(() => {
		try {
			console.log('Editor mounting...', backgroundImageUrl);

			configureEditor(editorElement, backgroundImageUrl);
			fetchUpdates(0);
		} catch (error) {
			console.error('Failed to initialize editor:', error);
			// Error will be caught by global error boundary
		}
	});

	function handleSelectMap(mapData) {
		console.log('Map selected:', mapData);
		// Load the map as background image
		if ($editor && mapData.url) {
			setBackgroundImage($editor, mapData.url);
		}
	}
</script>

<div class="editor-container">
	<div bind:this={editorElement}></div>
	{#if $showMapBrowser}
		<MapBrowser
			onClose={() => showMapBrowser.set(false)}
			onSelectMap={handleSelectMap}
		/>
	{/if}
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
