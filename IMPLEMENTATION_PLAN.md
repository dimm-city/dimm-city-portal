# Implementation Plan: High-ROI Features
**Project:** Dimm City Portal
**Version:** Post-RC1 (v1.1.0)
**Date:** 2025-11-19
**Estimated Timeline:** 10 days (2 week sprint)

---

## 🎯 Sprint Goal
Transform Dimm City Portal from "collaborative drawing app" to "competitive VTT" by implementing core VTT features that provide 80% of value with 20% of effort.

---

## 📋 Sprint Backlog

### Week 1: Core VTT Features
1. **Scene Persistence & Save/Load** (2 days) - CRITICAL
2. **Session Browser & Discovery** (2 days) - HIGH
3. **Basic Chat System** (2 days) - HIGH

### Week 2: Mobile & Polish
4. **Mobile-Responsive UI** (4 days) - HIGH

**Stretch Goals (if time permits):**
5. Dice Roll History (1 day)
6. Token HP/Status Display (1 day)

---

# Feature #1: Scene Persistence & Save/Load

**Effort:** 2 days
**Priority:** CRITICAL (Blocker for DM usability)
**ROI:** ⭐⭐⭐⭐⭐ (10/10)

## Problem Statement
Currently, all canvas drawings are lost on page refresh. DMs must redraw maps every session, which is frustrating and time-consuming. The SVG data exists but is never saved to the database.

## Technical Design

### Architecture
```
┌─────────────┐
│   Editor    │
│  (js-draw)  │
└──────┬──────┘
       │ toSVGAsync()
       ▼
┌─────────────┐
│  DOMPurify  │ ─── Sanitize SVG
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ SessionStore│ ─── Save to SQLite
│   (SQLite)  │     data/sessions.db
└─────────────┘
```

### Database Schema Changes

**Current Session Schema:**
```javascript
{
  sessionId: "ABC123",
  passwordHash: "$2b$10$...",
  name: "Lost Mines",
  host: {...},
  players: [...],
  commandData: [...],
  // Missing scene data!
}
```

**New Session Schema:**
```javascript
{
  sessionId: "ABC123",
  passwordHash: "$2b$10$...",
  name: "Lost Mines",
  host: {...},
  players: [...],
  commandData: [...],
  // NEW FIELDS:
  savedScene: "<svg>...</svg>", // Sanitized SVG string
  lastSaved: 1700000000000,     // Timestamp
  sceneVersion: 1,               // Version number
  sceneName: "Goblin Cave - Level 1", // Optional scene name
  autoSaveEnabled: true          // Auto-save preference
}
```

## Implementation Tasks

### Task 1.1: Add Scene Save Functionality (4 hours)

**File:** `src/lib/components/editor/Editor.svelte`

**Changes:**
1. Add save button to DM toolbar
2. Implement save scene function
3. Add save confirmation UI

**Code:**
```svelte
<script>
  import { sessionId, isHost } from '$lib/components/PortalStore';
  import { toast } from '@zerodevx/svelte-toast';

  let saving = $state(false);
  let lastSaved = $state(null);

  async function saveScene() {
    if (!$isHost || saving) return;

    saving = true;
    try {
      // Get SVG from editor
      const data = await _editor.toSVGAsync();

      // Sanitize with DOMPurify (already imported)
      const cleanSVG = DOMPurify.sanitize(data.innerHTML, {
        USE_PROFILES: { svg: true, svgFilters: true }
      });

      // Emit save event to server
      socket.emit('saveScene', {
        sessionId: $sessionId,
        sceneData: cleanSVG,
        sceneName: document.getElementById('scene-name-input')?.value || 'Untitled Scene'
      });

      lastSaved = new Date();
      toast.push('Scene saved successfully!', { classes: ['success'] });
    } catch (error) {
      console.error('Failed to save scene:', error);
      toast.push('Failed to save scene. Please try again.', { classes: ['error'] });
    } finally {
      saving = false;
    }
  }

  // Auto-save every 5 minutes
  onMount(() => {
    const autoSaveInterval = setInterval(() => {
      if ($isHost && autoSaveEnabled) {
        saveScene();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(autoSaveInterval);
  });
</script>

{#if $isHost}
  <div class="scene-controls">
    <input
      id="scene-name-input"
      type="text"
      placeholder="Scene Name"
      value="Untitled Scene"
      class="scene-name-input"
    />

    <button
      onclick={saveScene}
      disabled={saving}
      class="save-scene-btn"
      title="Save Scene (Ctrl+S)"
    >
      {#if saving}
        <i class="bi bi-hourglass-split"></i> Saving...
      {:else}
        <i class="bi bi-save"></i> Save Scene
      {/if}
    </button>

    {#if lastSaved}
      <span class="last-saved">
        Last saved: {lastSaved.toLocaleTimeString()}
      </span>
    {/if}
  </div>
{/if}

<style>
  .scene-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
    background: var(--background-secondary);
    border-radius: 4px;
  }

  .scene-name-input {
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    min-width: 200px;
  }

  .save-scene-btn {
    padding: 0.5rem 1rem;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .save-scene-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .last-saved {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
</style>
```

**Keyboard Shortcut:**
```javascript
// Add to Editor.svelte
onMount(() => {
  const handleKeyboard = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if ($isHost) {
        saveScene();
      }
    }
  };

  window.addEventListener('keydown', handleKeyboard);
  return () => window.removeEventListener('keydown', handleKeyboard);
});
```

### Task 1.2: Server-Side Save Handler (2 hours)

**File:** `src/lib/server/PortalServer.js`

**Add new WebSocket event handler:**
```javascript
socket.on('saveScene', async (data) => {
  try {
    const { sessionId, sceneData, sceneName } = data;

    // Validate
    if (!sessionId || !sceneData) {
      throw new Error('Session ID and scene data are required');
    }

    // Verify socket is host
    if (!isHost(sessionId, socket.id)) {
      throw new Error('Only the host can save scenes');
    }

    // Get session
    const session = sessionStore.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Validate SVG size (prevent DOS)
    if (sceneData.length > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('Scene data too large (max 10MB)');
    }

    // Update session with scene data
    session.savedScene = sceneData;
    session.lastSaved = Date.now();
    session.sceneName = sceneName || 'Untitled Scene';
    session.sceneVersion = (session.sceneVersion || 0) + 1;
    session.lastActivity = Date.now();

    // Save to database
    sessionStore.updateSession(sessionId, session);

    // Confirm to client
    socket.emit('sceneSaved', {
      success: true,
      lastSaved: session.lastSaved,
      sceneVersion: session.sceneVersion
    });

    // Notify all players
    io.to(sessionId).emit('sceneMetadataUpdated', {
      sceneName: session.sceneName,
      lastSaved: session.lastSaved
    });

    console.log(`Scene saved for session ${sessionId}: "${sceneName}"`);
  } catch (error) {
    console.error('Save scene error:', error.message);
    socket.emit('error', { message: error.message });
  }
});
```

### Task 1.3: Auto-Load Scene on Join (2 hours)

**File:** `src/lib/components/editor/Editor.svelte`

**Add load functionality:**
```javascript
async function loadScene(svgData) {
  if (!svgData || !_editor) return;

  try {
    // Clear current canvas
    _editor.clearAll();

    // Create SVG element
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgData, 'image/svg+xml');
    const svgElement = doc.documentElement;

    // Load into editor
    await _editor.loadFromSVG(svgElement);

    console.log('Scene loaded successfully');
  } catch (error) {
    console.error('Failed to load scene:', error);
    toast.push('Failed to load scene', { classes: ['error'] });
  }
}

// Listen for scene data when joining session
socket.on('sessionJoined', (session) => {
  if (session.savedScene) {
    loadScene(session.savedScene);
  }
});

socket.on('sessionCreated', (session) => {
  if (session.savedScene) {
    loadScene(session.savedScene);
  }
});
```

### Task 1.4: Update SessionStore Schema (1 hour)

**File:** `src/lib/server/SessionStore.js`

**Update database initialization:**
```javascript
initializeDatabase() {
  this.db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      session_data TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_activity INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      -- NEW FIELDS for scene persistence
      saved_scene TEXT,              -- SVG data
      scene_name TEXT,               -- Scene title
      scene_version INTEGER DEFAULT 0,
      last_saved INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_expires_at ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_last_activity ON sessions(last_activity);
    CREATE INDEX IF NOT EXISTS idx_last_saved ON sessions(last_saved);
  `);
}
```

**Note:** SQLite is schema-less for JSON fields, so we can add fields to the `session_data` JSON without migration. The above is optional if we want dedicated columns.

### Task 1.5: Add Manual Load/Export (2 hours)

**File:** `src/lib/components/editor/Editor.svelte`

**Add export/import buttons:**
```svelte
<script>
  async function exportScene() {
    const data = await _editor.toSVGAsync();
    const cleanSVG = DOMPurify.sanitize(data.innerHTML, {
      USE_PROFILES: { svg: true, svgFilters: true }
    });

    // Download as file
    const blob = new Blob([cleanSVG], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sceneName || 'scene'}.svg`;
    a.click();
    URL.revokeObjectURL(url);

    toast.push('Scene exported!', { classes: ['success'] });
  }

  async function importScene(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    await loadScene(text);

    toast.push('Scene imported!', { classes: ['success'] });
  }
</script>

{#if $isHost}
  <div class="import-export">
    <button onclick={exportScene} class="btn-secondary">
      <i class="bi bi-download"></i> Export Scene
    </button>

    <label class="btn-secondary">
      <i class="bi bi-upload"></i> Import Scene
      <input
        type="file"
        accept=".svg,image/svg+xml"
        onchange={importScene}
        hidden
      />
    </label>
  </div>
{/if}
```

## Testing Checklist

### Unit Tests
- [ ] Save scene with valid SVG
- [ ] Reject save from non-host
- [ ] Reject scene > 10MB
- [ ] Load scene on session join
- [ ] Load scene on session create
- [ ] Auto-save every 5 minutes (for hosts)

### Integration Tests
- [ ] Create session, draw, save, refresh → scene persists
- [ ] Player joins session → sees DM's saved scene
- [ ] Export scene → downloads SVG file
- [ ] Import scene → loads into editor
- [ ] Save with Ctrl+S keyboard shortcut

### Acceptance Criteria
- ✅ DM can save scene with one click
- ✅ Scene automatically loads on join
- ✅ Scene persists across server restarts (SQLite)
- ✅ Auto-save works every 5 minutes
- ✅ Players see DM's saved scene
- ✅ Export/import for backup
- ✅ Save confirmation toast appears
- ✅ Last saved time displayed

---

# Feature #2: Session Browser & Discovery

**Effort:** 2 days
**Priority:** HIGH (User acquisition)
**ROI:** ⭐⭐⭐⭐⭐ (9/10)

## Problem Statement
Players must know the exact session ID to join. There's no way to discover active games or browse public sessions. This creates friction for new users and limits organic growth.

## Technical Design

### Architecture
```
┌──────────────┐
│    Client    │
│SessionBrowser│
└──────┬───────┘
       │ GET /api/sessions
       ▼
┌──────────────┐
│   REST API   │
│  (Express)   │
└──────┬───────┘
       │ Query
       ▼
┌──────────────┐
│ SessionStore │
│   (SQLite)   │
└──────────────┘
```

### API Design

**Endpoint:** `GET /api/sessions`

**Query Parameters:**
- `public=true` - Only public sessions
- `hasSlots=true` - Only sessions with available slots
- `gameSystem=dnd5e` - Filter by game system

**Response:**
```json
{
  "sessions": [
    {
      "sessionId": "ABC123",
      "name": "Lost Mines of Phandelver",
      "gameSystem": "D&D 5e",
      "hostName": "Gandalf",
      "currentPlayers": 3,
      "maxPlayers": 5,
      "isPasswordProtected": true,
      "isPublic": true,
      "createdAt": "2025-11-19T10:00:00Z",
      "hasAvailableSlots": true
    }
  ],
  "total": 1
}
```

## Implementation Tasks

### Task 2.1: Extend Session Schema (1 hour)

**File:** `src/lib/server/PortalServer.js`

**Update createSession handler:**
```javascript
socket.on('createSession', async (data) => {
  try {
    // ... existing validation ...

    const state = {
      sessionId,
      passwordHash,
      name,
      host,
      players: [],
      diceRoles: [],
      tokens: [],
      commandData: [],
      idCounter: 0,
      createdAt: Date.now(),
      lastActivity: Date.now(),

      // NEW FIELDS for session discovery
      isPublic: data.isPublic !== false, // Default to public
      gameSystem: data.gameSystem || 'Generic',
      maxPlayers: data.maxPlayers || 6,
      description: data.description || '',
      tags: data.tags || []
    };

    sessionStore.createSession(sessionId, state);
    // ... rest of handler
  }
});
```

### Task 2.2: Create REST API Endpoint (3 hours)

**File:** `vite.config.js` (add Express middleware)

```javascript
import express from 'express';

export default defineConfig({
  plugins: [
    sveltekit(),
    {
      name: 'session-api',
      configureServer(server) {
        server.middlewares.use('/api', express.json());

        // GET /api/sessions
        server.middlewares.use('/api/sessions', (req, res) => {
          try {
            const { public: publicOnly, hasSlots, gameSystem } = req.query;

            // Get all active sessions from SessionStore
            const allSessions = sessionStore.getAllSessionsWithDetails();

            // Filter sessions
            let sessions = allSessions.filter(session => {
              // Filter by public
              if (publicOnly === 'true' && !session.isPublic) return false;

              // Filter by available slots
              if (hasSlots === 'true') {
                const currentPlayers = session.players.length + 1; // +1 for host
                if (currentPlayers >= session.maxPlayers) return false;
              }

              // Filter by game system
              if (gameSystem && session.gameSystem !== gameSystem) return false;

              return true;
            });

            // Remove sensitive data
            sessions = sessions.map(s => ({
              sessionId: s.sessionId,
              name: s.name,
              gameSystem: s.gameSystem,
              hostName: s.host.name,
              currentPlayers: s.players.length + 1,
              maxPlayers: s.maxPlayers,
              isPasswordProtected: !!s.passwordHash,
              isPublic: s.isPublic,
              createdAt: s.createdAt,
              description: s.description,
              tags: s.tags,
              hasAvailableSlots: (s.players.length + 1) < s.maxPlayers
            }));

            res.json({
              sessions,
              total: sessions.length
            });
          } catch (error) {
            res.status(500).json({ error: error.message });
          }
        });
      }
    }
  ]
});
```

### Task 2.3: Update SessionStore (1 hour)

**File:** `src/lib/server/SessionStore.js`

**Add method to get all sessions with details:**
```javascript
/**
 * Get all active sessions with full details
 * @returns {Array} Array of session objects
 */
getAllSessionsWithDetails() {
  const stmt = this.db.prepare(`
    SELECT session_data, expires_at
    FROM sessions
    WHERE expires_at > ?
  `);

  const rows = stmt.all(Date.now());
  return rows.map(row => JSON.parse(row.session_data));
}
```

### Task 2.4: Create SessionBrowser Component (4 hours)

**File:** `src/lib/components/SessionBrowser.svelte` (NEW)

```svelte
<script>
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
      sessions = data.sessions;
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
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

      <button onclick={fetchSessions} class="btn-icon">
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

            {#if session.tags.length > 0}
              <div class="tags">
                {#each session.tags as tag}
                  <span class="tag">{tag}</span>
                {/each}
              </div>
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

  .session-list {
    display: grid;
    gap: 1rem;
  }

  .session-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    background: var(--background-secondary);
    border: 1px solid var(--border-color);
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
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
  }

  .session-meta span {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .description {
    margin: 0.5rem 0;
    color: var(--text-secondary);
  }

  .tags {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.5rem;
  }

  .tag {
    padding: 0.25rem 0.5rem;
    background: var(--primary-color);
    color: white;
    border-radius: 4px;
    font-size: 0.75rem;
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--text-secondary);
  }

  .empty-state i {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary);
  }
</style>
```

### Task 2.5: Update SessionManager UI (2 hours)

**File:** `src/lib/components/SessionManager.svelte`

**Add public/private toggle and game system select:**
```svelte
<script>
  let isPublic = $state(true);
  let gameSystem = $state('Generic');
  let maxPlayers = $state(6);
  let description = $state('');
</script>

{#if $sessionMode === 'create'}
  <div class="session-options">
    <label for="game-system">
      Game System
      <select id="game-system" bind:value={gameSystem}>
        <option value="Generic">Generic/Other</option>
        <option value="D&D 5e">D&D 5e</option>
        <option value="Pathfinder 2e">Pathfinder 2e</option>
        <option value="Call of Cthulhu">Call of Cthulhu</option>
        <option value="Savage Worlds">Savage Worlds</option>
      </select>
    </label>

    <label for="max-players">
      Max Players
      <input
        id="max-players"
        type="number"
        bind:value={maxPlayers}
        min="2"
        max="10"
      />
    </label>

    <label for="description">
      Description (Optional)
      <textarea
        id="description"
        bind:value={description}
        placeholder="Tell players about your game..."
        rows="3"
      ></textarea>
    </label>

    <label class="checkbox-label">
      <input type="checkbox" bind:checked={isPublic} />
      Make session public (visible in session browser)
    </label>
  </div>
{/if}
```

**Update createSession call:**
```javascript
function createSession() {
  handleCreateSession({
    sessionId: portalId,
    name,
    password,
    host: $player,
    // NEW FIELDS:
    isPublic,
    gameSystem,
    maxPlayers,
    description
  });
}
```

### Task 2.6: Add Navigation (1 hour)

**File:** `src/routes/+page.svelte`

**Add "Browse Sessions" link:**
```svelte
<script>
  import SessionBrowser from '$lib/components/SessionBrowser.svelte';

  let showBrowser = $state(false);
</script>

{#if !$inSession}
  <div class="home-actions">
    <button onclick={() => showBrowser = !showBrowser} class="btn-secondary">
      <i class="bi bi-list"></i>
      {showBrowser ? 'Hide' : 'Browse'} Public Sessions
    </button>
  </div>

  {#if showBrowser}
    <SessionBrowser />
  {:else}
    <SessionManager />
  {/if}
{:else}
  <!-- Portal view -->
{/if}
```

## Testing Checklist

### API Tests
- [ ] GET /api/sessions returns all public sessions
- [ ] Filter by publicOnly works
- [ ] Filter by hasSlots works
- [ ] Filter by gameSystem works
- [ ] Sensitive data (password) not exposed

### UI Tests
- [ ] Browse button toggles session browser
- [ ] Sessions display with correct metadata
- [ ] Join button navigates to session
- [ ] Full sessions show "Session Full"
- [ ] Refresh updates session list
- [ ] Filters update results

### Acceptance Criteria
- ✅ Players can browse public sessions
- ✅ Filter by game system works
- ✅ Filter by available slots works
- ✅ Click "Join" pre-fills session ID
- ✅ DM can set session public/private
- ✅ Session browser refreshes every 30s
- ✅ Empty state shows "Create Session" CTA

---

# Feature #3: Basic Chat System

**Effort:** 2 days
**Priority:** HIGH (Essential for remote play)
**ROI:** ⭐⭐⭐⭐ (7/10)

## Problem Statement
Players must use external tools (Discord, Zoom) for communication. This fragments the experience and reduces immersion. A simple chat would enable all-in-one gameplay.

## Technical Design

### Architecture
```
┌──────────────┐
│   Client A   │
│  ChatPanel   │
└──────┬───────┘
       │ sendMessage
       ▼
┌──────────────┐
│  Socket.IO   │
│    Server    │
└──────┬───────┘
       │ broadcast
       ▼
┌──────────────┐
│   Client B   │
│  ChatPanel   │
└──────────────┘
```

### Message Schema
```javascript
{
  id: "msg-123",
  sessionId: "ABC123",
  playerId: "socket-456",
  playerName: "Gandalf",
  message: "I cast Fireball!",
  timestamp: 1700000000000,
  type: "chat", // "chat", "dice", "system", "action"
  color: "#FF5733" // Player color
}
```

## Implementation Tasks

### Task 3.1: Server-Side Message Handler (2 hours)

**File:** `src/lib/server/PortalServer.js`

**Add message event handler:**
```javascript
socket.on('sendMessage', async (data) => {
  try {
    const { sessionId, message, type = 'chat' } = data;

    // Validate
    if (!sessionId || !message) {
      throw new Error('Session ID and message are required');
    }

    // Validate message length
    if (message.length > 1000) {
      throw new Error('Message too long (max 1000 characters)');
    }

    // Get session
    const session = sessionStore.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Verify player is in session
    const isPlayerInSession = socket.id === session.host.id ||
      session.players.some(p => p.id === socket.id);

    if (!isPlayerInSession) {
      throw new Error('Player not in session');
    }

    // Get player info
    const player = socket.id === session.host.id
      ? session.host
      : session.players.find(p => p.id === socket.id);

    // Create message object
    const messageObj = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      playerId: socket.id,
      playerName: player.name,
      message: message.trim(),
      timestamp: Date.now(),
      type,
      color: player.color || '#FFFFFF'
    };

    // Store in session history (keep last 100 messages)
    if (!session.chatHistory) {
      session.chatHistory = [];
    }
    session.chatHistory.push(messageObj);
    if (session.chatHistory.length > 100) {
      session.chatHistory.shift();
    }

    // Update session
    sessionStore.updateSession(sessionId, session);

    // Broadcast to all players in session
    io.to(sessionId).emit('newMessage', messageObj);

    console.log(`Message in ${sessionId} from ${player.name}: ${message}`);
  } catch (error) {
    console.error('Send message error:', error.message);
    socket.emit('error', { message: error.message });
  }
});
```

### Task 3.2: Create ChatPanel Component (4 hours)

**File:** `src/lib/components/ChatPanel.svelte` (NEW)

```svelte
<script>
  import { sessionId, player } from '$lib/components/PortalStore';
  import { socket } from '$lib/components/PortalStore';
  import { onMount } from 'svelte';

  let messages = $state([]);
  let messageInput = $state('');
  let chatContainer;
  let isMinimized = $state(false);

  function sendMessage() {
    if (!messageInput.trim()) return;

    socket.emit('sendMessage', {
      sessionId: $sessionId,
      message: messageInput,
      type: 'chat'
    });

    messageInput = '';
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function scrollToBottom() {
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  onMount(() => {
    // Listen for new messages
    socket.on('newMessage', (message) => {
      messages = [...messages, message];
      setTimeout(scrollToBottom, 100);
    });

    // Listen for session joined (get chat history)
    socket.on('sessionJoined', (session) => {
      if (session.chatHistory) {
        messages = session.chatHistory;
        setTimeout(scrollToBottom, 100);
      }
    });

    return () => {
      socket.off('newMessage');
    };
  });

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getMessageClass(message) {
    if (message.type === 'system') return 'system-message';
    if (message.type === 'dice') return 'dice-message';
    if (message.playerId === socket.id) return 'own-message';
    return 'other-message';
  }
</script>

<div class="chat-panel" class:minimized={isMinimized}>
  <div class="chat-header">
    <h3>
      <i class="bi bi-chat-dots"></i>
      Chat
      {#if messages.length > 0}
        <span class="message-count">({messages.length})</span>
      {/if}
    </h3>
    <button
      onclick={() => isMinimized = !isMinimized}
      class="btn-icon"
      aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
    >
      <i class="bi bi-{isMinimized ? 'chevron-up' : 'chevron-down'}"></i>
    </button>
  </div>

  {#if !isMinimized}
    <div class="chat-messages" bind:this={chatContainer}>
      {#if messages.length === 0}
        <div class="empty-chat">
          <i class="bi bi-chat"></i>
          <p>No messages yet. Start the conversation!</p>
        </div>
      {:else}
        {#each messages as message}
          <div class="message {getMessageClass(message)}">
            <div class="message-header">
              <span class="player-name" style="color: {message.color}">
                {message.playerName}
              </span>
              <span class="timestamp">{formatTime(message.timestamp)}</span>
            </div>
            <div class="message-content">
              {message.message}
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <div class="chat-input">
      <textarea
        bind:value={messageInput}
        onkeypress={handleKeyPress}
        placeholder="Type a message... (Enter to send)"
        rows="2"
        maxlength="1000"
      ></textarea>
      <button
        onclick={sendMessage}
        disabled={!messageInput.trim()}
        class="send-btn"
        aria-label="Send message"
      >
        <i class="bi bi-send"></i>
      </button>
    </div>
  {/if}
</div>

<style>
  .chat-panel {
    position: fixed;
    bottom: 0;
    right: 20px;
    width: 350px;
    max-height: 500px;
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-bottom: none;
    border-radius: 8px 8px 0 0;
    box-shadow: 0 -4px 12px rgba(0,0,0,0.15);
    display: flex;
    flex-direction: column;
    z-index: 1000;
  }

  .chat-panel.minimized {
    max-height: 50px;
  }

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: var(--background-secondary);
    border-radius: 8px 8px 0 0;
    border-bottom: 1px solid var(--border-color);
  }

  .chat-header h3 {
    margin: 0;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .message-count {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-height: 350px;
  }

  .message {
    padding: 0.5rem;
    border-radius: 4px;
    background: var(--background-secondary);
  }

  .own-message {
    background: var(--primary-color-light);
    margin-left: 2rem;
  }

  .system-message {
    background: var(--info-color);
    text-align: center;
    font-style: italic;
  }

  .dice-message {
    background: var(--success-color);
    border-left: 3px solid var(--success-dark);
  }

  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  .player-name {
    font-weight: bold;
    font-size: 0.875rem;
  }

  .timestamp {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .message-content {
    font-size: 0.875rem;
    word-wrap: break-word;
    white-space: pre-wrap;
  }

  .empty-chat {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary);
  }

  .empty-chat i {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .chat-input {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem;
    border-top: 1px solid var(--border-color);
    background: var(--background-primary);
  }

  .chat-input textarea {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    resize: none;
    font-family: inherit;
  }

  .send-btn {
    padding: 0.5rem 1rem;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .send-btn:hover:not(:disabled) {
    background: var(--primary-dark);
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .chat-panel {
      right: 0;
      left: 0;
      width: 100%;
      max-height: 60vh;
    }
  }
</style>
```

### Task 3.3: Integrate with Dice Rolls (2 hours)

**File:** `src/lib/components/PortalStore.js`

**Update onDiceRollResult to post to chat:**
```javascript
socket.on('diceRollResult', (data) => {
  try {
    const { sessionId, playerName, result, diceTheme } = data;

    // Trigger dice animation
    onDiceRollResult(result, diceTheme);

    // Also send to chat
    socket.emit('sendMessage', {
      sessionId,
      message: `🎲 ${playerName} rolled ${result}`,
      type: 'dice'
    });
  } catch (error) {
    console.error('Dice roll result error:', error);
  }
});
```

### Task 3.4: Add System Messages (1 hour)

**File:** `src/lib/server/PortalServer.js`

**Send system messages on join/leave:**
```javascript
socket.on('joinSession', async (data) => {
  // ... existing join logic ...

  // Broadcast system message
  io.to(sessionId).emit('newMessage', {
    id: `msg-${Date.now()}`,
    sessionId,
    playerId: 'system',
    playerName: 'System',
    message: `${player.name} joined the session`,
    timestamp: Date.now(),
    type: 'system',
    color: '#888888'
  });
});

socket.on('leaveSession', (data) => {
  // ... existing leave logic ...

  const player = session.players.find(p => p.id === socket.id);
  if (player) {
    io.to(sessionId).emit('newMessage', {
      id: `msg-${Date.now()}`,
      sessionId,
      playerId: 'system',
      playerName: 'System',
      message: `${player.name} left the session`,
      timestamp: Date.now(),
      type: 'system',
      color: '#888888'
    });
  }
});
```

### Task 3.5: Add to Portal Layout (1 hour)

**File:** `src/routes/+page.svelte`

**Add ChatPanel when in session:**
```svelte
<script>
  import ChatPanel from '$lib/components/ChatPanel.svelte';
  import { inSession } from '$lib/components/PortalStore';
</script>

{#if $inSession}
  <Portal />
  <ChatPanel />
{:else}
  <SessionManager />
{/if}
```

## Testing Checklist

### Unit Tests
- [ ] Send message with valid content
- [ ] Reject message > 1000 chars
- [ ] Reject message from non-player
- [ ] Chat history loads on join
- [ ] Dice rolls post to chat

### UI Tests
- [ ] Messages display in correct order
- [ ] Own messages styled differently
- [ ] System messages styled differently
- [ ] Dice messages styled differently
- [ ] Chat auto-scrolls to bottom
- [ ] Enter key sends message
- [ ] Minimize/expand works

### Acceptance Criteria
- ✅ Players can send/receive messages
- ✅ Chat history persists (last 100 messages)
- ✅ Dice rolls appear in chat
- ✅ Join/leave notifications work
- ✅ Chat minimizes/expands
- ✅ Timestamps display correctly
- ✅ Mobile responsive
- ✅ Character limit enforced (1000)

---

# Feature #4: Mobile-Responsive UI

**Effort:** 4 days
**Priority:** HIGH (Market expansion)
**ROI:** ⭐⭐⭐⭐ (8/10)

## Problem Statement
Current UI is desktop-only. 50% of potential users access from mobile/tablet but cannot use the app effectively. Touch targets are too small, canvas controls don't work, and layout breaks on mobile.

## Technical Design

### Breakpoints
```css
/* Mobile: < 768px */
/* Tablet: 768px - 1024px */
/* Desktop: > 1024px */
```

### Touch Gestures
```
Single tap → Select
Two-finger drag → Pan canvas
Pinch → Zoom in/out
Long press → Context menu
```

## Implementation Tasks

### Task 4.1: Add CSS Media Queries (1 day)

**File:** `src/lib/components/styles.css`

**Add responsive breakpoints:**
```css
/* Mobile-first base styles */
:root {
  --header-height: 60px;
  --toolbar-height: 50px;
  --sidebar-width: 300px;
}

/* Base (Mobile) */
.portal-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.canvas-area {
  flex: 1;
  overflow: hidden;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--background-secondary);
}

.toolbar button {
  min-width: 44px; /* Touch-friendly */
  min-height: 44px;
  padding: 0.5rem;
}

/* Tablet: 768px+ */
@media (min-width: 768px) {
  .toolbar {
    flex-wrap: nowrap;
  }

  .chat-panel {
    width: 400px;
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .portal-container {
    flex-direction: row;
  }

  .sidebar {
    display: block;
    width: var(--sidebar-width);
  }

  .toolbar button {
    min-width: 36px;
    min-height: 36px;
  }
}
```

### Task 4.2: Touch Gesture Support (1 day)

**File:** `src/lib/components/editor/Editor.svelte`

**Add touch handlers:**
```javascript
import { onMount } from 'svelte';

let touchStartDistance = 0;
let isPanning = false;
let lastPanPosition = { x: 0, y: 0 };

function getTouchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function handleTouchStart(e) {
  if (e.touches.length === 2) {
    // Two-finger touch = pan/zoom
    touchStartDistance = getTouchDistance(e.touches);
    isPanning = true;
    lastPanPosition = {
      x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
      y: (e.touches[0].clientY + e.touches[1].clientY) / 2
    };
    e.preventDefault();
  }
}

function handleTouchMove(e) {
  if (e.touches.length === 2 && isPanning) {
    const currentDistance = getTouchDistance(e.touches);
    const currentPosition = {
      x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
      y: (e.touches[0].clientY + e.touches[1].clientY) / 2
    };

    // Zoom
    const zoomFactor = currentDistance / touchStartDistance;
    if (Math.abs(zoomFactor - 1) > 0.1) {
      const zoom = _editor.getZoom();
      _editor.setZoom(zoom * zoomFactor);
      touchStartDistance = currentDistance;
    }

    // Pan
    const dx = currentPosition.x - lastPanPosition.x;
    const dy = currentPosition.y - lastPanPosition.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      _editor.pan(dx, dy);
      lastPanPosition = currentPosition;
    }

    e.preventDefault();
  }
}

function handleTouchEnd(e) {
  if (e.touches.length < 2) {
    isPanning = false;
  }
}

onMount(() => {
  const canvas = editorElement;
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd);

  return () => {
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchmove', handleTouchMove);
    canvas.removeEventListener('touchend', handleTouchEnd);
  };
});
```

### Task 4.3: Mobile Toolbar (1 day)

**File:** `src/lib/components/editor/EditorToolbar.svelte` (NEW)

**Create collapsible mobile toolbar:**
```svelte
<script>
  let isExpanded = $state(false);
  let isMobile = $state(false);

  onMount(() => {
    const checkMobile = () => {
      isMobile = window.innerWidth < 768;
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  });
</script>

<div class="toolbar" class:mobile={isMobile} class:expanded={isExpanded}>
  {#if isMobile}
    <button
      class="toolbar-toggle"
      onclick={() => isExpanded = !isExpanded}
    >
      <i class="bi bi-{isExpanded ? 'x' : 'tools'}"></i>
      Tools
    </button>
  {/if}

  {#if !isMobile || isExpanded}
    <div class="toolbar-content">
      <!-- Drawing tools -->
      <button class="tool-btn" title="Pen">
        <i class="bi bi-pen"></i>
      </button>
      <button class="tool-btn" title="Eraser">
        <i class="bi bi-eraser"></i>
      </button>
      <button class="tool-btn" title="Shapes">
        <i class="bi bi-square"></i>
      </button>

      <!-- More tools... -->
    </div>
  {/if}
</div>

<style>
  .toolbar.mobile {
    position: fixed;
    bottom: 60px;
    left: 0;
    right: 0;
    z-index: 100;
  }

  .toolbar.mobile .toolbar-content {
    display: none;
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    background: var(--background-primary);
    border-top: 1px solid var(--border-color);
    padding: 1rem;
    max-height: 50vh;
    overflow-y: auto;
  }

  .toolbar.mobile.expanded .toolbar-content {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 0.5rem;
  }

  .tool-btn {
    min-width: 44px;
    min-height: 44px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--background-secondary);
    cursor: pointer;
    font-size: 0.75rem;
  }

  .tool-btn i {
    font-size: 1.5rem;
  }
</style>
```

### Task 4.4: PWA Setup (1 day)

**File:** `static/manifest.json` (NEW)

```json
{
  "name": "Dimm City Portal",
  "short_name": "DimmCity",
  "description": "Open-source Virtual Tabletop for TTRPG games",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a1a",
  "theme_color": "#6366f1",
  "orientation": "any",
  "icons": [
    {
      "src": "/assets/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/assets/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**File:** `src/app.html`

```html
<head>
  <meta charset="utf-8" />
  <link rel="icon" href="%sveltekit.assets%/favicon.png" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />

  <!-- PWA -->
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#6366f1" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

  %sveltekit.head%
</head>
```

**File:** `static/sw.js` (Service Worker - NEW)

```javascript
const CACHE_NAME = 'dimm-city-v1';
const urlsToCache = [
  '/',
  '/assets/dc-logo.webp',
  '/assets/the-dark.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

## Testing Checklist

### Mobile Tests (iOS/Android)
- [ ] Touch targets ≥ 44x44px
- [ ] Two-finger pan works
- [ ] Pinch zoom works
- [ ] Portrait orientation usable
- [ ] Landscape orientation usable
- [ ] Toolbar collapsible
- [ ] Chat panel responsive

### PWA Tests
- [ ] Install prompt appears
- [ ] Installs to home screen
- [ ] Offline assets cached
- [ ] Icons display correctly
- [ ] Splash screen works

### Acceptance Criteria
- ✅ Works on iOS Safari
- ✅ Works on Android Chrome
- ✅ Touch gestures functional
- ✅ All buttons ≥ 44px
- ✅ PWA installable
- ✅ Offline-capable (assets)
- ✅ No horizontal scroll

---

# Sprint Retrospective & Metrics

## Success Metrics

After implementing these 4 features, measure:

### Usage Metrics
- **Session Persistence Rate:** % of sessions with saved scenes
- **Mobile User Engagement:** % of users on mobile devices
- **Session Discovery:** % of users who found games via browser
- **Chat Engagement:** % of sessions using chat

### Target KPIs
- Scene saves per session: >80%
- Mobile users: >40% (up from ~0%)
- Session browser usage: >50% of new users
- Chat messages per session: >20

### User Feedback
- Survey question: "How would you rate the new features?"
- NPS score improvement
- Feature request frequency decrease

---

# Risk Management

## Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Mobile performance issues | Medium | High | Optimize canvas rendering, throttle events |
| Database size growth | Low | Medium | Implement scene size limits (10MB) |
| WebSocket message spam | Low | High | Rate limiting already in place |
| PWA compatibility | Medium | Low | Progressive enhancement, fallback to web |

## Schedule Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Scope creep | High | Medium | Strict feature freeze, only planned items |
| Testing delays | Medium | Medium | Automated tests, parallel QA |
| Dependencies block work | Low | High | Start with independent features first |

---

# Deployment Plan

## Pre-Deployment

1. **Code Review**
   - [ ] All features reviewed by team
   - [ ] Security audit for new endpoints
   - [ ] Performance testing completed

2. **Testing**
   - [ ] All acceptance criteria met
   - [ ] Cross-browser testing done
   - [ ] Mobile device testing done

3. **Documentation**
   - [ ] User guide updated
   - [ ] API docs updated
   - [ ] Changelog written

## Deployment Steps

1. **Database Migration**
   ```sql
   -- Add new columns to sessions table (if using dedicated columns)
   ALTER TABLE sessions ADD COLUMN saved_scene TEXT;
   ALTER TABLE sessions ADD COLUMN scene_name TEXT;
   ALTER TABLE sessions ADD COLUMN is_public BOOLEAN DEFAULT 1;
   ```

2. **Deploy Backend**
   - Deploy new server code
   - Run database migration
   - Verify health checks

3. **Deploy Frontend**
   - Build production bundle
   - Deploy static assets
   - Invalidate CDN cache

4. **Post-Deployment**
   - Monitor error rates
   - Check performance metrics
   - Gather user feedback

## Rollback Plan

If critical issues arise:
1. Revert to previous version
2. Database rollback (if needed)
3. Notify users of temporary downtime
4. Fix issues in staging
5. Redeploy when ready

---

# Next Steps After Sprint

## Phase 2 Features (Next Sprint)

If Sprint 1 successful, consider:

1. **Token Management** (4 days)
   - HP/AC tracking
   - Status effects
   - Initiative tracker

2. **Grid System** (4 days)
   - Square/hex grid overlay
   - Snap-to-grid
   - Distance measurement
   - AoE templates

3. **Dice Roll History** (1 day)
   - Roll log display
   - Modifiers UI
   - Advantage/disadvantage

## Long-Term Roadmap

**Q1 2025:**
- User accounts & profiles
- Asset library & upload
- Combat automation

**Q2 2025:**
- Fog of war
- Dynamic lighting
- Sound & ambiance

**Q3 2025:**
- Audio/video integration
- API integration (D&D Beyond)
- Advanced macros

---

**Implementation Plan Complete.**
**Ready to begin Sprint 1? Start with Feature #1 (Scene Persistence) for immediate impact!**
