<script>
	import { page } from '$app/stores';
	import { inSession } from '$lib/components/PortalStore';

	import '$lib/components/styles.css';
	let { children } = $props();
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
<div class="layout-container">
<section class:in-session={$inSession}>
	{@render children()}
</section>
{#if !$inSession}
	<footer>
		<a
			title="GitHub Repository"
			aria-label="GitHub Repository"
			href="https://github.com/dimm-city/dimm-city-portal"
			target="_blank"
		>
			<i class="bi bi-github"></i>
		</a>
		{#if $page.url.pathname === '/'}
			<a aria-label="About Dimm City Portal" title="About Dimm City Portal" href="/about">
				<i class="bi bi-patch-question"></i>
			</a>
		{:else}
			<a aria-label="Dimm City Portal" title="Dimm City Portal" href="/">
				<i class="bi bi-brilliance"></i>
			</a>
		{/if}
		<a
			title="Dimm City Subreddit"
			aria-label="Dimm City Subreddit"
			href="https://github.com/dimm-city/dimm-city-portal"
			target="_blank"
		>
			<i class="bi bi-reddit"></i>
		</a>
	</footer>
{/if}
</div>
<style>
	.layout-container {
		display: grid;
		min-height: 100svh;
		container-type: inline-size;
	}
	section{
		margin-inline: 1rem;
	}
	footer {
		/* position: sticky;
		bottom: 1rem; */
		display: grid;
		grid-auto-flow: column;
		align-items: end;
		gap: 1rem;
		justify-content: center;
		width: 100%;
	}
	footer a:nth-child(2) {
		font-size: 1.5rem;
	}
	footer a {
		color: var(--color-accent-one);
	}
</style>
