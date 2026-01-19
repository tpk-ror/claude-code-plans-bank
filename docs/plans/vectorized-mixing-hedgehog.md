# Logo Admin: Bug Fix + Wikimedia Search Feature

## Problem
1. **Bug**: Logos don't save because `handleSubmit` has no error handling (lines 79-107 in logos/page.tsx)
2. **Feature Request**: Add Wikimedia Commons logo search with SVG preference and download to Supabase

## Implementation Plan

### Phase 1: Fix the Save Bug
**File**: `src/app/admin/logos/page.tsx`

Add error handling to `handleSubmit`:
- Wrap database operations in try-catch
- Check Supabase response for errors
- Display error via toast notification
- Only close dialog on success

```typescript
// Current (broken):
await supabase.from('client_logos').insert({...});
setSaving(false); // Runs even if insert fails

// Fixed:
const { error } = await supabase.from('client_logos').insert({...});
if (error) throw error;
```

### Phase 2: Create Wikimedia Search API
**File**: `src/app/api/wikimedia/search/route.ts` (new)

- GET endpoint with `query` param
- Use Wikimedia Commons API: `https://commons.wikimedia.org/w/api.php`
- Search in File namespace (gsrnamespace=6) for `{query} logo`
- Request thumbnails at 300px for preview
- Sort results: SVG first, then PNG
- Require authentication
- Return: pageid, title, thumbnail_url, source_url, mime_type

### Phase 3: Create Wikimedia Download API
**File**: `src/app/api/wikimedia/download/route.ts` (new)

- POST endpoint accepting `source_url`, `filename`, `mime_type`
- SSRF protection: only allow `upload.wikimedia.org` domain
- Fetch image from Wikimedia
- Upload to `client-logos` bucket with unique filename
- Return public URL
- Use server Supabase client for storage

### Phase 4: Create WikimediaLogoSearch Component
**File**: `src/components/ui/WikimediaLogoSearch.tsx` (new)

Features:
- Search input with 300ms debounce
- Results grid showing thumbnails
- Format badges (SVG/PNG)
- Loading states for search and download
- Error handling with user feedback
- "Use this logo" button per result

Props:
```typescript
interface WikimediaLogoSearchProps {
  onSelect: (logoUrl: string) => void;
  disabled?: boolean;
}
```

### Phase 5: Integrate into Logos Page
**File**: `src/app/admin/logos/page.tsx`

Add WikimediaLogoSearch between name input and ImageUpload:
```tsx
<Label>Search Wikimedia for Logo</Label>
<WikimediaLogoSearch
  onSelect={(url) => setFormData({ ...formData, logo_url: url })}
  disabled={saving}
/>
<p className="text-xs text-muted-foreground">
  Search Wikimedia Commons for company logos, or upload your own below.
</p>
```

### Phase 6: Add Types
**File**: `src/types/index.ts`

Add interfaces:
- `WikimediaSearchResult`
- `WikimediaSearchResponse`
- `WikimediaDownloadRequest`
- `WikimediaDownloadResponse`

## Files to Modify/Create

| File | Action |
|------|--------|
| `src/app/admin/logos/page.tsx` | Modify - fix bug + add WikimediaLogoSearch |
| `src/app/api/wikimedia/search/route.ts` | Create |
| `src/app/api/wikimedia/download/route.ts` | Create |
| `src/components/ui/WikimediaLogoSearch.tsx` | Create |
| `src/types/index.ts` | Modify - add Wikimedia types |
| `docs/API.md` | Update - document new endpoints |

## Performance Optimizations
- 300ms debounce on search input
- Limit results to 10 (configurable)
- Request 300px thumbnails (not full images) for preview
- SVG files prioritized (smaller, scalable)

## Security
- SSRF protection: whitelist only `upload.wikimedia.org`
- Auth required for both API endpoints
- Input validation on search query (max 100 chars)

## Verification
1. Create a new logo without Wikimedia - verify error handling shows toast on failure
2. Search "Staples" in Wikimedia - should return results with SVG badge
3. Click "Use this logo" - should download to Supabase and populate form
4. Save the logo - should persist to database
5. Verify logo displays on home page client logos section
