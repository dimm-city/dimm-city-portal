<script>
	import { draggable } from '@neodrag/svelte';



	
	/** @type {{sessionId: any, socket: any, token: DC.PortalToken, enable?: boolean}} */
	let {
		sessionId,
		socket,
		token = $bindable(),
		enable = true
	} = $props();

	let position = $state({ x: token.x, y: token.y });
	let size = $state('50px'); // Initial size for the token
	let isEditing = $state(false); // Controls whether the token is being edited
	let newName = $state(token.name); // Holds the new name for the token
	let newIcon = $state(token.src); // Holds the new icon/image source for the token
	/**
	 * @type {HTMLButtonElement}
	 */
	let tokenRef = $state();
	let currentSize = 50;

	// Store for popover visibility and position
	let showPopover = $state(false);
	let popoverPosition = $state({ x: 0, y: 0 });

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

	// Toggle edit mode
	const editToken = () => {
		isEditing = true;
		repositionPopover();
	};

	// Emit an updated token to the socket
	const emitTokenUpdate = () => {
		const updatedToken = {
			sessionId,
			tokenId: token.id,
			name: newName,
			src: newIcon,
			x: position.x,
			y: position.y
		};
		token = { ...token, ...updatedToken };
		console.log('Token Updating', token);

		socket.emit('tokenUpdating', { sessionId, token });
	};

	const handleTokenMove = () => {
		const tokenMoving = { sessionId, tokenId: token.id, x: position.x, y: position.y };

		console.log('Token Moving', token);

		socket.emit('tokenMoving', tokenMoving);
	};

	socket.on('tokenUpdated', (data) => {
		if (data.token.id === token.id) {
			console.log('Token Updated', data, token);
			position = { x: data.token.x, y: data.token.y };
			token = { ...data.token };
			repositionPopover();
		}
	});

	socket.on('tokenMoved', (data) => {
		const { tokenId, x, y } = data;
		if (token.id === tokenId) {
			console.log('Token Moved', data);
			position = { x, y };
			token = { ...token, x, y };
			repositionPopover();
		}
	});

	// Save the new name and icon, exit edit mode
	const saveEdits = () => {
		token.name = newName;
		token.src = newIcon;
		isEditing = false;
		showPopover = false;
		emitTokenUpdate(); // Emit the updated token to the socket
	};

	// Cancel edits, reset changes, and exit edit mode
	const cancelEdits = () => {
		newName = token.name;
		newIcon = token.src;
		isEditing = false;
		showPopover = false;
	};

	// Increase token size
	const increaseSize = () => {
		size = `${parseInt(currentSize) + 10}px`;
		emitTokenUpdate(); // Emit the updated token to the socket
	};

	// Decrease token size
	const decreaseSize = () => {
		size = `${Math.max(parseInt(currentSize) - 10, 10)}px`;
		emitTokenUpdate(); // Emit the updated token to the socket
	};

	// Handle file upload for the image
	const handleFileUpload = (event) => {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				newIcon = e.target.result;
				//emitTokenUpdate(); // Emit the updated token to the socket
			};
			reader.readAsDataURL(file);
		}
	};

	// Remove token
	const removeToken = () => {
		// //dispatch('token.removed', { tokenId: token.id });
		// const removedToken = { sessionId, tokenId: token.id };
		console.log('Removing Token', token);
		socket.emit('removeToken', { sessionId, tokenId: token.id }); // Emit the removal to the socket
	};
</script>

<div>
	<div
		role="figure"
		class="token"
		class:enable
		title={token.name}
		data-augmented-ui="all-hex border"
		use:draggable={{
			bounds: '.background-container',
			grid: [10, 10],
			disabled: !enable,
			position,
			onDrag: ({ offsetX, offsetY }) => {
				position = { x: offsetX, y: offsetY };
			},
			onDragEnd: ({ offsetX, offsetY }) => {
				position = {
					x: offsetX,
					y: offsetY
				};
				handleTokenMove(); // Emit the updated position to the socket
			}
		}}
		oncontextmenu={togglePopover}
		bind:this={tokenRef}
		style="width: {size}; height: {size};"
	>
		{#if token.type === 'image' || token.src.startsWith('data:')}
			<img src={token.src} alt="token" style="max-height: {size};" />
		{:else if token.type === 'icon'}
			<i class={token.src} style="font-size: calc({size} - 1rem);" />
		{:else}
			<span>{token.name}</span>
		{/if}
	</div>

	{#if showPopover}
		<div
			class="popover"
			class:editing={isEditing}
			class:show={showPopover}
			style="top: {popoverPosition.y}px; left: {popoverPosition.x}px;"
		>
			{#if isEditing}
      <h4>Edit Token</h4>
				<input type="text" bind:value={newName} placeholder="Enter new name" />
				<input type="text" bind:value={newIcon} placeholder="Enter icon class or image URL" />
				<input type="file" accept="image/*" onchange={handleFileUpload} />
				<div class="edit-buttons">
					<button title="Cancel" onclick={cancelEdits}><i class="bi bi-x-circle" /></button>
					<button title="Save" onclick={saveEdits}><i class="bi bi-check-circle" /></button>
				</div>
			{:else}
				<div class="icon-buttons">
					<button title="Increase Size" onclick={increaseSize}>
						<i class="bi bi-plus-circle" />
					</button>
					<button title="Decrease Size" onclick={decreaseSize}>
						<i class="bi bi-dash-circle" />
					</button>
					<button title="Edit" onclick={editToken}><i class="bi bi-pencil" /></button>
					{#if !token.playerToken}
						<button title="Remove" onclick={removeToken}><i class="bi bi-trash" /></button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.token {
		display: flex;
		align-items: center;
		justify-content: center;
		position: absolute;
		--aug-border-all: 1px;
		border-radius: 50%;
	}
	.token.enable {
		cursor: pointer;
	}
	.token img {
		margin: 1rem;
	}

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
	.popover.editing {
		display: flex;
		flex-direction: column;
	}

	.icon-buttons,
	.edit-buttons {
		display: flex;
		justify-content: space-around;
		box-shadow: none;
	}

	.icon-buttons button,
	.edit-buttons button {
		background: none;
		border: none;
		color: var(--color-accent-one);
		cursor: pointer;
		padding: 5px;
		font-size: 20px;
	}

	.icon-buttons button:hover,
	.edit-buttons button:hover {
		color: var(--color-accent-two); /* Highlight color on hover */

		box-shadow: none;
	}

	input[type='text'] {
		width: 100%;
		padding: 5px;
		margin-bottom: 5px;
		border: 1px solid #ccc;
		border-radius: 3px;
		font-size: 14px;
	}

	input[type='file'] {
		margin-bottom: 5px;
	}
</style>
