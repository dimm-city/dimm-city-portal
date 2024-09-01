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
		<!-- svelte-ignore a11y-autofocus -->
		<button autofocus class="close-button" on:click={close}><i class="bi bi-x" /></button>
	</div>
</dialog>

<style>
	:root {
		--dc-dialog-animation-duration: 0.2s;
		--dc-dialog-backdrop-color: rgba(46, 2, 116, 0.651);
	}
	dialog {
		border-radius: 0;
		border: none;
		padding: 0;
		position: absolute;
		background-color: var(--color-bg-secondary);
		outline-color: var(--color-accent-one);
		outline-style: solid;
		outline-width: 1px;
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
	}
	button.close-button:hover {
		box-shadow: none;
		text-shadow: var(--shadow-accent-text);
	}

	dialog {
		/* animation: fade-out var(--dc-dialog-animation-duration) ease-out forwards; */
		animation: slideOutUp;
		animation-duration: var(--dc-dialog-animation-duration);
	}

	dialog[open] {
		display: grid;
		/* animation: fade-in var(--dc-dialog-animation-duration) ease-out; */
		animation: slideInDown ease-in;
		animation-duration: var(--dc-dialog-animation-duration);
	}

	dialog::backdrop {
		display: block;
		/* animation: backdrop-fade-out var(--dc-dialog-animation-duration) ease-out forwards; */
		background-color: rgba(255, 0, 0, 0);
		transition: background-color var(--dc-dialog-animation-duration) ease-in;
	}

	dialog[open]::backdrop {
		background-color: var(--dc-dialog-backdrop-color);
		transition: background-color var(--dc-dialog-animation-duration) ease-in;
		/* animation: backdrop-fade-in var(--dc-dialog-animation-duration) ease-out;  */
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
