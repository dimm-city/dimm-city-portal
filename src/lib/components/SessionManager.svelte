<script>
	import { player, sessionMode, handleCreateSession, handleJoinSession } from './PortalStore.js';
	import { dev } from '$app/environment';

	import { toast } from '@zerodevx/svelte-toast';
	let { portalId = dev ? 'test-portal' : '', password = dev ? 'test' : '' } = $props();
	// let portalId = $state(dev ? 'test-portal' : '');
	// let password = $state(dev ? 'test' : '');

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

<div class="session-manager-container">
	<div class="session-form-container">
		<div class="session-form" data-augmented-ui="tl-clip tr-clip bl-clip br-clip both">
			<div>
				{#if $sessionMode === 'create' || $sessionMode == null}
					<h3>Portal Creation</h3>
				{:else if $sessionMode === 'join'}
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

			<footer>
				{#if $sessionMode === 'create' || $sessionMode == null}
					<button class="connect-button" onclick={createSession}>Create</button>
					<small>
						Switch to <button class="switch-mode" onclick={() => ($sessionMode = 'join')}
							>connect mode</button
						>
					</small>
				{/if}
				{#if $sessionMode === 'join'}
					<button class="connect-button" onclick={joinSession}>Connect</button><small>
						Switch to <button class="switch-mode" onclick={() => ($sessionMode = 'create')}>
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
	/* @media (max-width: 768px) {
		.session-form {
			width: 80dvw;
		}
	} */
	.session-form > * {
		margin: auto;
		width: 100%;
	}
	.switch-mode {
		appearance: none;
		color: var(--color-accent-one);
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
	}

	footer small {
		padding-inline: 0.25rem;
	}
</style>
