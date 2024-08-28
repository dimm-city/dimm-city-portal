<script>
	export let aug = '';
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
				<slot name="header" />
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
		<button class="text-button" autofocus on:click={close}><i class="bi bi-x" /></button>
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
		background-color: var(--dark);
		outline-color: var(--fourth-accent);
		outline-style: solid;
		outline-width: 1px;
		color: var(--light);
		min-width: 30ch;
		min-height: 30ch;
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
	.dialog-footer{
		margin-top: 1rem;
	}
	button.text-button {
		color: var(--third-accent);
		font-size: 1.5rem;
		display: block;
		position: absolute;
		right: 0;
		top: 0;
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

	@keyframes backdrop-fade-in {
		from {
			background-color: rgb(0 0 0 / 0);
		}

		to {
			background-color: rgb(170, 9, 9);
		}
	}

	@keyframes backdrop-fade-out {
		from {
			display: block;
			background-color: black;
		}

		to {
			display: block;
			background-color: rgb(0 0 0 / 0);
		}
	}
</style>
