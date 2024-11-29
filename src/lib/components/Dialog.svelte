<!-- @migration-task Error while migrating Svelte code: This migration would change the name of a slot making the component unusable -->
<script>
	export let aug = 'tl-clip tr-clip br-clip bl-clip both';
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
		<slot name="close">
			<!-- svelte-ignore a11y-autofocus -->
			<button class="text-button" autofocus on:click={close}><i class="bi bi-x" /></button>
		</slot>
	</div>
</dialog>

<style>
	:root {
		--dc-dialog-animation-duration: 0.3s;
		--dc-dialog-close-animation-duration: 0.3s;
		/* --dc-dialog-backdrop-color: rgba(1, 96, 206, 0.212); */

		--dc-dialog-backdrop-color: transparent;
		--dc-dialog-height: 80dvh;
		--dc-dialog-width: 60ch;

		--aug-border-all: 1px;
		--aug-inlay-bg: var(--dark);
		--aug-border-bg: var(--fourth-accent);
	}
	dialog {
		--aug-border-all: 1px;
		--aug-inlay-bg: var(--dark);
		--aug-border-bg: var(--fourth-accent);

		border-radius: 0;
		border: none;
		/* padding: 1em; */
		/* position: absolute; */
		background-color: #000000ce;
		backdrop-filter: blur(3px);
		outline-color: var(--fourth-accent);
		outline-style: solid;
		outline-width: 1px;

		box-shadow: 0 4px 6px var(--fourth-accent);
		color: var(--light);
		/* min-width: 30ch; */
		min-height: 30ch;
		height: var(--dc-dialog-height);
		width: var(--dc-dialog-width);
		max-width: 95svw;
	}
	
	.dialog-container {
		/* padding: 1em; */
		container-type: inline-size;
		position: relative;
		display: grid;
		height: 100%;
		overflow: hidden;
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
		scrollbar-width: none;
	}
	.dialog-body::-webkit-scrollbar {
		width: 0px;
	}
	.dialog-footer {
		margin-top: 1rem;
	}
	button.text-button {
		color: var(--third-accent);
		font-size: 1.5rem;
		display: block;
		position: absolute;
		right: -0.25rem;
		top: -0.5rem;
	}

	dialog {
		transition: display var(--dc-dialog-close-animation-duration) allow-discrete,
			overlay var(--dc-dialog-close-animation-duration) allow-discrete;
		animation: close var(--dc-dialog-close-animation-duration) forwards;
	}
	dialog[open] {
		animation: open var(--dc-dialog-animation-duration) forwards;
		transition: display var(--dc-dialog-animation-duration) allow-discrete,
			overlay var(--dc-dialog-animation-duration) allow-discrete;
	}
	@keyframes open {
		from {
			opacity: 0;
			transform: translate3d(0, -180svh, 0);
		}
		to {
			opacity: 1;
			transform: translate3d(0, 0, 0);
		}
	}
	@keyframes close {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
			transform: translate3d(0, -180svh, 0);
		}
	}

	dialog::backdrop {
		
		background-color: transparent;
		transition: display var(--dc-dialog-close-animation-duration) allow-discrete,
			opacity var(--dc-dialog-close-animation-duration) allow-discrete,
			background-color var(--dc-dialog-close-animation-duration) allow-discrete;
		animation: close-backdrop var(--dc-dialog-close-animation-duration) forwards;
	}
	dialog[open]::backdrop {
		background-color: var(--dc-dialog-backdrop-color);
		animation: open-backdrop var(--dc-dialog-animation-duration) forwards;
		transition: display var(--dc-dialog-close-animation-duration) allow-discrete,
			opacity var(--dc-dialog-animation-duration) allow-discrete,
			background-color var(--dc-dialog-animation-duration) allow-discrete;
	}
	@keyframes close-backdrop {
		from {
			opacity: 1;
			background-color: var(--dc-dialog-backdrop-color);
		}
		to {
			opacity: 0;
			background-color: transparent;
		}
	}
	@keyframes open-backdrop {
		from {
			background-color: transparent;
			opacity: 0;
		}
		to {
			opacity: 1;
			background-color: var(--dc-dialog-backdrop-color);
		}
	}
</style>
