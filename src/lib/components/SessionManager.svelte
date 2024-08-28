<script>
	import { createEventDispatcher, onMount } from 'svelte';

	import { getNotificationsContext } from 'svelte-notifications';
	const { addNotification } = getNotificationsContext();
	export let player = { name: 'founder 3', host: false }; // Replace with authenticated user data
	/**
	 * @type {string | null}
	 */
	export let mode;
	/**
	 * @type {string | null}
	 */
	export let sessionId;
	/**
	 * @type {string | null}
	 */
	export let sessionName;

	let password = '';
	const dispatch = createEventDispatcher();

	/**
	 * @param {number} length
	 */
	function createRandomId(length) {
		let result = '';
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		for (let i = 0; i < length; i++)
			result += characters.charAt(Math.floor(Math.random() * characters.length));
		return result;
	}
	function createSession() {
		if (!sessionName || sessionName.length < 1) {
			addNotification({
				id: `${new Date().getTime()}-${Math.floor(Math.random() * 9999)}`,
				position: 'top-right',
				removeAfter: 3000,
				allowRemove: true,
				heading: 'Portal Name Required',
				type: 'error',
				text: `You must enter a name to create a portal.`
			});
			return;
		}
		if (password.length < 1) {
			addNotification({
				id: `${new Date().getTime()}-${Math.floor(Math.random() * 9999)}`,
				position: 'top-right',
				removeAfter: 3000,
				allowRemove: true,
				heading: 'Password Required',
				type: 'error',
				text: `You must enter a password to create a portal.`
			});
			return;
		}
		if (player.name.length < 1) {
			addNotification({
				id: `${new Date().getTime()}-${Math.floor(Math.random() * 9999)}`,
				position: 'top-right',
				removeAfter: 3000,
				allowRemove: true,
				heading: 'Name Required',
				type: 'error',
				text: `You must enter a name to create a portal.`
			});
			return;
		}
		sessionId = createRandomId(12);
		player.host = true;
		player = { ...player }; // Clone the object to avoid mutating the original
		const sessionData = {
			sessionId,
			sessionName,
			password,
			player
		};

		dispatch('createSession', sessionData);
	}

	function joinSession() {
		if (!sessionId || sessionId.length < 1) {
			addNotification({
				id: `${new Date().getTime()}-${Math.floor(Math.random() * 9999)}`,
				position: 'top-right',
				removeAfter: 3000,
				allowRemove: true,
				heading: 'Portal ID Required',
				type: 'error',
				text: `You must enter an ID to enter a portal.`
			});
			return;
		}
		if (password.length < 1) {
			addNotification({
				id: `${new Date().getTime()}-${Math.floor(Math.random() * 9999)}`,
				position: 'top-right',
				removeAfter: 3000,
				allowRemove: true,
				heading: 'Password Required',
				type: 'error',
				text: `You must enter a password to enter a portal.`
			});
			return;
		}
		if (player.name.length < 1) {
			addNotification({
				id: `${new Date().getTime()}-${Math.floor(Math.random() * 9999)}`,
				position: 'top-right',
				removeAfter: 3000,
				allowRemove: true,
				heading: 'Name Required',
				type: 'error',
				text: `You must enter a name to enter a portal.`
			});
			return;
		}
		const sessionData = {
			sessionId,
			password,
			player
		};

		dispatch('joinSession', sessionData);
	}
</script>

<div class="session-form-container">
	<div class="session-form" data-augmented-ui="tl-clip tr-clip bl-clip br-clip both">
		<div>
			{#if mode === 'create' || mode == null}
				<h3>Portal Creation</h3>
				<small>
					Switch to <a href="#" class="switch-mode" on:click={() => (mode = 'join')}>
						connect mode
					</a>
				</small>
			{:else if mode === 'join'}
				<h3>Portal Connection</h3>
				<small>
					Switch to <a href="#" class="switch-mode" on:click={() => (mode = 'create')}>
						create mode
					</a>
				</small>
			{/if}
		</div>
		<hr />
		<form>
			<label for="portal-name">
				Player Name
				<input
					name="player-name"
					type="text"
					bind:value={player.name}
					placeholder="Enter your name"
					required
				/>
			</label>
			{#if mode === 'create' || mode == null}
				<label for="portal-name">
					Portal Name
					<input
						name="portal-name"
						type="text"
						bind:value={sessionName}
						placeholder="Enter a name for the portal"
						required
					/>
				</label>
			{:else}
				<label for="sessionId">
					Portal ID
					<input type="text" bind:value={sessionId} placeholder="Enter Session ID" required />
				</label>
			{/if}
			<label for="password">
				Password
				<input type="password" bind:value={password} placeholder="Enter Password" required />
			</label>
		</form>

		<hr />
		<div>
			{#if mode === 'create' || mode == null}
				<button on:click={createSession}>Create</button>
			{/if}
			{#if mode === 'join'}
				<button on:click={joinSession}>Connect</button>
			{/if}
		</div>
	</div>
</div>

<style>
	label {
		width: 100%;
	}
	.session-form-container {
		display: grid;
		height: 100%;
	}
	.session-form {
		--aug-border-bg: var(--third-accent);
		--aug-border-all: 2px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		margin: auto;
		gap: 1rem;
		padding: 1rem;
		width: 50ch;
	}
	@media (max-width: 768px) {
		h3 {
			font-size: 1rem;
		}
		.session-form {
			width: 80dvw;
		}
	}
	.session-form > * {
		margin: auto;
		width: 100%;
	}
	form {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		row-gap: 1rem;
	}
	button {
		color: var(--fourth-accent);
		width: 100%;
	}
</style>
