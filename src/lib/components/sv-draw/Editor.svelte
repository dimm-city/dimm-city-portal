<script>
	import 'js-draw/bundledStyles';
	import './Editor.css';
	import { onMount } from 'svelte';
	import {
		fetchUpdates
	} from '../PortalStore';
	import { configureEditor } from './Editor';


	/**
	 * @type {HTMLElement}
	 */
	let editorElement = $state();


	onMount(() => {
	
		configureEditor(editorElement);
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
		height: calc(100svh - 100px);
		position: relative;
		container-type: inline-size;
	}
	:global(.player-token) {
		border-radius: 40%;
		border: thin solid var(--icon-color);
	}

	:global(
			.editor-container
				.js-draw.imageEditorContainer
				.js-draw-image-background.js-draw-image-background-grid
				path,
			.editor-container .js-draw.imageEditorContainer .js-draw-image-background path
		) {
		opacity: 0.3;
		stroke: red !important;
		z-index: 9999;
	}
</style>
