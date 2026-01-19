# Feature Enhancement Plan: Whiteboard & Ideas

## Overview
Add features inspired by Notion, Miro, and FigJam to enhance the whiteboard and ideas pages for personal brainstorming and async team collaboration.

## Features to Implement

### 1. Unified Templates Library
Pre-made templates for both whiteboard and ideas canvases.

### 2. Sticky Notes (Ideas Canvas)
Lightweight quick-add notes with AI-powered clustering.

### 3. Frames/Sections
Named containers to organize content on both platforms.

### 4. Board Linking
Cross-linking between whiteboards and idea canvases.

---

## Phase 1: Database & Types

### Database Migration (`021_board_enhancements.sql`)

```sql
-- Templates table
CREATE TABLE board_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  board_type TEXT NOT NULL CHECK (board_type IN ('whiteboard', 'ideas')),
  category TEXT NOT NULL CHECK (category IN (
    'brainstorming', 'planning', 'retrospectives',
    'user_flows', 'mind_maps', 'wireframes', 'custom'
  )),
  template_data JSONB NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,
  tags TEXT[] DEFAULT '{}',
  is_system BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  use_count INT DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Board links table
CREATE TABLE board_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_board_type TEXT NOT NULL CHECK (source_board_type IN ('whiteboard', 'ideas')),
  source_board_id UUID NOT NULL,
  source_element_id TEXT,
  target_board_type TEXT NOT NULL CHECK (target_board_type IN ('whiteboard', 'ideas')),
  target_board_id UUID NOT NULL,
  target_element_id TEXT,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_board_type, source_board_id, source_element_id,
         target_board_type, target_board_id, target_element_id)
);

-- Extend idea_nodes for sticky notes and frames
ALTER TABLE idea_nodes DROP CONSTRAINT idea_nodes_node_type_check;
ALTER TABLE idea_nodes ADD CONSTRAINT idea_nodes_node_type_check
  CHECK (node_type IN (
    'idea', 'task', 'question', 'insight', 'resource', 'root',
    'sticky_note', 'frame'
  ));
ALTER TABLE idea_nodes ADD COLUMN frame_style TEXT DEFAULT 'default';
ALTER TABLE idea_nodes ADD COLUMN is_collapsed BOOLEAN DEFAULT false;
ALTER TABLE idea_nodes ADD COLUMN z_index INT DEFAULT 0;

-- Add frames metadata to whiteboards
ALTER TABLE whiteboards ADD COLUMN frames JSONB DEFAULT '[]';
```

### Type Definitions (`/src/types/index.ts`)

```typescript
// Template types
export type TemplateCategory = 'brainstorming' | 'planning' | 'retrospectives' |
  'user_flows' | 'mind_maps' | 'wireframes' | 'custom';

export interface BoardTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  board_type: 'whiteboard' | 'ideas';
  category: TemplateCategory;
  template_data: Record<string, unknown>;
  thumbnail_url: string | null;
  tags: string[];
  is_system: boolean;
  is_public: boolean;
  use_count: number;
  featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Board link types
export interface BoardLink {
  id: string;
  source_board_type: 'whiteboard' | 'ideas';
  source_board_id: string;
  source_element_id: string | null;
  target_board_type: 'whiteboard' | 'ideas';
  target_board_id: string;
  target_element_id: string | null;
  label: string | null;
  created_at: string;
}

// Extend IdeaNodeType
export type IdeaNodeType = 'root' | 'idea' | 'task' | 'question' |
  'insight' | 'resource' | 'sticky_note' | 'frame';
```

### Files to Modify
- `/supabase/migrations/021_board_enhancements.sql` (new)
- `/src/types/index.ts`

---

## Phase 2: Sticky Notes

### New Components

**`/src/components/ideas/StickyNoteNode.tsx`**
- Custom ReactFlow node for sticky notes
- Compact square design (150x150px default)
- 8 color options matching existing palette
- Single-click to edit text
- No expand button or handles

**`/src/components/ideas/StickyNoteToolbar.tsx`**
- Quick color picker (8 colors)
- Size toggle (small/medium/large)

### Store Updates (`/src/stores/idea-canvas-store.ts`)
- Add `addStickyNote(position, color)` action
- Add `clusterStickyNotes(nodeIds)` action for AI clustering

### Integration Points
- Add "Sticky Note" button to `CanvasToolbar.tsx`
- Register `sticky_note` type in ReactFlow nodeTypes
- Update context menu with sticky note options

### Files to Create/Modify
- `/src/components/ideas/StickyNoteNode.tsx` (new)
- `/src/components/ideas/StickyNoteToolbar.tsx` (new)
- `/src/stores/idea-canvas-store.ts`
- `/src/components/ideas/CanvasToolbar.tsx`
- `/src/app/admin/ideas/[id]/page.tsx`

---

## Phase 3: Templates Library

### New Components

**`/src/components/templates/TemplateGallery.tsx`**
- Grid view with search and category filters
- Tabs: "All", "Whiteboard", "Ideas"
- Category filter dropdown

**`/src/components/templates/TemplateCard.tsx`**
- Thumbnail preview
- Name, description, category badge
- Use count indicator

**`/src/components/templates/SaveAsTemplateDialog.tsx`**
- Name, description, category inputs
- Tag selector
- Visibility toggle (private/public)

**`/src/components/templates/UseTemplateDialog.tsx`**
- Template preview
- "Use Template" button
- Creates new board from template

### API Routes

**`/src/app/api/templates/route.ts`**
- GET: List templates with filters
- POST: Create new template

**`/src/app/api/templates/[id]/route.ts`**
- GET: Get template details
- PATCH: Update template
- DELETE: Delete template

### Admin Page

**`/src/app/admin/templates/page.tsx`**
- Template management dashboard
- Create, edit, delete templates
- Toggle system/featured status

### Integration Points
- Add "Create from Template" to whiteboard/ideas creation dialogs
- Add "Save as Template" to editor toolbars
- Seed 6-8 system templates per category

### Files to Create
- `/src/components/templates/TemplateGallery.tsx`
- `/src/components/templates/TemplateCard.tsx`
- `/src/components/templates/SaveAsTemplateDialog.tsx`
- `/src/components/templates/UseTemplateDialog.tsx`
- `/src/app/api/templates/route.ts`
- `/src/app/api/templates/[id]/route.ts`
- `/src/app/admin/templates/page.tsx`

---

## Phase 4: Frames/Sections

### Ideas Canvas (ReactFlow)

**`/src/components/ideas/FrameNode.tsx`**
- Large resizable container node
- Header with name, collapse toggle, color
- Lower z-index (renders behind other nodes)
- Tracks contained nodes via position overlap

**Frame Containment Logic:**
- On frame drag: move all contained nodes
- On node drag into frame: auto-assign to frame
- Store `parentFrameId` on nodes for explicit tracking

### Whiteboard (Excalidraw)

**`/src/components/whiteboard/FramePanel.tsx`**
- Panel showing list of frames
- Click to navigate to frame
- Collapse/expand toggles

**Integration:**
- Use Excalidraw's native frame support
- Store frame metadata in `frames` column
- Sync frame state on save

### Shared
- Frame style presets (8 colors + default)
- Collapse animation

### Files to Create/Modify
- `/src/components/ideas/FrameNode.tsx` (new)
- `/src/components/whiteboard/FramePanel.tsx` (new)
- `/src/stores/idea-canvas-store.ts`
- `/src/components/whiteboard/WhiteboardEditor.tsx`

---

## Phase 5: Board Linking

### New Components

**`/src/components/shared/BoardLinkDialog.tsx`**
- Board type selector (Whiteboard/Ideas)
- Board search/dropdown
- Optional label input

**`/src/components/shared/BoardLinkBadge.tsx`**
- Link icon badge on linked elements
- Tooltip showing linked board name
- Click to navigate

**`/src/components/shared/LinkedBoardsPanel.tsx`**
- Sidebar panel showing all links for current board
- Grouped by incoming/outgoing
- Quick navigation

### API Routes

**`/src/app/api/board-links/route.ts`**
- GET: List links for a board
- POST: Create board link

**`/src/app/api/board-links/[id]/route.ts`**
- DELETE: Delete board link

### Integration Points
- Ideas: Add "Link to Board" in context menu
- Whiteboard: Add link button to toolbar
- Show linked boards count in admin lists

### Files to Create
- `/src/components/shared/BoardLinkDialog.tsx`
- `/src/components/shared/BoardLinkBadge.tsx`
- `/src/components/shared/LinkedBoardsPanel.tsx`
- `/src/app/api/board-links/route.ts`
- `/src/app/api/board-links/[id]/route.ts`

---

## Phase 6: AI Enhancements

### AI Clustering for Sticky Notes

**`/src/app/api/ideas/cluster/route.ts`**
- Input: Array of sticky note contents
- Uses Claude to analyze semantic similarity
- Returns suggested groups with frame positions

### AI Auto-Frame Suggestions

**`/src/app/api/ideas/suggest-frames/route.ts`**
- Analyzes existing nodes on canvas
- Suggests frame groupings based on content themes
- Returns frame definitions with suggested contained nodes

### Integration
- "Auto-cluster" button in toolbar when sticky notes selected
- "Suggest Frames" button in canvas toolbar

### Files to Create
- `/src/app/api/ideas/cluster/route.ts`
- `/src/app/api/ideas/suggest-frames/route.ts`

---

## Implementation Order

| Order | Feature | Estimated Effort |
|-------|---------|------------------|
| 1 | Database migration & types | Small |
| 2 | Sticky Notes | Medium |
| 3 | Templates Library | Large |
| 4 | Frames/Sections | Medium |
| 5 | Board Linking | Medium |
| 6 | AI Enhancements | Medium |

---

## Verification Plan

### After Each Phase:
1. Run `npm run build` to verify no type errors
2. Test new features in dev environment (`npm run dev`)
3. Verify database migrations work correctly
4. Test on both whiteboard and ideas pages as applicable

### End-to-End Testing:
1. Create a template from existing whiteboard
2. Use template to create new ideas canvas
3. Add sticky notes and cluster them with AI
4. Create frames and verify containment
5. Link boards and verify navigation
6. Export/import template data

---

## Documentation Updates

Update `/docs/FEATURES.md` with:
- Templates usage guide
- Sticky notes and frames documentation
- Board linking instructions
- AI clustering feature guide
