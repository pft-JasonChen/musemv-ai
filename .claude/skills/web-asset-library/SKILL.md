---
name: web-asset-library
description: Image asset sourcing for web prototypes. Resolution order — local img/ folder (primary), Figma export (fallback), visible placeholder (last resort). Manages naming conventions, manifest, and export rules.
allowed-tools: Read, Write, Glob, mcp__cf475d39*
---

# SKILL — Web Asset Library

> Image sourcing for web prototypes: local `img/` folder (primary) + Figma export (fallback).

---

## PURPOSE

Provide a deterministic, predictable way to source images and visual assets for web prototypes. The agent must never guess or hallucinate image paths — every `<img src>` must resolve to a real file.

---

## FOLDER STRUCTURE

```
img/                              # Project-level asset library (persists across features)
├── icons/                        # Icon library — see full catalog below
│   ├── ic-*.svg                  # System UI icons (SVG primary source)
│   ├── system icon/              # PNG copies of system icons (fallback only)
│   └── custom icon/              # PNG feature/AI-tool icons (no SVG equivalent)
├── photos/                       # Photography assets (hero, testimonial, product)
├── ui/                           # UI elements (avatars, thumbnails, badges, patterns)
├── brand/                        # Logos, wordmarks, brand marks
├── product/                      # Product screenshots, feature illustrations
└── README.md                     # Manifest: lists all assets with descriptions
```

---

## ICON LIBRARY CATALOG

### Icon Tiers & Format Rules

| Tier | Location | Format | Use when |
|---|---|---|---|
| **System icons** | `img/icons/*.svg` | SVG (24×24) | Primary — always prefer SVG |
| **System icons (PNG)** | `img/icons/system icon/*.png` | PNG | Only if SVG rendering is broken |
| **Custom feature icons** | `img/icons/custom icon/*.png` | PNG | Feature/AI-tool sidebar icons — no SVG available |

**Always use SVG from root `img/icons/` first. Fall back to `system icon/` PNG only when SVG is unavailable.**

### Naming Convention

```
ic-<function>[-<variant>].<ext>          # system icons (ic- prefix)
<FeatureName>_<Variant>.<ext>            # surface/tool icons (PascalCase)
<Feature_Name>.<ext>                     # custom feature icons (underscore_separated)
```

**Suffix glossary:**

| Suffix | Meaning | Example |
|---|---|---|
| `_OL` | Outline style | `ic-check_OL.svg`, `Home_OL.svg` |
| `_Fill` / `-f` | Filled/solid style | `Play_Fill.svg`, `ic-crown-f.svg` |
| `_B` | Blue theme variant | `Edit_B_OL.svg`, `ic-check-b.svg` |
| `_R` | Red theme variant | `Edit_R_OL.svg`, `ic-check-r.svg` |
| `_B_OL` | Blue + outline combined | `Pause_B_OL.svg` |
| `_R_OL` | Red + outline combined | `Pause_R_OL.svg` |

---

### System Icons — Full Catalog (SVG at `img/icons/`)

#### Navigation & Surface
```
Home_OL.svg          Gallery_OL.svg       Layers_OL.svg
Default_OL.svg       Number.svg           AI-Agent_OL.svg
AI-PHOTO-EDITING_OL.svg                   AI-PORTRAIT_OL.svg
ic-ai-image.svg      ic-ai-video.svg
```

#### Arrows & Chevrons
```
ic-arrow-up.svg          ic-arrow-down.svg        ic-arrow-left.svg
ic-arrow-right.svg       ic-arrow-left-right.svg  ic-arrow-right-left.svg
ic-arrow-u-left.svg      ic-arrow-u-right.svg     ic-arrow-up-left.svg
ic-arrow-up-right.svg
ic-chevron-up.svg        ic-chevron-down.svg      ic-chevron-left.svg
ic-chevron-right.svg
ic-chevrons-left.svg     ic-chevrons-right.svg    ic-chevrons-left-right.svg
ic-chevrons-right-left.svg
```

#### Actions & Editing
```
Crop_OL.svg              Scissors_OL.svg          expand.svg
Edit_B_OL.svg            Edit_R_OL.svg            Edit-2_B_OL.svg
Edit-3_R_OL.svg          copy_OL.svg              copy-plus.svg
ic-eraser.svg            ic-hand-brush.svg        ic-rotate-ccw.svg
ic-compare.svg           ic-trash.svg             ic-plus.svg
ic-upload.svg            ic-download.svg          funnel_OL.svg
history_OL.svg           pin.svg                  pin-fill.svg
reply_OL.svg             send-horizontal_OL.svg
square-arrow-out-up-right_OL.svg                  X-circle_OL.svg
```

#### Media & Playback
```
ic-video.svg             ic-video-2.svg           ic-image.svg
ic-music.svg             ic-music-f.svg
ic-volume-high.svg       ic-volume-high-f.svg     ic-volume-x.svg
ic-volume-x-f.svg        camera_OL.svg
Play_Fill.svg            Pause_B_OL.svg           Pause_R_OL.svg
```

#### UI Controls & Layout
```
ic-sliders-horizontal.svg    ic-sliders-horizontal-2.svg
ic-sliders-vertical.svg      ic-sliders-vertical-2.svg
ic-panel-left-open.svg       ic-panel-left-close.svg
ic-panel-right-open.svg      ic-panel-right-close.svg
ic-maximize.svg              ic-expand-diagonal.svg    ic-expand-diagonal-2.svg
More-horizontal_OL.svg       More-vertical_OL.svg
message-circle-plus_OL.svg   message-square-plus_OL.svg
message-square-reply_OL.svg
```

#### Feedback & Status
```
ic-check-b.svg           ic-check-r.svg           ic-info.svg
ic-question.svg          ic-x-b.svg               ic-x-b-r.svg
thumbs-up_OL.svg         thumbs-up_Fill.svg       thumbs-down_OL.svg
thumbs-down_Fill.svg
```

#### User & Identity
```
ic-user.svg              ic-user-alt.svg          ic-user-select.svg
ic-crown-f.svg           user-sparkle_OL.svg
```

---

### Custom Feature Icons — Full Catalog (PNG at `img/icons/custom icon/`)

These are product/feature-specific icons used in tool sidebars and feature menus. PNG only — no SVG equivalent.

#### Photo Editing Tools
```
AI_Color_Correction.png    AI_Colorize.png         AI_Face_Retouch.png
Adjust_Light_&_Color.png   Batch_Photo_Ennancer.png Batch_Image_Converter.png
Blur_Background.png        Change_Background.png   Crop.png
Effects_B_OL.png           Effects_R_OL.png        Flip_&_Rotate.png
Image_Converter.png        Object_Removal.png      Photo_Enhancer.png
Remove_Background.png      Resize.png              Scratch Removal_OL.png
photo-repair.png
```

#### AI Portrait & Generation
```
AI_Studio_Generator.png      AI_lmage_Generator.png    Al_Avatar_Generator.png
Al_Headshot_Generator.png    Al_Hairstyle_Generator.png
Al_Hair_Color_Changer_2ub.png Al_Hair_Volume.png       Al_Hair_Wavy.png
Al_Bang_Generator.png        A_Hair_Extension.png      beard.png
Al_Face_Shape_Detector.png   Al_Face_Swap.png          Al_Face_Swap_B.png
Al_Makeup-Virtual_Try_On.png Al_Makeup_Transfer.png    nails-color.png
Al_Look Virtual Try On.png   ai-reshape.png
body-reshape-b.png           body-reshape-r.png
```

#### AI Image & Generation Tools
```
Al_Generate.png              Al_Replace.png            Al_lmage_Extender.png
Al_Lighting.png              hugeicons_magic-wand-01.png
magic-wand_OL.png            magic_wand_2tone.png
magic_wand_2tone_thin.png    magic_wand_thin.png
```

#### Video Tools
```
Image_to_Video.png           Video_Ennancer.png         Video_Ennancer_B.png
Video_Face_Swap.png          N_Video_Face_Swap.png      Video_Object_Removal.png
Video_Style_Transfer.png     Video_Style_Transfer_B.png
text to video_B_OL.png       text to video_R_OL.png
```

#### Integration & System
```
API Integration.png          ic-api-b.png               ic-api-r.png
settings.png                 layers.png                 folder-open.png
file-image.png               file-user.png              file-video-2OL.png
circle-user-roundOL.png      gallery-vertical-endOL.png
gallery-vertical-endOLthin.png
```

---

### Icon Selection Rules

1. **Match suffix to context:** Use `_B` (blue) for primary/active states, `_R` (red) for destructive/accent actions, plain `_OL` for neutral/inactive.
2. **Filled vs. Outline:** `_Fill` for selected/active/on states; `_OL` for default/off states.
3. **Surface icons** (`AI-Agent_OL`, `AI-PHOTO-EDITING_OL`, `AI-PORTRAIT_OL`) — used only in top-level navigation and page headers.
4. **Custom feature icons** — used only in tool sidebar lists and feature pickers. Never use as UI controls.
5. **HTML usage:** Reference SVG system icons inline or as `<img>` tags: `<img src="../../img/icons/ic-arrow-right.svg" alt="" aria-hidden="true">`. For custom icons: `<img src="../../img/icons/custom icon/AI_Face_Retouch.png" alt="AI Face Retouch">`.

---

### Naming Convention (legacy / other assets)

```
<category>-<descriptor>[-<variant>].<ext>
```

- **category:** matches folder name (photo, ui, brand, product)
- **descriptor:** kebab-case function/content description
- **variant:** optional size/theme/state (e.g., `-dark`, `-2x`, `-small`)
- **ext:** `.svg` for vector, `.webp` for raster (prefer webp over png/jpg)

---

## RESOLUTION RULES (priority order)

When the prototype needs an image:

### 1. Local `img/` folder (PRIMARY)

- Check `img/` for an asset matching the needed content.
- Read `img/README.md` manifest to find the closest match.
- If exact match exists → use it via relative path: `img/photos/hero-editor-workspace.webp`.

### 2. Figma Export (FALLBACK)

If the asset exists in the Figma file but not in `img/`:

1. Use `mcp__cf475d39__get_screenshot` or `mcp__cf475d39__upload_assets` to export the node.
2. Save exported asset to `img/<appropriate-subfolder>/`.
3. Update `img/README.md` manifest with the new entry.
4. Reference via relative path.

**Figma export constraints:**
- Only export from Figma A (library) or Figma B (target) — fileKeys must be known.
- Export at 2x resolution for raster assets.
- SVG for icons/logos when source is vector.
- Rename exported file to match naming convention (Figma export names are often node IDs).

### 3. Placeholder (LAST RESORT)

If the asset cannot be sourced from either location:

1. Use a solid-color placeholder div with appropriate aspect ratio.
2. Add a visible badge: `<span class="img-placeholder-badge">Image pending</span>`
3. Log the gap in the prototype's `README.md` under "Missing Assets".
4. Log in brief §7 (Open Questions).

**Placeholder CSS pattern:**
```css
.img-placeholder {
  background: var(--bg-surface);
  border: 1px dashed var(--stroke-weak);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.img-placeholder-badge {
  font-size: var(--font-size-tiny);
  color: var(--text-weak);
  padding: var(--spacing-4) var(--spacing-8);
  background: var(--bg-base);
  border-radius: var(--radius-8);
  border: 1px solid var(--stroke-weak);
}
```

---

## MANAGING THE LIBRARY

### Adding Assets

When a new asset is added (manually by user or via Figma export):

1. Place in correct subfolder.
2. Follow naming convention.
3. Add entry to `img/README.md`:
   ```markdown
   | Filename | Description | Source | Dimensions |
   |---|---|---|---|
   | photos/hero-editor-workspace.webp | Editor workspace hero shot | Figma A node 1234:5678 | 1440×800 |
   ```

### User Preparation

Users can pre-populate the `img/` folder by:
- Manually placing exported assets from Figma (recommended for large batches).
- Running a Figma export script.
- Copying from a shared asset CDN or internal library.

The agent will always check `img/` FIRST before attempting any Figma export.

---

## FIGMA EXPORT API USAGE

When Figma export fallback is triggered:

```
Tool: mcp__cf475d39__get_screenshot
Input: { fileKey: "<known_key>", nodeId: "<target_node>", format: "png", scale: 2 }
```

Or for SVG vector assets:
```
Tool: mcp__cf475d39__upload_assets
Input: { fileKey: "<known_key>", nodes: [{ nodeId: "<target>", format: "svg" }] }
```

**Important:** The agent cannot freely browse Figma for images. It can only export assets from:
- Nodes referenced in §6 Component Checklist (with known node IDs).
- Nodes discovered during Stage 1 Inventory.
- Nodes explicitly identified by the user.

If no node ID is available for a needed asset, halt and ask the user.

---

## INTEGRATION WITH WEB PROTOTYPE PIPELINE

- **Stage 1 (Inventory):** Scan `img/` folder, build asset manifest, identify gaps vs. §4/§5 requirements.
- **Stage 0a (AskUserQuestion):** Ask user about asset handling preferences (use local, export from Figma, placeholders OK?).
- **Stage 2 (Build):** Reference assets by relative path from prototype folder.
- **Stage 3 (Validate):** Check item 18 (all img src resolve) and item 20 (placeholder badges visible).

---

## RULES

1. **Never hallucinate an image path.** Every `src` must point to a verified file.
2. **Local first.** Always check `img/` before attempting Figma export.
3. **Manifest is source of truth.** If `img/README.md` doesn't list it, verify the file exists with `Read`/`Glob`.
4. **Placeholder must be visible.** Users should never see a broken image icon — use the styled placeholder.
5. **Figma export requires node ID.** No node ID = no export. Ask the user.
6. **2x raster.** All raster exports at 2x for retina displays.
