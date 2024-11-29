<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import DiceBox from '@3d-dice/dice-box-threejs';
	const dispatcher = createEventDispatcher();

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
		return diceBox.roll(result);
	}

	export function clear() {
		if (diceBox) diceBox.clearDice();
	}
	onMount(() => {
		initDiceBox();
	});
</script>

<div id="dice-container" class="dice-container"></div>

<style>
	.dice-container {
		width: 100%;
		height: 100%;
		position: relative;
	}
</style>
