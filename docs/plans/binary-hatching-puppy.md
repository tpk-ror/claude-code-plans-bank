# Ideas Page UX Enhancement Plan

## Goal
Make the `/ideas` canvas editor ultra user-friendly with auto-save, undo/redo, context menus, alignment tools, and power-user keyboard shortcuts.

## Requirements Summary
- **Auto-save**: Debounced (2-3 sec after changes stop), simple "Saved/Saving" indicator
- **Undo/Redo**: Full support, 20 steps history, Ctrl+Z/Y, toolbar buttons
- **Context Menu**: Full-featured (CRUD, AI actions, organization, alignment)
- **Alignment**: Basic align, distribute, smart guides while dragging
- **Keyboard Shortcuts**: Power user set (see Phase 5)

---

## Implementation Phases

### Phase 1: Foundation
**Install dependencies:**
```bash
npm install zustand @radix-ui/react-context-menu
npx shadcn@latest add context-menu
```

**Create new files:**

1. **`/src/stores/idea-canvas-store.ts`** - Zustand store for canvas state
   - State: nodes, edges, historyStack (max 20), historyIndex, saveStatus, clipboard
   - Actions: addNode, deleteNodes, updateNode, moveNodes, addEdge, deleteEdges
   - History: pushToHistory, undo, redo
   - Clipboard: copy, paste, duplicate

2. **`/src/lib/canvas-utils.ts`** - Pure alignment/distribution functions
   - `alignNodes(nodes, direction)` - left/center/right/top/middle/bottom
   - `distributeNodes(nodes, direction)` - horizontal/vertical
   - `findAlignmentGuides(movingNode, otherNodes, threshold)`
   - `snapToGuide(position, guides, threshold)`

3. **`/src/types/index.ts`** - Add types:
   ```typescript
   export interface CanvasHistoryEntry {
     nodes: IdeaNode[];
     edges: IdeaConnection[];
     action: string;
   }
   export interface AlignmentGuide {
     position: number;
     orientation: 'horizontal' | 'vertical';
     type: 'edge' | 'center';
   }
   ```

---

### Phase 2: Auto-save & Save Status
**Modify: `/src/app/admin/ideas/[id]/page.tsx`**

1. Replace `useNodesState`/`useEdgesState` with Zustand store
2. Add auto-save effect with 2.5s debounce:
   ```typescript
   useEffect(() => {
     if (!hasUnsavedChanges) return;
     const timeout = setTimeout(async () => {
       setSaveStatus('saving');
       await saveCanvas();
       setSaveStatus('saved');
     }, 2500);
     return () => clearTimeout(timeout);
   }, [hasUnsavedChanges]);
   ```
3. Add save status indicator in header (checkmark for saved, spinner for saving)
4. Gray out manual save button when already saved

---

### Phase 3: Undo/Redo System
**Modify: `/src/stores/idea-canvas-store.ts`**

1. Implement history tracking with command pattern:
   - Push state snapshot on each undoable action
   - Limit to 20 entries, trim oldest when exceeded
   - On undo: decrement index, restore state
   - On redo: increment index, restore state

2. Batch position changes during drag (commit single history entry on dragEnd)

**Create: `/src/components/ideas/CanvasToolbar.tsx`**
- Undo button (disabled at history start)
- Redo button (disabled at history end)
- Save status indicator
- Add node dropdown
- Tooltips with keyboard shortcuts

---

### Phase 4: Context Menus
**Create: `/src/components/ideas/ContextMenu.tsx`**

Three menu types based on context:

1. **Pane Menu** (right-click empty canvas):
   - Add Node submenu (Root, Idea, Task, Question, Insight, Resource)
   - Paste (if clipboard has content)

2. **Node Menu** (right-click single node):
   - Edit (Ctrl+E)
   - Duplicate (Ctrl+D)
   - Delete (Del)
   - Separator
   - Change Type submenu (6 types, 1-6 keys)
   - Change Color submenu (8 colors)
   - Separator
   - Expand with AI
   - Connect to...

3. **Multi-select Menu** (right-click with multiple selected):
   - Align submenu (Left, Center, Right, Top, Middle, Bottom)
   - Distribute submenu (Horizontally, Vertically)
   - Separator
   - Duplicate All
   - Delete All

**Integrate into page:**
- Use ReactFlow's `onPaneContextMenu` and `onNodeContextMenu` props
- Position menu within viewport bounds

---

### Phase 5: Keyboard Shortcuts
**Create: `/src/hooks/useCanvasKeyboardShortcuts.ts`**

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Y / Ctrl+Shift+Z | Redo |
| Delete / Backspace | Delete selected |
| Ctrl+S | Manual save |
| Ctrl+D | Duplicate selected |
| Ctrl+A | Select all nodes |
| Arrow keys | Nudge 1px |
| Shift+Arrow | Nudge 10px |
| 1-6 | Change node type (root, idea, task, question, insight, resource) |
| Ctrl+E | Edit selected node |
| Ctrl+G | Group selected (future) |
| Escape | Clear selection / close dialogs |

**Implementation notes:**
- Check if input is focused before handling
- Prevent default for browser shortcuts (Ctrl+S, Ctrl+A)
- Use `useEffect` with `keydown` listener

---

### Phase 6: Smart Guides & Alignment
**Create: `/src/components/ideas/SmartGuides.tsx`**

1. SVG overlay showing alignment guides
2. Detect during `onNodeDrag`:
   - Compare moving node edges/center to all other nodes
   - Threshold: 5px
   - Show dashed lines when aligned
3. Optional snap-to-guide behavior

**Integrate alignment actions:**
- Context menu triggers `alignNodes()` / `distributeNodes()` from canvas-utils
- Update positions through store (creates undo entry)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/admin/ideas/[id]/page.tsx` | Replace state with Zustand, add auto-save, integrate context menu & shortcuts |
| `src/components/ideas/IdeaNode.tsx` | Add context menu handler, multi-select visual indicator |
| `src/types/index.ts` | Add CanvasHistoryEntry, AlignmentGuide types |

## New Files to Create

| File | Purpose |
|------|---------|
| `src/stores/idea-canvas-store.ts` | Zustand store for canvas state + history |
| `src/lib/canvas-utils.ts` | Alignment/distribution utilities |
| `src/components/ideas/CanvasToolbar.tsx` | Toolbar with undo/redo, save status |
| `src/components/ideas/ContextMenu.tsx` | Right-click context menus |
| `src/components/ideas/SmartGuides.tsx` | Alignment guide overlay |
| `src/hooks/useCanvasKeyboardShortcuts.ts` | Keyboard shortcut handler |
| `src/components/ui/context-menu.tsx` | shadcn/ui context menu (via CLI) |

---

## Verification Plan

1. **Auto-save**: Make changes, wait 3 sec, refresh page - changes should persist
2. **Save indicator**: Watch status change from "Saved" → "Saving..." → "Saved"
3. **Undo/Redo**: Add node, Ctrl+Z removes it, Ctrl+Y restores it
4. **Context menu**: Right-click canvas shows add menu, right-click node shows edit menu
5. **Alignment**: Select 3 nodes, right-click → Align → Left - nodes align
6. **Smart guides**: Drag node near another, guide lines appear
7. **Shortcuts**: Test all keyboard shortcuts in table above
8. **Edge cases**: Undo at start (button disabled), Redo at end (button disabled)

---

## Reference Files
- `src/components/whiteboard/WhiteboardEditor.tsx` (lines 198-270) - Auto-save pattern
- `src/components/ui/dropdown-menu.tsx` - Pattern for context-menu component
