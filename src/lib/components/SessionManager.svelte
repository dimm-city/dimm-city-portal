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

	// Session discovery fields
	let isPublic = $state(true);
	let gameSystem = $state('Generic');
	let maxPlayers = $state(6);
	let description = $state('');

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
			tokens: [],
			// Session discovery metadata
			isPublic,
			gameSystem,
			maxPlayers,
			description
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
				<label for="player-name">
					Player Name
					<input
						id="player-name"
						name="player-name"
						type="text"
						bind:value={$player.name}
						placeholder="Enter your name"
						required
						aria-required="true"
						aria-invalid={!$player.name}
					/>
				</label>
				{#if $sessionMode === 'create' || $sessionMode == null}
					<label for="portal-name">
						Portal Name
						<input
							id="portal-name"
							name="portal-name"
							type="text"
							bind:value={name}
							placeholder="Enter a name for the portal"
							required
							aria-required="true"
							aria-invalid={!name || name.length < 1}
						/>
					</label>
				{:else}
					<label for="session-id">
						Portal ID
						<input
							id="session-id"
							name="session-id"
							type="text"
							bind:value={portalId}
							placeholder="Enter Session ID"
							required
							aria-required="true"
							aria-invalid={!portalId || portalId.length < 1}
						/>
					</label>
				{/if}
				<label for="password">
					Password
					<input
						id="password"
						name="password"
						type="password"
						bind:value={password}
						placeholder="Enter Password"
						required
						aria-required="true"
						aria-invalid={!password || password.length < 1}
					/>
				</label>
				{#if $sessionMode === 'create' || $sessionMode == null}
					<label for="game-system">
						Game System
						<select
							id="game-system"
							name="game-system"
							bind:value={gameSystem}
						>
							<option value="Generic">Generic/Other</option>
							<option value="D&D 5e">D&D 5e</option>
							<option value="Pathfinder 2e">Pathfinder 2e</option>
							<option value="Call of Cthulhu">Call of Cthulhu</option>
							<option value="Savage Worlds">Savage Worlds</option>
							<option value="FATE">FATE</option>
						</select>
					</label>
					<label for="max-players">
						Max Players
						<input
							id="max-players"
							name="max-players"
							type="number"
							bind:value={maxPlayers}
							min="2"
							max="20"
							placeholder="Maximum number of players"
						/>
					</label>
					<label for="description">
						Description (Optional)
						<textarea
							id="description"
							name="description"
							bind:value={description}
							placeholder="Describe your game session..."
							rows="3"
						></textarea>
					</label>
					<label for="is-public" class="checkbox-label">
						<input
							id="is-public"
							name="is-public"
							type="checkbox"
							bind:checked={isPublic}
						/>
						Make session public (visible in session browser)
					</label>
				{/if}
			</form>

			<footer>
				{#if $sessionMode === 'create' || $sessionMode == null}
					<button
						class="connect-button"
						onclick={createSession}
						aria-label="Create new portal session"
					>
						Create
					</button>
					<small>
						Switch to <button
							class="switch-mode"
							onclick={() => ($sessionMode = 'join')}
							aria-label="Switch to connect mode"
						>
							connect mode
						</button>
					</small>
				{/if}
				{#if $sessionMode === 'join'}
					<button
						class="connect-button"
						onclick={joinSession}
						aria-label="Connect to existing portal session"
					>
						Connect
					</button>
					<small>
						Switch to <button
							class="switch-mode"
							onclick={() => ($sessionMode = 'create')}
							aria-label="Switch to create mode"
						>
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
	select {
		width: 100%;
		margin-bottom: 1rem;
		padding: 0.5rem;
		border-radius: var(--border-radius);
		border: 1px solid var(--color-primary-overlay);
		background: var(--color-bg-primary);
		color: var(--color-text-primary);
	}
	textarea {
		width: 100%;
		margin-bottom: 1rem;
		padding: 0.5rem;
		border-radius: var(--border-radius);
		border: 1px solid var(--color-primary-overlay);
		background: var(--color-bg-primary);
		color: var(--color-text-primary);
		resize: vertical;
		font-family: inherit;
	}
	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}
	.checkbox-label input[type="checkbox"] {
		width: auto;
		margin-bottom: 0;
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
