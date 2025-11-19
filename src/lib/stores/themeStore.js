import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * Theme options
 * - 'auto': Follow system preference
 * - 'light': Force light theme
 * - 'dark': Force dark theme
 */
export const THEMES = {
	AUTO: 'auto',
	LIGHT: 'light',
	DARK: 'dark'
};

/**
 * Get initial theme from localStorage or default to 'auto'
 */
function getInitialTheme() {
	if (!browser) return THEMES.AUTO;

	const stored = localStorage.getItem('theme');
	if (stored && Object.values(THEMES).includes(stored)) {
		return stored;
	}

	return THEMES.AUTO;
}

/**
 * Get the effective theme (resolves 'auto' to actual theme)
 */
function getEffectiveTheme(themePreference) {
	if (themePreference === THEMES.AUTO) {
		// Check system preference
		if (browser && window.matchMedia) {
			return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT;
		}
		return THEMES.LIGHT; // Default fallback
	}
	return themePreference;
}

/**
 * Apply theme to document
 */
function applyTheme(theme) {
	if (!browser) return;

	const effectiveTheme = getEffectiveTheme(theme);

	// Apply theme as data attribute on document root
	document.documentElement.setAttribute('data-theme', effectiveTheme);

	// Also apply as class for backward compatibility
	document.documentElement.classList.remove('theme-light', 'theme-dark');
	document.documentElement.classList.add(`theme-${effectiveTheme}`);

	// Store preference
	localStorage.setItem('theme', theme);
}

/**
 * Create the theme store
 */
function createThemeStore() {
	const initialTheme = getInitialTheme();
	const { subscribe, set, update } = writable(initialTheme);

	// Apply initial theme
	if (browser) {
		applyTheme(initialTheme);

		// Listen for system theme changes when in auto mode
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleSystemThemeChange = () => {
			update(currentTheme => {
				if (currentTheme === THEMES.AUTO) {
					applyTheme(THEMES.AUTO);
				}
				return currentTheme;
			});
		};

		// Modern browsers
		if (mediaQuery.addEventListener) {
			mediaQuery.addEventListener('change', handleSystemThemeChange);
		} else {
			// Fallback for older browsers
			mediaQuery.addListener(handleSystemThemeChange);
		}
	}

	return {
		subscribe,
		/**
		 * Set theme preference
		 * @param {string} theme - 'auto' | 'light' | 'dark'
		 */
		setTheme: (theme) => {
			if (!Object.values(THEMES).includes(theme)) {
				console.warn(`Invalid theme: ${theme}. Using auto.`);
				theme = THEMES.AUTO;
			}

			applyTheme(theme);
			set(theme);
		},
		/**
		 * Toggle between light and dark (sets explicit preference)
		 */
		toggle: () => {
			update(currentTheme => {
				const effectiveTheme = getEffectiveTheme(currentTheme);
				const newTheme = effectiveTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
				applyTheme(newTheme);
				return newTheme;
			});
		},
		/**
		 * Get the currently active theme (resolved from auto)
		 */
		getActiveTheme: () => {
			let currentTheme;
			subscribe(t => { currentTheme = t; })();
			return getEffectiveTheme(currentTheme);
		}
	};
}

export const theme = createThemeStore();
