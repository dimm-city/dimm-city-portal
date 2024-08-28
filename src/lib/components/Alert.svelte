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
		class="{getClass()} animate__animated animate__slideInRight"
		role="status"
		aria-live="polite"
		{id}
		out:fly|global={{ x: '300px', easing: sineOut, duration: 200 }}
		data-augmented-ui="  tl-clip-x tr-clip br-clip bl-clip both"
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
		--aug-border-all: 1px;
		--aug-bl: 0.35rem;
		--aug-br: 0.35rem;
		--aug-tl: 0.35rem;
		--aug-tr: 0.35rem;
		--aug-inlay-all: 1px;
		--aug-border-bg: var(--fourth-accent);
		position: relative;
		display: flex;
		align-items: stretch;
		justify-content: space-between;
		margin: 12px;
		background: #fff;
		color: #000;
		/* border-radius: 6px; */
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
		min-height: 0;
		min-width: 200px;
		overflow: hidden;
		opacity: 0.8;
	}

	.default-notification-style-content {
		max-width: 100%;
		padding: 12px 6px 12px 12px;
		box-sizing: border-box;
		word-wrap: break-word;
		border: 0;
	}

	.default-notification-style-button {
		display: block;
		width: 40px;
		padding: 0;
		padding-inline: 0.25rem;
		margin: 0;
		border: none;
		/* border-left: 1px solid #eee; */
		outline: none;
		background: none;
		cursor: pointer;
		font-size: 20px;
		color: #000;
		box-sizing: border-box;
		align-self: start;
	}

	.default-notification-style-button:hover {
		background: rgba(0, 0, 0, 0.01);
	}

	.default-notification-error {
		background: var(--third-accent);
		color: #fff;
	}

	.default-notification-error .default-notification-style-button {
		/* border-left: 1px solid rgba(255, 255, 255, 0.4); */
		color: #fff;
	}

	.default-notification-warning {
		background: var(--fourth-accent);
		color: #000;
	}

	.default-notification-warning .default-notification-style-button {
		border-left: 1px solid rgba(0, 0, 0, 0.2);
		color: #000;
	}

	.default-notification-success {
		background: var(--primary-accent);
		color: #fff;
	}

	.default-notification-success .default-notification-style-button {
		/* border-left: 1px solid rgba(255, 255, 255, 0.4); */
		color: #fff;
	}
</style>
