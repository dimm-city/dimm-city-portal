<script>
	import { browser } from '$app/environment';

	let { show = $bindable(false), onClose = () => {} } = $props();

	// Tour steps configuration
	const tourSteps = [
		{
			id: 'welcome',
			title: 'Welcome to Dimm City Portal',
			description: 'Your virtual tabletop for epic Dimm City adventures! Let\'s show you around.',
			icon: '👋',
			position: 'center'
		},
		{
			id: 'create-session',
			title: 'Create or Join Sessions',
			description: 'Start your own game as a Dream Master, or join an existing session as a player. Share session links with your group to play together.',
			icon: '🎮',
			position: 'center',
			target: null // Could be enhanced to point to session UI
		},
		{
			id: 'drawing-tools',
			title: 'Drawing & Map Tools',
			description: 'Use the toolbar to draw, add tokens, set backgrounds, and create tactical maps. Perfect for combat encounters and exploration.',
			icon: '🎨',
			position: 'center'
		},
		{
			id: 'tokens',
			title: 'Token Library',
			description: 'Access a library of creature tokens! Click the Tokens button in the toolbar to browse and place characters on your map.',
			icon: '🎭',
			position: 'center'
		},
		{
			id: 'fog-of-war',
			title: 'Fog of War (Dream Masters)',
			description: 'Control what players can see! Press F to paint fog over unexplored areas, R to erase and reveal. Perfect for building suspense as your party explores.',
			icon: '🌫️',
			position: 'center'
		},
		{
			id: 'chat-dice',
			title: 'Chat & Dice Rolling',
			description: 'Communicate with your party using the chat panel and roll dice with our 3D dice roller. Type /roll 2d6 to get started!',
			icon: '🎲',
			position: 'center'
		},
		{
			id: 'keyboard',
			title: 'Keyboard Shortcuts',
			description: 'Press Shift+? anytime to see all available keyboard shortcuts. Speed up your workflow with quick tool switching!',
			icon: '⌨️',
			position: 'center'
		},
		{
			id: 'ready',
			title: 'You\'re Ready!',
			description: 'That\'s all you need to get started. Click "Start Playing" to begin your adventure in Dimm City!',
			icon: '🚀',
			position: 'center'
		}
	];

	// Tour state
	let currentStep = $state(0);
	let tourCompleted = $state(false);

	// Navigation
	function nextStep() {
		if (currentStep < tourSteps.length - 1) {
			currentStep++;
		} else {
			completeTour();
		}
	}

	function prevStep() {
		if (currentStep > 0) {
			currentStep--;
		}
	}

	function skipTour() {
		if (browser) {
			localStorage.setItem('hasSeenTour', 'true');
		}
		onClose();
	}

	function completeTour() {
		tourCompleted = true;
		if (browser) {
			localStorage.setItem('hasSeenTour', 'true');
		}
		// Small delay before closing for better UX
		setTimeout(() => {
			onClose();
		}, 500);
	}

	// Keyboard navigation
	function handleKeydown(event) {
		if (!show) return;

		switch (event.key) {
			case 'ArrowRight':
			case 'Enter':
				event.preventDefault();
				nextStep();
				break;
			case 'ArrowLeft':
				event.preventDefault();
				prevStep();
				break;
			case 'Escape':
				event.preventDefault();
				skipTour();
				break;
		}
	}

	// Derived state
	let currentStepData = $derived(tourSteps[currentStep]);
	let isFirstStep = $derived(currentStep === 0);
	let isLastStep = $derived(currentStep === tourSteps.length - 1);
	let progress = $derived(((currentStep + 1) / tourSteps.length) * 100);
</script>

<svelte:window onkeydown={handleKeydown} />

{#if show}
	<div class="onboarding-overlay" class:completed={tourCompleted}>
		<div class="tour-modal" class:completed={tourCompleted}>
			<!-- Progress bar -->
			<div class="progress-bar">
				<div class="progress-fill" style="width: {progress}%"></div>
			</div>

			<!-- Step counter -->
			<div class="step-counter">
				Step {currentStep + 1} of {tourSteps.length}
			</div>

			<!-- Step content -->
			<div class="step-content">
				<div class="step-icon" class:completed={tourCompleted}>
					{currentStepData.icon}
				</div>
				<h2 class="step-title">{currentStepData.title}</h2>
				<p class="step-description">{currentStepData.description}</p>
			</div>

			<!-- Navigation controls -->
			<div class="tour-controls">
				<button class="btn-skip" onclick={skipTour}>
					{isLastStep ? 'Close' : 'Skip Tour'}
				</button>

				<div class="btn-group">
					{#if !isFirstStep}
						<button class="btn-nav btn-prev" onclick={prevStep}>
							<i class="bi bi-arrow-left"></i>
							Previous
						</button>
					{/if}
					<button class="btn-nav btn-next" onclick={nextStep}>
						{isLastStep ? 'Start Playing' : 'Next'}
						{#if !isLastStep}
							<i class="bi bi-arrow-right"></i>
						{/if}
					</button>
				</div>
			</div>

			<!-- Keyboard hints -->
			<div class="keyboard-hints">
				<span><kbd>←</kbd><kbd>→</kbd> Navigate</span>
				<span><kbd>Enter</kbd> Next</span>
				<span><kbd>Esc</kbd> Skip</span>
			</div>
		</div>
	</div>
{/if}

<style>
	.onboarding-overlay {
		position: fixed;
		inset: 0;
		z-index: 10000;
		background-color: rgba(0, 0, 0, 0.85);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		animation: fadeIn 0.3s ease-out;
	}

	.onboarding-overlay.completed {
		animation: fadeOut 0.3s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes fadeOut {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}

	.tour-modal {
		background-color: var(--color-bg-primary);
		border: 2px solid var(--color-accent-two);
		border-radius: var(--border-radius);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), var(--shadow-accent-two);
		max-width: 600px;
		width: 100%;
		padding: 2rem;
		animation: slideUp 0.4s ease-out;
		position: relative;
	}

	.tour-modal.completed {
		animation: slideDown 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			transform: translateY(30px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@keyframes slideDown {
		from {
			transform: translateY(0) scale(1);
			opacity: 1;
		}
		to {
			transform: translateY(20px) scale(0.95);
			opacity: 0;
		}
	}

	.progress-bar {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background-color: var(--color-secondary);
		border-radius: var(--border-radius) var(--border-radius) 0 0;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--color-accent-one), var(--color-accent-two));
		transition: width 0.3s ease-out;
	}

	.step-counter {
		text-align: center;
		color: var(--color-text-secondary);
		font-size: 0.85rem;
		margin-bottom: 1.5rem;
		font-family: var(--font-mono, monospace);
	}

	.step-content {
		text-align: center;
		margin-bottom: 2rem;
		min-height: 250px;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.step-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		animation: bounce 0.6s ease-out;
	}

	.step-icon.completed {
		animation: celebration 0.6s ease-out;
	}

	@keyframes bounce {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	@keyframes celebration {
		0%, 100% {
			transform: scale(1) rotate(0deg);
		}
		25% {
			transform: scale(1.2) rotate(-5deg);
		}
		75% {
			transform: scale(1.2) rotate(5deg);
		}
	}

	.step-title {
		font-family: var(--font-header);
		font-size: 1.75rem;
		color: var(--color-accent-two);
		margin: 0 0 1rem 0;
		line-height: 1.2;
	}

	.step-description {
		font-size: 1.1rem;
		color: var(--color-text);
		line-height: 1.6;
		margin: 0;
		max-width: 500px;
		margin-inline: auto;
	}

	.tour-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.btn-group {
		display: flex;
		gap: 0.5rem;
	}

	button {
		font-family: var(--font-body);
		padding: 0.75rem 1.5rem;
		border-radius: var(--border-radius);
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
		font-weight: 500;
	}

	.btn-skip {
		background-color: transparent;
		color: var(--color-text-secondary);
		border: 1px solid var(--color-secondary);
	}

	.btn-skip:hover {
		background-color: var(--color-bg-secondary);
		color: var(--color-text);
	}

	.btn-nav {
		background: linear-gradient(135deg, var(--color-accent-one), var(--color-accent-two));
		color: var(--color-bg-primary);
		font-weight: bold;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.btn-nav:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
	}

	.btn-nav:active {
		transform: translateY(0);
	}

	.btn-prev {
		background: var(--color-bg-secondary);
		color: var(--color-text);
		border: 1px solid var(--color-secondary);
	}

	.btn-prev:hover {
		background-color: var(--color-primary);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.keyboard-hints {
		display: flex;
		justify-content: center;
		gap: 1rem;
		flex-wrap: wrap;
		color: var(--color-text-secondary);
		font-size: 0.8rem;
	}

	kbd {
		background-color: var(--color-bg-secondary);
		border: 1px solid var(--color-secondary);
		border-radius: 3px;
		padding: 0.1rem 0.4rem;
		font-family: var(--font-mono, monospace);
		font-size: 0.75rem;
		margin: 0 0.1rem;
	}

	/* Mobile responsive */
	@media (max-width: 767px) {
		.tour-modal {
			padding: 1.5rem 1rem;
		}

		.step-content {
			min-height: 200px;
		}

		.step-icon {
			font-size: 3rem;
		}

		.step-title {
			font-size: 1.4rem;
		}

		.step-description {
			font-size: 1rem;
		}

		.tour-controls {
			flex-direction: column;
		}

		.btn-group {
			width: 100%;
			flex-direction: column;
		}

		.btn-nav,
		.btn-skip {
			width: 100%;
		}

		.keyboard-hints {
			font-size: 0.7rem;
			gap: 0.5rem;
		}
	}

	/* Touch device improvements */
	@media (hover: none) {
		.btn-nav:hover,
		.btn-prev:hover,
		.btn-skip:hover {
			transform: none;
		}

		.btn-nav:active {
			transform: scale(0.98);
		}
	}
</style>
