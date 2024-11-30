<script>
	import Portal from '$lib/components/Portal.svelte';
	import { page } from '$app/stores';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { player, inSession, sessionMode } from '$lib/components/PortalStore';

	/** @type {{data: any}} */
	let { data } = $props();

	data.portalConfig.portalId = $page.url.searchParams?.get('session') ?? null;
	sessionMode.set($page.url.searchParams?.get('mode') ?? 'create');
	player.set(data.player);
	/** @type {import('@zerodevx/svelte-toast').SvelteToastOptions}*/
	const options = {};
	console.log('Page loaded', data);

	import '$lib/components/styles.css';
	import DiceRoller from '$lib/components/DiceRoller.svelte';
	import { roller } from '$lib/components/DiceStore.js';
</script>

<svelte:head>
	<title>Dimm City Portal</title>

	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
	/>
	<link
		rel="stylesheet"
		href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
	/>
</svelte:head>
<section class:in-session={$inSession}>
	{#if $inSession == false}
		<h1><small>Welcome to the</small>Dimm City Portal</h1>
	{/if}
	<Portal config={data.portalConfig} player={data.player} />
</section>
<DiceRoller bind:this={$roller} />
<SvelteToast {options} />

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
		min-height: 100dvh;
		position: relative;
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
