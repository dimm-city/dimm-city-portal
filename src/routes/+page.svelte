<script>
	import Portal from '$lib/components/Portal.svelte';
	import { page } from '$app/stores';
	import { SvelteToast, toast } from '@zerodevx/svelte-toast';
	import { player, inSession, sessionMode, handleJoinSession } from '$lib/components/PortalStore';

	/** @type {{data: any}} */
	let { data } = $props();

	data.portalConfig.portalId = $page.url.searchParams?.get('session') ?? null;
	sessionMode.set($page.url.searchParams?.get('mode') ?? 'create');
	player.set(data.player);
	/** @type {import('@zerodevx/svelte-toast').SvelteToastOptions}*/
	const options = {
		classes: ['alert']
	};
	console.log('Page loaded', data);

	import '$lib/components/styles.css';
	import DiceRoller from '$lib/components/DiceRoller.svelte';
	import { roller } from '$lib/components/DiceStore.js';

	let loadingDemo = $state(false);

	async function joinDemo() {
		loadingDemo = true;
		try {
			const response = await fetch('/api/demo', { method: 'POST' });
			const result = await response.json();

			if (result.success) {
				// Set player name to a guest name if not already set
				if (!$player?.name) {
					const guestId = Math.floor(Math.random() * 10000);
					player.set({ name: `Guest-${guestId}`, host: false });
				}

				// Join the demo session
				const sessionData = {
					sessionId: result.sessionId,
					password: result.password,
					player: $player
				};

				handleJoinSession(sessionData);
			} else {
				toast.push('Failed to create demo session', { classes: ['error'] });
			}
		} catch (error) {
			console.error('Demo session error:', error);
			toast.push('Failed to create demo session', { classes: ['error'] });
		} finally {
			loadingDemo = false;
		}
	}
</script>

<svelte:head>
	<title>Dimm City Portal</title>
</svelte:head>
<section class:in-session={$inSession}>
	{#if $inSession == false}
		<div class="welcome-header">
			<h1><small>Welcome to the</small>Dimm City Portal</h1>
			<div class="demo-banner">
				<p class="demo-description">
					Want to try the VTT features right away? Join our pre-configured demo session!
				</p>
				<button
					class="demo-button"
					onclick={joinDemo}
					disabled={loadingDemo}
					aria-label="Try demo session"
				>
					{loadingDemo ? '⏳ Loading Demo...' : '🎮 Try Demo Session'}
				</button>
			</div>
		</div>
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

	.welcome-header {
		text-align: center;
		padding-inline: 1rem;
	}

	.demo-banner {
		max-width: 600px;
		margin: 0 auto 2rem;
		padding: 1.5rem;
		background: var(--color-bg-secondary-transparent);
		border: 2px solid var(--color-accent-two);
		border-radius: var(--border-radius);
		backdrop-filter: var(--filter-backdrop);
		box-shadow: var(--shadow-accent-two);
	}

	.demo-description {
		margin: 0 0 1rem 0;
		color: var(--color-primary-text);
		font-size: 1rem;
		line-height: 1.5;
	}

	.demo-button {
		font-family: var(--font-header);
		font-size: 1.1rem;
		padding: 0.875rem 2rem;
		background: linear-gradient(135deg, var(--color-accent-one), var(--color-accent-two));
		color: var(--color-bg-primary);
		border: none;
		border-radius: var(--border-radius);
		cursor: pointer;
		transition: all 0.3s ease;
		font-weight: bold;
		box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
	}

	.demo-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
	}

	.demo-button:active:not(:disabled) {
		transform: translateY(0);
	}

	.demo-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
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

	/* Mobile responsive */
	@media (max-width: 767px) {
		.demo-banner {
			padding: 1rem;
			margin-bottom: 1.5rem;
		}

		.demo-description {
			font-size: 0.9rem;
		}

		.demo-button {
			font-size: 1rem;
			padding: 0.75rem 1.5rem;
			width: 100%;
		}
	}
</style>
