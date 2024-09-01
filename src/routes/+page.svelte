<script>
	import Portal from '$lib/components/Portal.svelte';
	import { page } from '$app/stores';
	import Notifications from 'svelte-notifications';
	import Alert from '$lib/components/Alert.svelte';
	import '$lib/style.css';
	import { env } from '$env/dynamic/public';
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
	let portalHubUrl = env.PUBLIC_PORTAL_HUB_URL ?? 'http://localhost:5173/portal-hub';
	/**
	 * @type {string}
	 */
	export let sessionName;
	let sessionId = $page.url.searchParams?.get('session') ?? null;	
	let inSession;
</script>

<svelte:head>
	<title>Dimm City Portal</title>

	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
	/>
	<!-- <link rel="stylesheet" type="text/css" href="https://unpkg.com/augmented-ui@2/augmented-ui.min.css"> -->
	<link
		rel="stylesheet"
		href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
	/>
</svelte:head>
<Notifications item={Alert} zIndex={999999}>
	<section>
		{#if inSession == false}
			<h1><small>Welcome to the</small>Dimm City Portal</h1>
		{/if}
		<Portal
			{portalHubUrl}
			bind:sessionName
			bind:inSession
			bind:sessionId
			sessionMode={$page.url.searchParams?.get('mode')}
			{player}
			{diceOptions}
		/>
	</section>
</Notifications>

<style>
	small {
		display: block;
		font-size: 0.5rem;
	}
	h1 {
		text-align: center;
		margin-block: 1.5rem;
	}
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
</style>
