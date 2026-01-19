# AI Diagram Generation for Whiteboards

## Overview
Add an AI-powered feature to the Whiteboard editor that generates Excalidraw diagrams from natural language prompts using Google Gemini.

**User Flow**: Click "AI Diagram" button in toolbar → Enter prompt in dialog → AI generates diagram → Elements appear on canvas

---

## Implementation Steps

### Step 1: Add Types
**File**: `src/types/index.ts`

Add these types:
```typescript
export type DiagramType = 'flowchart' | 'mindmap' | 'system' | 'sequence' | 'org' | 'free';

export interface GenerateDiagramRequest {
  prompt: string;
  diagramType?: DiagramType;
  canvasWidth: number;
  canvasHeight: number;
}

export interface ExcalidrawElementSkeleton {
  type: 'rectangle' | 'ellipse' | 'diamond' | 'text' | 'arrow' | 'line';
  x: number;
  y: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  fillStyle?: 'hachure' | 'solid' | 'cross-hatch';
  roughness?: number;
  text?: string;
  fontSize?: number;
  label?: { text: string; fontSize?: number };
  startElementIndex?: number;  // For arrows - index of start element
  endElementIndex?: number;    // For arrows - index of end element
}

export interface GenerateDiagramResponse {
  success: boolean;
  data?: {
    elements: ExcalidrawElementSkeleton[];
    summary: string;
  };
  error?: string;
}
```

---

### Step 2: Create API Route
**File**: `src/app/api/generate-diagram/route.ts`

Pattern follows `src/app/api/analyze-video/route.ts`:

1. Auth check with Supabase
2. Validate prompt input
3. Define Gemini schema for structured Excalidraw elements
4. Build prompt with diagram type guidance and canvas dimensions
5. Call Gemini with `responseMimeType: 'application/json'` and schema
6. Return elements array and summary

**Gemini Schema** - Define element structure:
- type, x, y (required)
- width, height, backgroundColor, strokeColor (optional)
- label object for text inside shapes
- startElementIndex/endElementIndex for arrows connecting shapes

**Prompt Engineering** - Include:
- Canvas dimensions for positioning
- Diagram type-specific instructions (flowchart layout, mindmap radial, etc.)
- Color palette suggestions
- Spacing and sizing guidelines

---

### Step 3: Create UI Component
**File**: `src/components/whiteboard/GenerateDiagramButton.tsx`

Features:
- Button with Wand2 icon and "AI Diagram" text
- Dialog with:
  - Diagram type selector (6 types in 2x3 grid)
  - Textarea for prompt with placeholder examples
  - Generate button with loading state
- Calls `/api/generate-diagram` and passes elements to parent

Props:
```typescript
interface GenerateDiagramButtonProps {
  onGenerate: (elements: ExcalidrawElementSkeleton[]) => void;
  canvasWidth: number;
  canvasHeight: number;
  disabled?: boolean;
}
```

---

### Step 4: Integrate into WhiteboardEditor
**File**: `src/components/whiteboard/WhiteboardEditor.tsx`

Changes:
1. Import `GenerateDiagramButton` and `convertToExcalidrawElements` from Excalidraw
2. Add canvas dimension state tracking
3. Add `handleDiagramGenerate` callback that:
   - Processes AI elements (assigns IDs, converts arrow indices to bindings)
   - Calls `convertToExcalidrawElements()`
   - Merges with existing elements via `excalidrawAPI.updateScene()`
   - Scrolls to new content with `excalidrawAPI.scrollToContent()`
4. Add `renderTopRightUI` prop to Excalidraw component with the button

---

### Step 5: Update Documentation
**Files**: `docs/API.md`, `docs/FEATURES.md`, `docs/AI.md`

Document:
- New `/api/generate-diagram` endpoint
- Feature usage guide
- Gemini integration details

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/types/index.ts` | Add diagram types |
| `src/app/api/generate-diagram/route.ts` | Create (new API route) |
| `src/components/whiteboard/GenerateDiagramButton.tsx` | Create (new component) |
| `src/components/whiteboard/WhiteboardEditor.tsx` | Modify (add button via renderTopRightUI) |
| `docs/API.md` | Update |
| `docs/FEATURES.md` | Update |
| `docs/AI.md` | Update |

---

## Key Technical Details

**Excalidraw Element Conversion**:
```typescript
import { convertToExcalidrawElements } from '@excalidraw/excalidraw';

// AI returns simplified skeletons, Excalidraw converts to full elements
const fullElements = convertToExcalidrawElements(skeletons);
```

**Arrow Bindings**: AI returns element indices. Frontend converts:
```typescript
// From: { startElementIndex: 0, endElementIndex: 1 }
// To: { start: { id: 'element-0-id' }, end: { id: 'element-1-id' } }
```

**renderTopRightUI Prop**: Excalidraw provides this prop for custom toolbar buttons:
```tsx
<Excalidraw
  renderTopRightUI={() => <GenerateDiagramButton ... />}
/>
```

---

## Verification Plan

1. **API Testing**:
   - Test endpoint returns valid Excalidraw element structure
   - Test with different diagram types
   - Verify auth requirement works

2. **UI Testing**:
   - Button appears in whiteboard editor
   - Dialog opens/closes correctly
   - Loading state shows during generation

3. **Integration Testing**:
   - Generated elements appear on canvas
   - Elements are selectable and editable
   - Save works with generated elements
   - Arrows properly connect shapes

4. **Test Prompts**:
   - "Create a simple flowchart: start -> process -> end"
   - "Mind map for web development: HTML, CSS, JavaScript branches"
   - "System diagram: User -> Frontend -> API -> Database"
