<script>
	import Portal from '$lib/components/Portal.svelte';
	import { page } from '$app/stores';
	import Notifications from 'svelte-notifications';
	import Alert from '$lib/components/Alert.svelte';
	
	/**
	 * Example of loading portal config from server. See ./page.js for more details
	 */
	export let data;

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
			config={data.portalConfig}
			player={data.player}
			bind:inSession
			bind:sessionId
			sessionMode={$page.url.searchParams?.get('mode')}
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

	:global(body) {
		/* Colors */
		--color-bg-main: #08000f;
		--color-bg-secondary: #190030;
		--color-text: #ffffffe6;
		--color-muted-text: #c4c0c0;
		--color-muted-dark: #4b4b4b;
		--color-dark-overlay: #11111180;
		--color-dark: #000000f2;

		/* Accent Color Palette */
		--color-accent-one: #e6ff00;
		--color-accent-two: #c643ff;
	}
</style>
