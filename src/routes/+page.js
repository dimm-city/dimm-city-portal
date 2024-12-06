import { env } from '$env/dynamic/public';

export const load = async () => {

	/***
	 * NOTE: The player data could be loaded from a database based 
	 * the logged in user and their profile.
	 */
	/** @type {import('$lib/_remove/types.js').Player} */
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


 async function getDiceThemes() {
	/** @type DiceTheme */
	let theme = {
		foreground: '#ffffff',
		background: '#ef1ebf',
		material: 'glass',
		name: 'glass 01',
		texture: 'glass',
		description: '',
		size: 'medium'
	};
	return new Promise((resolve) => {
		resolve([
			{
				foreground: '#ffffff',
				background: '#ef1ebf',
				material: 'glass',
				name: 'glass 01',
				texture: 'glass',
				description: '',
				size: 'medium'
			},
			{
				foreground: '#fbd40e',
				background: '#4b1b40',
				material: 'glass',
				name: 'dark royalty',
				texture: 'glass',
				description: '',
				size: 'xl'
			},
			{
				foreground: '#fbd40e',
				background: '#4f4f4f',
				material: 'metal',
				name: 'silver',
				texture: 'metal',
				description: '',
				size: 'medium'
			},
			{
				foreground: '#ff8300',
				background: '#0f01cb',
				material: 'glass',
				name: 'bluran',
				texture: 'glass',
				description: '',
				size: 'large'
			},
			{
				foreground: '#0f01cb',
				background: '#ff8300',
				material: 'plastic',
				name: 'orue3',
				texture: 'metal',
				description: '',
				size: 'large'
			},
			{
				name: 'brass',
				foreground: '#ffffff',
				background: '#ff8300',
				material: 'metal',
				texture: 'metal',
				description: '',
				size: 'medium'
			},
			{
				name: 'daisy',
				foreground: '#cfa33b',
				background: '#ffffff',
				material: 'plastic',
				texture: 'glass',
				description: '',
				size: 'medium'
			},
			{
				name: 'uv 666',
				foreground: '#790c0c',
				background: '#ffffff',
				material: 'plastic',
				texture: 'glass',
				description: '',
				size: 'medium'
			}
		]);
	});
}
