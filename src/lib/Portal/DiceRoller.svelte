<script>
	import { onMount } from 'svelte';
	import DiceBox from '@3d-dice/dice-box-threejs';

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
			material: 'glass'
		},
		theme_colorset: 'pink',
		baseScale: window.innerWidth > 500 ? 75 : 60,
		strength: 1
	};

	function initDiceBox() {
		if (!diceBox) {
			diceBox = new DiceBox('#dice-container', defaultDiceConfig);
			diceBox.initialize();
		}
	}
	// This function will be called from the main component to roll the dice
	/**
	 * @param {any} result
	 * @param {{ name: string; }} diceTheme
	 * @param {any} diceId
	 */
	 export async function roll(result, diceTheme, diceId) {
		if (!diceBox) {
			initDiceBox();
		}

		// Roll the dice associated with the specific player's result
		console.log('Rolling', result, diceTheme, diceId);

        // Update the theme
        diceTheme.name += new Date().getTime().toString();
        diceBox.theme_customColorset = diceTheme;
		await diceBox.loadTheme(diceTheme);

        // Roll the dice
		return diceBox.roll(result);
	}

	onMount(() => {
		initDiceBox();
	});
</script>

<div id="dice-container" class="dice-container" />

<style>
	.dice-container {
		width: 100%;
		height: 100%;
		position: relative;
	}
</style>
