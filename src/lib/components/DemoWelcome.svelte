<script>
	import { browser } from '$app/environment';

	let { onClose } = $props();

	let show = $state(true);
	let dontShowAgain = $state(false);

	function handleClose() {
		if (browser && dontShowAgain) {
			localStorage.setItem('dimm-city-demo-seen', 'true');
		}
		show = false;
		if (onClose) onClose();
	}

	// Check if user has seen demo before
	if (browser) {
		const seen = localStorage.getItem('dimm-city-demo-seen');
		if (seen === 'true') {
			show = false;
			if (onClose) onClose();
		}
	}
</script>

{#if show}
	<div class="demo-overlay">
		<div class="demo-modal">
			<div class="demo-header">
				<h2>🎮 Welcome to the Demo!</h2>
				<button
					class="close-btn"
					onclick={handleClose}
					aria-label="Close demo welcome"
					title="Close"
				>
					<i class="bi bi-x-lg"></i>
				</button>
			</div>

			<div class="demo-content">
				<div class="scenario">
					<h3>📖 Scenario: The Goblin Ambush</h3>
					<p>
						Your adventuring party has encountered a group of goblins in a forest clearing.
						The initiative has been rolled, and combat is underway!
					</p>
				</div>

				<div class="features">
					<h3>✨ Try These Features:</h3>
					<ul>
						<li>
							<strong>Initiative Tracker</strong> (right side)
							- See who's turn it is. DMs can advance turns and manage HP.
						</li>
						<li>
							<strong>Dice Roller</strong> (bottom left)
							- Roll d20, 2d6+3, or any dice notation. Watch the 3D animation!
						</li>
						<li>
							<strong>Chat Panel</strong> (bottom right)
							- Communicate with your party. System messages appear for game events.
						</li>
						<li>
							<strong>Drawing Tools</strong> (toolbar)
							- Add shapes, text, or freehand drawings to the canvas.
						</li>
						<li>
							<strong>Scene Save/Load</strong> (toolbar)
							- Save your progress and load it later. Auto-saves every 5 minutes!
						</li>
					</ul>
				</div>

				<div class="demo-info">
					<h3>ℹ️ Demo Session Info:</h3>
					<div class="info-grid">
						<div class="info-item">
							<span class="label">Session ID:</span>
							<code>demo-goblin-ambush</code>
						</div>
						<div class="info-item">
							<span class="label">Password:</span>
							<code>demo123</code>
						</div>
						<div class="info-item">
							<span class="label">Your Role:</span>
							<span>Player (read-only for combat tracker)</span>
						</div>
					</div>
					<p class="note">
						💡 <strong>Tip:</strong> This is a shared demo. Other users might be here too!
						For your own private session, create a new one from the homepage.
					</p>
				</div>

				<div class="quick-actions">
					<h3>🚀 Quick Actions:</h3>
					<div class="action-buttons">
						<button class="action-btn" onclick={() => window.dispatchEvent(new CustomEvent('demo-roll-dice'))}>
							🎲 Roll a d20
						</button>
						<button class="action-btn" onclick={() => window.dispatchEvent(new CustomEvent('demo-open-chat'))}>
							💬 Open Chat
						</button>
						<button class="action-btn" onclick={() => window.dispatchEvent(new CustomEvent('demo-highlight-initiative'))}>
							⚔️ Show Initiative
						</button>
					</div>
				</div>
			</div>

			<div class="demo-footer">
				<label class="checkbox-label">
					<input type="checkbox" bind:checked={dontShowAgain} />
					Don't show this again
				</label>
				<button class="start-btn" onclick={handleClose}>
					Start Demo
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.demo-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
		padding: 1rem;
		backdrop-filter: blur(4px);
	}

	.demo-modal {
		background-color: var(--color-bg-primary);
		border: 2px solid var(--color-accent-one);
		border-radius: var(--border-radius);
		max-width: 700px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
	}

	.demo-header {
		background-color: var(--color-accent-one);
		color: var(--color-bg-primary);
		padding: 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 2px solid var(--color-accent-two);
	}

	.demo-header h2 {
		margin: 0;
		font-size: 1.5rem;
	}

	.close-btn {
		background: transparent;
		border: none;
		color: var(--color-bg-primary);
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		opacity: 0.8;
		transition: opacity 0.2s;
	}

	.close-btn:hover {
		opacity: 1;
	}

	.demo-content {
		padding: 1.5rem;
	}

	.scenario,
	.features,
	.demo-info,
	.quick-actions {
		margin-bottom: 1.5rem;
	}

	.scenario h3,
	.features h3,
	.demo-info h3,
	.quick-actions h3 {
		margin: 0 0 0.75rem 0;
		color: var(--color-accent-one);
		font-size: 1.2rem;
	}

	.scenario p {
		color: var(--color-primary-text);
		line-height: 1.6;
	}

	.features ul {
		margin: 0;
		padding-left: 1.5rem;
	}

	.features li {
		margin-bottom: 0.75rem;
		color: var(--color-primary-text);
		line-height: 1.5;
	}

	.features li strong {
		color: var(--color-accent-two);
	}

	.info-grid {
		display: grid;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.info-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.info-item .label {
		font-weight: bold;
		color: var(--color-primary-text);
		min-width: 100px;
	}

	.info-item code {
		background-color: var(--color-bg-secondary);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-family: monospace;
		color: var(--color-accent-two);
	}

	.note {
		background-color: var(--color-bg-secondary);
		padding: 0.75rem;
		border-left: 3px solid var(--color-accent-two);
		border-radius: 4px;
		font-size: 0.9rem;
		color: var(--color-primary-text);
	}

	.action-buttons {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.action-btn {
		flex: 1;
		min-width: 150px;
		padding: 0.75rem 1rem;
		background-color: var(--color-bg-secondary);
		border: 1px solid var(--color-accent-two);
		border-radius: var(--border-radius);
		color: var(--color-primary-text);
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.action-btn:hover {
		background-color: var(--color-accent-two);
		color: var(--color-bg-primary);
		transform: translateY(-2px);
	}

	.demo-footer {
		padding: 1.5rem;
		border-top: 1px solid var(--color-accent-two);
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: var(--color-bg-secondary);
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-primary-text);
		font-size: 0.9rem;
		cursor: pointer;
	}

	.checkbox-label input[type="checkbox"] {
		cursor: pointer;
	}

	.start-btn {
		padding: 0.75rem 2rem;
		background-color: var(--color-accent-one);
		color: var(--color-bg-primary);
		border: none;
		border-radius: var(--border-radius);
		font-size: 1rem;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s;
	}

	.start-btn:hover {
		background-color: var(--color-accent-two);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
	}

	/* Mobile responsive */
	@media (max-width: 767px) {
		.demo-modal {
			max-width: 100%;
			max-height: 100vh;
			border-radius: 0;
		}

		.demo-header h2 {
			font-size: 1.2rem;
		}

		.demo-content {
			padding: 1rem;
		}

		.action-buttons {
			flex-direction: column;
		}

		.action-btn {
			min-width: 100%;
		}

		.demo-footer {
			flex-direction: column;
			gap: 1rem;
		}

		.start-btn {
			width: 100%;
		}
	}
</style>
