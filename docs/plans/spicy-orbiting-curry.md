# AI Generate Ideas Feature Plan

## Overview
Add a "Generate with AI" feature to the Ideas canvas (`/admin/ideas/[id]`) that creates an entire board from a free-form idea input, with smart type detection and conversational refinement.

## User Requirements (from Q&A)
- **UI Placement**: New button in toolbar next to "Add Idea"
- **Canvas Behavior**: Add alongside existing content
- **Auto-Detection**: AI auto-detects idea type (flow, app, brainstorm, etc.)
- **Detail Level**: Checkbox for basic vs detailed output
- **Templates**: Clickable example prompts
- **Iteration**: Conversational refinement with follow-up prompts

---

## Files to Create

### 1. `/src/app/api/generate-idea-board/route.ts`
New API endpoint using Claude Sonnet for AI generation.

**Key Features:**
- Auto-detect idea type: `sequential_flow`, `app_screens`, `process_flow`, `brainstorm`, `hierarchy`
- Support conversation history for refinement
- Return positioned nodes and connections
- Follow existing expand-idea patterns

### 2. `/src/components/ideas/GenerateIdeaDialog.tsx`
Dialog component for the "Generate with AI" feature.

**UI Elements:**
- Large textarea for free-form idea input
- Detail level toggle (Basic / Detailed)
- Clickable example prompts:
  - "Todo app with categories"
  - "User onboarding flow"
  - "E-commerce checkout process"
  - "Content creation pipeline"
  - "Feature brainstorm for mobile app"
- Conversation history display
- Follow-up input for refinement
- Generate button with loading state

---

## Files to Modify

### 3. `/src/app/admin/ideas/[id]/page.tsx`
Add the Generate button and integrate the dialog.

**Changes:**
- Add state: `generateDialogOpen`
- Add handler: `handleNodesGenerated` - calculates non-overlapping positions
- Add toolbar button with Sparkles icon
- Import and render `GenerateIdeaDialog`

### 4. `/src/types/index.ts`
Add new types:

```typescript
export type GeneratedIdeaType =
  | 'sequential_flow'
  | 'app_screens'
  | 'process_flow'
  | 'brainstorm'
  | 'hierarchy';

export interface GenerateIdeaBoardRequest {
  canvas_id: string;
  prompt: string;
  detail_level: 'basic' | 'detailed';
  conversation_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  existing_nodes_context?: Array<{ id: string; title: string; content: string | null; node_type: IdeaNodeType }>;
}

export interface GenerateIdeaBoardResponse {
  success: boolean;
  data?: {
    detected_idea_type: GeneratedIdeaType;
    new_nodes: Array<Omit<IdeaNode, 'id' | 'created_at' | 'updated_at'>>;
    new_connections: Array<Omit<IdeaConnection, 'id' | 'created_at'>>;
    layout_bounds: { min_x: number; max_x: number; min_y: number; max_y: number };
    ai_summary: string;
  };
  error?: string;
}
```

### 5. `/docs/AI.md`
Document the new endpoint and feature.

---

## Implementation Details

### Layout Positioning by Type
| Type | Layout | Spacing |
|------|--------|---------|
| sequential_flow | Horizontal line | 200px |
| app_screens | Grid | 250px |
| process_flow | Vertical stack | 150px |
| brainstorm | Radial around center | 200px radius |
| hierarchy | Tree from top | 150px levels |

### Node Type Mapping
- **root**: Main/central concept
- **idea**: General concepts (blue)
- **task**: Actionable items (green)
- **question**: Open questions (purple)
- **insight**: Key realizations (yellow)
- **resource**: References/tools (pink)

### Connection Types
- `leads_to`: Sequential relationship
- `related`: Associated concepts
- `depends_on`: Prerequisite
- `supports`: Reinforcing

---

## Implementation Order

1. Add types to `/src/types/index.ts`
2. Create API endpoint `/src/app/api/generate-idea-board/route.ts`
3. Create dialog component `/src/components/ideas/GenerateIdeaDialog.tsx`
4. Integrate into canvas editor `/src/app/admin/ideas/[id]/page.tsx`
5. Update documentation `/docs/AI.md`

---

## Verification

1. **Basic flow test**: Enter "Start -> Process -> End" and verify 3 connected nodes
2. **App idea test**: Enter "Todo app with categories" and verify screen nodes generated
3. **Detail levels**: Toggle between basic (3-5 nodes) and detailed (5-10 nodes)
4. **Example prompts**: Click each example and verify it auto-fills
5. **Refinement**: After generation, add follow-up like "add more detail to login"
6. **Existing content**: Verify new nodes don't overlap existing nodes
7. **Save**: Verify generated nodes persist when saving canvas
