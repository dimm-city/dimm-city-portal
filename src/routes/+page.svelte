<script>
	import Portal from '$lib/components/Portal.svelte';
	import { page } from '$app/stores';
	import Notifications from 'svelte-notifications';
	import Alert from '$lib/components/Alert.svelte';
	import '$lib/style.css';

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
	const diceOptions = [
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
	let portalHubUrl = 'http://localhost:5173/portal-hub';
	/**
	 * @type {string}
	 */
	export let sessionName;
	let sessionId = $page.url.searchParams?.get('session') ?? null;
</script>
<svelte:head>
	<title>Dimm City Portal</title>
</svelte:head>
{#if sessionId == null}
	<h1><small>Welcome to the</small>Dimm City Portal</h1>
{/if}
<Notifications item={Alert} zIndex={999999}>
	<section>
	<Portal
		{portalHubUrl}
		bind:sessionName
		{player}
		{diceOptions}
		sessionMode={$page.url.searchParams?.get('mode')}
		bind:sessionId
	/>

	</section>
</Notifications>
<style>
	small
	{
		display: block;
		font-size: 0.75rem;
	}
	h1 {
		text-align: center;
		margin-block: 1rem;
	}
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: calc(100vh - 5rem);
	}
</style>