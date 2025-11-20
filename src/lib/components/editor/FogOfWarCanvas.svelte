<script>
	import { onMount, onDestroy } from 'svelte';
	import { FogOfWarEngine } from './FogOfWarEngine.js';
	import {
		fogData,
		fogMode,
		fogBrushSize,
		fogVisibility,
		addFogPath,
		loadFogData
	} from '$lib/stores/fogOfWarStore.js';
	import { player } from '../PortalStore.js';
	import { EditorEventType } from 'js-draw';

	/**
	 * Props
	 */
	let { editor } = $props();

	/**
	 * State
	 */
	let fogCanvas = $state();
	let fogEngine = $state(null);
	let isDM = $derived($player?.host || false);
	let containerElement = $state();
	let resizeObserver = $state(null);

	/**
	 * Lifecycle - Initialize fog engine
	 */
	onMount(() => {
		if (!fogCanvas || !editor) return;

		// Create fog engine
		fogEngine = new FogOfWarEngine(fogCanvas, isDM);

		// Set initial brush size
		fogEngine.setBrushSize($fogBrushSize);

		// Load initial fog data
		fogEngine.loadFogPaths($fogData.paths);
		fogEngine.setVisibility($fogVisibility);

		// Sync viewport transform
		syncTransform();

		// Listen to editor viewport changes (pan/zoom)
		editor.addEventListener(EditorEventType.ViewportChanged, handleViewportChange);

		// Set up resize observer
		setupResizeObserver();

		// Set initial canvas size
		resizeCanvas();

		// Return cleanup function
		return () => {
			if (editor) {
				editor.removeEventListener(EditorEventType.ViewportChanged, handleViewportChange);
			}
			if (resizeObserver) {
				resizeObserver.disconnect();
			}
		};
	});

	/**
	 * Set up resize observer to handle canvas resizing
	 */
	function setupResizeObserver() {
		if (!containerElement || typeof ResizeObserver === 'undefined') return;

		resizeObserver = new ResizeObserver(() => {
			resizeCanvas();
		});

		resizeObserver.observe(containerElement);
	}

	/**
	 * Resize canvas to match container
	 */
	function resizeCanvas() {
		if (!fogCanvas || !containerElement) return;

		const rect = containerElement.getBoundingClientRect();
		if (rect.width > 0 && rect.height > 0) {
			fogCanvas.width = rect.width;
			fogCanvas.height = rect.height;

			if (fogEngine) {
				fogEngine.resize(rect.width, rect.height);
			}
		}
	}

	/**
	 * Handle viewport changes (pan/zoom from js-draw)
	 */
	function handleViewportChange() {
		syncTransform();
	}

	/**
	 * Sync fog canvas transform with js-draw viewport
	 */
	function syncTransform() {
		if (!fogEngine || !editor) return;

		const viewport = editor.viewport;
		const visibleRect = viewport.visibleRect;
		const canvasSize = { width: fogCanvas.width, height: fogCanvas.height };

		// Calculate transform to match js-draw viewport
		const transform = {
			scale: viewport.getScaleFactor(),
			translateX: -visibleRect.x * viewport.getScaleFactor(),
			translateY: -visibleRect.y * viewport.getScaleFactor()
		};

		fogEngine.setTransform(transform);
	}

	/**
	 * Mouse event handlers for fog drawing
	 */
	function handleMouseDown(event) {
		if (!isDM || !$fogMode || !fogEngine) return;

		const rect = fogCanvas.getBoundingClientRect();
		const point = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		};

		fogEngine.startDrawing(point);
	}

	function handleMouseMove(event) {
		if (!isDM || !$fogMode || !fogEngine) return;

		const rect = fogCanvas.getBoundingClientRect();
		const point = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		};

		fogEngine.continueDrawing(point);
	}

	function handleMouseUp() {
		if (!isDM || !$fogMode || !fogEngine) return;

		const completedPath = fogEngine.finishDrawing();
		if (completedPath) {
			// Add to store (will be synced via WebSocket)
			addFogPath(completedPath);
		}
	}

	/**
	 * Touch event handlers for mobile support
	 */
	function handleTouchStart(event) {
		if (!isDM || !$fogMode || !fogEngine) return;
		event.preventDefault();

		const touch = event.touches[0];
		const rect = fogCanvas.getBoundingClientRect();
		const point = {
			x: touch.clientX - rect.left,
			y: touch.clientY - rect.top
		};

		fogEngine.startDrawing(point);
	}

	function handleTouchMove(event) {
		if (!isDM || !$fogMode || !fogEngine) return;
		event.preventDefault();

		const touch = event.touches[0];
		const rect = fogCanvas.getBoundingClientRect();
		const point = {
			x: touch.clientX - rect.left,
			y: touch.clientY - rect.top
		};

		fogEngine.continueDrawing(point);
	}

	function handleTouchEnd(event) {
		if (!isDM || !$fogMode || !fogEngine) return;
		event.preventDefault();

		const completedPath = fogEngine.finishDrawing();
		if (completedPath) {
			addFogPath(completedPath);
		}
	}

	/**
	 * Reactive statements - sync store changes with engine
	 */
	$effect(() => {
		if (fogEngine && $fogMode) {
			fogEngine.setMode($fogMode);
		}
	});

	$effect(() => {
		if (fogEngine) {
			fogEngine.setBrushSize($fogBrushSize);
		}
	});

	$effect(() => {
		if (fogEngine) {
			fogEngine.setVisibility($fogVisibility);
		}
	});

	$effect(() => {
		if (fogEngine && $fogData.paths) {
			fogEngine.loadFogPaths($fogData.paths);
		}
	});

	/**
	 * Cleanup
	 */
	onDestroy(() => {
		if (resizeObserver) {
			resizeObserver.disconnect();
		}
	});
</script>

<div
	bind:this={containerElement}
	class="fog-canvas-container"
>
	<canvas
		bind:this={fogCanvas}
		class="fog-canvas"
		class:active={isDM && $fogMode}
		class:paint-mode={$fogMode === 'paint'}
		class:erase-mode={$fogMode === 'erase'}
		onmousedown={handleMouseDown}
		onmousemove={handleMouseMove}
		onmouseup={handleMouseUp}
		onmouseleave={handleMouseUp}
		ontouchstart={handleTouchStart}
		ontouchmove={handleTouchMove}
		ontouchend={handleTouchEnd}
		ontouchcancel={handleTouchEnd}
	/>
</div>

<style>
	.fog-canvas-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 100;
	}

	.fog-canvas {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		touch-action: none;
	}

	.fog-canvas.active {
		pointer-events: auto;
	}

	.fog-canvas.paint-mode {
		cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2"><circle cx="12" cy="12" r="8"/></svg>') 12 12, crosshair;
	}

	.fog-canvas.erase-mode {
		cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="8"/></svg>') 12 12, crosshair;
	}
</style>
