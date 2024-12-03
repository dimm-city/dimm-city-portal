<script>
	export let aug = '';
	export let title = '';
	export let show = false; // boolean
	export const open = () => {
		dialog.show();
		show = true;
	};

	export const close = () => {
		dialog.close();
		show = false;
	};
	/**
	 * @type {HTMLDialogElement}
	 */
	let dialog; // HTMLDialogElement

	$: if (dialog && show) dialog.showModal();
	else if (dialog) dialog.close();
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<dialog bind:this={dialog} on:close on:click|self={close} data-augmented-ui={aug}>
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div on:click|stopPropagation class="dialog-container">
		<div class="dialog-grid">
			<div class="dialog-header">
				<slot name="header">
					<h4>{title}</h4>
				</slot>
			</div>
			<div class="dialog-body">
				<slot />
			</div>
			<div class="dialog-footer">
				<slot name="footer">
					<button on:click={close}>Close</button>
				</slot>
			</div>
		</div>
		<button class="close-button" on:click={close} aria-label="Close"><i class="bi bi-x"></i></button
		>
	</div>
</dialog>

<style>
	dialog {
		border-radius: 0;
		border: none;
		padding: 0;
		position: absolute;
		background-color: var(--color-bg-transparent);
		/* outline-color: var(--color-accent-one);
		outline-style: solid;
		outline-width: 1px; */
		color: var(--color-text);
		min-width: 30ch;
		min-height: 30ch;
		margin: auto;
	}
	dialog > div {
		padding: 1em;
		position: relative;
		display: grid;
		height: 100%;
	}
	.dialog-container {
		background: var(--color-primary-overlay);
		border: 1px solid var(--color-secondary);
		backdrop-filter: var(--filter-backdrop);
		box-shadow: var(--shadow-accent-two);
		border-radius: var(--border-radius);
		padding: 0.5rem;
		transition:
			background var(--transition-speed),
			box-shadow var(--transition-speed);
	}
	.dialog-grid {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: min-content auto min-content;
		height: 100%;
		overflow: hidden;
	}

	.dialog-body {
		overflow-y: auto;
		overflow-x: hidden;
		margin-top: 1rem;
		padding-inline: 0.5rem;
	}
	.dialog-footer {
		margin-top: 1rem;
	}
	.dialog-footer > button {
		width: 100%;
		font-family: var(--font-header);
	}
	button.close-button {
		font-size: 1.5rem;
		display: block;
		position: absolute;
		right: 0;
		top: 0;
		padding: 0;
		margin: 0;
		background-color: transparent;
		color: var(--color-accent-two);
	}
	button.close-button:hover {
		box-shadow: none;
		text-shadow: var(--shadow-accent-two);
	}

	dialog {
		/* animation: fade-out var(--transition-speed) ease-out forwards; */
		animation: slideOutUp;
		animation-duration: var(--transition-speed);
	}

	dialog[open] {
		display: grid;
		/* animation: fade-in var(--transition-speed) ease-out; */
		animation: slideInDown ease-in;
		animation-duration: var(--transition-speed);
	}

	dialog::backdrop {
		display: block;
		/* animation: backdrop-fade-out var(--transition-speed) ease-out forwards; */
		background-color: rgba(255, 0, 0, 0);
		transition: background-color var(--transition-speed) ease-in;
	}

	dialog[open]::backdrop {
		background-color: var(--color-bg-transparent);
		transition: background-color var(--transition-speed) ease-in;
		/* animation: backdrop-fade-in var(--transition-speed) ease-out;  */
	}

	/* Animation keyframes */

	@keyframes fade-in {
		0% {
			opacity: 0;
			transform: scale(0);
			display: none;
		}

		100% {
			opacity: 1;
			transform: scale(1);
			display: block;
			position: absolute;
		}
	}

	@keyframes fade-out {
		0% {
			opacity: 1;
			transform: scale(1);
			display: block;
			position: absolute;
		}
		100% {
			opacity: 0;
			transform: scale(0);
			position: absolute;
		}
	}
</style>
