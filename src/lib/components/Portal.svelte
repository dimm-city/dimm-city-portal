<script>
	import Dialog from './Dialog.svelte';
	import SessionManager from './SessionManager.svelte';
	import InitiativeTracker from './InitiativeTracker.svelte';
	import ChatPanel from './ChatPanel.svelte';
	import DemoWelcome from './DemoWelcome.svelte';
	import DiceAnimation from './DiceAnimation.svelte';
	import OnboardingTour from './OnboardingTour.svelte';
	import UserGuide from './UserGuide.svelte';
	import { browser } from '$app/environment';

	import {
		host,
		inSession,
		players,
		showPlayerList,
		sessionId,
		sessionName,
		showSessionDetails,
		sessionPassword,
		currentDiceAnimation,
		showOnboardingTour,
		showUserGuide
	} from './PortalStore';
	import Editor from './editor/Editor.svelte';
	import { isHost } from './PortalStore.js';
	import './theme.css';
	let { config } = $props();

	// Handle dice animation completion
	function handleAnimationComplete() {
		currentDiceAnimation.set(null);
	}

	// Check if current session is the demo session
	let isDemoSession = $derived($sessionId === 'demo-goblin-ambush');
	let showDemoWelcome = $state(false);

	$effect(() => {
		if (isDemoSession && $inSession) {
			showDemoWelcome = true;
		}
	});

	// Check if user has seen the onboarding tour
	$effect(() => {
		if (browser) {
			const hasSeenTour = localStorage.getItem('hasSeenTour');
			if (!hasSeenTour) {
				// Show tour after a short delay for better UX
				setTimeout(() => {
					showOnboardingTour.set(true);
				}, 800);
			}
		}
	});
</script>

<div class="portal-container" class:in-session={$inSession} class:host={$isHost}>
	{#if $inSession == false}
		<SessionManager portalId={config.portalId} />
	{:else if $inSession}
		<Dialog bind:show={$showPlayerList}>
			<div>
				<h4>Players in Session</h4>
				<ul>
					<li>{$host.name} (Dream Master)</li>
					{#each $players as p}
						<li>
							{p.name}
						</li>
					{/each}
				</ul>
			</div>
		</Dialog>
		<Dialog bind:show={$showSessionDetails}>
			<div>
				<h2>{$sessionName}</h2>
				<p>
					ID: {$sessionId}
				</p>
				<p>
					Password: {$sessionPassword ?? '***********'}
				</p>
			</div>
		</Dialog>
		<Editor backgroundImageUrl={config.backgroundImageUrl} />
		<InitiativeTracker />
		<ChatPanel />
		{#if isDemoSession && showDemoWelcome}
			<DemoWelcome onClose={() => (showDemoWelcome = false)} />
		{/if}
	{/if}

	<!-- Dice animation overlay (global, shows even outside of session) -->
	{#if $currentDiceAnimation}
		<DiceAnimation
			diceType={$currentDiceAnimation.diceType}
			result={$currentDiceAnimation.result}
			playerName={$currentDiceAnimation.playerName}
			onComplete={handleAnimationComplete}
		/>
	{/if}

	<!-- Onboarding tour (shown to first-time users) -->
	<OnboardingTour
		bind:show={$showOnboardingTour}
		onClose={() => showOnboardingTour.set(false)}
	/>

	<!-- User Guide (help documentation) -->
	<UserGuide
		bind:show={$showUserGuide}
		onClose={() => showUserGuide.set(false)}
	/>
</div>

<style>
	.portal-container {
		--dc-dialog-backdrop-color: transparent;
	}
	.portal-container.in-session {
		width: 100%;
		height: 100dvh;
	}
</style>
