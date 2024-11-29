<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import DiceBox from '@3d-dice/dice-box-threejs';
	const dispatcher = createEventDispatcher();

	let rolling = $state(false);
	/**
	 * @typedef {Object} Props
	 * @property {string} [diceSize]
	 */

	/** @type {Props} */
	let { diceSize = 'medium' } = $props();

	// $: diceSizeModifier = diceSize === 'large' ? 90 : diceSize === 'medium' ? 50 : 0;
	// $: scale = diceSizeModifier + (window.innerWidth > 500 ? 100 : 90);

	/**
	 * @type {DiceBox}
	 */
	let diceBox;

	let defaultDiceConfig = {
		assetPath: '/dice/',
		sounds: false,
		volume: 100,
		sound_dieMaterial: 'plastic',
		theme_customColorset: {
			name: 'pink',
			foreground: 'white',
			background: '#ef1ebf',
			texture: 'glass',
			description: 'Default pink dice',
			material: 'glass',
			scale: 0
		},
		theme_colorset: 'pink',
		baseScale: 110,
		strength: 1,
		onRollComplete: (/** @type {any} */ result) => {
			//rolling = false;
			dispatcher('rollCompleted', result);
		}
	};

	function initDiceBox() {
		if (diceBox) return;
		let diceSizeModifier = diceSize === 'large' ? 90 : diceSize === 'medium' ? 50 : 0;
		let scale = diceSizeModifier + (window.innerWidth > 500 ? 100 : 90);
		defaultDiceConfig.baseScale = scale;
		console.log('Initializing dice box...', defaultDiceConfig);
		diceBox = new DiceBox('#dice-container', defaultDiceConfig);
		diceBox.initialize();
		//}
	}
	// This function will be called from the main component to roll the dice
	/**
	 * @param {any} result
	 * @param {{ name: string; }} diceTheme
	 * @param {any} diceId
	 */
	export async function roll(result, diceTheme, diceId) {
		rolling = true;
		initDiceBox();

		if (!diceTheme) diceTheme = defaultDiceConfig.theme_customColorset;

		let diceSizeModifier =
			diceSize === 'x-large' ? 130 : diceSize === 'large' ? 90 : diceSize === 'medium' ? 50 : 0;
		let scale = diceSizeModifier + (window.innerWidth > 500 ? 100 : 90);
		// Roll the dice associated with the specific player's result
		console.log('Rolling', result, diceTheme, diceId);

		// Update the theme
		diceTheme.name += new Date().getTime().toString();
		//TODO: figure out scaling dice properly
		//diceTheme.scale = scale;
		diceBox.theme_customColorset = diceTheme;
		//diceBox.DiceFactory.updateConfig({baseScale: scale, scale: true});
		await diceBox.loadTheme(diceTheme);
		await diceBox.resizeWorld();
		// Roll the dice
		const output = await diceBox.roll(result);
		rolling = false;
		return output;
	}

	export function clear() {
		if (diceBox) diceBox.clearDice();
	}
	onMount(() => {
		initDiceBox();
	});
</script>

<div id="dice-container" class="dice-container" class:rolling></div>

<style>
	.dice-container {
		inset: 0;
		position: absolute;
		z-index: -10;
		opacity: 0.2;
		filter: blur(3px);
		transform: scale(0.8) translate3d(12px, -50px, 3em);
		transition: all 750ms cubic-bezier(0.455, 0.03, 0.515, 0.955);
		transition: all 200ms cubic-bezier(0.6, 0.04, 0.98, 0.335);
		transition-delay: 400ms;
		overflow: hidden;
	}
	.dice-container.rolling {
		z-index: unset;
		opacity: 1;
		filter: blur(0px);
		transform: scale(1);
		transition-delay: 0ms;
		transition: all 200ms cubic-bezier(0.6, 0.04, 0.98, 0.335);
		transition-timing-function: linear;
	}
</style>
