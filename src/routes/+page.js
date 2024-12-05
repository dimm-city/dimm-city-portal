import { env } from '$env/dynamic/public';
import { getDiceThemes } from './getDiceThemes.js';


export const load = async () => {

	/***
	 * NOTE: The player data could be loaded from a database based 
	 * the logged in user and their profile.
	 */
	/** @type {import('$lib/types.js').Player} */
	let player = {
		name: '',
		diceId: [-1],
		diceTheme: 'default',
		diceThemeConfig: {
			name: 'pink',
			foreground: 'yellow',
			background: '#ef1ebf',
			texture: 'glass',
			description: 'Default pink dice',
			material: 'glass'
		},
		diceThemes: [
			{
				name: 'pink',
				foreground: 'yellow',
				background: '#ef1ebf',
				texture: 'glass',
				description: 'Default pink dice',
				material: 'glass'
			}
		],
		characters: [
			{
				name: 'character name',
				id: -1,
				src: 'bi bi-person'
			}
		],
		token: {
			type: 'icon',
			name: 'character name',
			id: -1,
			src: 'bi bi-person'
		},
		host: false
	};

	/** @type {import("./types.js").PortalConfig} */
	const portalConfig = {
		hubUrl: env.PUBLIC_PORTAL_HUB_URL ?? 'http://localhost:5173/portal-hub',
		allowHubSwitching: false, //If true, the user can switch between hubs in session manager component.
		backgroundImageUrl: '',
		availableDiceThemes: await getDiceThemes(),
		diceOptions: [
			{
				label: '1d20',
				value: '1d20'
			},
			{
				label: '2d20',
				value: '2d20'
			},
			{
				label: 'Lucid',
				value: 'lucid'
			},
			{
				label: 'Surreal',
				value: 'surreal'
			}
		], // TODO: Add ability to have additional custom types of rolls like lucid, surreal, etc.
		diceThemes: [...player.diceThemes] //Note: This allows for custom dice themes to be added from the players profile.
	};

	return {
		portalConfig,
		player
	};
};

export const ssr = false;
export const csr = true;
export const prerender = false;
