<script>
	import { player, sessionMode, handleCreateSession, handleJoinSession } from './PortalStore.js';
	import { browser, building, dev, version } from '$app/environment';

	import { toast } from '@zerodevx/svelte-toast';
	let portalId = $state(dev ? 'test-portal' : '');
	let password = $state(dev ? 'test' : '');

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
		console.log(`Creating session ${name} with id ${portalId}`);

		if (!name || name.length < 1) {
			toast.push(`You must provide a name to create a portal.`, { classes: ['error'] });
			return;
		}
		if (password.length < 1) {
			toast.push(`You must provide a password to create a portal.`, { classes: ['error'] });
			return;
		}
		if (!$player?.name) {
			toast.push(`You must provide a name to create a portal.`, { classes: ['error'] });
			return;
		}
		portalId = createRandomId(12);
		$player.host = true;
		player.set({ ...$player, name }); // Clone the object to avoid mutating the original

		/**
		 * @type {DC.PortalState}
		 */
		const sessionData = {
			sessionId: portalId,
			name,
			password: password,
			host: $player,
			players: [],
			player: $player,
			tokens: []
		};
		console.log('Session data: ', sessionData);

		handleCreateSession(sessionData);
	}

	function joinSession() {
		if (!portalId || portalId.length < 1) {
			toast.push(`You must provide an ID to enter a portal.`, { classes: ['error'] });
			return;
		}
		if (password.length < 1) {
			toast.push(`You must provide a password to enter a portal.`, { classes: ['error'] });
			return;
		}
		if (!$player?.name) {
			toast.push(`You must provide a name to enter a portal.`, { classes: ['error'] });
			return;
		}
		const sessionData = {
			sessionId: portalId,
			password: password,
			player: $player
		};

		handleJoinSession(sessionData);
	}
</script>

<div class="session-form-container">
	<div class="session-form" data-augmented-ui="tl-clip tr-clip bl-clip br-clip both">
		<div>
			{#if $sessionMode === 'create' || $sessionMode == null}
				<h3>Portal Creation</h3>
				<small>
					Switch to <a class="switch-mode" onclick={() => ($sessionMode = 'join')}>connect mode</a>
				</small>
			{:else if $sessionMode === 'join'}
				<h3>Portal Connection</h3>
				<small>
					Switch to <a class="switch-mode" onclick={() => ($sessionMode = 'create')}>
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
					bind:value={$player.name}
					placeholder="Enter your name"
					required
				/>
			</label>
			{#if $sessionMode === 'create' || $sessionMode == null}
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
					<input type="text" bind:value={portalId} placeholder="Enter Session ID" required />
				</label>
			{/if}
			<label for="password">
				Password
				<input type="password" bind:value={password} placeholder="Enter Password" required />
			</label>
		</form>

		<hr />
		<div>
			{#if $sessionMode === 'create' || $sessionMode == null}
				<button onclick={createSession}>Create</button>
			{/if}
			{#if $sessionMode === 'join'}
				<button onclick={joinSession}>Connect</button>
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
