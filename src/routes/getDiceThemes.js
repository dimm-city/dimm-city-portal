/**
 * Retrieves a list of dice themes.
 * @return {Promise<Array<DiceTheme>>} A promise that resolves to an array of dice themes.
 */
export async function getDiceThemes() {
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

/**@type {DiceTheme}*/
export let theme = {
	foreground: '#ffffff',
	background: '#ef1ebf',
	material: 'glass',
	name: 'glass 01',
	texture: 'glass',
	description: '',
	size: 'medium'
};
