<script>
	export let enable = true;

	/**
	 * @type {HTMLButtonElement}
	 */
	let tokenRef;

	// Store for popover visibility and position
	let showPopover = false;
	let popoverPosition = { x: 0, y: 0 };

	// Function to reposition the popover
	const repositionPopover = () => {
		if (!enable) return; // If not enabled, do not reposition

		let rect = { right: 10, top: 10, left: 10 };
		if (tokenRef) rect = tokenRef.getBoundingClientRect();

		// Initial position (right of the token)
		let newPosition = { x: rect.right, y: rect.top };

		// Adjust if popover goes beyond the right edge of the viewport
		const popoverWidth = 200; // Estimate or calculate the width of the popover
		const viewportWidth = window.innerWidth;
		if (newPosition.x + popoverWidth > viewportWidth) {
			newPosition.x = rect.left - popoverWidth;
		}

		// Adjust if popover goes beyond the bottom edge of the viewport
		const popoverHeight = 150; // Estimate or calculate the height of the popover
		const viewportHeight = window.innerHeight;
		if (newPosition.y + popoverHeight > viewportHeight) {
			newPosition.y = viewportHeight - popoverHeight;
		}

		// Adjust if the popover goes beyond the left edge of the viewport
		if (newPosition.x < 0) {
			newPosition.x = 0;
		}

		// Adjust if the popover goes beyond the top edge of the viewport
		if (newPosition.y < 0) {
			newPosition.y = 0;
		}

		popoverPosition = newPosition;
	};

	// Function to toggle the popover visibility
	const togglePopover = (event) => {
		if (!enable) return; // If not enabled, do not show popover
		event.preventDefault();
		repositionPopover();
		showPopover = !showPopover;
	};
</script>

<div
	on:contextmenu={togglePopover}
	on:click={togglePopover}
	on:keyup={togglePopover}
	role="button"
	tabindex="0"
>
	<slot />
</div>

{#if showPopover}
	<div
		class="popover"
		class:show={showPopover}
		style="top: {popoverPosition.y}px; left: {popoverPosition.x}px;"
	>
		<slot name="popover" />
	</div>
{/if}

<style>
	.popover {
		position: absolute;
		background-color: rgba(0, 0, 0, 0.75); /* Dark translucent background */
		border: 1px solid #444;
		border-radius: 5px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
		padding: 10px;
		z-index: 1000;
		overflow: hidden;
		white-space: nowrap;
		transition: opacity 0.2s ease, transform 0.2s ease;
		opacity: 0;
		transform: scale(0.5);
	}

	.popover.show {
		opacity: 1;
		transform: scale(1);
	}
</style>
