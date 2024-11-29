<script>
	import { createEventDispatcher } from 'svelte';

	import { getNotificationsContext } from 'svelte-notifications';
	const { addNotification } = getNotificationsContext();
	
	
	

	/** @type {{player?: any, mode: string | null, sessionId: string | null, sessionName: string | null, allowHubSwitching?: boolean, portalHubUrl: any}} */
	let {
		player = $bindable({ name: 'founder 3', host: false }),
		mode = $bindable(),
		sessionId = $bindable(),
		sessionName = $bindable(),
		allowHubSwitching = false,
		portalHubUrl = $bindable()
	} = $props();

	let password = $state('');
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
		<!-- <div>
			{#if mode === 'create' || mode == null}
				<h3>Portal Creation</h3>
			{:else if mode === 'join'}
				<h3>Portal Connection</h3>
			{/if}
		</div>
		<hr /> -->
		<form>
			{#if allowHubSwitching}
			<label for="portal-hub-url"> Portal Hub URL </label>	
			<input
				type="text"
				name="portal-hub-url"
				bind:value={portalHubUrl}
				placeholder="https://beta.dimm.city/portal"
				required
			/>
			{/if}
			{#if mode === 'create' || mode == null}
				<label for="portal-name"> Portal Name </label>
				<input
					name="portal-name"
					type="text"
					bind:value={sessionName}
					placeholder="Enter a name for the portal"
					required
				/>
			{:else}
				<label for="sessionId"> Portal ID </label>
				<input type="text" bind:value={sessionId} placeholder="Enter Portal ID" required />
			{/if}
			<label for="portal-name"> Player Name </label>
			<input
				name="player-name"
				type="text"
				bind:value={player.name}
				placeholder="Enter your name"
				required
			/>
			<label for="password"> Password </label>
			<input type="password" bind:value={password} placeholder="Enter Password" required />
		</form>

		<hr />
		<div>
			{#if mode === 'create' || mode == null}
				<button class="header" onclick={createSession}>Create</button>
				<small>
					Switch to <a href="#connect" class="switch-mode" onclick={() => (mode = 'join')}>
						connect mode
					</a>
				</small>
			{/if}
			{#if mode === 'join'}
				<button class="header" onclick={joinSession}>Connect</button>
				<small>
					Switch to <a href="#create" class="switch-mode" onclick={() => (mode = 'create')}>
						create mode
					</a>
				</small>
			{/if}
		</div>
	</div>
</div>

<style>
	[data-augmented-ui] {
		--aug-border-bg: var(--color-accent-one);
	}
	label {
		width: 100%;
	}
	input {
		width: 100%;
		margin-bottom: 1rem;
	}
	.session-form-container {
		display: grid;
		height: 100%;
		outline: var(--color-accent-one) solid var(--outline-width);
		box-shadow:var(--shadow-accent);
	}
	
	.session-form {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		margin: auto;
		gap: 0.5rem;
		padding: 2rem;
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
	}
</style>
