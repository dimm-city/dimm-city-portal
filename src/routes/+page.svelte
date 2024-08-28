<script>
	import Portal from '$lib/components/Portal.svelte';
	import { page } from '$app/stores';
	import Notifications from 'svelte-notifications';
	import Alert from '$lib/components/Alert.svelte';

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
	const  diceOptions = [
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
	];
	/**
	 * @type {string}
	 */
	export let sessionName;
	let sessionId = $page.url.searchParams?.get('session') ?? null;
</script>
{#if sessionId == null}
<h1>Welcome to the Dimm City Portal</h1>
{/if}
<Notifications item={Alert} zIndex={999999}>
	<Portal
		bind:sessionName
		{player}
		{diceOptions}
		sessionMode={$page.url.searchParams?.get('mode')}
		bind:sessionId
	/>
</Notifications>
