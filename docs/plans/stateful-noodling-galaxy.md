# Fix AI Image Playground Model Search

## Problem

The model search in the AI Image Playground returns no results because:
- The API route calls `https://fal.ai/api/models` which **does not exist**
- fal.ai does not provide a public API for searching/listing their model catalog
- The endpoint either returns an error or empty response, causing "No models found"

## Root Cause

`src/app/api/image-playground/models/route.ts:32` calls a non-existent endpoint:
```typescript
const url = new URL('https://fal.ai/api/models');
```

## Solution: Static Model Catalog

Since fal.ai has no public model discovery API, implement a curated static catalog of popular fal.ai models with client-side search filtering.

### Implementation Plan

#### 1. Create a static model catalog file
**File**: `src/lib/fal-models-catalog.ts`

Define a comprehensive list of fal.ai models with:
- `endpoint_id`: The fal.ai endpoint (e.g., `fal-ai/flux-pro/v1.1`)
- `display_name`: Human-readable name
- `description`: Brief description
- `category`: `text-to-image`, `image-to-image`, `image-to-video`
- `tags`: Searchable keywords (e.g., `['flux', 'fast', 'quality']`)
- `thumbnail_url`: Optional preview image

Include ~20 popular models:
- **Text-to-Image**: Flux Pro, Flux Dev, Flux Schnell, Flux Pro Ultra, SDXL, SD3, Recraft v3
- **Image-to-Image**: Flux Canny, Flux Depth, Flux Redux, AuraSR (upscaler), BRIA Background Removal
- **Image-to-Video**: Kling, Luma Dream Machine, Runway Gen-3

#### 2. Update the API route
**File**: `src/app/api/image-playground/models/route.ts`

- Remove the fal.ai API call
- Import the static catalog
- Implement server-side search filtering:
  - Match query against `display_name`, `description`, and `tags`
  - Filter by `category`
  - Return matching models sorted by relevance

#### 3. Keep component unchanged
**File**: `src/components/image-playground/ModelSearch.tsx`

The component already handles the response correctly - no changes needed.

#### 4. Update documentation
**File**: `docs/FEATURES.md`

Document the model catalog and how to add new models.

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/fal-models-catalog.ts` | **Create** - Static model catalog |
| `src/app/api/image-playground/models/route.ts` | Update to use static catalog |
| `docs/FEATURES.md` | Document the feature |

## Model Catalog Structure

```typescript
export interface FalModelCatalog {
  endpoint_id: string;
  display_name: string;
  description: string;
  category: 'text-to-image' | 'image-to-image' | 'image-to-video';
  tags: string[];
  thumbnail_url?: string;
}

export const FAL_MODEL_CATALOG: FalModelCatalog[] = [
  {
    endpoint_id: 'fal-ai/flux-pro/v1.1',
    display_name: 'FLUX Pro v1.1',
    description: 'Highest quality FLUX model for production use',
    category: 'text-to-image',
    tags: ['flux', 'pro', 'quality', 'production'],
  },
  // ... more models
];
```

## Search Algorithm

```typescript
function searchModels(query: string, category: string): FalModel[] {
  const q = query.toLowerCase();
  return FAL_MODEL_CATALOG
    .filter(m => m.category === category)
    .filter(m =>
      m.display_name.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.tags.some(tag => tag.includes(q))
    )
    .slice(0, 12);
}
```

## Verification

1. Start dev server: `npm run dev`
2. Navigate to `/admin/image-playground`
3. Search for "Banana" - should return banana-related models
4. Search for "Flux" - should return all Flux variants
5. Change category and verify filtering works
6. Select a model from search and generate an image

## Future Improvements

- Periodically update the catalog as fal.ai adds new models
- Consider scraping fal.ai/explore/models for automated updates
- Add a "request model" feature for users to suggest additions
