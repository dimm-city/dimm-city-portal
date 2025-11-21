<script>
	import Dialog from './Dialog.svelte';
	import { keyboardShortcuts, shortcuts, formatShortcut } from '$lib/stores/keyboardShortcuts.js';

	let show = false;

	// Subscribe to store to show/hide dialog
	keyboardShortcuts.subscribe(state => {
		show = state.showHelp;
	});

	function handleClose() {
		keyboardShortcuts.setShowHelp(false);
	}

	// Group shortcuts by category
	const shortcutsByCategory = Object.entries(shortcuts).reduce((acc, [id, shortcut]) => {
		const category = shortcut.category || 'Other';
		if (!acc[category]) {
			acc[category] = [];
		}
		acc[category].push({ id, ...shortcut });
		return acc;
	}, {});

	// Sort categories: Tools, Actions, UI, Other
	const categoryOrder = ['Tools', 'Actions', 'UI', 'Other'];
	const sortedCategories = categoryOrder.filter(cat => shortcutsByCategory[cat]);
</script>

<Dialog {show} title="Keyboard Shortcuts" on:close={handleClose}>
	<div class="shortcuts-content">
		{#each sortedCategories as category}
			<section class="shortcut-category">
				<h3>{category}</h3>
				<div class="shortcuts-list">
					{#each shortcutsByCategory[category] as shortcut}
						<div class="shortcut-item">
							<span class="shortcut-name">{shortcut.name}</span>
							<span class="shortcut-keys">{formatShortcut(shortcut)}</span>
						</div>
						<div class="shortcut-description">
							{shortcut.description}
						</div>
					{/each}
				</div>
			</section>
		{/each}
	</div>
</Dialog>

<style>
	.shortcuts-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-height: 60vh;
		overflow-y: auto;
	}

	.shortcut-category {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.shortcut-category h3 {
		color: var(--color-accent-two);
		font-family: var(--font-header);
		font-size: 1.1rem;
		margin: 0;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--color-secondary);
	}

	.shortcuts-list {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.5rem 1rem;
		align-items: center;
	}

	.shortcut-item {
		display: contents;
	}

	.shortcut-name {
		color: var(--color-text);
		font-weight: 500;
	}

	.shortcut-keys {
		font-family: var(--font-mono, monospace);
		background-color: var(--color-bg-secondary, rgba(0, 0, 0, 0.2));
		color: var(--color-accent-one);
		padding: 0.25rem 0.5rem;
		border-radius: var(--border-radius);
		font-size: 0.9rem;
		white-space: nowrap;
		border: 1px solid var(--color-secondary);
	}

	.shortcut-description {
		grid-column: 1 / -1;
		color: var(--color-text-secondary, rgba(255, 255, 255, 0.7));
		font-size: 0.85rem;
		padding-left: 0.5rem;
		margin-bottom: 0.5rem;
	}

	@media (max-width: 768px) {
		.shortcuts-content {
			max-height: 70vh;
		}

		.shortcuts-list {
			grid-template-columns: 1fr;
			gap: 0.25rem;
		}

		.shortcut-keys {
			justify-self: start;
			margin-top: 0.25rem;
		}

		.shortcut-description {
			margin-bottom: 0.75rem;
		}
	}
</style>
