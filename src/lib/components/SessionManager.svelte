<script>
	import { player, handleCreateSession, handleJoinSession } from './PortalStore.js';
	import { dev } from '$app/environment';
	import { showError } from './StoreUtils.js';
	let { activeSession} = $props();
	/**
	 * @type {any}
	 */
	let name = $state(dev ? 'test-portal' : '');

	if (dev) {
		// @ts-ignore
		$player = { name: 'example', host: false };
	}

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
		console.log(`Creating session ${name} with id ${activeSession.portalId}`);

		if (!name || name.length < 1) {
			showError(`You must provide a name to create a portal.`);
			return;
		}
		if (activeSession.password.length < 1) {
			showError(`You must provide a password to create a portal.`);
			return;
		}
		if (!$player?.name) {
			showError(`You must provide a name to create a portal.`);
			return;
		}
		activeSession.portalId = createRandomId(12);
		$player.host = true;
		player.set({ ...$player, name }); // Clone the object to avoid mutating the original

		/**
		 * @type {DC.PortalState}
		 */
		const sessionData = {
			sessionId: activeSession.portalId,
			name,
			password: activeSession.password,
			host: $player,
			players: [],
			player: $player,
			tokens: []
		};
		console.log('Session data: ', sessionData);

		handleCreateSession(sessionData);
	}

	function joinSession() {
		if (!activeSession.portalId || activeSession.portalId.length < 1) {
			showError(`You must provide an ID to enter a portal.`);
			return;
		}
		if (activeSession.password.length < 1) {
			showError(`You must provide a password to enter a portal.`);
			return;
		}
		if (!$player?.name) {
			showError(`You must provide a name to enter a portal.`);
			return;
		}
		const sessionData = {
			sessionId: activeSession.portalId,
			password: activeSession.password,
			player: $player
		};

		handleJoinSession(sessionData);
	}
</script>

<div class="session-manager-container">
	<div class="session-form-container">
		<div class="session-form" data-augmented-ui="tl-clip tr-clip bl-clip br-clip both">
			<div>
				{#if activeSession.sessionMode === 'create' || activeSession.sessionMode == null}
					<h3>Portal Creation</h3>
				{:else if activeSession.sessionMode === 'join'}
					<h3>Portal Connection</h3>
				{/if}
			</div>
			<form>
				<label for="portal-name">
					Player Name
					<input
						name="player-name"
						type="text"
						bind:value={$player.name}
						placeholder="Enter your name"
						required
					/>
				</label>
				{#if activeSession.sessionMode === 'create' || activeSession.sessionMode == null}
					<label for="portal-name">
						Portal Name
						<input
							name="portal-name"
							type="text"
							bind:value={name}
							placeholder="Enter a name for the portal"
							required
						/>
					</label>
				{:else}
					<label for="sessionId">
						Portal ID
						<input type="text" bind:value={activeSession.portalId} placeholder="Enter Session ID" required />
					</label>
				{/if}
				<label for="password">
					Password
					<input type="password" bind:value={activeSession.password} placeholder="Enter Password" required />
				</label>
			</form>

			<footer>
				{#if activeSession.sessionMode === 'create' || activeSession.sessionMode == null}
					<button class="connect-button" onclick={createSession}>Create</button>
					<small>
						Switch to <button class="switch-mode" onclick={() => (activeSession.sessionMode = 'join')}
							>connect mode</button
						>
					</small>
				{/if}
				{#if activeSession.sessionMode === 'join'}
					<button class="connect-button" onclick={joinSession}>Connect</button><small>
						Switch to <button class="switch-mode" onclick={() => (activeSession.sessionMode = 'create')}>
							create mode
						</button>
					</small>
				{/if}
			</footer>
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
	.session-manager-container {
		justify-items: center;
		padding-inline: 1rem;
		position: relative;
	}
	.session-manager-container::before {
		position: absolute;
		inset: 0.25rem;
		background-size: contain;
		/* place-self: center; */
		opacity: 0.04;
		/* background-image: url('/assets/the-dark.jpg'); */
		background-position: center;
		background-repeat: no-repeat;

		content: '';
	}
	.session-form-container {
		display: grid;
		height: 100%;

		background: var(--color-bg-secondary-transparent);
		border: 1px solid var(--color-primary-overlay);
		backdrop-filter: var(--filter-backdrop);
		box-shadow: var(--shadow-accent-two);
		border-radius: 15px;
		padding: 1rem;
		transition:
			background var(--transition-speed),
			box-shadow var(--transition-speed);
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
	.switch-mode {
		appearance: none;
		color: var(--color-accent-one);
		transition: color var(--transition-speed) ease-in-out;
		&:hover{
			color: var(--color-accent-two);
		}
	}
	form {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
	}

	footer button.connect-button {
		font-family: var(--font-header);
		width: 100%;
		padding-block: 0.7rem;
		color: var(--color-accent-two);
		background-color: var(--color-accent-one);
		border-radius: var(--border-radius);
		opacity: 0.8;
		transition:
			opacity var(--transition-speed) ease-in-out,
			box-shadow var(--transition-speed) ease-in-out;
		&:hover {
			box-shadow: var(--show-accent-one);
			opacity: 1;
		}
	}

	footer small {
		padding-inline: 0.25rem;
	}
</style>
