<script>
	import Dialog from './Dialog.svelte';
	import { shortcuts, formatShortcut } from '$lib/stores/keyboardShortcuts.js';

	let { show = $bindable(false), onClose = () => {} } = $props();

	// Guide sections/tabs
	const sections = [
		{ id: 'getting-started', label: 'Getting Started', icon: 'bi-rocket-takeoff' },
		{ id: 'dm-guide', label: 'For Dream Masters', icon: 'bi-star' },
		{ id: 'player-guide', label: 'For Players', icon: 'bi-people' },
		{ id: 'keyboard', label: 'Keyboard Shortcuts', icon: 'bi-keyboard' },
		{ id: 'faq', label: 'FAQ', icon: 'bi-question-circle' },
		{ id: 'troubleshooting', label: 'Troubleshooting', icon: 'bi-wrench' }
	];

	let activeSection = $state('getting-started');

	// FAQ data
	const faqs = [
		{
			question: 'How do I create a session?',
			answer: 'Click "Create Session" on the home page, set a password, and click "Start Session". You\'ll get a shareable link to send to your players.'
		},
		{
			question: 'How do I join a session?',
			answer: 'Either click the session link your Dream Master sent you, or click "Join Session" and enter the session ID and password.'
		},
		{
			question: 'Can players see what the DM draws?',
			answer: 'Yes! All drawing, tokens, and map changes sync in real-time to all players in the session.'
		},
		{
			question: 'How do I add tokens to the map?',
			answer: 'Click the "Tokens" button in the toolbar (or press T), browse the token library, and click any token to add it to the map.'
		},
		{
			question: 'How do I roll dice?',
			answer: 'Use the chat panel and type "/roll" followed by your dice expression. Example: "/roll 2d6+3" or "/roll 1d20"'
		},
		{
			question: 'Is my session data saved?',
			answer: 'Yes! Session data including the map, tokens, and initiative tracker is automatically saved. You can also manually save scenes.'
		},
		{
			question: 'How many players can join a session?',
			answer: 'The portal supports multiple players per session. Performance is optimized for typical gaming groups (4-8 players).'
		},
		{
			question: 'Can I use custom maps?',
			answer: 'Currently, you can select from the built-in map library. Custom map upload is planned for a future release.'
		}
	];

	// Troubleshooting issues
	const troubleshooting = [
		{
			issue: 'Session won\'t connect',
			solutions: [
				'Check your internet connection',
				'Verify the session ID and password are correct',
				'Try refreshing the page',
				'Make sure the session is still active (not ended by the DM)'
			]
		},
		{
			issue: 'Drawing isn\'t appearing for other players',
			solutions: [
				'Check if you have an active internet connection',
				'Verify all players are in the same session',
				'Try refreshing the page for all players',
				'Check the browser console for connection errors'
			]
		},
		{
			issue: 'Dice rolls not showing',
			solutions: [
				'Verify your dice expression syntax (e.g., "2d6" not "2 d6")',
				'Make sure you\'re in an active session',
				'Check if animations are enabled in settings',
				'Try a simple roll like "1d20" to test'
			]
		},
		{
			issue: 'Can\'t see the toolbar',
			solutions: [
				'Make sure you\'re in an active session (not on the home screen)',
				'Try zooming out if your browser zoom is too high',
				'Check if your browser window is wide enough',
				'Refresh the page'
			]
		},
		{
			issue: 'Performance is slow',
			solutions: [
				'Close other browser tabs to free up memory',
				'Disable browser extensions that might interfere',
				'Try using a different browser (Chrome or Firefox recommended)',
				'Clear your browser cache',
				'Reduce the number of tokens on the map'
			]
		}
	];

	function handleDialogClose() {
		show = false;
		onClose();
	}

	// Group shortcuts by category
	const shortcutsByCategory = $derived.by(() => {
		const categories = {};
		for (const [id, shortcut] of Object.entries(shortcuts)) {
			const cat = shortcut.category;
			if (!categories[cat]) categories[cat] = [];
			categories[cat].push({ id, ...shortcut });
		}
		return categories;
	});
</script>

<Dialog {show} title="User Guide" on:close={handleDialogClose}>
	<div class="user-guide">
		<!-- Tab navigation -->
		<nav class="guide-tabs">
			{#each sections as section}
				<button
					class="tab-btn"
					class:active={activeSection === section.id}
					onclick={() => activeSection = section.id}
				>
					<i class="bi {section.icon}"></i>
					<span class="tab-label">{section.label}</span>
				</button>
			{/each}
		</nav>

		<!-- Content area -->
		<div class="guide-content">
			<!-- Getting Started -->
			{#if activeSection === 'getting-started'}
				<section class="guide-section">
					<h2>Getting Started with Dimm City Portal</h2>

					<div class="content-block">
						<h3>Welcome!</h3>
						<p>
							Dimm City Portal is your virtual tabletop for epic Dimm City RPG adventures.
							Whether you're a Dream Master running the game or a player exploring the creaturepunk
							world, this guide will help you get started.
						</p>
					</div>

					<div class="content-block">
						<h3>Quick Start</h3>
						<ol class="guide-steps">
							<li>
								<strong>Create or Join a Session</strong>
								<p>Dream Masters create sessions, players join using the session link or ID.</p>
							</li>
							<li>
								<strong>Explore the Interface</strong>
								<p>The toolbar provides access to drawing tools, maps, tokens, and more.</p>
							</li>
							<li>
								<strong>Use the Chat & Dice</strong>
								<p>Communicate with your group and roll dice using the chat panel.</p>
							</li>
							<li>
								<strong>Start Playing!</strong>
								<p>Draw maps, place tokens, track initiative, and tell your story.</p>
							</li>
						</ol>
					</div>

					<div class="content-block">
						<h3>Key Features</h3>
						<ul class="feature-list">
							<li><i class="bi bi-pencil"></i> Real-time collaborative drawing</li>
							<li><i class="bi bi-map"></i> Built-in map library</li>
							<li><i class="bi bi-person-bounding-box"></i> Token library with creatures</li>
							<li><i class="bi bi-dice-5"></i> Integrated dice roller with 3D animations</li>
							<li><i class="bi bi-chat-dots"></i> Group chat system</li>
							<li><i class="bi bi-list-ol"></i> Initiative tracker for combat</li>
						</ul>
					</div>
				</section>
			{/if}

			<!-- DM Guide -->
			{#if activeSection === 'dm-guide'}
				<section class="guide-section">
					<h2>Guide for Dream Masters</h2>

					<div class="content-block">
						<h3>Creating a Session</h3>
						<ol class="guide-steps">
							<li>Click <strong>"Create Session"</strong> on the home page</li>
							<li>Enter a session name and set a password</li>
							<li>Click <strong>"Start Session"</strong></li>
							<li>Share the session URL with your players (click "Copy Session Link")</li>
						</ol>
					</div>

					<div class="content-block">
						<h3>Managing the Map</h3>
						<ul class="guide-steps">
							<li>
								<strong>Setting a Background Map</strong>
								<p>Click the Maps button in the toolbar to browse and select a map.</p>
							</li>
							<li>
								<strong>Drawing Tools</strong>
								<p>Use the toolbar to switch between Hand (pan), Select, Draw, Erase, and Text tools.</p>
							</li>
							<li>
								<strong>Adding Tokens</strong>
								<p>Click the Tokens button to open the token library and place creatures on the map.</p>
							</li>
						</ul>
					</div>

				<div class="content-block">
					<h3>Fog of War</h3>
					<p>
						Control what your players can see with the fog of war system. Paint dark fog over areas
						of the map to hide unexplored regions, then erase fog to reveal areas as players explore.
					</p>
					<ul class="guide-steps">
						<li>
							<strong>Paint Fog</strong>
							<p>Press <kbd>F</kbd> to enable paint mode, then drag over the map to add fog. This hides the map beneath from players.</p>
						</li>
						<li>
							<strong>Erase Fog</strong>
							<p>Press <kbd>R</kbd> to enable erase mode, then drag to reveal hidden areas as players explore.</p>
						</li>
						<li>
							<strong>Toggle Visibility</strong>
							<p>Press <kbd>Ctrl+H</kbd> to temporarily hide/show all fog. Useful for DM preparation and checking what players see.</p>
						</li>
						<li>
							<strong>Clear All Fog</strong>
							<p>Click the "Clear Fog" button in the fog toolbar to remove all fog at once.</p>
						</li>
						<li>
							<strong>Adjust Brush Size</strong>
							<p>Use the brush size slider to paint/erase larger or smaller areas efficiently.</p>
						</li>
					</ul>
					<p>
						<strong>Note:</strong> Dream Masters see fog as semi-transparent so you can still see the map beneath.
						Players see fog as completely opaque black. Fog data is automatically saved with your session.
					</p>
				</div>

					<div class="content-block">
						<h3>Running Combat</h3>
						<ol class="guide-steps">
							<li>Open the Initiative Tracker panel</li>
							<li>Click <strong>"Add Combatant"</strong> for each creature/player</li>
							<li>Enter their name, initiative roll, HP, and AC</li>
							<li>Click <strong>"Start Combat"</strong> to begin</li>
							<li>Use <strong>"Next Turn"</strong> to advance through the initiative order</li>
							<li>Click <strong>"End Combat"</strong> when the encounter is over</li>
						</ol>
					</div>

					<div class="content-block">
						<h3>Saving Scenes</h3>
						<p>
							Press <kbd>Ctrl+S</kbd> to save the current scene. Your session data is also
							auto-saved periodically, but manual saves ensure important moments are preserved.
						</p>
					</div>

					<div class="content-block">
						<h3>DM Tips</h3>
						<ul>
							<li>Prepare maps and tokens before the session for smooth gameplay</li>
							<li>Use the chat to share important information with all players</li>
							<li>Keyboard shortcuts (press Shift+?) speed up your workflow</li>
							<li>You can update HP/AC during combat by clicking on combatants</li>
						</ul>
					</div>
				</section>
			{/if}

			<!-- Player Guide -->
			{#if activeSection === 'player-guide'}
				<section class="guide-section">
					<h2>Guide for Players</h2>

					<div class="content-block">
						<h3>Joining a Session</h3>
						<ol class="guide-steps">
							<li>Click the session link your Dream Master sent you, OR</li>
							<li>Click <strong>"Join Session"</strong> on the home page</li>
							<li>Enter the session ID and password</li>
							<li>Enter your character name</li>
							<li>Click <strong>"Join"</strong></li>
						</ol>
					</div>

					<div class="content-block">
						<h3>Using the Interface</h3>
						<ul class="guide-steps">
							<li>
								<strong>View the Map</strong>
								<p>Use the Hand tool (Space bar) to pan around. Scroll to zoom in/out.</p>
							</li>
							<li>
								<strong>Chat with the Group</strong>
								<p>Use the chat panel to communicate with other players and the DM.</p>
							</li>
							<li>
								<strong>Roll Dice</strong>
								<p>In the chat, type "/roll" followed by your dice (e.g., "/roll 2d6+3").</p>
							</li>
							<li>
								<strong>Track Initiative</strong>
								<p>View the initiative tracker to see turn order during combat.</p>
							</li>
						</ul>
					</div>

					<div class="content-block">
						<h3>Drawing & Tools</h3>
						<p>
							As a player, you can use the drawing tools to mark the map, measure distances,
							or highlight areas. Your DM controls the main map and tokens.
						</p>
						<ul>
							<li>Press <kbd>V</kbd> to select objects</li>
							<li>Press <kbd>D</kbd> to draw</li>
							<li>Press <kbd>E</kbd> to erase</li>
							<li>Press <kbd>T</kbd> to add text</li>
						</ul>
					</div>

					<div class="content-block">
						<h3>Player Tips</h3>
						<ul>
							<li>Keep the chat panel open to stay informed</li>
							<li>Use specific dice expressions for accuracy ("/roll 1d20+5")</li>
							<li>You can see all keyboard shortcuts by pressing Shift+?</li>
							<li>Ask your DM if you need help with any features!</li>
						</ul>
					</div>
				</section>
			{/if}

			<!-- Keyboard Shortcuts -->
			{#if activeSection === 'keyboard'}
				<section class="guide-section">
					<h2>Keyboard Shortcuts</h2>

					<p class="section-intro">
						Speed up your workflow with these keyboard shortcuts. All shortcuts work
						when the editor is focused (not typing in a text field).
					</p>

					{#each Object.entries(shortcutsByCategory) as [category, items]}
						<div class="content-block">
							<h3>{category}</h3>
							<div class="shortcuts-list">
								{#each items as shortcut}
									<div class="shortcut-item">
										<div class="shortcut-keys">
											{formatShortcut(shortcut).split(' + ').map(key => `<kbd>${key}</kbd>`).join(' + ')}
										</div>
										<div class="shortcut-desc">
											<strong>{shortcut.name}</strong>
											<span class="shortcut-detail">{shortcut.description}</span>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</section>
			{/if}

			<!-- FAQ -->
			{#if activeSection === 'faq'}
				<section class="guide-section">
					<h2>Frequently Asked Questions</h2>

					<div class="faq-list">
						{#each faqs as faq}
							<div class="faq-item">
								<h3 class="faq-question">
									<i class="bi bi-question-circle-fill"></i>
									{faq.question}
								</h3>
								<p class="faq-answer">{faq.answer}</p>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Troubleshooting -->
			{#if activeSection === 'troubleshooting'}
				<section class="guide-section">
					<h2>Troubleshooting</h2>

					<p class="section-intro">
						Having issues? Here are solutions to common problems.
					</p>

					<div class="troubleshooting-list">
						{#each troubleshooting as item}
							<div class="trouble-item">
								<h3 class="trouble-issue">
									<i class="bi bi-exclamation-triangle-fill"></i>
									{item.issue}
								</h3>
								<div class="trouble-solutions">
									<p><strong>Try these solutions:</strong></p>
									<ol>
										{#each item.solutions as solution}
											<li>{solution}</li>
										{/each}
									</ol>
								</div>
							</div>
						{/each}
					</div>

					<div class="content-block">
						<h3>Still Need Help?</h3>
						<p>
							If you're still experiencing issues after trying these solutions:
						</p>
						<ul>
							<li>Check the browser console for error messages (F12)</li>
							<li>Try using a different browser (Chrome or Firefox recommended)</li>
							<li>Clear your browser cache and cookies</li>
							<li>Contact support or file an issue on GitHub</li>
						</ul>
					</div>
				</section>
			{/if}
		</div>
	</div>
</Dialog>

<style>
	.user-guide {
		display: flex;
		flex-direction: column;
		height: 70vh;
		max-height: 800px;
	}

	.guide-tabs {
		display: flex;
		gap: 0.25rem;
		padding: 0.5rem;
		background-color: var(--color-bg-secondary);
		border-radius: var(--border-radius);
		margin-bottom: 1rem;
		overflow-x: auto;
		flex-wrap: wrap;
	}

	.tab-btn {
		flex: 1;
		min-width: fit-content;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background-color: transparent;
		color: var(--color-text-secondary);
		border: none;
		border-radius: var(--border-radius);
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.9rem;
		white-space: nowrap;
	}

	.tab-btn:hover {
		background-color: var(--color-primary);
		color: var(--color-text);
	}

	.tab-btn.active {
		background: linear-gradient(135deg, var(--color-accent-one), var(--color-accent-two));
		color: var(--color-bg-primary);
		font-weight: bold;
	}

	.tab-btn i {
		font-size: 1.1rem;
	}

	.guide-content {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem;
	}

	.guide-section {
		animation: fadeIn 0.3s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.guide-section h2 {
		margin: 0 0 1.5rem 0;
		color: var(--color-accent-two);
		font-family: var(--font-header);
		font-size: 1.75rem;
	}

	.guide-section h3 {
		margin: 0 0 0.75rem 0;
		color: var(--color-accent-one);
		font-size: 1.2rem;
	}

	.section-intro {
		font-size: 1.05rem;
		color: var(--color-text-secondary);
		margin-bottom: 1.5rem;
		line-height: 1.6;
	}

	.content-block {
		margin-bottom: 2rem;
		padding: 1.25rem;
		background-color: var(--color-bg-secondary);
		border-radius: var(--border-radius);
		border-left: 3px solid var(--color-accent-two);
	}

	.content-block p {
		margin: 0.5rem 0;
		line-height: 1.6;
		color: var(--color-text);
	}

	.guide-steps {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	.guide-steps li {
		margin: 0.75rem 0;
		line-height: 1.6;
	}

	.guide-steps li strong {
		color: var(--color-accent-two);
	}

	.guide-steps li p {
		margin: 0.25rem 0 0 0;
		color: var(--color-text-secondary);
	}

	.feature-list {
		list-style: none;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 0.75rem;
	}

	.feature-list li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background-color: var(--color-primary);
		border-radius: var(--border-radius);
	}

	.feature-list i {
		color: var(--color-accent-two);
		font-size: 1.2rem;
	}

	kbd {
		display: inline-block;
		padding: 0.2rem 0.5rem;
		background-color: var(--color-bg-secondary);
		border: 1px solid var(--color-secondary);
		border-radius: 3px;
		font-family: var(--font-mono, monospace);
		font-size: 0.85rem;
		color: var(--color-accent-two);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	/* Shortcuts */
	.shortcuts-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.shortcut-item {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 0.75rem;
		background-color: var(--color-primary);
		border-radius: var(--border-radius);
	}

	.shortcut-keys {
		min-width: 150px;
		font-size: 0.9rem;
	}

	.shortcut-desc {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.shortcut-desc strong {
		color: var(--color-text);
	}

	.shortcut-detail {
		font-size: 0.85rem;
		color: var(--color-text-secondary);
	}

	/* FAQ */
	.faq-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.faq-item {
		padding: 1.25rem;
		background-color: var(--color-bg-secondary);
		border-radius: var(--border-radius);
		border-left: 3px solid var(--color-accent-one);
	}

	.faq-question {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin: 0 0 0.75rem 0;
		color: var(--color-accent-two);
		font-size: 1.1rem;
	}

	.faq-question i {
		color: var(--color-accent-one);
	}

	.faq-answer {
		margin: 0;
		line-height: 1.6;
		color: var(--color-text);
	}

	/* Troubleshooting */
	.troubleshooting-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.trouble-item {
		padding: 1.25rem;
		background-color: var(--color-bg-secondary);
		border-radius: var(--border-radius);
		border-left: 3px solid var(--color-warning);
	}

	.trouble-issue {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin: 0 0 1rem 0;
		color: var(--color-warning);
		font-size: 1.1rem;
	}

	.trouble-issue i {
		font-size: 1.2rem;
	}

	.trouble-solutions p {
		margin: 0 0 0.5rem 0;
		font-weight: bold;
		color: var(--color-text);
	}

	.trouble-solutions ol {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	.trouble-solutions li {
		margin: 0.5rem 0;
		line-height: 1.6;
		color: var(--color-text);
	}

	/* Mobile responsive */
	@media (max-width: 767px) {
		.user-guide {
			height: 80vh;
		}

		.guide-tabs {
			flex-wrap: nowrap;
			overflow-x: auto;
		}

		.tab-btn {
			flex: 0 0 auto;
			padding: 0.6rem 0.8rem;
			font-size: 0.85rem;
		}

		.tab-label {
			display: none;
		}

		.tab-btn.active .tab-label {
			display: inline;
		}

		.guide-section h2 {
			font-size: 1.4rem;
		}

		.feature-list {
			grid-template-columns: 1fr;
		}

		.shortcut-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.shortcut-keys {
			min-width: auto;
		}
	}
</style>
