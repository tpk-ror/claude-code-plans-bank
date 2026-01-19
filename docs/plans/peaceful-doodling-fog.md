# Project Canvases: Interactive Storyboards, Ideas & Whiteboards

Embed interactive Excalidraw canvases into project pages to showcase thought process and structure. Visitors can fully manipulate elements (pan, zoom, move objects) but changes reset on refresh.

## Requirements Summary
- **3 Canvas Types**: Storyboard (user flows), Ideas (exploration), Whiteboard (technical)
- **Placement**: Embedded in relevant case study sections (Research, Process, Technical)
- **Quantity**: Flexible - any number of canvases per project
- **Interaction**: Full manipulation (viewModeEnabled=false) without persistence
- **Display**: Full width, responsive height, match canvas style

---

## Implementation Plan

### 1. Database Migration
**File**: `supabase/migrations/032_project_canvases.sql`

```sql
-- Add canvas_type enum
CREATE TYPE canvas_type AS ENUM ('storyboard', 'ideas', 'whiteboard');

-- Extend whiteboards table
ALTER TABLE whiteboards
ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
ADD COLUMN canvas_type canvas_type DEFAULT 'whiteboard';

-- Indexes for efficient queries
CREATE INDEX idx_whiteboards_project_id ON whiteboards(project_id);
CREATE INDEX idx_whiteboards_project_canvas ON whiteboards(project_id, canvas_type);
```

### 2. Type Updates
**File**: `src/types/index.ts`

- Add `CanvasType = 'storyboard' | 'ideas' | 'whiteboard'`
- Add `project_id: string | null` and `canvas_type: CanvasType` to `Whiteboard` interface
- Add `ProjectCanvases` interface for grouped canvases

### 3. New Components

#### A. ProjectCanvas (Interactive Viewer)
**File**: `src/components/whiteboard/ProjectCanvas.tsx`

Key implementation:
- `viewModeEnabled={false}` - enables full interaction
- NO `onChange` callback - changes not persisted
- `key` state for reset functionality (re-mounts component)
- Responsive height: `min-height: 60vh`, `max-height: 80vh`
- Reset button to restore original state
- "Playground" notice for visitors

#### B. ProjectCanvasSection (Section Wrapper)
**File**: `src/components/projects/ProjectCanvasSection.tsx`

- Takes `canvases: Whiteboard[]` and `type: CanvasType`
- Type-specific icons: Map (storyboard), Lightbulb (ideas), Cpu (whiteboard)
- Type-specific titles and descriptions
- Maps over canvases and renders `ProjectCanvas` for each

### 4. Project Page Integration
**File**: `src/app/(public)/projects/[slug]/page.tsx`

**Data fetching** - Add `getProjectCanvases(projectId)`:
```typescript
const { data } = await supabase
  .from('whiteboards')
  .select('*')
  .eq('project_id', projectId)
  .eq('is_public', true)
  .order('display_order');
```

**Render locations**:
| Canvas Type | After Section | Line Reference |
|-------------|---------------|----------------|
| `ideas` | Research section | After line 222 |
| `storyboard` | Process section | After line 257 |
| `whiteboard` | Technical section | After line 302 |

### 5. Admin Updates
**File**: `src/app/admin/whiteboards/page.tsx`

Modify create/edit dialog to add:
- Project selection dropdown (optional)
- Canvas type selector (when project selected)
- Fetch projects list on mount for dropdown

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/migrations/032_project_canvases.sql` | CREATE - DB migration |
| `src/types/index.ts` | Add CanvasType, update Whiteboard |
| `src/components/whiteboard/ProjectCanvas.tsx` | CREATE - Interactive viewer |
| `src/components/projects/ProjectCanvasSection.tsx` | CREATE - Section wrapper |
| `src/app/(public)/projects/[slug]/page.tsx` | Add canvas fetching & rendering |
| `src/app/admin/whiteboards/page.tsx` | Add project/type selection |
| `docs/DATABASE.md` | Document new columns |

---

## Verification Plan

1. **Database**: Run migration, verify columns exist via Supabase dashboard
2. **Admin**: Create a whiteboard linked to a project, set canvas type
3. **Public page**: Visit project detail page, verify canvas appears in correct section
4. **Interaction**: Pan, zoom, move elements - confirm changes work
5. **Reset**: Click reset button, verify canvas returns to original state
6. **Refresh**: Refresh page, verify all changes are lost
7. **Multiple canvases**: Add multiple canvases to one project, verify all display
8. **Mobile**: Test responsive height on mobile viewport
