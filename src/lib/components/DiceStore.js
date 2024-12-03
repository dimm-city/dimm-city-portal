import { getDiceThemes } from './getDiceThemes';
import { getLocalValue, setLocalValue } from './StoreUtils';
import { derived, get, writable } from 'svelte/store';
import { showAlert } from './StoreUtils.js';
export let showDiceConfig = writable(false);

/** @type {import("svelte/store").Writable<DiceTheme[]>} */
export const availableDiceThemes = writable([]);

/** @type{DiceTheme} */
const defaultDiceTheme = {
	foreground: '#ffffff',
	background: '#ef1ebf',
	material: 'glass',
	name: 'glass 01',
	texture: 'glass',
	description: '',
	size: 'medium'
};
/** @type {import("svelte/store").Writable<DiceTheme>} */
export let selectedDiceTheme = writable(getLocalValue('selectedDiceTheme') ?? defaultDiceTheme);
selectedDiceTheme.subscribe((value) => {
	setLocalValue('selectedDiceTheme', value);
});

export async function loadAvailableDiceThemes() {
	const themes = await getDiceThemes();
	availableDiceThemes.set(themes);
	if (!themes.some((t) => t.name === get(selectedDiceTheme).name)) {
		// if the current theme is not in the list, set it to the first one
		selectedDiceTheme.set(defaultDiceTheme);
	}
}

export let lastRoll = writable('awaiting roll');
export let lastRollNumber = writable(null);
export let diceNotation = writable('1d20');
export let diceModifier = writable('');
export let diceRollType = writable('success');

export const diceString = derived([diceModifier, diceRollType], ([modifier, diceType]) => {
	let output = '1d20';

	if (diceType === '') {
		output = '1d20';
	} else if (diceType === '2d20') {
		output = '2d20';
	} else {
		if (modifier === '') {
			output = `1d20{${diceType}}`;
		} else {
			output = `2d20{${diceType}}`;
		}
	}
	if (modifier !== '') {
		output += `{${modifier}}`;
	}
	return output;
});

/**
 * @type {import('svelte/store').Writable<import('$lib/components/DiceRoller.svelte').default>}
 */
export let roller = writable();
export let rolling = writable(false);

export let clearDiceDelay = writable(500);
export let showDiceResultToast = writable(true);

export async function rollDice() {
	console.log('rolling...');

	const rollerInstance = get(roller);

	if (get(rolling) || !rollerInstance) return;

	rollerInstance.clear();
	rolling.set(true);
	let theme = get(selectedDiceTheme);
	let notation = get(diceString);
	// let modifier = get(diceModifier);
	// let diceType = get(diceRollType);

	// if (diceType === '') {
	// 	notation = '1d20';
	// } else if (diceType === '2d20') {
	// 	notation = '2d20';
	// } else {
	// 	if (modifier === '') {
	// 		notation = `1d20{${diceType}}`;
	// 	} else {
	// 		notation = `2d20{${diceType}}`;
	// 	}
	// }
	// if (modifier !== '') {
	// 	notation += `{${modifier}}`;
	// }

	setTimeout(async () => {
		processDiceResult(notation, theme);
	}, 500);
}

/**
 * @param {string} diceString
 * @param {DiceTheme} theme
 */
export async function processDiceResult(diceString, theme) {
	rolling.set(true);
	const rollerInstance = get(roller);

	const result = await rollerInstance.roll(diceString, theme, -1);
	console.log('Result', result);

	let resultNumber = result.total ?? 0;
	let outcome = '';
	if (result.notation.includes('{l}')) {
		// @ts-ignore
		resultNumber = Math.max(...result.sets.flatMap((s) => s.rolls).map((r) => r.value));
	} else if (result.notation.includes('{s}')) {
		// @ts-ignore
		resultNumber = Math.min(...result.sets.flatMap((s) => s.rolls).map((r) => r.value));
	}

	console.log('calc output');

	if (result.notation.includes('{success}')) {
		if (resultNumber === 20) {
			outcome = 'lucid success';
			diceModifier.set('l');
		} else if (resultNumber >= 11 && resultNumber < 20) {
			outcome = 'success';
		} else if (resultNumber >= 6 && resultNumber < 11) {
			outcome = 'success with cost';
		} else if (resultNumber >= 2 && resultNumber < 6) {
			outcome = 'failure';
		} else if (resultNumber === 1) {
			outcome = 'surreal failure';
			diceModifier.set('s');
		}
	}

	let delay = get(clearDiceDelay);
	setTimeout(() => {
		lastRollNumber.set(resultNumber);
		lastRoll.set(`${outcome} (${resultNumber})`);
		rolling.set(false);
		if (get(showDiceResultToast))
			showAlert(`${outcome} (${resultNumber})`);
	}, delay);
}
