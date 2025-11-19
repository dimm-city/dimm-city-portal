# Tokens Guide

This guide explains how to add and use tokens in Dimm City Portal VTT.

## Quick Start

The VTT ships with 50 placeholder token entries. To use real tokens:

1. **Find or create token images** (see [Sources](#sources-for-free-tokens) below)
2. **Add PNG files** (with transparency) to `static/assets/tokens/`
3. **Update metadata** in `static/assets/tokens/tokens.json`
4. **Use tokens** via the existing Token Selector in the Editor

## Token System

Dimm City Portal uses the existing js-draw token system integrated into the Editor. The placeholder tokens.json file provides a structured catalog for when a dedicated TokenBrowser UI is implemented.

### Current Token Usage

**For Players:**
- Click the "Player Token" button in the toolbar
- Select your token color
- Your token appears on the canvas
- Move it by dragging

**For DMs:**
- Use the drawing tools to add images to the canvas
- Images can represent tokens, objects, or effects
- Future: TokenBrowser will provide one-click token placement

## Token Specifications

**Recommended format:**
- **File type:** PNG with transparency
- **Size:** 200x200px to 512x512px (square)
- **Background:** Transparent
- **Border:** Optional circular border or frame

**Token sizes** (for D&D 5e grid):
- **Tiny:** <5ft (items, familiars)
- **Small:** 5ft (goblins, halflings, gnomes)
- **Medium:** 5ft (humans, elves, most PCs)
- **Large:** 10ft (horses, ogres, some monsters)
- **Huge:** 15ft (giants, young dragons)
- **Gargantuan:** 20ft+ (ancient dragons, titans)

## Sources for Free Tokens

### Public Domain / CC0

1. **[2-Minute Tabletop](https://2minutetabletop.com/product-category/tokens/)**
   - High-quality, simple art style
   - Many free token packs
   - Perfect for beginners

2. **[Game-icons.net](https://game-icons.net/)**
   - 4000+ free SVG icons
   - CC BY 3.0 license
   - Convertible to PNG tokens
   - Great for objects and effects

3. **[Token Stamp 2](http://rolladvantage.com/tokenstamp/)**
   - Free online token creator
   - Upload your images
   - Add borders and frames
   - Download instantly

### Creative Commons (Attribution Required)

4. **[Forgotten Adventures](https://www.forgotten-adventures.net/)**
   - High-quality token packs
   - Free and Patreon tiers
   - Attribution required

5. **[Devin Night Token Packs](https://immortalnights.com/tokensite/)**
   - Professional quality
   - Free samples available
   - Check license for each pack

### Token Creation Tools

6. **[Token Tool](https://www.rptools.net/toolbox/token-tool/)**
   - Free desktop app (Windows/Mac/Linux)
   - Add borders, frames, overlays
   - Batch processing

7. **[Roll20 Character Creator](https://app.roll20.net/)**
   - Free account required
   - Built-in character art
   - Export as PNG

8. **[Heroforge](https://www.heroforge.com/)** (Desktop app, $10)
   - 3D character creator
   - Export top-down tokens
   - Highly customizable

## Adding Tokens to Your Collection

### Step 1: Prepare Token Images

```bash
# Create tokens directory if needed
mkdir -p static/assets/tokens

# Move your token PNGs to the directory
cp ~/Downloads/fighter-01.png static/assets/tokens/
```

### Step 2: Update tokens.json

Add a new entry:

```json
{
  "id": "fighter-custom-01",
  "name": "Fighter (Custom)",
  "category": "pc",
  "filename": "fighter-01.png",
  "size": "medium",
  "tags": ["fighter", "warrior", "custom"],
  "description": "Custom fighter token",
  "author": "Your Name",
  "license": "CC0",
  "isPlaceholder": false
}
```

### Step 3: Use in Game

Currently, tokens are added using the Editor's drawing tools:
1. Upload image to the canvas
2. Resize as needed
3. Move and position

**Future:** TokenBrowser will provide one-click token placement with automatic sizing.

## Token Organization

Organize tokens by category in `tokens.json`:

- **pc**: Player characters (fighters, wizards, rogues)
- **npc**: NPCs and allies (guards, merchants, villagers)
- **monster**: Enemies (goblins, orcs, dragons)
- **object**: Items and props (chests, doors, traps)
- **effect**: Markers and effects (AoE, conditions, numbers)

## Batch Token Creation

### Using Token Tool (GUI)

1. Download Token Tool from rptools.net
2. Load your character images
3. Select border style
4. Export all with consistent sizing

### Using ImageMagick (CLI)

Create circular tokens from images:

```bash
# Convert square image to circular token with border
convert input.png \
  -resize 512x512 \
  -gravity center \
  -extent 512x512 \
  \( +clone -threshold -1 -negate -fill white -draw "circle 256,256 256,0" \) \
  -alpha off -compose copy_opacity -composite \
  -bordercolor white -border 8 \
  output-token.png
```

### Using Node.js (sharp)

```javascript
import sharp from 'sharp';
import fs from 'fs';

const inputDir = './character-art';
const outputDir = './static/assets/tokens';

const files = fs.readdirSync(inputDir);

for (const file of files) {
  const input = `${inputDir}/${file}`;
  const output = `${outputDir}/${file}`;

  await sharp(input)
    .resize(512, 512, { fit: 'cover' })
    .png()
    .toFile(output);

  console.log(`✓ Created token: ${file}`);
}
```

## Best Practices

### 1. Consistent Sizing

Keep all tokens at the same resolution:
- **Recommended:** 512x512px (high quality, reasonable file size)
- **Minimum:** 200x200px (acceptable for most uses)
- **Maximum:** 1024x1024px (overkill for most VTTs)

### 2. Transparency

Always use PNG with transparency:
- No white backgrounds
- Clean alpha channel edges
- Consider adding a subtle border

### 3. Naming Convention

Use descriptive, consistent names:

```
✓ fighter-male-sword-01.png
✓ goblin-archer-02.png
✓ wizard-female-staff-01.png

✗ token1.png
✗ IMG_5432.png
✗ character_FINAL_v3_NEW.png
```

### 4. File Size

Keep individual tokens under 500KB:
- Use PNG compression
- Avoid excessive detail
- 512x512px at 8-bit color = ~200-400KB

## Token Browser (Coming Soon)

A dedicated TokenBrowser component is planned with features:

- **Search and Filter:** Find tokens by name, category, size, tags
- **Drag and Drop:** Drag tokens directly onto the map
- **Auto-Sizing:** Tokens automatically sized based on creature size
- **Collections:** Organize tokens into campaigns or encounters
- **Favorites:** Quick access to frequently used tokens
- **Upload:** Upload custom tokens directly from the browser

## Current Workflow

Until TokenBrowser is implemented:

### As DM:

1. Use Editor drawing tools to add images
2. Manually size and position tokens
3. Use Initiative Tracker for combat order

### As Player:

1. Use "Player Token" button for your character
2. Select color and position
3. Move token as your character moves

## Integration with Initiative Tracker

The Initiative Tracker complements token usage:

1. Add combatants to Initiative Tracker
2. Place corresponding tokens on map
3. Track turn order and HP in tracker
4. Move tokens during each turn

## Future Enhancements

Planned token system improvements:

1. **TokenBrowser Component** (P1)
   - Browse 50+ placeholders
   - Search, filter, category selection
   - One-click placement on map

2. **Token Management** (P2)
   - Upload custom tokens via UI
   - Create token collections
   - Share token packs

3. **Advanced Features** (P3)
   - Aura/radius visualization
   - HP bars on tokens
   - Status condition markers
   - Token vision/fog of war

## Getting Help

- **Documentation:** [README.md](./README.md)
- **Issues:** [GitHub Issues](https://github.com/dimm-city/dimm-city-portal/issues)
- **Community:** [r/VTT](https://www.reddit.com/r/VTT/)

---

**Note:** The tokens.json file provides a placeholder system ready for when TokenBrowser is implemented. For now, use the existing Editor tools to place tokens on your maps!
