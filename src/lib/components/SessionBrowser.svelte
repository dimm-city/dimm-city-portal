<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { sessionMode, player } from '$lib/components/PortalStore';

  let sessions = $state([]);
  let loading = $state(true);
  let filter = $state({
    publicOnly: true,
    hasSlots: true,
    gameSystem: ''
  });

  async function fetchSessions() {
    loading = true;
    try {
      const params = new URLSearchParams({
        public: filter.publicOnly,
        hasSlots: filter.hasSlots,
        ...(filter.gameSystem && { gameSystem: filter.gameSystem })
      });

      const response = await fetch(`/api/sessions?${params}`);
      const data = await response.json();
      sessions = data.sessions || [];
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      sessions = [];
    } finally {
      loading = false;
    }
  }

  function joinSession(session) {
    sessionMode.set('join');
    goto(`/?sessionId=${session.sessionId}`);
  }

  onMount(() => {
    fetchSessions();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  });
</script>

<div class="session-browser">
  <header class="browser-header">
    <h2>Find a Game</h2>

    <div class="filters">
      <label>
        <input type="checkbox" bind:checked={filter.publicOnly} onchange={fetchSessions} />
        Public only
      </label>

      <label>
        <input type="checkbox" bind:checked={filter.hasSlots} onchange={fetchSessions} />
        Available slots
      </label>

      <select bind:value={filter.gameSystem} onchange={fetchSessions}>
        <option value="">All Systems</option>
        <option value="D&D 5e">D&D 5e</option>
        <option value="Pathfinder 2e">Pathfinder 2e</option>
        <option value="Call of Cthulhu">Call of Cthulhu</option>
        <option value="Generic">Generic/Other</option>
      </select>

      <button onclick={fetchSessions} class="btn-icon" title="Refresh">
        <i class="bi bi-arrow-clockwise"></i>
      </button>
    </div>
  </header>

  <div class="session-list">
    {#if loading}
      <div class="loading">
        <i class="bi bi-hourglass-split"></i>
        Loading sessions...
      </div>
    {:else if sessions.length === 0}
      <div class="empty-state">
        <i class="bi bi-inbox"></i>
        <p>No active sessions found</p>
        <button onclick={() => goto('/')} class="btn-primary">
          Create a Session
        </button>
      </div>
    {:else}
      {#each sessions as session}
        <div class="session-card">
          <div class="session-info">
            <h3>{session.name}</h3>
            <div class="session-meta">
              <span class="game-system">
                <i class="bi bi-dice-6"></i>
                {session.gameSystem}
              </span>
              <span class="players">
                <i class="bi bi-people"></i>
                {session.currentPlayers}/{session.maxPlayers}
              </span>
              <span class="host">
                <i class="bi bi-person-badge"></i>
                {session.hostName}
              </span>
              {#if session.isPasswordProtected}
                <span class="password-protected">
                  <i class="bi bi-lock"></i>
                  Password
                </span>
              {/if}
            </div>

            {#if session.description}
              <p class="description">{session.description}</p>
            {/if}
          </div>

          <div class="session-actions">
            {#if session.hasAvailableSlots}
              <button
                onclick={() => joinSession(session)}
                class="btn-primary"
              >
                Join Game
              </button>
            {:else}
              <button class="btn-disabled" disabled>
                Session Full
              </button>
            {/if}
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .session-browser {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .browser-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .filters {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .filters label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .filters select {
    padding: 0.5rem;
    border: 1px solid var(--border-color, #ccc);
    border-radius: 4px;
    background: var(--background-primary, white);
  }

  .btn-icon {
    padding: 0.5rem;
    background: none;
    border: 1px solid var(--border-color, #ccc);
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-icon:hover {
    background: var(--background-secondary, #f5f5f5);
  }

  .session-list {
    display: grid;
    gap: 1rem;
  }

  .session-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    background: var(--background-secondary, #f9f9f9);
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 8px;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .session-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .session-info h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
  }

  .session-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    color: var(--text-secondary, #666);
    margin-bottom: 0.5rem;
  }

  .session-meta span {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .description {
    margin: 0.5rem 0;
    color: var(--text-secondary, #666);
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--text-secondary, #666);
  }

  .empty-state i {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary, #666);
  }

  .btn-primary {
    padding: 0.75rem 1.5rem;
    background: var(--primary-color, #007bff);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background 0.2s;
  }

  .btn-primary:hover {
    background: var(--primary-color-dark, #0056b3);
  }

  .btn-disabled {
    padding: 0.75rem 1.5rem;
    background: #ccc;
    color: #666;
    border: none;
    border-radius: 4px;
    cursor: not-allowed;
  }
</style>
