<script>
	import Portal from '$lib/Portal/Portal.svelte';
	import { page } from '$app/stores';
	import Notifications from 'svelte-notifications';
	import Alert from '$lib/Portal/Alert.svelte';

	/** @type {DC.PortalPlayer} */
	let player = {
		name: '',
		diceTheme: 'default',
		diceThemeConfig: {
			name: 'pink',
			foreground: 'yellow',
			background: '#ef1ebf',
			texture: 'glass',
			description: 'Default pink dice',
			material: 'glass'
		},
		diceId: [-1],
		token: {
			type: 'icon',
			name: 'character name',
			id: -1,
			src: 'bi bi-person'
		},
		host: false
	};
	/**
	 * @type {string}
	 */
	export let sessionName;
	let sessionId = $page.url.searchParams?.get('session') ?? null;
</script>

<h1>Welcome to the Dimm City Portal</h1>

<Notifications item={Alert} zIndex={999999}>
	<Portal
		bind:sessionName
		{player}
		sessionMode={$page.url.searchParams?.get('mode')}
		bind:sessionId
	/>
</Notifications>
