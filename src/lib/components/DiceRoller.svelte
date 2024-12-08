<script>
	import DiceBox from '@3d-dice/dice-box-threejs';
	import { portal } from './Portal.svelte.js';
	import { onMount } from 'svelte';

	let initialized = false;

	function initDiceBox() {
		if (initialized && portal.ui.diceBox != null) return;
		const diceSize = portal.player.selectedDiceTheme?.size ?? 'medium';
		let diceSizeModifier = diceSize === 'large' ? 90 : diceSize === 'medium' ? 50 : 0;
		let scale = diceSizeModifier + (window.innerWidth > 500 ? 100 : 90);
		portal.config.dice.config.baseScale = scale;
		console.log('Initializing dice box...', portal.config.dice.config);
		portal.ui.diceBox = new DiceBox('#dice-container', portal.config.dice.config);
		portal.ui.diceBox.initialize();
		initialized = true;
	}
	
	/**
	 * @param {any} result
	 * @param {{ name: string; }} diceTheme
	 * @param {any} diceId
	 */
	export async function roll(result, diceTheme, diceId) {
		portal.ui.rolling = true;
		initDiceBox();

		if (!diceTheme) diceTheme = portal.config.dice.config.theme_customColorset;

		const diceSize = portal.player.selectedDiceTheme?.size ?? 'medium';

		let diceSizeModifier =
			diceSize === 'x-large' ? 130 : diceSize === 'large' ? 90 : diceSize === 'medium' ? 50 : 0;
		let scale = diceSizeModifier + (window.innerWidth > 500 ? 100 : 90);
		// Roll the dice associated with the specific player's result
		console.log('Rolling', result, diceTheme, diceId);

		// Update the theme
		diceTheme.name += new Date().getTime().toString();
		//FIXME: figure out scaling dice properly
		//diceTheme.scale = scale;
		portal.ui.diceBox.theme_customColorset = diceTheme;
		//portal.ui.diceBox.DiceFactory.updateConfig({baseScale: scale, scale: true});
		await portal.ui.diceBox.loadTheme(diceTheme);
		await portal.ui.diceBox.resizeWorld();
		// Roll the dice
		const output = await portal.ui.diceBox.roll(result);

		portal.ui.rolling = false;
		return output;
	}

	export function clear() {
		if (portal.ui.diceBox) portal.ui.diceBox.clearDice();
	}

	onMount(() => {
		initDiceBox();
	});
</script>

<div id="dice-container" class="dice-container" class:rolling={portal.ui.rolling}></div>

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
