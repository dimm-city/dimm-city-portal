<script>
	import { sineOut } from 'svelte/easing';
	import { fade, fly, slide } from 'svelte/transition';

	/**
	 * @type {{ allowRemove?: any; id?: any; text?: any; type?: any; heading?: any; }}
	 */
	export let notification;
	export let withoutStyles = false;
	/**
	 * @type {null}
	 */
	export let onRemove = null;

	const { id, text, type, heading } = notification;

	const getClass = (/** @type {string | undefined} */ suffix) => {
		const defaultSuffix = suffix ? `-${suffix}` : '';
		const defaultNotificationClass = ` default-notification-style${defaultSuffix}`;
		const defaultNotificationType = type && !suffix ? ` default-notification-${type}` : '';

		return `notification${defaultSuffix}${
			withoutStyles ? '' : defaultNotificationClass
		}${defaultNotificationType}`;
	};
</script>

{#if text}
	<div
		class="default-notification-style {getClass()}"
		role="status"
		aria-live="polite"
		{id}
		in:fly|global={{ x: '380px', easing: sineOut, duration: 200 }}
		out:fly|global={{ x: '380px', easing: sineOut, duration: 200 }}
		data-augmented-ui="tl-clip-x tr-clip br-clip bl-clip both"
	>
		<div class={getClass('content')}>
			<slot>
				<h4>{heading}</h4>
				<p>
					{text}
				</p>
			</slot>
		</div>
		{#if notification.allowRemove == null || notification.allowRemove}
			<button class={getClass('button')} on:click={onRemove} aria-label="delete notification">
				&times;
			</button>
		{/if}
	</div>
{/if}

<style>
	h4 {
		margin-block: 0;
	}
	.default-notification-style {
		--aug-border-all: 2px;
		--aug-bl: 0.35rem;
		--aug-br: 0.35rem;
		--aug-tl: 0.35rem;
		--aug-tr: 0.35rem;
		--aug-inlay-all: 2px;
		--aug-border-bg: var(--color-alert-border);
		--aug-inlay-bg: var(--color-alert-bg);
		position: relative;
		display: flex;
		align-items: stretch;
		justify-content: space-between;
		box-shadow:var(--shadow-default);
		margin-top: 1rem;
		min-height: 0;
		min-width: 200px;
		overflow: hidden;
		opacity: 0.9;
		outline: var(--color-alert-border) var(--outline-width) solid;

		background-color: var(--color-alert-bg) !important;
	}

	.default-notification-style-content {
		max-width: 100%;
		padding: 12px 6px 12px 12px;
		box-sizing: border-box;
		word-wrap: break-word;
		border: 0;
		background-color: var(--color-alert-bg);
	}

	.default-notification-style-button {
		display: block;
		width: 40px;
		padding: 0;
		padding-inline: 0.25rem;
		margin: 0;
		border: none;
		outline: none;
		background: none;
		cursor: pointer;
		font-size: 20px;
		box-sizing: border-box;
		align-self: start;
	}

	.default-notification-style-button:hover {
		box-shadow: none;
	}

	.default-notification-error {
		background: var(--color-error-bg);
		color: var(--color-error-text);
	}

	.default-notification-error .default-notification-style-button {
		color: var(--color-error-text);
	}

	.default-notification-warning {
		background: var(--color-warning-bg);
		color: var(--color-warning-text);
	}

	.default-notification-warning .default-notification-style-button {
		color: var(--color-warning-text);
	}

	.default-notification-success {
		background: var(--color-alert-bg);
		color: var(--color-alert-text);
	}

	.default-notification-success .default-notification-style-button {
		color: var(--color-alert-text);
	}
</style>
