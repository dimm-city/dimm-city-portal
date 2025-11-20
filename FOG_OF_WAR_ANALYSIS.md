# Fog of War Implementation Analysis

**Date:** 2025-11-19
**Status:** Design & Architecture Analysis
**Current Blocker:** js-draw library doesn't export AbstractTool API for custom component registration

---

## Background

The original implementation attempted to create a `FogComponent` that extends js-draw's `AbstractComponent`. This approach failed because:
1. js-draw doesn't export the AbstractTool API needed for custom component registration
2. The component registration system (`AbstractComponent.registerComponent`) is not accessible
3. Error: "Component fog-of-war has not been registered"

**Existing Work:**
- `src/lib/components/editor/FogComponent.js` - 186 lines of code (complete implementation)
- Full fog rendering logic (DM sees semi-transparent, players see opaque)
- Serialization/deserialization for persistence
- Path-based fog drawing

---

## Three Alternative Approaches

### Option 1: HTML5 Canvas Overlay Layer ⭐ RECOMMENDED

**Architecture:**
```
+----------------------------------+
|  Fog Canvas (z-index: 100)      | ← New HTML5 canvas
+----------------------------------+
|  js-draw Canvas (z-index: 50)   | ← Existing editor
+----------------------------------+
|  Background (z-index: 10)        | ← Map layer
+----------------------------------+
```

**Implementation Strategy:**

1. **Create separate HTML5 canvas element**
   - Position absolutely above js-draw canvas
   - Match dimensions and transform (zoom/pan) synchronization
   - Render fog independently of js-draw

2. **Fog Data Structure:**
```javascript
{
  fogPaths: [
    {
      id: 'uuid',
      type: 'polygon' | 'rectangle' | 'circle',
      points: [[x, y], ...],
      timestamp: Date.now()
    }
  ],
  visibility: true,
  mode: 'paint' | 'erase'
}
```

3. **Drawing Modes:**
   - **Paint Mode:** Click and drag to draw fog polygons
   - **Erase Mode:** Click fog areas to remove/punch holes
   - **Brush Tool:** Configurable brush size for painting

4. **Synchronization:**
   - Listen to js-draw's pan/zoom events
   - Apply same transformation matrix to fog canvas
   - Sync via WebSocket (emit `fogUpdate` event)

5. **Role-Based Rendering:**
```javascript
// DM View
ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent
ctx.globalCompositeOperation = 'source-over';

// Player View
ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Opaque
ctx.globalCompositeOperation = 'source-over';
```

**File Structure:**
```
src/lib/components/editor/
├── FogOfWarCanvas.svelte      (NEW - Svelte wrapper)
├── FogOfWarEngine.js          (NEW - Canvas drawing engine)
├── FogOfWarStore.js           (NEW - State management)
└── Editor.svelte              (MODIFY - Add fog canvas)
```

**Pros:**
- ✅ **Complete control** - No dependency on js-draw internals
- ✅ **High performance** - Native canvas drawing, GPU-accelerated
- ✅ **Clean separation** - Fog logic independent of editor
- ✅ **Easy WebSocket sync** - Simple data structure
- ✅ **Flexible drawing** - Can use any canvas API (gradients, patterns)
- ✅ **No library modifications** - Works with current js-draw version

**Cons:**
- ❌ **Transform synchronization** - Need to listen to js-draw events
- ❌ **Additional canvas layer** - Slight memory overhead
- ❌ **Z-index management** - Must ensure proper layering
- ❌ **Touch/mouse coordination** - Need to handle both canvases

**Implementation Effort:** ~6-8 hours
- 2 hours: Canvas overlay setup + transform sync
- 2 hours: Drawing engine (paint/erase modes)
- 2 hours: WebSocket sync + persistence
- 2 hours: UI controls + testing

---

### Option 2: SVG Overlay Layer

**Architecture:**
```
+----------------------------------+
|  SVG Fog Layer (z-index: 100)   | ← New SVG overlay
+----------------------------------+
|  js-draw Canvas (z-index: 50)   | ← Existing editor
+----------------------------------+
|  Background (z-index: 10)        | ← Map layer
+----------------------------------+
```

**Implementation Strategy:**

1. **SVG Container:**
```html
<svg class="fog-overlay" viewBox="0 0 1000 1000">
  <defs>
    <clipPath id="fog-clip">
      <!-- Fog paths define revealed areas -->
    </clipPath>
  </defs>

  <!-- Full screen fog rect, clipped by revealed areas -->
  <rect width="100%" height="100%" fill="black" opacity="0.5" />
</svg>
```

2. **Fog Data Structure:**
```javascript
{
  fogPaths: [
    {
      id: 'uuid',
      d: 'M 10 10 L 50 50 L 90 10 Z', // SVG path data
      operation: 'add' | 'subtract'
    }
  ],
  visibility: true
}
```

3. **Drawing Modes:**
   - Convert mouse movements to SVG path commands
   - Use `<path>` elements for fog shapes
   - Invert paths for "reveal" functionality (negative space)

4. **Synchronization:**
   - SVG `viewBox` syncs with js-draw viewport
   - CSS transforms for zoom/pan
   - Serialize SVG paths to JSON for WebSocket

5. **Role-Based Rendering:**
```javascript
// DM View
<rect fill="black" opacity="0.5" clip-path="url(#fog-clip)" />

// Player View
<rect fill="black" opacity="1.0" clip-path="url(#fog-clip)" />
```

**File Structure:**
```
src/lib/components/editor/
├── FogOfWarSVG.svelte         (NEW - SVG fog layer)
├── FogPathBuilder.js          (NEW - SVG path generation)
├── FogOfWarStore.js           (NEW - State management)
└── Editor.svelte              (MODIFY - Add SVG layer)
```

**Pros:**
- ✅ **Scalable** - Vector-based, no pixelation
- ✅ **Easy to serialize** - SVG paths are already text-based
- ✅ **Complex shapes** - Bezier curves, smooth edges
- ✅ **CSS styling** - Easy opacity/color changes
- ✅ **Inspect/debug** - SVG DOM is human-readable
- ✅ **Clip paths** - Natural fog reveal with negative space

**Cons:**
- ❌ **Performance** - Can degrade with many complex paths
- ❌ **Brush drawing complexity** - Converting mouse to smooth SVG paths
- ❌ **Transform sync** - viewBox calculations can be tricky
- ❌ **Large fog areas** - Complex paths can have large file sizes
- ❌ **Browser differences** - SVG rendering quirks across browsers

**Implementation Effort:** ~8-10 hours
- 3 hours: SVG overlay setup + viewBox sync
- 3 hours: Path generation from mouse input
- 2 hours: Clip-path fog reveal logic
- 2 hours: WebSocket sync + testing

---

### Option 3: js-draw Image Elements with Metadata Filtering

**Architecture:**
```
js-draw Canvas (existing)
├── Background Layer
├── Drawing Layer
│   ├── Regular Strokes
│   └── Fog Objects ← Tagged with metadata
└── UI Layer
```

**Implementation Strategy:**

1. **Treat fog as regular js-draw image elements:**
   - Add black rectangles/paths to the canvas
   - Tag them with custom metadata: `{ type: 'fog', id: 'uuid' }`
   - Use js-draw's existing serialization

2. **Fog Data Structure:**
```javascript
// Use js-draw's ImageComponent directly
const fogRect = ImageComponent.ofPath(Path.fromRect(rect), {
  fill: Color4.ofRGBA(0, 0, 0, 1.0)
});

// Add custom metadata
fogRect.metadata = {
  type: 'fog',
  id: crypto.randomUUID(),
  dmOnly: true
};
```

3. **Rendering Filter:**
   - Hook into js-draw's render pipeline
   - Filter fog objects based on user role
   - Show semi-transparent to DM, opaque to players

4. **Synchronization:**
   - Use existing js-draw's `postSerializedCommand` infrastructure
   - Fog objects sync automatically with other drawing commands
   - Filter on deserialization based on player role

5. **Role-Based Rendering:**
```javascript
// Override render method or use filter
editor.addEventListener(EditorEventType.CommandDone, (event) => {
  const elements = editor.image.getAllElements();
  for (const elem of elements) {
    if (elem.metadata?.type === 'fog') {
      // Adjust opacity based on user role
      elem.setOpacity(isDM ? 0.5 : 1.0);

      // Prevent player selection/deletion
      if (!isDM) {
        elem.setLocked(true);
      }
    }
  }
});
```

**File Structure:**
```
src/lib/components/editor/
├── FogTool.js                 (NEW - Fog drawing tool wrapper)
├── FogMetadataFilter.js       (NEW - Role-based filtering)
└── Editor.js                  (MODIFY - Add fog tool)
```

**Pros:**
- ✅ **Leverages existing infrastructure** - Uses js-draw's serialization
- ✅ **Automatic sync** - Fog syncs with other drawing commands
- ✅ **No additional layers** - Works within js-draw canvas
- ✅ **Undo/redo** - Free with js-draw's command system
- ✅ **Simple implementation** - Minimal code changes
- ✅ **Transform handling** - js-draw handles zoom/pan

**Cons:**
- ❌ **Fog is selectable** - Players might interact with fog objects
- ❌ **Metadata visibility** - Metadata included in serialization (players could inspect)
- ❌ **Limited control** - Bound by js-draw's rendering pipeline
- ❌ **Locking complexity** - Need to lock fog objects from player manipulation
- ❌ **Z-index issues** - Fog may not always render above other objects
- ❌ **Security concern** - Difficult to truly hide fog from client-side inspection

**Implementation Effort:** ~4-6 hours
- 2 hours: Fog tool wrapper implementation
- 2 hours: Metadata filtering + role-based rendering
- 1 hour: Locking/security measures
- 1 hour: Testing + UI controls

---

## Comparison Matrix

| Criteria | Canvas Overlay | SVG Overlay | js-draw Image Elements |
|----------|---------------|-------------|------------------------|
| **Performance** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐ Good | ⭐⭐⭐⭐ Very Good |
| **Implementation Effort** | ⭐⭐⭐⭐ 6-8h | ⭐⭐⭐ 8-10h | ⭐⭐⭐⭐⭐ 4-6h |
| **Maintainability** | ⭐⭐⭐⭐ Clean separation | ⭐⭐⭐ Moderate | ⭐⭐ Tightly coupled |
| **Security** | ⭐⭐⭐⭐⭐ Full control | ⭐⭐⭐⭐⭐ Full control | ⭐⭐ Client-side filtering |
| **Flexibility** | ⭐⭐⭐⭐⭐ Full canvas API | ⭐⭐⭐⭐ SVG capabilities | ⭐⭐⭐ Limited to js-draw |
| **Scalability** | ⭐⭐⭐⭐ Bitmap-based | ⭐⭐⭐⭐⭐ Vector-based | ⭐⭐⭐⭐ js-draw native |
| **Undo/Redo** | ⭐⭐ Need custom impl | ⭐⭐ Need custom impl | ⭐⭐⭐⭐⭐ Built-in |
| **Mobile Support** | ⭐⭐⭐⭐ Touch events | ⭐⭐⭐ Touch + SVG quirks | ⭐⭐⭐⭐⭐ js-draw handles |
| **Sync Complexity** | ⭐⭐⭐ Transform sync | ⭐⭐⭐ ViewBox sync | ⭐⭐⭐⭐⭐ Automatic |
| **Player Security** | ⭐⭐⭐⭐⭐ Server-side | ⭐⭐⭐⭐⭐ Server-side | ⭐⭐ Client-side only |

---

## Recommendation: Option 1 - HTML5 Canvas Overlay ⭐

### Why Canvas Overlay is Best

1. **Security & Control:**
   - Fog data managed independently from drawing canvas
   - Server can send different fog states to DM vs players
   - No risk of client-side inspection revealing fog areas

2. **Performance:**
   - Native canvas rendering is GPU-accelerated
   - No DOM overhead (unlike SVG)
   - Efficient re-rendering on pan/zoom

3. **Clean Architecture:**
   - Fog layer completely separate from js-draw
   - No dependency on js-draw internals
   - Easy to maintain and extend

4. **Flexibility:**
   - Can implement advanced features (gradient fog, animated fog, fog presets)
   - Full control over rendering pipeline
   - Easy to add brush sizes, opacity controls, etc.

5. **Future-Proof:**
   - Works with any js-draw version (no API dependency)
   - Can easily migrate if we switch drawing libraries
   - Minimal technical debt

### Why NOT the Other Options

**SVG Overlay:**
- Comparable architecture to canvas but worse performance
- SVG path manipulation is more complex than canvas
- No significant advantages over canvas for this use case

**js-draw Image Elements:**
- Security concerns (client-side metadata filtering)
- Player could inspect/manipulate fog objects
- Fog competes with Z-index of other drawing objects
- Violates separation of concerns (fog is not a "drawing")

---

## Implementation Plan (Option 1)

### Phase 1: Core Fog Engine (4 hours)

**1.1 Create FogOfWarCanvas.svelte**
```svelte
<script>
  import { onMount } from 'svelte';
  import { player } from '../PortalStore.js';

  let { editor } = $props(); // js-draw editor instance
  let fogCanvas;
  let ctx;
  let isDM = $derived($player?.host || false);

  onMount(() => {
    ctx = fogCanvas.getContext('2d');
    syncTransform();

    // Listen to js-draw pan/zoom events
    editor.addEventListener(EditorEventType.ViewportChanged, syncTransform);

    return () => {
      editor.removeEventListener(EditorEventType.ViewportChanged, syncTransform);
    };
  });

  function syncTransform() {
    // Apply js-draw's transform to fog canvas
    const viewport = editor.viewport;
    // Implementation details...
  }
</script>

<canvas
  bind:this={fogCanvas}
  class="fog-canvas"
  class:dm-view={isDM}
/>

<style>
  .fog-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 100;
    pointer-events: none; /* Let clicks pass through when not in fog mode */
  }

  .fog-canvas.active {
    pointer-events: auto; /* Capture clicks when fog tool is active */
  }
</style>
```

**1.2 Create FogOfWarEngine.js**
```javascript
export class FogOfWarEngine {
  constructor(canvas, isDM = false) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.isDM = isDM;
    this.fogPaths = [];
    this.mode = 'paint'; // 'paint' | 'erase'
    this.brushSize = 50;
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const opacity = this.isDM ? 0.5 : 1.0;
    this.ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;

    for (const path of this.fogPaths) {
      this.ctx.fill(path);
    }
  }

  addFogPath(points) {
    const path = new Path2D();
    if (points.length > 0) {
      path.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        path.lineTo(points[i].x, points[i].y);
      }
      path.closePath();
    }
    this.fogPaths.push(path);
  }

  eraseFog(point, radius) {
    // Use composite operation to erase
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.beginPath();
    this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.globalCompositeOperation = 'source-over';
  }

  serialize() {
    return {
      fogPaths: this.fogPaths.map(path => /* serialize path */),
      mode: this.mode,
      brushSize: this.brushSize
    };
  }
}
```

### Phase 2: WebSocket Integration (2 hours)

**2.1 Backend (PortalServer.js)**
```javascript
// Add fog data to session schema
session.fogData = {
  paths: [],
  visibility: true
};

// WebSocket handlers
socket.on('updateFog', async (data) => {
  const { sessionId, fogData } = data;

  // Validate host permission
  if (!isHost(socket, sessionId)) {
    return socket.emit('error', { message: 'Only DM can update fog' });
  }

  // Update session fog data
  await SessionStore.updateFogData(sessionId, fogData);

  // Emit different fog states to DM and players
  io.to(`session-${sessionId}`).emit('fogUpdated', {
    fogData: fogData, // DM sees full data
    visibility: fogData.visibility
  });

  // Players get filtered fog
  const playerSockets = getPlayerSockets(sessionId);
  playerSockets.forEach(playerSocket => {
    playerSocket.emit('fogUpdated', {
      fogData: filterFogForPlayer(fogData),
      visibility: fogData.visibility
    });
  });
});
```

**2.2 Frontend (FogOfWarStore.js)**
```javascript
import { writable } from 'svelte/store';
import { socket } from '../PortalStore.js';

export const fogData = writable({
  paths: [],
  visibility: true
});

export const fogMode = writable('paint'); // 'paint' | 'erase' | null
export const fogBrushSize = writable(50);

// Sync fog updates via WebSocket
socket.on('fogUpdated', (data) => {
  fogData.set(data.fogData);
});

export function updateFog(newFogData) {
  fogData.set(newFogData);
  socket.emit('updateFog', {
    sessionId: get(sessionId),
    fogData: newFogData
  });
}
```

### Phase 3: UI Controls (2 hours)

**3.1 Add Fog Toolbar (Editor.js)**
```javascript
// Add fog tools to DM toolbar
if (isHost) {
  toolbar.addActionButton(
    {
      label: 'Fog: Paint',
      icon: /* fog icon */
    },
    () => {
      fogMode.set('paint');
    }
  );

  toolbar.addActionButton(
    {
      label: 'Fog: Erase',
      icon: /* eraser icon */
    },
    () => {
      fogMode.set('erase');
    }
  );

  toolbar.addActionButton(
    {
      label: 'Clear Fog',
      icon: /* clear icon */
    },
    () => {
      if (confirm('Clear all fog?')) {
        updateFog({ paths: [], visibility: true });
      }
    }
  );

  toolbar.addActionButton(
    {
      label: 'Toggle Fog',
      icon: /* eye icon */
    },
    () => {
      fogData.update(data => ({
        ...data,
        visibility: !data.visibility
      }));
    }
  );
}
```

### Phase 4: Testing & Polish (2 hours)

- [ ] Test fog drawing in paint mode
- [ ] Test fog erasing in erase mode
- [ ] Test DM visibility (semi-transparent)
- [ ] Test player visibility (opaque)
- [ ] Test fog persistence (save/load)
- [ ] Test fog sync across clients
- [ ] Test mobile touch drawing
- [ ] Test zoom/pan synchronization
- [ ] Test clear all fog
- [ ] Test toggle visibility

---

## Success Criteria

- ✅ DM can paint fog areas with brush tool
- ✅ DM can erase fog areas to reveal map
- ✅ DM sees semi-transparent fog (50% opacity)
- ✅ Players see opaque fog (100% opacity)
- ✅ Fog persists across page refresh
- ✅ Fog syncs in real-time to all players
- ✅ Fog respects zoom/pan transformations
- ✅ Clear all fog button works
- ✅ Toggle fog visibility (DM only)
- ✅ Mobile-friendly touch drawing
- ✅ No performance degradation

---

## Alternative Quick Win: Server-Side Fog Filtering

If time is constrained, we could implement a **hybrid approach**:

1. Use **Option 3** (js-draw Image Elements) for quick implementation
2. Add **server-side fog filtering**:
   - DM client sends fog objects to server
   - Server stores fog separately from scene
   - Server sends different scene data to players (fog excluded)
   - Players never receive fog coordinates

This gives us:
- ✅ Quick implementation (4-6 hours)
- ✅ Secure (server-side filtering)
- ❌ Still limited by js-draw's rendering pipeline
- ❌ Fog competes with drawing objects

**Recommendation:** Only use this if we need fog **immediately**. Otherwise, invest in Canvas Overlay for long-term solution.

---

## Conclusion

**Implement Option 1: HTML5 Canvas Overlay**

- **Best performance:** Native canvas rendering
- **Best security:** Server-controlled fog distribution
- **Best architecture:** Clean separation of concerns
- **Best maintainability:** Independent of js-draw internals
- **Reasonable effort:** 8 hours for full implementation
- **Future-proof:** Works with any version of js-draw

This approach leverages the existing `FogComponent.js` logic but renders it on a separate canvas layer instead of trying to integrate with js-draw's internal component system.
