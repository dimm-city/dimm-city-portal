<script>
	import { theme, THEMES } from '$lib/stores/themeStore.js';

	function getEffectiveTheme(themePreference) {
		if (themePreference === THEMES.AUTO) {
			if (typeof window !== 'undefined' && window.matchMedia) {
				return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT;
			}
			return THEMES.LIGHT;
		}
		return themePreference;
	}

	function cycleTheme() {
		const currentTheme = $theme;
		if (currentTheme === THEMES.AUTO) {
			theme.setTheme(THEMES.LIGHT);
		} else if (currentTheme === THEMES.LIGHT) {
			theme.setTheme(THEMES.DARK);
		} else {
			theme.setTheme(THEMES.AUTO);
		}
	}

	// Reactive declarations for display
	$: currentTheme = $theme;
	$: effectiveTheme = getEffectiveTheme(currentTheme);
</script>

<button
	class="theme-toggle"
	onclick={cycleTheme}
	title={currentTheme === THEMES.AUTO
		? `Auto (${effectiveTheme})`
		: currentTheme === THEMES.LIGHT
		? 'Light theme'
		: 'Dark theme'}
	aria-label="Toggle theme"
>
	{#if currentTheme === THEMES.AUTO}
		<i class="bi bi-circle-half"></i>
		<span class="theme-label">Auto</span>
	{:else if effectiveTheme === THEMES.DARK}
		<i class="bi bi-moon-stars-fill"></i>
		<span class="theme-label">Dark</span>
	{:else}
		<i class="bi bi-sun-fill"></i>
		<span class="theme-label">Light</span>
	{/if}
</button>

<style>
	.theme-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--color-bg-secondary);
		border: var(--border-width) solid var(--color-secondary-muted);
		border-radius: var(--border-radius);
		color: var(--color-primary-text);
		cursor: pointer;
		font-family: var(--font-main);
		font-size: 0.9rem;
		transition: all var(--transition-speed);
		box-shadow: var(--shadow-default);
	}

	.theme-toggle:hover {
		background: var(--color-primary-overlay);
		box-shadow: var(--shadow-primary);
		transform: translateY(-1px);
	}

	.theme-toggle:active {
		transform: translateY(0);
	}

	.theme-toggle i {
		font-size: 1.2rem;
		line-height: 1;
	}

	.theme-label {
		font-weight: 500;
		letter-spacing: var(--spacing-letter);
	}

	@media (max-width: 768px) {
		.theme-label {
			display: none;
		}

		.theme-toggle {
			padding: 0.5rem;
			min-width: 2.5rem;
			justify-content: center;
		}
	}
</style>
