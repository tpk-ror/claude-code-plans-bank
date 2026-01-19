# Plan: Add Style Dropdown to Whiteboard

## Overview
Add a style dropdown to the whiteboard editor that allows users to select from 12 predefined visual styles. Each style applies a cohesive color palette affecting the canvas background and default element colors.

## Style Presets (12 options)

| Style | Background | Stroke | Fill | Description |
|-------|------------|--------|------|-------------|
| **Classic** | `#ffffff` | `#1e1e1e` | `transparent` | Default Excalidraw |
| **Black & White** | `#ffffff` | `#000000` | `#ffffff` | Pure monochrome |
| **Neon** | `#0a0a0a` | `#00ffff` | `#ff00ff` | Dark bg, bright neons |
| **Pastel** | `#fef9f3` | `#6b7280` | `#fcd5ce` | Soft muted tones |
| **Blueprint** | `#1e3a5f` | `#ffffff` | `#3b82f6` | Technical blue |
| **Sunset** | `#fef3e2` | `#dc2626` | `#fb923c` | Warm oranges/pinks |
| **Ocean** | `#e0f2fe` | `#0369a1` | `#7dd3fc` | Cool blues/teals |
| **Forest** | `#ecfdf5` | `#166534` | `#86efac` | Greens/earth tones |
| **Retro** | `#fef9c3` | `#92400e` | `#fbbf24` | Vintage mustard/rust |
| **Candy** | `#fdf2f8` | `#be185d` | `#f9a8d4` | Bright pinks/purples |
| **Minimalist** | `#f5f5f5` | `#737373` | `#e5e5e5` | Subtle grays |
| **Chalkboard** | `#1a3129` | `#ffffff` | `#4ade80` | Dark green, chalk |

## Implementation Steps

### 1. Create Style Presets Configuration
**File:** `src/components/whiteboard/whiteboard-styles.ts` (new file)

Define the style presets with Excalidraw-compatible appState properties:
- `viewBackgroundColor` - canvas background
- `currentItemStrokeColor` - default stroke for new elements
- `currentItemBackgroundColor` - default fill for new elements
- `currentItemFillStyle` - hachure/solid/cross-hatch

### 2. Add Style Dropdown Component
**File:** `src/components/whiteboard/WhiteboardEditor.tsx`

Changes:
- Import `DropdownMenu` components from shadcn/ui
- Import `Palette` icon from lucide-react
- Add `currentStyle` state to track selected style
- Add dropdown in header between Settings and Save buttons
- Show current style name with color indicator

### 3. Implement Style Application
**File:** `src/components/whiteboard/WhiteboardEditor.tsx`

- Create `applyStyle()` function that:
  1. Updates Excalidraw appState via `excalidrawAPI.updateScene()`
  2. Sets the canvas background color
  3. Updates default colors for new elements
- Mark whiteboard as having unsaved changes when style changes

## Files to Modify
1. `src/components/whiteboard/whiteboard-styles.ts` - **CREATE** - Style definitions
2. `src/components/whiteboard/WhiteboardEditor.tsx` - **MODIFY** - Add dropdown UI and logic

## Verification
1. Open whiteboard editor at `/admin/whiteboards/[id]`
2. Verify style dropdown appears in header
3. Select each style and confirm:
   - Canvas background changes
   - New elements use the style's stroke/fill colors
4. Save whiteboard and reload - verify style persists
5. Test in both light and dark mode
