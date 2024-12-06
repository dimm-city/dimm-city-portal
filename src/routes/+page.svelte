<script>
	import Portal from '$lib/components/Portal.svelte';
	import '$lib/components/styles.css';
	import DiceRoller from '$lib/components/DiceRoller.svelte';
	import { page } from '$app/stores';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { portal } from '$lib/components/Portal.svelte.js';

	/** @type {{data: any}} */
	let { data } = $props();
	
	portal.session.id = $page.url.searchParams?.get('session') ?? null;
	portal.session.mode = $page.url.searchParams?.get('mode') ?? 'create';

	portal.config = { ...portal.config, ...data.config };
	portal.player = data.player;
</script>

<svelte:head>
	<title>Dimm City Portal</title>
</svelte:head>
<section class:in-session={portal.session.mode == 'active'}>
	{#if portal.session.mode != 'active'}
		<h1><small>Welcome to the</small>Dimm City Portal</h1>
	{/if}
	<Portal />
</section>
<DiceRoller bind:this={portal.ui.diceBox} />
<SvelteToast options={portal.config.toast} />

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
