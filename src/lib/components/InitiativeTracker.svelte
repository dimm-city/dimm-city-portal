<script>
	import { sessionId, player, socket } from '$lib/components/PortalStore';
	import { onMount } from 'svelte';

	// State
	let combatants = $state([]);
	let combatActive = $state(false);
	let currentTurnIndex = $state(0);
	let isMinimized = $state(false);
	let showAddForm = $state(false);

	// Form state for adding combatants
	let newCombatant = $state({
		name: '',
		initiative: '',
		type: 'NPC',
		hp: '',
		maxHp: '',
		ac: ''
	});

	// Derived state
	let isHost = $derived($player?.host || false);
	let currentCombatant = $derived(combatants[currentTurnIndex] || null);

	// Add combatant
	function addCombatant() {
		if (!newCombatant.name || !newCombatant.initiative) {
			alert('Name and Initiative are required');
			return;
		}

		socket.emit('addCombatant', {
			sessionId: $sessionId,
			combatant: {
				name: newCombatant.name,
				initiative: parseInt(newCombatant.initiative),
				type: newCombatant.type,
				hp: newCombatant.hp ? parseInt(newCombatant.hp) : null,
				maxHp: newCombatant.maxHp ? parseInt(newCombatant.maxHp) : null,
				ac: newCombatant.ac ? parseInt(newCombatant.ac) : null
			}
		});

		// Reset form
		newCombatant = {
			name: '',
			initiative: '',
			type: 'NPC',
			hp: '',
			maxHp: '',
			ac: ''
		};
		showAddForm = false;
	}

	// Remove combatant
	function removeCombatant(combatantId) {
		if (confirm('Remove this combatant from initiative?')) {
			socket.emit('removeCombatant', {
				sessionId: $sessionId,
				combatantId
			});
		}
	}

	// Next turn
	function nextTurn() {
		socket.emit('nextTurn', { sessionId: $sessionId });
	}

	// Previous turn
	function previousTurn() {
		socket.emit('previousTurn', { sessionId: $sessionId });
	}

	// Toggle combat
	function toggleCombat() {
		socket.emit('toggleCombat', { sessionId: $sessionId });
	}

	// Update combatant HP
	function updateHP(combatantId, newHP) {
		socket.emit('updateCombatant', {
			sessionId: $sessionId,
			combatantId,
			updates: { hp: parseInt(newHP) }
		});
	}

	// Socket event listeners
	onMount(() => {
		// Listen for session joined - initialize combat state
		socket.on('sessionJoined', (session) => {
			if (session.combatants) {
				combatants = session.combatants;
			}
			if (session.combatActive !== undefined) {
				combatActive = session.combatActive;
			}
			if (session.currentTurnIndex !== undefined) {
				currentTurnIndex = session.currentTurnIndex;
			}
		});

		// Listen for session created - initialize combat state
		socket.on('sessionCreated', (session) => {
			if (session.combatants) {
				combatants = session.combatants;
			}
			if (session.combatActive !== undefined) {
				combatActive = session.combatActive;
			}
			if (session.currentTurnIndex !== undefined) {
				currentTurnIndex = session.currentTurnIndex;
			}
		});

		// Listen for combatant added
		socket.on('combatantAdded', (data) => {
			combatants = data.combatants;
		});

		// Listen for combatant removed
		socket.on('combatantRemoved', (data) => {
			combatants = data.combatants;
			currentTurnIndex = data.currentTurnIndex;
		});

		// Listen for turn changes
		socket.on('turnChanged', (data) => {
			currentTurnIndex = data.currentTurnIndex;
		});

		// Listen for combat status changes
		socket.on('combatStatusChanged', (data) => {
			combatActive = data.combatActive;
			currentTurnIndex = data.currentTurnIndex;
		});

		// Listen for combatant updates
		socket.on('combatantUpdated', (data) => {
			combatants = data.combatants;
		});

		return () => {
			// Cleanup listeners
			socket.off('sessionJoined');
			socket.off('sessionCreated');
			socket.off('combatantAdded');
			socket.off('combatantRemoved');
			socket.off('turnChanged');
			socket.off('combatStatusChanged');
			socket.off('combatantUpdated');
		};
	});

	// Toggle minimize
	function toggleMinimize() {
		isMinimized = !isMinimized;
	}
</script>

<div class="initiative-tracker" class:minimized={isMinimized}>
	<!-- Header -->
	<div class="tracker-header">
		<h3>Initiative Tracker</h3>
		<div class="header-controls">
			<button
				class="minimize-btn"
				onclick={toggleMinimize}
				aria-label={isMinimized ? 'Maximize' : 'Minimize'}
				title={isMinimized ? 'Maximize' : 'Minimize'}
			>
				<i class="bi bi-{isMinimized ? 'chevron-up' : 'chevron-down'}"></i>
			</button>
		</div>
	</div>

	{#if !isMinimized}
		<!-- Combat Controls (Host Only) -->
		{#if isHost}
			<div class="combat-controls">
				<button
					class="toggle-combat-btn {combatActive ? 'active' : ''}"
					onclick={toggleCombat}
				>
					{combatActive ? '⚔️ End Combat' : '⚔️ Start Combat'}
				</button>

				{#if !showAddForm}
					<button class="add-combatant-btn" onclick={() => (showAddForm = true)}>
						<i class="bi bi-plus-circle"></i> Add Combatant
					</button>
				{/if}
			</div>

			<!-- Add Combatant Form -->
			{#if showAddForm}
				<div class="add-form">
					<h4>Add Combatant</h4>
					<div class="form-row">
						<label>
							Name *
							<input type="text" bind:value={newCombatant.name} placeholder="Name" />
						</label>
						<label>
							Initiative *
							<input
								type="number"
								bind:value={newCombatant.initiative}
								placeholder="Initiative"
								min="0"
								max="99"
							/>
						</label>
					</div>
					<div class="form-row">
						<label>
							Type
							<select bind:value={newCombatant.type}>
								<option value="PC">PC</option>
								<option value="NPC">NPC</option>
								<option value="Monster">Monster</option>
							</select>
						</label>
						<label>
							HP
							<input type="number" bind:value={newCombatant.hp} placeholder="Current HP" />
						</label>
						<label>
							Max HP
							<input type="number" bind:value={newCombatant.maxHp} placeholder="Max HP" />
						</label>
						<label>
							AC
							<input type="number" bind:value={newCombatant.ac} placeholder="AC" />
						</label>
					</div>
					<div class="form-actions">
						<button class="btn-primary" onclick={addCombatant}>Add</button>
						<button class="btn-secondary" onclick={() => (showAddForm = false)}>Cancel</button>
					</div>
				</div>
			{/if}
		{/if}

		<!-- Turn Controls (Host Only, Combat Active) -->
		{#if isHost && combatActive && combatants.length > 0}
			<div class="turn-controls">
				<button class="btn-turn" onclick={previousTurn} title="Previous Turn">
					<i class="bi bi-chevron-left"></i>
				</button>
				<div class="current-turn-display">
					{#if currentCombatant}
						<strong>{currentCombatant.name}'s Turn</strong>
						<span class="initiative-badge">{currentCombatant.initiative}</span>
					{/if}
				</div>
				<button class="btn-turn" onclick={nextTurn} title="Next Turn">
					<i class="bi bi-chevron-right"></i>
				</button>
			</div>
		{/if}

		<!-- Combatants List -->
		{#if combatants.length === 0}
			<div class="empty-state">
				<p>No combatants in initiative</p>
				{#if isHost}
					<p class="hint">Add combatants to start tracking initiative</p>
				{/if}
			</div>
		{:else}
			<div class="combatants-list">
				{#each combatants as combatant, index (combatant.id)}
					<div
						class="combatant-card"
						class:current-turn={combatActive && index === currentTurnIndex}
						class:pc={combatant.type === 'PC'}
						class:npc={combatant.type === 'NPC'}
						class:monster={combatant.type === 'Monster'}
					>
						<div class="combatant-header">
							<div class="combatant-info">
								<span class="initiative-number">{combatant.initiative}</span>
								<span class="combatant-name">{combatant.name}</span>
								<span class="combatant-type">{combatant.type}</span>
							</div>
							{#if isHost}
								<button
									class="remove-btn"
									onclick={() => removeCombatant(combatant.id)}
									aria-label="Remove combatant"
									title="Remove"
								>
									<i class="bi bi-x-circle"></i>
								</button>
							{/if}
						</div>

						{#if combatant.hp !== null || combatant.ac !== null}
							<div class="combatant-stats">
								{#if combatant.hp !== null}
									<div class="stat">
										<span class="stat-label">HP:</span>
										{#if isHost}
											<input
												type="number"
												class="hp-input"
												value={combatant.hp}
												onchange={(e) => updateHP(combatant.id, e.target.value)}
												min="0"
												max={combatant.maxHp || 999}
											/>
										{:else}
											<span class="stat-value">{combatant.hp}</span>
										{/if}
										{#if combatant.maxHp}
											<span class="stat-max">/ {combatant.maxHp}</span>
										{/if}
									</div>
								{/if}
								{#if combatant.ac !== null}
									<div class="stat">
										<span class="stat-label">AC:</span>
										<span class="stat-value">{combatant.ac}</span>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.initiative-tracker {
		position: fixed;
		top: 80px;
		right: 20px;
		width: 320px;
		max-height: calc(100vh - 100px);
		background-color: var(--color-bg-secondary);
		border: 2px solid var(--color-accent-one);
		border-radius: var(--border-radius);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		display: flex;
		flex-direction: column;
		z-index: 1000;
		overflow: hidden;
	}

	.initiative-tracker.minimized {
		height: auto;
		max-height: none;
	}

	.tracker-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background-color: var(--color-accent-one);
		color: var(--color-bg-primary);
		border-bottom: 2px solid var(--color-accent-two);
	}

	.tracker-header h3 {
		margin: 0;
		font-size: 1.1rem;
		color: var(--color-bg-primary);
	}

	.header-controls {
		display: flex;
		gap: 0.5rem;
	}

	.minimize-btn {
		background: transparent;
		border: none;
		color: var(--color-bg-primary);
		font-size: 1.2rem;
		cursor: pointer;
		padding: 0.25rem;
		display: flex;
		align-items: center;
	}

	.minimize-btn:hover {
		opacity: 0.8;
	}

	.combat-controls {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		border-bottom: 1px solid var(--color-accent-two);
	}

	.toggle-combat-btn {
		padding: 0.75rem;
		background-color: var(--color-bg-primary);
		border: 2px solid var(--color-accent-two);
		border-radius: var(--border-radius);
		color: var(--color-primary-text);
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s;
	}

	.toggle-combat-btn.active {
		background-color: var(--color-accent-one);
		color: var(--color-bg-primary);
	}

	.toggle-combat-btn:hover {
		border-color: var(--color-accent-one);
	}

	.add-combatant-btn {
		padding: 0.5rem;
		background-color: transparent;
		border: 1px solid var(--color-accent-two);
		border-radius: var(--border-radius);
		color: var(--color-accent-two);
		cursor: pointer;
		transition: all 0.2s;
	}

	.add-combatant-btn:hover {
		background-color: var(--color-accent-two);
		color: var(--color-bg-primary);
	}

	.add-form {
		padding: 1rem;
		background-color: var(--color-bg-primary);
		border-bottom: 1px solid var(--color-accent-two);
	}

	.add-form h4 {
		margin: 0 0 0.75rem 0;
		font-size: 1rem;
		color: var(--color-accent-one);
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.form-row label {
		display: flex;
		flex-direction: column;
		font-size: 0.85rem;
		gap: 0.25rem;
	}

	.form-row input,
	.form-row select {
		padding: 0.4rem;
		font-size: 0.9rem;
		border-radius: var(--border-radius);
		background-color: var(--color-bg-secondary);
		border: 1px solid var(--color-accent-two);
		color: var(--color-primary-text);
	}

	.form-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.btn-primary,
	.btn-secondary {
		flex: 1;
		padding: 0.5rem;
		border-radius: var(--border-radius);
		cursor: pointer;
		font-weight: bold;
	}

	.btn-primary {
		background-color: var(--color-accent-one);
		color: var(--color-bg-primary);
		border: none;
	}

	.btn-secondary {
		background-color: transparent;
		color: var(--color-primary-text);
		border: 1px solid var(--color-accent-two);
	}

	.turn-controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background-color: var(--color-accent-one);
		border-bottom: 2px solid var(--color-accent-two);
	}

	.btn-turn {
		background-color: var(--color-bg-primary);
		border: none;
		color: var(--color-accent-one);
		font-size: 1.2rem;
		padding: 0.5rem 0.75rem;
		border-radius: var(--border-radius);
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-turn:hover {
		background-color: var(--color-accent-two);
		color: var(--color-bg-primary);
	}

	.current-turn-display {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-bg-primary);
		font-size: 0.95rem;
	}

	.initiative-badge {
		background-color: var(--color-bg-primary);
		color: var(--color-accent-one);
		padding: 0.2rem 0.5rem;
		border-radius: 12px;
		font-size: 0.85rem;
		font-weight: bold;
	}

	.empty-state {
		padding: 2rem 1rem;
		text-align: center;
		color: var(--color-primary-text);
		opacity: 0.7;
	}

	.empty-state p {
		margin: 0.5rem 0;
	}

	.hint {
		font-size: 0.85rem;
	}

	.combatants-list {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem;
	}

	.combatant-card {
		background-color: var(--color-bg-primary);
		border: 2px solid var(--color-accent-two);
		border-radius: var(--border-radius);
		padding: 0.75rem;
		margin-bottom: 0.5rem;
		transition: all 0.3s;
	}

	.combatant-card.current-turn {
		background-color: var(--color-accent-one);
		border-color: var(--color-accent-one);
		box-shadow: 0 0 12px var(--color-accent-one);
	}

	.combatant-card.current-turn * {
		color: var(--color-bg-primary) !important;
	}

	.combatant-card.pc {
		border-left: 4px solid #4ade80;
	}

	.combatant-card.npc {
		border-left: 4px solid #60a5fa;
	}

	.combatant-card.monster {
		border-left: 4px solid #f87171;
	}

	.combatant-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.combatant-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
	}

	.initiative-number {
		background-color: var(--color-accent-two);
		color: var(--color-bg-primary);
		font-weight: bold;
		font-size: 1.1rem;
		padding: 0.25rem 0.6rem;
		border-radius: 50%;
		min-width: 32px;
		text-align: center;
	}

	.combatant-name {
		font-weight: bold;
		font-size: 1rem;
		color: var(--color-primary-text);
	}

	.combatant-type {
		font-size: 0.75rem;
		color: var(--color-primary-text);
		opacity: 0.7;
		text-transform: uppercase;
	}

	.remove-btn {
		background: transparent;
		border: none;
		color: var(--color-accent-two);
		font-size: 1.2rem;
		cursor: pointer;
		padding: 0.25rem;
		opacity: 0.7;
	}

	.remove-btn:hover {
		opacity: 1;
		color: #f87171;
	}

	.combatant-stats {
		display: flex;
		gap: 1rem;
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--color-accent-two);
	}

	.stat {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.9rem;
	}

	.stat-label {
		font-weight: bold;
		color: var(--color-primary-text);
		opacity: 0.8;
	}

	.stat-value {
		color: var(--color-primary-text);
	}

	.stat-max {
		color: var(--color-primary-text);
		opacity: 0.6;
	}

	.hp-input {
		width: 50px;
		padding: 0.2rem;
		background-color: var(--color-bg-secondary);
		border: 1px solid var(--color-accent-two);
		border-radius: var(--border-radius);
		color: var(--color-primary-text);
		font-size: 0.9rem;
	}

	/* Mobile responsive */
	@media (max-width: 767px) {
		.initiative-tracker {
			top: auto;
			bottom: 60px;
			right: 10px;
			left: 10px;
			width: auto;
			max-height: 50vh;
		}

		.form-row {
			grid-template-columns: 1fr;
		}
	}
</style>
