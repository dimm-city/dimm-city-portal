<script>
	import { onMount } from 'svelte';

	let error = $state(null);
	let errorInfo = $state(null);
	let errorStack = $state(null);

	function handleError(event) {
		// Ignore harmless ResizeObserver notifications
		if (event.message?.includes('ResizeObserver loop')) {
			return;
		}

		error = event.error || event.reason;
		errorInfo = event.message || error?.message || 'Unknown error occurred';
		errorStack = error?.stack;

		// Log with more context if error is undefined
		if (error === undefined) {
			console.warn('Error caught by boundary: undefined (possibly from:', event.filename, 'line:', event.lineno, ')');
			// Don't prevent default or set error state for undefined errors
			return;
		}

		console.error('Error caught by boundary:', error);

		// Prevent default error handling
		if (event.preventDefault) {
			event.preventDefault();
		}
	}

	function handleUnhandledRejection(event) {
		handleError({
			error: event.reason,
			message: 'Unhandled Promise Rejection'
		});
		event.preventDefault();
	}

	function reset() {
		error = null;
		errorInfo = null;
		errorStack = null;
	}

	function reload() {
		window.location.reload();
	}

	onMount(() => {
		// Catch global errors
		window.addEventListener('error', handleError);
		window.addEventListener('unhandledrejection', handleUnhandledRejection);

		return () => {
			window.removeEventListener('error', handleError);
			window.removeEventListener('unhandledrejection', handleUnhandledRejection);
		};
	});

	let { children } = $props();
</script>

{#if error}
	<div class="error-boundary">
		<div class="error-content">
			<div class="error-icon">
				<i class="bi bi-exclamation-triangle-fill"></i>
			</div>
			<h2>Something went wrong</h2>
			<p class="error-message">
				We're sorry, but something unexpected happened. Please try refreshing the page or
				restarting your session.
			</p>

			<div class="error-actions">
				<button class="btn-primary" onclick={reload}>
					<i class="bi bi-arrow-clockwise"></i> Reload Page
				</button>
				<button class="btn-secondary" onclick={reset}>
					<i class="bi bi-arrow-repeat"></i> Try Again
				</button>
			</div>

			<details class="error-details">
				<summary>Technical Details</summary>
				<div class="error-info">
					<p><strong>Error:</strong> {errorInfo}</p>
					{#if errorStack}
						<pre class="error-stack">{errorStack}</pre>
					{/if}
				</div>
			</details>
		</div>
	</div>
{:else}
	{@render children()}
{/if}

<style>
	.error-boundary {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 2rem;
		background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
		color: var(--color-text, #fff);
	}

	.error-content {
		max-width: 600px;
		text-align: center;
		background: rgba(255, 255, 255, 0.05);
		padding: 3rem 2rem;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}

	.error-icon {
		font-size: 4rem;
		color: #ff6b6b;
		margin-bottom: 1.5rem;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
	}

	h2 {
		font-size: 2rem;
		margin-bottom: 1rem;
		color: var(--color-text, #fff);
	}

	.error-message {
		font-size: 1.1rem;
		line-height: 1.6;
		margin-bottom: 2rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.error-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}

	button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.btn-primary {
		background: var(--color-accent-one, #ff6b6b);
		color: white;
	}

	.btn-primary:hover {
		background: var(--color-accent-two, #ff5252);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-text, #fff);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.15);
		transform: translateY(-2px);
	}

	.error-details {
		margin-top: 2rem;
		text-align: left;
	}

	summary {
		cursor: pointer;
		font-weight: 600;
		padding: 0.5rem;
		border-radius: 4px;
		transition: background 0.2s ease;
		user-select: none;
	}

	summary:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.error-info {
		margin-top: 1rem;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 6px;
		font-size: 0.9rem;
	}

	.error-stack {
		margin-top: 1rem;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.5);
		border-radius: 4px;
		overflow-x: auto;
		font-family: 'Courier New', monospace;
		font-size: 0.85rem;
		line-height: 1.4;
		color: #ff6b6b;
		white-space: pre-wrap;
		word-break: break-all;
	}

	strong {
		color: var(--color-accent-one, #ff6b6b);
	}
</style>
