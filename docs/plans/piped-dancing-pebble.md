# Dynamic Model Search for AI Image Playground

## Overview
Enhance the existing AI Image Playground to support dynamic model discovery via Fal.ai's Model Search API. Users can search for models by name (e.g., "banana" finds "nano-banana-pro") instead of selecting from a hardcoded list.

## Fal.ai Model Search API

**Endpoint:** `GET https://api.fal.ai/v1/models`

**Key Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Free-text search by name, description, or category |
| `category` | string | Filter by category (e.g., 'text-to-image') |
| `limit` | integer | Max items to return |
| `cursor` | string | Pagination cursor |

**Example Request:**
```bash
curl "https://api.fal.ai/v1/models?q=banana&category=text-to-image&limit=20" \
  -H "Authorization: Key YOUR_FAL_KEY"
```

**Response Structure:**
```json
{
  "models": [
    {
      "endpoint_id": "fal-ai/nano-banana-pro",
      "metadata": {
        "display_name": "Nano Banana Pro",
        "description": "...",
        "category": "text-to-image",
        "thumbnail_url": "...",
        "tags": ["image", "generation"]
      }
    }
  ],
  "next_cursor": "...",
  "has_more": true
}
```

---

## Implementation Plan

### Phase 1: Create Model Search API Route

**File:** `src/app/api/image-playground/models/route.ts`

```typescript
// GET /api/image-playground/models?q=banana&category=text-to-image
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'text-to-image';

  const response = await fetch(
    `https://api.fal.ai/v1/models?q=${encodeURIComponent(query)}&category=${category}&limit=20`,
    {
      headers: {
        'Authorization': `Key ${process.env.FAL_KEY}`,
      },
    }
  );

  return NextResponse.json(await response.json());
}
```

### Phase 2: Update Types

**File:** `src/types/index.ts`

Add new types:
```typescript
export interface FalModel {
  endpoint_id: string;
  metadata: {
    display_name: string;
    description: string;
    category: string;
    thumbnail_url?: string;
    tags?: string[];
  };
}

export interface FalModelsResponse {
  models: FalModel[];
  next_cursor: string | null;
  has_more: boolean;
}
```

### Phase 3: Create Model Search Component

**File:** `src/components/image-playground/ModelSearch.tsx`

Features:
- Debounced search input (300ms)
- Display model cards with thumbnail, name, description
- Click to select model
- Show "Gemini" as a special non-Fal option
- Category filter dropdown (text-to-image, image-to-image, etc.)

UI Layout:
```
+------------------------------------------+
| Search Models: [__banana____________] 🔍  |
| Category: [text-to-image ▼]              |
+------------------------------------------+
| ┌─────────┐ ┌─────────┐ ┌─────────┐     |
| │ [thumb] │ │ [thumb] │ │ [thumb] │     |
| │ Nano    │ │ Flux    │ │ SDXL    │     |
| │ Banana  │ │ Pro     │ │ Turbo   │     |
| └─────────┘ └─────────┘ └─────────┘     |
+------------------------------------------+
| Selected: fal-ai/nano-banana-pro         |
+------------------------------------------+
```

### Phase 4: Update Playground Page

**File:** `src/app/admin/image-playground/page.tsx`

Changes:
1. Replace hardcoded `MODELS` array with dynamic search
2. Add `ModelSearch` component
3. Update `model` state to store full `endpoint_id` (e.g., `fal-ai/nano-banana-pro`)
4. Update generate API call to use dynamic model ID

### Phase 5: Update Generate API Route

**File:** `src/app/api/image-playground/generate/route.ts`

Changes:
1. Accept any valid Fal.ai `endpoint_id` instead of hardcoded list
2. Validate model exists before calling
3. Handle different model input schemas dynamically

---

## Files to Create/Modify

| Action | File |
|--------|------|
| Create | `src/app/api/image-playground/models/route.ts` |
| Create | `src/components/image-playground/ModelSearch.tsx` |
| Modify | `src/app/admin/image-playground/page.tsx` |
| Modify | `src/app/api/image-playground/generate/route.ts` |
| Modify | `src/types/index.ts` |

---

## Verification Plan

1. **Search API** - Call `/api/image-playground/models?q=banana` and verify results
2. **UI Search** - Type "flux" in search, see Flux models appear
3. **Model Selection** - Click a model card, verify it's selected
4. **Generation** - Generate image with dynamically selected model
5. **Gemini Fallback** - Verify Gemini option still works as non-Fal option

---

## Sources

- [Fal.ai Model Search API](https://docs.fal.ai/platform-apis/v1/models)
- [Fal.ai Model Explorer](https://fal.ai/explore/models)
