# Battle Maps Guide

This guide explains how to add, manage, and use battle maps in Dimm City Portal VTT.

## Quick Start

The VTT ships with 15 placeholder maps that demonstrate functionality. To use real maps:

1. **Find or create maps** (see [Sources](#sources-for-free-battle-maps) below)
2. **Add image files** to `static/assets/maps/`
3. **Update metadata** in `static/assets/maps/maps.json`
4. **Refresh** the Map Browser in-app

## Directory Structure

```
static/assets/maps/
├── maps.json              # Map metadata and configuration
├── forest-clearing-01.jpg # Full-size map images
├── forest-clearing-01-thumb.jpg # Thumbnails (optional)
├── dungeon-room-01.jpg
└── ... more maps
```

## Adding a New Map

### Step 1: Prepare the Map Image

**Recommended specifications:**
- **Format:** JPG for photographs, PNG for transparency/grid overlays
- **Resolution:** 1400-2400px for longest side (balance quality vs file size)
- **Grid:** Pre-gridded maps work best (standard 5ft grid for D&D)
- **File size:** Keep under 2MB per map for fast loading

**Example file sizes:**
- 1750x1750px JPG @ 85% quality = ~400-600KB
- 2100x1500px JPG @ 85% quality = ~500-800KB

### Step 2: Create Thumbnail (Optional but Recommended)

Thumbnails significantly improve browser performance:

```bash
# Using ImageMagick
convert forest-clearing-01.jpg -resize 300x300^ -gravity center -extent 300x300 forest-clearing-01-thumb.jpg

# Using Node.js (sharp)
npm install sharp
node -e "require('sharp')('forest-clearing-01.jpg').resize(300, 300, {fit: 'cover'}).toFile('forest-clearing-01-thumb.jpg')"
```

### Step 3: Add Map Entry to maps.json

Copy an existing entry and modify:

```json
{
  "id": "your-map-id",
  "name": "Your Map Name",
  "category": "wilderness",  // dungeon, wilderness, urban, special
  "filename": "your-map-file.jpg",
  "thumbnail": "your-map-file-thumb.jpg",  // optional
  "gridSize": 30,  // number of grid squares (e.g., 30x30)
  "gridUnits": "5ft",  // standard D&D grid
  "resolution": {
    "width": 2100,
    "height": 2100
  },
  "tags": ["forest", "outdoor", "daytime"],  // for searching
  "description": "A detailed description of the map location and features",
  "author": "Map Creator Name",
  "license": "CC0",  // or "CC BY 4.0", etc.
  "attribution": "Required attribution text if any",
  "sourceUrl": "https://source.com/map",  // optional
  "isPlaceholder": false  // IMPORTANT: Set to false for real maps
}
```

### Step 4: Verify

1. Start the VTT server
2. Join a session
3. Click the Map Browser button in toolbar
4. Search for your map
5. Click to load onto canvas

## Map Metadata Fields

### Required Fields

- **id**: Unique identifier (lowercase-with-hyphens)
- **name**: Display name shown in browser
- **category**: Category ID (must match one from categories array)
- **filename**: Actual file name in /static/assets/maps/
- **gridSize**: Number of grid squares (e.g., 30 for 30x30 grid)
- **gridUnits**: Unit per square (typically "5ft" for D&D)
- **resolution**: Object with width/height in pixels
- **isPlaceholder**: Boolean - set to `false` for real maps

### Optional Fields

- **thumbnail**: Smaller preview image filename
- **tags**: Array of searchable keywords
- **description**: Helpful description for DMs
- **author**: Creator's name
- **license**: License type (CC0, CC BY 4.0, etc.)
- **attribution**: Required attribution text
- **sourceUrl**: Original source URL

## Sources for Free Battle Maps

### Public Domain / CC0 (No Attribution Required)

1. **[r/battlemaps](https://www.reddit.com/r/battlemaps/)** (Reddit)
   - Filter by "Free" flair
   - Check comments for license info
   - High-quality community maps

2. **[2-Minute Tabletop](https://2minutetabletop.com/)**
   - Many free maps in "Free Gallery"
   - Simple, clean art style
   - Clear licensing

3. **[Forgotten Adventures](https://www.forgotten-adventures.net/)**
   - Asset packs for map making
   - Some free map packs
   - Attribution required for some

### Creative Commons (Attribution Required)

4. **[Dyson Logos](https://dysonlogos.blog/maps/)**
   - Hundreds of free maps
   - CC BY 4.0 license
   - Attribution: "Map by Dyson Logos"

5. **[Miska's Maps](https://www.miskasmaps.com/)**
   - Patreon-based with free tier
   - High-quality isometric maps
   - Check individual map licenses

### Map-Making Tools (Create Your Own)

6. **[Dungeondraft](https://dungeondraft.net/)** ($20 one-time)
   - Professional map creation
   - Export at any resolution
   - Large asset library

7. **[Inkarnate](https://inkarnate.com/)** (Free tier available)
   - Browser-based map maker
   - Free tier has limited assets
   - Export up to 2048px (free) or 4096px (pro)

8. **[DungeonScrawl](https://dungeonscrawl.com/)** (Free)
   - Simple, clean dungeon maker
   - Free to use and export
   - Minimal art style

## Map Categories

Define categories in the `categories` array:

```json
{
  "id": "dungeon",
  "name": "Dungeons & Caverns",
  "description": "Underground locations, dungeons, and cave systems",
  "icon": "🏰"
}
```

**Default categories:**
- **dungeon**: Underground, caves, crypts
- **wilderness**: Forests, mountains, rivers
- **urban**: Cities, buildings, interiors
- **special**: Unique/magical locations

Add custom categories as needed!

## Batch Processing Maps

### Using ImageMagick (Linux/Mac)

Resize all JPGs to max 2100px width:

```bash
cd static/assets/maps
for img in *.jpg; do
  convert "$img" -resize 2100x2100\> -quality 85 "optimized-$img"
done
```

Create thumbnails for all maps:

```bash
for img in *.jpg; do
  if [[ ! "$img" == *"-thumb.jpg" ]]; then
    convert "$img" -resize 300x300^ -gravity center -extent 300x300 "${img%.jpg}-thumb.jpg"
  fi
done
```

### Using Node.js Script

Create `scripts/optimize-maps.js`:

```javascript
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const mapsDir = './static/assets/maps';
const files = fs.readdirSync(mapsDir).filter(f => f.match(/\.(jpg|png)$/i) && !f.includes('-thumb'));

for (const file of files) {
  const input = path.join(mapsDir, file);
  const base = path.basename(file, path.extname(file));

  // Resize main image
  await sharp(input)
    .resize(2100, 2100, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(path.join(mapsDir, `${base}-optimized.jpg`));

  // Create thumbnail
  await sharp(input)
    .resize(300, 300, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toFile(path.join(mapsDir, `${base}-thumb.jpg`));

  console.log(`✓ Processed: ${file}`);
}
```

Run with: `node scripts/optimize-maps.js`

## Best Practices

### 1. Consistent Naming

Use descriptive, lowercase-with-hyphens naming:

```
✓ forest-clearing-01.jpg
✓ dungeon-crypt-large.jpg
✓ tavern-interior-cozy.jpg

✗ Map1.jpg
✗ NEW_DUNGEON.png
✗ final_FINAL_v2.jpg
```

### 2. Grid Alignment

For best results:
- Use pre-gridded maps when possible
- Standard D&D grid is 5ft per square
- Common grid sizes: 20x20, 25x25, 30x30, 35x35
- Match gridSize in JSON to actual grid squares

### 3. File Size Management

- Keep individual maps under 2MB
- Use JPG for photorealistic maps (smaller file size)
- Use PNG only when transparency is needed
- Compress without visible quality loss (85% JPG quality is ideal)

### 4. Organization

Group maps by campaign or type:

```
static/assets/maps/
├── starter-set/
│   ├── goblin-hideout.jpg
│   └── dragon-lair.jpg
├── homebrew-campaign/
│   ├── town-square.jpg
│   └── mystic-forest.jpg
└── generic/
    ├── tavern-01.jpg
    └── inn-common-room.jpg
```

Update `filename` paths accordingly in maps.json.

### 5. Attribution

If using CC BY or similar licenses:
- Set `attribution` field in JSON
- Display in Map Browser (automatically handled)
- Include in campaign notes
- Link to source in `sourceUrl`

## Map Browser Features

The built-in Map Browser provides:

- **Search**: Find maps by name, description, or tags
- **Category Filter**: Browse by dungeon, wilderness, urban, special
- **Grid/List Views**: Toggle display mode
- **Metadata Display**: Grid size, units, tags
- **Placeholder Detection**: Visual indicators for missing images
- **Responsive Design**: Works on desktop and mobile

## Using Maps in Sessions

### As DM (Host)

1. Click "Maps" button in toolbar
2. Browse or search for desired map
3. Click map to load onto canvas
4. Map appears as background layer
5. Adjust zoom/position as needed
6. Add tokens on top

### Grid Alignment (Coming Soon)

Future versions will include:
- Auto-align grid to map grid
- Manual grid offset controls
- Grid overlay toggle
- Snap-to-grid for tokens

## Troubleshooting

### Map Not Showing in Browser

**Possible causes:**
1. File doesn't exist at specified path
2. Filename mismatch in maps.json
3. Invalid JSON syntax
4. Browser cache

**Solutions:**
```bash
# Verify file exists
ls -la static/assets/maps/your-map.jpg

# Validate JSON
cat static/assets/maps/maps.json | python -m json.tool

# Clear browser cache
# Chrome: Ctrl+Shift+R
# Firefox: Ctrl+F5
```

### Map Loads Slowly

**Possible causes:**
1. File size too large (>2MB)
2. Resolution too high (>2500px)
3. No thumbnail (browser loads full image)

**Solutions:**
```bash
# Check file size
du -h static/assets/maps/*.jpg

# Optimize images
# See "Batch Processing Maps" above

# Create thumbnails for all maps
for img in *.jpg; do
  convert "$img" -resize 300x300^ "${img%.jpg}-thumb.jpg"
done
```

### Placeholder Badge Shows on Real Map

**Cause:** `isPlaceholder` field is still `true`

**Solution:**
```json
{
  "id": "your-map",
  "isPlaceholder": false  // Set to false
}
```

## Advanced: Dynamic Map Loading

For large campaigns with 100+ maps, consider dynamic loading:

### Option 1: Multiple JSON Files

```
static/assets/maps/
├── core-maps.json
├── campaign1-maps.json
├── campaign2-maps.json
└── ...
```

Modify MapBrowser.svelte to load additional JSONs.

### Option 2: API Endpoint

Create `/api/maps` endpoint that:
- Scans `static/assets/maps/` directory
- Generates JSON dynamically
- Caches results for performance

### Option 3: Database Storage

For very large collections:
- Store map metadata in SQLite
- Create API endpoints for CRUD
- Build admin UI for map management

## Contributing Maps

Want to contribute free maps to the community?

1. **Create high-quality maps** (1750x1750px or larger)
2. **License as CC0 or CC BY 4.0**
3. **Share on r/battlemaps** with [Free] flair
4. **Link in Dimm City Portal discussions**

Popular CC0 map creators are always appreciated!

## Getting Help

- **Documentation:** [README.md](./README.md)
- **Issues:** [GitHub Issues](https://github.com/dimm-city/dimm-city-portal/issues)
- **Community:** [r/battlemaps](https://www.reddit.com/r/battlemaps/)

---

**Remember:** Start with a few favorite maps, then expand your collection over time!
