# AAA Self-Hosted VTT Development Roadmap
**Project:** Dimm City Portal - Complete VTT Package
**Goal:** Transform from MVP to production-ready, self-hostable AAA VTT
**Target Audience:** Self-hosting groups who want a complete solution
**Last Updated:** 2025-11-19

---

## 📊 Current Status Overview

| Category | Completed | In Progress | Planned | Total | Completion % |
|----------|-----------|-------------|---------|-------|--------------|
| **Core Features** | 4 | 0 | 8 | 12 | 33% |
| **Self-Hosting** | 2 | 0 | 5 | 7 | 29% |
| **UX Polish** | 1 | 0 | 6 | 7 | 14% |
| **DevOps/Deploy** | 0 | 0 | 4 | 4 | 0% |
| **Documentation** | 1 | 0 | 5 | 6 | 17% |
| **Assets/Content** | 0 | 0 | 3 | 3 | 0% |
| **TOTAL** | **8** | **0** | **31** | **39** | **21%** |

**Overall AAA Readiness:** 21% → Target: 100%

---

## ✅ Completed Features (From Previous Work)

### Core VTT Features (4/12)
- ✅ **Scene Persistence & Save/Load** - Auto-save, export, database storage
- ✅ **Session Browser & Discovery** - API endpoint, filtering, metadata
- ✅ **Basic Chat System** - Real-time, system messages, persistence
- ✅ **Mobile-Responsive UI** - PWA, touch-friendly, breakpoints

### Self-Hosting Essentials (2/7)
- ✅ **SQLite Session Persistence** - Data survives restarts
- ✅ **Rate Limiting** - Protection against abuse

### UX Polish (1/7)
- ✅ **Error Boundaries** - Graceful error handling

### Documentation (1/6)
- ✅ **Implementation Plan** - High-ROI features documented

---

## 🎯 Phase 1: Core VTT Features (CRITICAL)

### Priority: P0 - Must Have for Launch

#### 1.1 Initiative Tracker ⏳
**Status:** 🔴 Not Started
**Priority:** P0
**Effort:** 1 day (8 hours)
**ROI:** ⭐⭐⭐⭐⭐

**Description:**
Combat turn order tracker with automatic sorting and current turn indicator.

**Requirements:**
- [ ] Add combatants with initiative values
- [ ] Auto-sort by initiative (descending)
- [ ] Highlight current turn
- [ ] Next/Previous turn buttons
- [ ] Remove combatant button
- [ ] Integrate with chat ("Gandalf's turn!")
- [ ] Persist in session state
- [ ] DM-only controls, all players can view

**Technical Details:**
- **Component:** `src/lib/components/InitiativeTracker.svelte` (NEW)
- **State:** Add `combatants: []` to session schema
- **WebSocket Events:** `addCombatant`, `removeCombatant`, `nextTurn`

**Acceptance Criteria:**
- [ ] DM can add/remove combatants
- [ ] List auto-sorts on changes
- [ ] Turn indicator visible to all players
- [ ] Persists across page refresh
- [ ] Mobile-responsive layout

**Files to Create:**
- `src/lib/components/InitiativeTracker.svelte`

**Files to Modify:**
- `src/lib/server/PortalServer.js` (add combat handlers)
- Session schema (add combatants array)

---

#### 1.2 Dice Roll Animations ⏳
**Status:** 🔴 Not Started
**Priority:** P0
**Effort:** 4-6 hours
**ROI:** ⭐⭐⭐⭐⭐

**Description:**
Visual dice rolling animations with particle effects for critical hits/fails.

**Requirements:**
- [ ] Animated dice rolling across screen
- [ ] Different animations per die type (d4, d6, d8, d10, d12, d20, d100)
- [ ] Confetti animation for nat 20
- [ ] Dark cloud/sad animation for nat 1
- [ ] Sound effects (optional, user toggle)
- [ ] Does not block chat or gameplay
- [ ] Performance optimized (60fps)

**Technical Details:**
- **Component:** `src/lib/components/DiceAnimation.svelte` (NEW)
- **Library:** Use existing `animate.css` (already included)
- **Sounds:** Optional, use Web Audio API
- **Trigger:** Socket.IO event `diceRollResult`

**Acceptance Criteria:**
- [ ] Shows animation for 2 seconds max
- [ ] Special effects for nat 1 and nat 20
- [ ] Can be toggled off in settings
- [ ] Doesn't interfere with other UI
- [ ] Works on mobile

**Files to Create:**
- `src/lib/components/DiceAnimation.svelte`
- `static/sounds/dice-roll.mp3` (optional)
- `static/sounds/nat20.mp3` (optional)
- `static/sounds/nat1.mp3` (optional)

**Files to Modify:**
- `src/lib/components/PortalStore.js` (trigger animation on dice roll)

---

#### 1.3 Fog of War System ⏳
**Status:** 🔴 Not Started
**Priority:** P0
**Effort:** 1 day (8 hours)
**ROI:** ⭐⭐⭐⭐

**Description:**
Allow DM to hide/reveal areas of the map for exploration.

**Requirements:**
- [ ] DM can draw fog areas (black overlay)
- [ ] DM can erase fog to reveal areas
- [ ] Fog layer sits above scene, below tokens
- [ ] Fog persists in session state
- [ ] Players see fogged areas, DM sees through
- [ ] Toggle fog visibility for DM preview
- [ ] Opacity control (fully black to translucent)

**Technical Details:**
- **Layer:** Add fog layer to js-draw editor
- **State:** Add `fogAreas: []` to session schema
- **Commands:** `drawFog`, `eraseFog`, `clearAllFog`
- **Visibility:** Different for DM vs players

**Acceptance Criteria:**
- [ ] DM can draw fog with brush tool
- [ ] Players cannot see through fog
- [ ] DM can toggle fog visibility
- [ ] Fog persists across sessions
- [ ] Works with scene save/load

**Files to Create:**
- `src/lib/components/editor/FogOfWarLayer.js` (NEW)

**Files to Modify:**
- `src/lib/components/editor/Editor.js` (add fog layer)
- `src/lib/server/PortalServer.js` (add fog state)

---

#### 1.4 Token Library & Management ⏳
**Status:** 🔴 Not Started
**Priority:** P1
**Effort:** 1.5 days (12 hours)
**ROI:** ⭐⭐⭐⭐

**Description:**
Drag-and-drop token interface with pre-loaded token pack.

**Requirements:**
- [ ] Token library sidebar panel
- [ ] Drag token from library to canvas
- [ ] Upload custom tokens
- [ ] Token categories (PC, NPC, Monster, Object)
- [ ] Token color tinting
- [ ] Token name labels
- [ ] Token size options (1x1, 2x2, 3x3 grid squares)
- [ ] Pre-loaded token pack (50+ tokens)

**Technical Details:**
- **Component:** `src/lib/components/TokenLibrary.svelte` (NEW)
- **Storage:** Static assets + upload to session
- **Drag/Drop:** HTML5 Drag and Drop API

**Acceptance Criteria:**
- [ ] 50+ tokens included out-of-box
- [ ] Drag-and-drop works smoothly
- [ ] Custom uploads persist in session
- [ ] Tokens snap to grid
- [ ] Mobile-friendly alternative (tap to place)

**Files to Create:**
- `src/lib/components/TokenLibrary.svelte`
- `static/assets/tokens/` (directory with 50+ token images)

**Files to Modify:**
- `src/lib/components/editor/Editor.js` (integrate token placement)

---

#### 1.5 Keyboard Shortcuts ⏳
**Status:** 🔴 Not Started
**Priority:** P1
**Effort:** 4 hours
**ROI:** ⭐⭐⭐

**Description:**
Power user keyboard shortcuts for common actions.

**Requirements:**
- [ ] `Ctrl+S` - Save scene ✅ (already works!)
- [ ] `Ctrl+Z` - Undo
- [ ] `Ctrl+Shift+Z` - Redo
- [ ] `/roll [dice]` - Quick dice roll in chat
- [ ] `Ctrl+Enter` - Send chat message
- [ ] `Escape` - Close modals/panels
- [ ] `Ctrl+/` - Show keyboard shortcuts help
- [ ] `Tab` - Focus chat input
- [ ] `F` - Toggle fog of war (DM only)
- [ ] `I` - Toggle initiative tracker

**Technical Details:**
- **Global Handler:** `<svelte:window onkeydown={handleShortcuts} />`
- **Help Modal:** `src/lib/components/KeyboardShortcuts.svelte` (NEW)

**Acceptance Criteria:**
- [ ] All shortcuts work globally
- [ ] No conflicts with browser shortcuts
- [ ] Help modal shows all shortcuts
- [ ] Shortcuts disabled in text inputs
- [ ] Works on Mac (Cmd) and PC (Ctrl)

**Files to Create:**
- `src/lib/components/KeyboardShortcuts.svelte`

**Files to Modify:**
- `src/routes/+layout.svelte` (global shortcut handler)

---

#### 1.6 Theme Switcher (Dark/Light) ⏳
**Status:** 🔴 Not Started
**Priority:** P1
**Effort:** 3 hours
**ROI:** ⭐⭐⭐⭐

**Description:**
Toggle between dark and light themes.

**Requirements:**
- [ ] Theme toggle button
- [ ] Dark theme (default)
- [ ] Light theme
- [ ] Persist preference in localStorage
- [ ] Smooth transition animation
- [ ] Affects all UI elements
- [ ] Accessible (WCAG compliant)

**Technical Details:**
- **Storage:** localStorage `theme` key
- **CSS:** Data attribute `[data-theme="dark"]` or `[data-theme="light"]`
- **Variables:** Already using CSS custom properties

**Acceptance Criteria:**
- [ ] Toggle works instantly
- [ ] Preference persists across sessions
- [ ] All UI elements properly themed
- [ ] High contrast in both modes
- [ ] Icon changes (sun/moon)

**Files to Create:**
- None (use existing theme system)

**Files to Modify:**
- `src/lib/components/theme.css` (add light theme variables)
- `src/routes/+layout.svelte` (add theme switcher)

---

#### 1.7 Audio/Music Integration ⏳
**Status:** 🔴 Not Started
**Priority:** P2
**Effort:** 1 day (8 hours)
**ROI:** ⭐⭐⭐⭐

**Description:**
Ambient music and sound effects synchronized across all players.

**Requirements:**
- [ ] Audio control panel (DM only)
- [ ] YouTube/Spotify URL embed
- [ ] Volume control (individual per player)
- [ ] Play/Pause/Stop for all players
- [ ] Pre-curated playlists (optional)
- [ ] Sound effects (combat, ambience, effects)
- [ ] Mute option

**Technical Details:**
- **Component:** `src/lib/components/AudioPanel.svelte` (NEW)
- **Embed:** iframe for YouTube/Spotify
- **Sync:** WebSocket event `audioControl`

**Acceptance Criteria:**
- [ ] DM can share audio URL
- [ ] All players hear synchronized
- [ ] Individual volume control
- [ ] Does not autoplay (user gesture required)
- [ ] Works on mobile

**Files to Create:**
- `src/lib/components/AudioPanel.svelte`

**Files to Modify:**
- `src/lib/server/PortalServer.js` (audio control events)

---

#### 1.8 Measurement Tools ⏳
**Status:** 🔴 Not Started
**Priority:** P2
**Effort:** 6 hours
**ROI:** ⭐⭐⭐

**Description:**
Measure distances and areas on the map.

**Requirements:**
- [ ] Ruler tool (measure distance)
- [ ] Area tool (circle, cone, square)
- [ ] Grid snapping
- [ ] Distance in feet/meters (configurable)
- [ ] Show measurement to all players or DM only
- [ ] Color-coded by range (short/medium/long)

**Technical Details:**
- **Tool:** Add to js-draw toolbar
- **Units:** Configurable in session settings

**Acceptance Criteria:**
- [ ] Click and drag to measure
- [ ] Shows distance in real-time
- [ ] Grid snapping option
- [ ] Clear measurement button

**Files to Modify:**
- `src/lib/components/editor/Editor.js` (add measurement tool)

---

## 🏗️ Phase 2: Self-Hosting Essentials (CRITICAL)

### Priority: P0 - Required for Self-Hosting

#### 2.1 Docker Compose Setup ⏳
**Status:** 🔴 Not Started
**Priority:** P0
**Effort:** 6 hours
**ROI:** ⭐⭐⭐⭐⭐

**Description:**
One-command deployment with Docker Compose.

**Requirements:**
- [ ] `docker-compose.yml` with all services
- [ ] Dockerfile for app
- [ ] Volume mounts for data persistence
- [ ] Environment variable configuration
- [ ] Health checks
- [ ] Automatic restart policy
- [ ] README with Docker instructions

**Technical Details:**
```yaml
version: '3.8'
services:
  dimm-city:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - SESSION_SECRET=${SESSION_SECRET}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Acceptance Criteria:**
- [ ] `docker-compose up` works first time
- [ ] Data persists across container restarts
- [ ] Health check reports status
- [ ] Logs accessible via `docker-compose logs`
- [ ] Can customize via `.env` file

**Files to Create:**
- `docker-compose.yml`
- `Dockerfile`
- `.dockerignore`
- `docs/DOCKER.md`

**Files to Modify:**
- `README.md` (add Docker quickstart)

---

#### 2.2 Environment-Based Configuration ⏳
**Status:** 🔴 Not Started
**Priority:** P0
**Effort:** 4 hours
**ROI:** ⭐⭐⭐⭐⭐

**Description:**
Comprehensive environment variable configuration for customization.

**Requirements:**
- [ ] Expand `.env.example` with all options
- [ ] Config validation on startup
- [ ] Runtime config access via API
- [ ] Documentation for each variable
- [ ] Sensible defaults

**Environment Variables:**
```bash
# App Configuration
APP_NAME="My D&D Group"
APP_DESCRIPTION="Our weekly game night"
NODE_ENV=production

# Server
PORT=3000
HOST=0.0.0.0

# Session Defaults
MAX_PLAYERS_DEFAULT=8
ENABLE_PUBLIC_SESSIONS=false
DEFAULT_GAME_SYSTEM="D&D 5e"
SCENE_AUTO_SAVE_MINUTES=5
CHAT_MESSAGE_LIMIT=100

# Security
SESSION_SECRET=change-me-to-random-string
RATE_LIMIT_ENABLED=true
PASSWORD_MIN_LENGTH=8

# Features
ENABLE_GUEST_MODE=true
ENABLE_AUDIO=true
ENABLE_FOG_OF_WAR=true
ALLOW_SCENE_EXPORT=true

# Customization
CUSTOM_LOGO_URL=/assets/my-logo.png
THEME=dark
PRIMARY_COLOR=#6366f1

# Storage
DATABASE_PATH=./data/sessions.db
UPLOAD_MAX_SIZE_MB=10
```

**Acceptance Criteria:**
- [ ] All features configurable via env vars
- [ ] Validation fails fast on startup
- [ ] `.env.example` fully documented
- [ ] Config accessible in app (read-only)

**Files to Create:**
- `src/lib/server/config.js` (NEW)

**Files to Modify:**
- `.env.example` (expand significantly)
- `src/lib/server/PortalServer.js` (use config)

---

#### 2.3 Backup & Restore System ⏳
**Status:** 🔴 Not Started
**Priority:** P0
**Effort:** 6 hours
**ROI:** ⭐⭐⭐⭐⭐

**Description:**
One-click backup and restore of all session data.

**Requirements:**
- [ ] Export all sessions to JSON file
- [ ] Import sessions from JSON file
- [ ] Includes scenes, chat history, settings
- [ ] Automatic filename with timestamp
- [ ] Validation on import
- [ ] Merge vs Replace options
- [ ] Automatic backups (optional, configurable)

**Technical Details:**
- **API Endpoints:**
  - `GET /api/backup` - Download backup
  - `POST /api/restore` - Upload backup
- **Format:** JSON with metadata
```json
{
  "version": "1.0.0",
  "exportDate": "2025-11-19T12:00:00Z",
  "appVersion": "1.0.0",
  "sessions": [...],
  "totalSessions": 5,
  "totalPlayers": 12
}
```

**Acceptance Criteria:**
- [ ] Export downloads immediately
- [ ] Import validates file format
- [ ] Error messages for invalid backups
- [ ] Backup includes all session data
- [ ] Can schedule automatic backups

**Files to Create:**
- `src/routes/api/backup/+server.js` (NEW)
- `src/routes/api/restore/+server.js` (NEW)
- `src/lib/components/BackupPanel.svelte` (NEW)

**Files to Modify:**
- Settings page (add backup/restore UI)

---

#### 2.4 Health Check API ⏳
**Status:** 🔴 Not Started
**Priority:** P1
**Effort:** 3 hours
**ROI:** ⭐⭐⭐

**Description:**
Status endpoint for monitoring and troubleshooting.

**Requirements:**
- [ ] `/api/health` endpoint
- [ ] System status (uptime, version, memory)
- [ ] Database status
- [ ] Active sessions count
- [ ] Storage stats
- [ ] No authentication required (public)

**Response Format:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 86400,
  "timestamp": 1700000000000,
  "system": {
    "memory": {
      "used": "256 MB",
      "total": "1024 MB"
    },
    "cpu": "5%"
  },
  "database": {
    "status": "connected",
    "size": "45 MB"
  },
  "sessions": {
    "active": 3,
    "total": 15
  },
  "storage": {
    "scenes": 45,
    "chatMessages": 1250
  }
}
```

**Acceptance Criteria:**
- [ ] Responds in < 100ms
- [ ] Works without authentication
- [ ] Returns proper HTTP status codes
- [ ] Useful for Docker healthcheck

**Files to Create:**
- `src/routes/api/health/+server.js` (NEW)

---

#### 2.5 Admin Dashboard ⏳
**Status:** 🔴 Not Started
**Priority:** P2
**Effort:** 1 day (8 hours)
**ROI:** ⭐⭐⭐

**Description:**
Admin panel for server management and monitoring.

**Requirements:**
- [ ] Server statistics
- [ ] Active sessions list
- [ ] User management
- [ ] Session cleanup tools
- [ ] Database maintenance
- [ ] Log viewer
- [ ] Configuration editor

**Technical Details:**
- **Route:** `/admin` (requires admin password)
- **Auth:** Simple password from env var `ADMIN_PASSWORD`

**Acceptance Criteria:**
- [ ] Password protected
- [ ] Shows real-time stats
- [ ] Can terminate stuck sessions
- [ ] Can trigger database cleanup

**Files to Create:**
- `src/routes/admin/+page.svelte` (NEW)
- `src/lib/components/AdminDashboard.svelte` (NEW)

---

#### 2.6 Session Cleanup & Maintenance ⏳
**Status:** 🔴 Not Started
**Priority:** P2
**Effort:** 4 hours
**ROI:** ⭐⭐⭐

**Description:**
Automatic cleanup of old/abandoned sessions.

**Requirements:**
- [ ] Delete sessions older than X days (configurable)
- [ ] Delete empty sessions
- [ ] Archive option instead of delete
- [ ] Manual cleanup API
- [ ] Scheduled cleanup (cron)
- [ ] Cleanup logs

**Technical Details:**
- **Config:** `SESSION_CLEANUP_DAYS=30`
- **Cron:** Run daily at 3 AM

**Acceptance Criteria:**
- [ ] Configurable retention period
- [ ] Does not delete active sessions
- [ ] Logs cleanup actions
- [ ] Can be triggered manually

**Files to Create:**
- `src/lib/server/cleanup.js` (NEW)

---

#### 2.7 Multi-User Admin System ⏳
**Status:** 🔴 Not Started
**Priority:** P3
**Effort:** 1.5 days (12 hours)
**ROI:** ⭐⭐

**Description:**
Multiple admin users with different permission levels.

**Requirements:**
- [ ] User accounts (admin, moderator, user)
- [ ] Role-based permissions
- [ ] User management UI
- [ ] Audit log

**Note:** May be overkill for self-hosted, consider skipping

---

## 🎨 Phase 3: UX Polish & Delight

### Priority: P1 - Important for First Impressions

#### 3.1 Demo Session / Quickstart ⏳
**Status:** 🔴 Not Started
**Priority:** P0
**Effort:** 6 hours
**ROI:** ⭐⭐⭐⭐⭐

**Description:**
Pre-populated demo session to showcase features.

**Requirements:**
- [ ] "Try Demo" button on homepage
- [ ] Pre-loaded scene with dungeon map
- [ ] Sample tokens on map
- [ ] Pre-populated chat history
- [ ] Sample dice rolls
- [ ] Initiative tracker with combatants
- [ ] Session is read-only for guests
- [ ] Can "Clone to New Session"

**Technical Details:**
- **Seed Data:** `src/lib/data/demo-session.js` (NEW)
- **Route:** `/demo` or query param `?demo=true`

**Acceptance Criteria:**
- [ ] Accessible without password
- [ ] Shows all features
- [ ] Cannot modify demo (or resets on reload)
- [ ] One-click "Start My Own Session"

**Files to Create:**
- `src/lib/data/demo-session.js`
- `src/routes/demo/+page.svelte` (optional)

**Files to Modify:**
- `src/routes/+page.svelte` (add demo button)

---

#### 3.2 First-Time User Onboarding ⏳
**Status:** 🔴 Not Started
**Priority:** P1
**Effort:** 1 day (8 hours)
**ROI:** ⭐⭐⭐⭐⭐

**Description:**
Interactive tutorial overlay for new users.

**Requirements:**
- [ ] Detect first-time user (localStorage flag)
- [ ] Guided tour of interface
- [ ] Highlight key features (chat, dice, save)
- [ ] Can skip or dismiss
- [ ] "Don't show again" option
- [ ] Mobile-friendly
- [ ] Multiple steps (5-7 max)

**Technical Details:**
- **Library:** Consider intro.js or shepherd.js
- **Storage:** `localStorage.getItem('hasSeenTutorial')`

**Tour Steps:**
1. Welcome message
2. How to create a session
3. Drawing tools
4. Chat and dice
5. Saving scenes
6. Done!

**Acceptance Criteria:**
- [ ] Shows once per browser
- [ ] Can be skipped
- [ ] Does not block functionality
- [ ] Works on mobile

**Files to Create:**
- `src/lib/components/OnboardingTour.svelte` (NEW)

---

#### 3.3 Loading States & Animations ⏳
**Status:** 🔴 Not Started
**Priority:** P1
**Effort:** 4 hours
**ROI:** ⭐⭐⭐

**Description:**
Smooth loading states and skeleton screens.

**Requirements:**
- [ ] Loading spinner component
- [ ] Skeleton screens for session list
- [ ] Progress indicators
- [ ] Smooth transitions
- [ ] Error states with retry button

**Technical Details:**
- **Component:** `src/lib/components/LoadingSpinner.svelte` (NEW)
- **Use:** While fetching sessions, loading scenes, etc.

**Acceptance Criteria:**
- [ ] No blank screens while loading
- [ ] Clear feedback on long operations
- [ ] Consistent design across app

**Files to Create:**
- `src/lib/components/LoadingSpinner.svelte`
- `src/lib/components/SkeletonLoader.svelte`

---

#### 3.4 Notification System ⏳
**Status:** 🔴 Not Started
**Priority:** P1
**Effort:** 4 hours
**ROI:** ⭐⭐⭐

**Description:**
Toast notifications for important events.

**Requirements:**
- [ ] Success notifications (green)
- [ ] Error notifications (red)
- [ ] Warning notifications (yellow)
- [ ] Info notifications (blue)
- [ ] Auto-dismiss after 5 seconds
- [ ] Click to dismiss
- [ ] Stack multiple notifications
- [ ] Position: top-right

**Technical Details:**
- **Already have:** `@zerodevx/svelte-toast` package
- **Expand usage:** Consistent across all features

**Acceptance Criteria:**
- [ ] Used for all user actions
- [ ] Clear, concise messages
- [ ] Proper color coding
- [ ] Accessible (ARIA live region)

**Files to Modify:**
- Standardize toast usage across all components

---

#### 3.5 Player Avatars & Profiles ⏳
**Status:** 🔴 Not Started
**Priority:** P2
**Effort:** 6 hours
**ROI:** ⭐⭐⭐

**Description:**
Personalized player avatars and profiles.

**Requirements:**
- [ ] Upload custom avatar image
- [ ] Choose from icon library
- [ ] Initials in colored circle (fallback)
- [ ] Player color picker
- [ ] Display in: chat, player list, tokens
- [ ] Persist per user (localStorage)

**Technical Details:**
- **Storage:** localStorage + session data
- **Icons:** Use Bootstrap Icons (already included)

**Acceptance Criteria:**
- [ ] Avatar shows in all relevant places
- [ ] Easy to upload/change
- [ ] Works on mobile
- [ ] Graceful fallback (initials)

**Files to Create:**
- `src/lib/components/AvatarPicker.svelte` (NEW)
- `src/lib/components/PlayerProfile.svelte` (NEW)

---

#### 3.6 Session Templates ⏳
**Status:** 🔴 Not Started
**Priority:** P2
**Effort:** 6 hours
**ROI:** ⭐⭐⭐⭐

**Description:**
Quick-start templates for different game types.

**Requirements:**
- [ ] Template selection on session creation
- [ ] Templates included:
  - Blank Canvas
  - D&D 5e - Tavern
  - D&D 5e - Dungeon
  - Pathfinder 2e - Wilderness
  - Generic TTRPG
- [ ] Each template includes:
  - Background image
  - Sample tokens
  - Grid settings
  - Game system preset

**Technical Details:**
- **Templates:** Static data files
- **UI:** Radio button selection on create session

**Acceptance Criteria:**
- [ ] 5+ templates available
- [ ] Preview image shown
- [ ] One-click session creation
- [ ] Can customize after creation

**Files to Create:**
- `src/lib/data/session-templates.js` (NEW)

**Files to Modify:**
- `src/lib/components/SessionManager.svelte` (add template picker)

---

#### 3.7 Accessibility Audit & Fixes ⏳
**Status:** 🔴 Not Started
**Priority:** P2
**Effort:** 1 day (8 hours)
**ROI:** ⭐⭐⭐

**Description:**
Full WCAG 2.1 AA compliance audit and remediation.

**Requirements:**
- [ ] Run axe-core accessibility audit
- [ ] Fix all critical issues
- [ ] Fix all serious issues
- [ ] Keyboard navigation audit
- [ ] Screen reader testing
- [ ] Color contrast check
- [ ] Focus indicators
- [ ] ARIA labels

**Acceptance Criteria:**
- [ ] Zero critical accessibility errors
- [ ] All interactive elements keyboard accessible
- [ ] Proper focus management
- [ ] Screen reader friendly

**Tools:**
- axe DevTools browser extension
- Lighthouse CI
- WAVE tool

---

## 📦 Phase 4: Assets & Content

### Priority: P0 - Required for Out-of-Box Experience

#### 4.1 Battle Maps Pack ⏳
**Status:** 🔴 Not Started
**Priority:** P0
**Effort:** 4 hours (sourcing/optimization)
**ROI:** ⭐⭐⭐⭐⭐

**Description:**
10-15 high-quality, free battle maps included.

**Requirements:**
- [ ] Find free/CC0 licensed maps
- [ ] Optimize images (WebP format)
- [ ] Variety of locations:
  - Tavern interior
  - Dungeon corridor
  - Cave system
  - Forest clearing
  - Town square
  - Castle hall
  - Ship deck
  - Desert ruins
  - Mountain pass
  - Throne room
- [ ] Consistent grid size (1 inch = 5 feet)
- [ ] High resolution (4K preferred)

**Technical Details:**
- **Location:** `static/assets/maps/`
- **Format:** WebP (smaller file size)
- **Naming:** Descriptive, lowercase, hyphenated

**Sources:**
- Patreon free tiers
- Reddit r/battlemaps
- CartographyAssets.com

**Acceptance Criteria:**
- [ ] 10+ maps included
- [ ] All properly licensed (CC0/Public Domain)
- [ ] Credits file included
- [ ] Total size < 50MB

**Files to Create:**
- `static/assets/maps/*.webp` (10+ files)
- `static/assets/maps/CREDITS.md`

---

#### 4.2 Token Pack ⏳
**Status:** 🔴 Not Started
**Priority:** P0
**Effort:** 6 hours (sourcing/preparation)
**ROI:** ⭐⭐⭐⭐⭐

**Description:**
50-100 tokens for immediate use.

**Requirements:**
- [ ] Fantasy token collection
- [ ] Categories:
  - Player Characters (10+)
  - Humanoid NPCs (10+)
  - Monsters (20+)
  - Animals (10+)
  - Objects (10+)
- [ ] PNG with transparency
- [ ] Circular frames (standard VTT format)
- [ ] Consistent size (256x256 or 512x512)
- [ ] All CC0/Public Domain licensed

**Technical Details:**
- **Location:** `static/assets/tokens/`
- **Naming:** `category-name.png` (e.g., `pc-warrior.png`)
- **Size:** 256x256px recommended

**Sources:**
- Game-icons.net (CC BY 3.0)
- OpenGameArt.org
- Custom generation (if needed)

**Acceptance Criteria:**
- [ ] 50+ tokens minimum
- [ ] Organized by category
- [ ] Properly licensed
- [ ] Credits file included

**Files to Create:**
- `static/assets/tokens/*.png` (50+ files)
- `static/assets/tokens/CREDITS.md`

---

#### 4.3 Sound Effects & Music ⏳
**Status:** 🔴 Not Started
**Priority:** P2
**Effort:** 4 hours
**ROI:** ⭐⭐⭐

**Description:**
Optional sound effects and ambient music.

**Requirements:**
- [ ] Dice roll sound
- [ ] UI click sounds
- [ ] Ambient music tracks (5+)
- [ ] All CC0/royalty-free
- [ ] Compressed formats (MP3/OGG)

**Technical Details:**
- **Location:** `static/sounds/`
- **Format:** MP3 (widely supported)
- **Size:** Keep individual files < 5MB

**Sources:**
- Freesound.org
- Incompetech.com
- YouTube Audio Library

**Acceptance Criteria:**
- [ ] Proper licensing
- [ ] Good quality
- [ ] Small file sizes
- [ ] Credits included

**Files to Create:**
- `static/sounds/*.mp3`
- `static/sounds/CREDITS.md`

---

## 🚀 Phase 5: DevOps & Deployment

### Priority: P0 - Required for Self-Hosting

#### 5.1 CI/CD Pipeline ⏳
**Status:** 🔴 Not Started
**Priority:** P1
**Effort:** 1 day (8 hours)
**ROI:** ⭐⭐⭐

**Description:**
GitHub Actions for automated testing and building.

**Requirements:**
- [ ] Automated tests on PR
- [ ] Build verification
- [ ] Docker image build
- [ ] Publish to Docker Hub
- [ ] Security scanning
- [ ] Dependency audit

**Technical Details:**
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run build
```

**Acceptance Criteria:**
- [ ] All tests run on PR
- [ ] Build succeeds before merge
- [ ] Docker image auto-published

**Files to Create:**
- `.github/workflows/ci.yml`
- `.github/workflows/docker-publish.yml`

---

#### 5.2 Release Process & Versioning ⏳
**Status:** 🔴 Not Started
**Priority:** P1
**Effort:** 4 hours
**ROI:** ⭐⭐⭐

**Description:**
Semantic versioning and release automation.

**Requirements:**
- [ ] Semantic versioning (MAJOR.MINOR.PATCH)
- [ ] CHANGELOG.md
- [ ] GitHub releases with binaries
- [ ] Docker tags for versions
- [ ] Migration guides for breaking changes

**Technical Details:**
- **Current version:** 1.0.0-rc1
- **Tool:** standard-version or semantic-release

**Acceptance Criteria:**
- [ ] Clear version numbers
- [ ] Release notes for each version
- [ ] Easy to download specific version

**Files to Create:**
- `CHANGELOG.md`
- `.github/workflows/release.yml`

---

#### 5.3 Monitoring & Logging ⏳
**Status:** 🔴 Not Started
**Priority:** P2
**Effort:** 6 hours
**ROI:** ⭐⭐

**Description:**
Structured logging and error tracking.

**Requirements:**
- [ ] Structured JSON logging
- [ ] Log levels (debug, info, warn, error)
- [ ] Request logging
- [ ] Error tracking
- [ ] Performance monitoring

**Technical Details:**
- **Library:** pino or winston
- **Format:** JSON for easy parsing
- **Output:** stdout (Docker captures)

**Acceptance Criteria:**
- [ ] All errors logged
- [ ] Performance metrics captured
- [ ] Easy to debug issues

**Files to Create:**
- `src/lib/server/logger.js` (NEW)

---

#### 5.4 Database Migrations ⏳
**Status:** 🔴 Not Started
**Priority:** P2
**Effort:** 6 hours
**ROI:** ⭐⭐

**Description:**
Schema versioning and migrations.

**Requirements:**
- [ ] Migration scripts
- [ ] Auto-run on startup
- [ ] Rollback capability
- [ ] Version tracking

**Technical Details:**
- **Tool:** Custom scripts (SQLite is simple)
- **Location:** `migrations/`

**Acceptance Criteria:**
- [ ] Migrations run automatically
- [ ] Schema version tracked
- [ ] No data loss

**Files to Create:**
- `src/lib/server/migrations/` (directory)

---

## 📚 Phase 6: Documentation

### Priority: P0 - Critical for Adoption

#### 6.1 Comprehensive README ⏳
**Status:** 🔴 Not Started
**Priority:** P0
**Effort:** 6 hours
**ROI:** ⭐⭐⭐⭐⭐

**Description:**
World-class README with screenshots, quick start, features.

**Requirements:**
- [ ] Hero image/banner
- [ ] Feature list with screenshots
- [ ] Quick start (3 steps max)
- [ ] Installation methods (Docker, Node, npm)
- [ ] Demo link/video
- [ ] Comparison table (vs Roll20, Foundry)
- [ ] Contributing guidelines
- [ ] License
- [ ] Badges (build status, version, license)

**Structure:**
```markdown
# Dimm City Portal

[Hero Image]

## Features
- [Screenshots of each major feature]

## Quick Start
```bash
docker-compose up
```

## Installation
...

## Documentation
...

## Contributing
...

## License
MIT
```

**Acceptance Criteria:**
- [ ] Professional appearance
- [ ] Clear, concise
- [ ] Works on GitHub and in docs
- [ ] Includes all essential info

**Files to Modify:**
- `README.md` (complete rewrite)

---

#### 6.2 User Guide ⏳
**Status:** 🔴 Not Started
**Priority:** P1
**Effort:** 1 day (8 hours)
**ROI:** ⭐⭐⭐⭐

**Description:**
Step-by-step guide for DMs and players.

**Requirements:**
- [ ] Getting started guide
- [ ] DM guide (creating sessions, fog of war, etc.)
- [ ] Player guide (joining, using tools)
- [ ] Screenshots for each step
- [ ] FAQ section
- [ ] Troubleshooting guide

**Structure:**
- `docs/user-guide/getting-started.md`
- `docs/user-guide/dm-guide.md`
- `docs/user-guide/player-guide.md`
- `docs/user-guide/faq.md`

**Acceptance Criteria:**
- [ ] Covers all major features
- [ ] Beginner-friendly
- [ ] Screenshots for clarity
- [ ] Search functionality (if using docs site)

**Files to Create:**
- `docs/user-guide/*.md` (multiple files)

---

#### 6.3 Self-Hosting Guide ⏳
**Status:** 🔴 Not Started
**Priority:** P0
**Effort:** 6 hours
**ROI:** ⭐⭐⭐⭐⭐

**Description:**
Complete guide for deploying and managing the server.

**Requirements:**
- [ ] System requirements
- [ ] Installation methods
- [ ] Configuration guide
- [ ] Backup/restore procedures
- [ ] Upgrading guide
- [ ] Security best practices
- [ ] Troubleshooting

**Topics:**
- Docker deployment
- Reverse proxy setup (nginx/caddy)
- HTTPS/SSL certificates
- Domain setup
- Port forwarding
- Firewall configuration
- Performance tuning

**Acceptance Criteria:**
- [ ] Non-technical users can follow
- [ ] Covers all deployment scenarios
- [ ] Security warnings included

**Files to Create:**
- `docs/self-hosting/deployment.md`
- `docs/self-hosting/configuration.md`
- `docs/self-hosting/security.md`
- `docs/self-hosting/troubleshooting.md`

---

#### 6.4 API Documentation ⏳
**Status:** 🔴 Not Started
**Priority:** P2
**Effort:** 6 hours
**ROI:** ⭐⭐

**Description:**
REST API and WebSocket event documentation.

**Requirements:**
- [ ] All REST endpoints documented
- [ ] All WebSocket events documented
- [ ] Request/response examples
- [ ] Authentication requirements
- [ ] Rate limits

**Format:**
- OpenAPI/Swagger spec
- Or markdown with examples

**Acceptance Criteria:**
- [ ] Complete coverage
- [ ] Working examples
- [ ] Easy to navigate

**Files to Create:**
- `docs/api/rest-api.md`
- `docs/api/websocket-events.md`

---

#### 6.5 Contributing Guide ⏳
**Status:** 🔴 Not Started
**Priority:** P1
**Effort:** 3 hours
**ROI:** ⭐⭐⭐

**Description:**
Guide for contributors.

**Requirements:**
- [ ] Code of conduct
- [ ] Development setup
- [ ] Coding standards
- [ ] PR process
- [ ] Issue templates
- [ ] Feature request template

**Acceptance Criteria:**
- [ ] Lowers barrier to contribution
- [ ] Clear expectations
- [ ] Welcoming tone

**Files to Create:**
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/PULL_REQUEST_TEMPLATE.md`

---

#### 6.6 Video Tutorials ⏳
**Status:** 🔴 Not Started
**Priority:** P2
**Effort:** 2 days (16 hours)
**ROI:** ⭐⭐⭐⭐

**Description:**
Screen recordings showing how to use the platform.

**Requirements:**
- [ ] Quick start video (2 min)
- [ ] DM walkthrough (10 min)
- [ ] Player walkthrough (5 min)
- [ ] Self-hosting tutorial (15 min)
- [ ] Upload to YouTube
- [ ] Embed in README

**Acceptance Criteria:**
- [ ] Professional quality
- [ ] Clear audio
- [ ] Concise
- [ ] Linked from docs

---

## 🎯 Priority Matrix & Roadmap

### Immediate (Week 1-2): Launch Blockers
**Goal:** Ship a complete, usable VTT

1. Initiative Tracker (P0, 1 day)
2. Dice Animations (P0, 0.5 day)
3. Docker Setup (P0, 0.5 day)
4. Environment Config (P0, 0.5 day)
5. Backup/Restore (P0, 0.5 day)
6. Battle Maps Pack (P0, 0.5 day)
7. Token Pack (P0, 0.5 day)
8. Demo Session (P0, 0.5 day)
9. README Rewrite (P0, 0.5 day)
10. Self-Hosting Guide (P0, 0.5 day)

**Total: 6.5 days**

---

### Short Term (Week 3-4): Polish
**Goal:** Make it impressive and production-ready

11. Fog of War (P0, 1 day)
12. Token Library (P1, 1.5 days)
13. Keyboard Shortcuts (P1, 0.5 day)
14. Theme Switcher (P1, 0.3 day)
15. Health Check API (P1, 0.3 day)
16. Onboarding Tour (P1, 1 day)
17. User Guide (P1, 1 day)
18. CI/CD Pipeline (P1, 1 day)

**Total: 6.6 days**

---

### Medium Term (Month 2): Advanced Features
**Goal:** Competitive with paid VTTs

19. Audio Integration (P2, 1 day)
20. Measurement Tools (P2, 0.5 day)
21. Session Templates (P2, 0.5 day)
22. Player Avatars (P2, 0.5 day)
23. Loading States (P1, 0.5 day)
24. Notifications (P1, 0.5 day)
25. Admin Dashboard (P2, 1 day)

**Total: 4.5 days**

---

### Long Term (Month 3+): Nice to Have

26. Accessibility Audit (P2, 1 day)
27. Sound Effects (P2, 0.5 day)
28. Session Cleanup (P2, 0.5 day)
29. Monitoring/Logging (P2, 0.5 day)
30. API Docs (P2, 0.5 day)
31. Video Tutorials (P2, 2 days)

**Total: 5 days**

---

## 📊 Success Metrics

### Technical Metrics
- [ ] Build time < 2 minutes
- [ ] Docker image size < 500MB
- [ ] Page load time < 2 seconds
- [ ] Zero critical security vulnerabilities
- [ ] 90%+ code coverage (if tests implemented)
- [ ] Lighthouse score > 90

### User Metrics (Post-Launch)
- [ ] GitHub stars > 100 (Month 1)
- [ ] GitHub stars > 500 (Month 3)
- [ ] Docker pulls > 1000 (Month 1)
- [ ] Active forks > 20
- [ ] Community contributions > 5 PRs

### Quality Metrics
- [ ] Zero P0 bugs
- [ ] < 5 P1 bugs
- [ ] Response time to issues < 48 hours
- [ ] Documentation coverage 100%

---

## 🎉 Completion Criteria

### Version 1.0 Release Criteria

**Must Have (100% Complete):**
- [x] All P0 items complete
- [ ] All self-hosting essentials
- [ ] Complete documentation
- [ ] 10+ battle maps included
- [ ] 50+ tokens included
- [ ] Demo session
- [ ] Docker deployment

**Should Have (80% Complete):**
- [ ] Most P1 items
- [ ] CI/CD pipeline
- [ ] Video tutorials

**Nice to Have (50% Complete):**
- [ ] Some P2 items
- [ ] Advanced features

---

## 📝 Notes & Decisions

### Design Decisions
- **Self-hosted first:** No cloud dependency
- **Mobile-friendly:** PWA for all platforms
- **Zero friction:** No accounts required
- **Open source:** MIT license
- **Privacy-focused:** All data stays local

### Technical Debt
- Consider replacing js-draw with custom canvas solution (future)
- May need Redis for scaling (post-1.0)
- WebRTC for audio/video (post-1.0)

### Out of Scope (for 1.0)
- ❌ Video chat integration (complex, use Discord)
- ❌ Character sheet management (use external tools)
- ❌ Dice physics engine (animations sufficient)
- ❌ 3D maps (2D is standard)
- ❌ Mobile app (PWA is sufficient)

---

## 🚦 Current Sprint (Week 1)

**Sprint Goal:** Ship launch blockers

**This Week's Tasks:**
1. [ ] Initiative Tracker
2. [ ] Dice Animations
3. [ ] Docker Setup
4. [ ] Environment Config
5. [ ] Battle Maps Pack

**Blocked Items:** None

**In Review:** None

**Completed This Week:** 0/5

---

**Last Updated:** 2025-11-19
**Next Review:** TBD
**Document Owner:** Development Team
