<script>
	import Portal from '$lib/components/Portal.svelte';
	import '$lib/components/styles.css';
	import DiceRoller from '$lib/components/DiceRoller.svelte';
	import { page } from '$app/stores';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { player, inSession, roller } from '$lib/components/PortalStore';

	/** @type {{data: any}} */
	let { data } = $props();

	let config = $state(data.portalConfig);
	config.activeSession = { sessionMode: 'create' };
	config.activeSession.portalId = $page.url.searchParams?.get('session') ?? null;
	config.activeSession.sessionMode = $page.url.searchParams?.get('mode') ?? 'create';
	player.set(data.player);

	/** @type {import('@zerodevx/svelte-toast').SvelteToastOptions}*/
	const toastOptions = {
		classes: ['alert']
	};
</script>

<svelte:head>
	<title>Dimm City Portal</title>
</svelte:head>
<section class:in-session={$inSession}>
	{#if $inSession == false}
		<h1><small>Welcome to the</small>Dimm City Portal</h1>
	{/if}
	<Portal config={config}  player={data.player} />
</section>
<DiceRoller bind:this={$roller} />
<SvelteToast options={toastOptions} />

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
		position: relative;
	}
	section.in-session {
		min-height: 100dvh;
	}
	section.in-session::before {
		position: absolute;
		inset: 0;
		content: '';
		background-image: url('/assets/dc-banner-orange.png');
		background-repeat: no-repeat;
		background-position: bottom;
		background-size: 300px auto;
		background-color: rgba(255, 255, 255);
		z-index: -90000;
	}
	@media (prefers-color-scheme: dark) {
		section.in-session::before {
			background-image: url('/assets/dc-banner-yellow.png');
			background-color: rgb(0, 0, 0);
		}
	}
</style>
