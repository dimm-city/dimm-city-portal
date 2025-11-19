<script>
	import { page } from '$app/stores';
	import { inSession } from '$lib/components/PortalStore';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	import '$lib/components/styles.css';
	let { children } = $props();

	// Register service worker for PWA support
	onMount(() => {
		if (browser && 'serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js')
				.then(registration => {
					console.log('Service Worker registered:', registration);
				})
				.catch(error => {
					console.log('Service Worker registration failed:', error);
				});
		}
	});
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
<ErrorBoundary>
	<div class="layout-container">
		<section class:in-session={$inSession}>
			{@render children()}
		</section>
		{#if !$inSession}
			<footer>
				<div class="footer-links">
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
				</div>
				<div class="footer-theme">
					<ThemeToggle />
				</div>
			</footer>
		{/if}
	</div>
</ErrorBoundary>

<style>
	.layout-container {
		display: grid;
		min-height: 100svh;
		container-type: inline-size;
	}

	footer {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2rem;
		padding: 1rem;
		flex-wrap: wrap;
	}

	.footer-links {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.footer-links a:nth-child(2) {
		font-size: 1.5rem;
	}

	.footer-links a {
		color: var(--color-accent-one);
		transition: all var(--transition-speed);
	}

	.footer-links a:hover {
		transform: scale(1.1);
	}

	.footer-theme {
		display: flex;
		align-items: center;
	}

	@media (max-width: 640px) {
		footer {
			flex-direction: column;
			gap: 1rem;
		}
	}
</style>
