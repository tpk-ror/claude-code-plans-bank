# Image Upload Implementation Plan

## Overview
Add file upload functionality for:
1. **Client logos** - Single image upload in admin logos page
2. **Project images** - Featured image + multiple gallery images in admin projects page

## Current State
- Both admin pages use URL text inputs (no file upload)
- `Project` type already has `images: string[]` field for gallery (unused in form)
- Supabase Storage pattern exists in `/src/app/api/capture-screenshot/route.ts`

---

## Implementation Steps

### 1. Create Supabase Storage Buckets
**Manual setup in Supabase Dashboard:**
- Create bucket `project-images` (public, 5MB limit)
- Create bucket `client-logos` (public, 2MB limit)

### 2. Create ImageUpload Component
**File:** `/src/components/ui/ImageUpload.tsx`

Props:
```typescript
interface ImageUploadProps {
  value: string | string[];              // Current URL(s)
  onChange: (value: string | string[]) => void;
  bucket: 'project-images' | 'client-logos';
  multiple?: boolean;                    // Default: false
  maxFiles?: number;                     // Default: 10
  maxSizeMB?: number;                    // Default: 5
  acceptedTypes?: string[];              // Default: common image types
  className?: string;
  disabled?: boolean;
}
```

Features:
- Drag-and-drop zone with visual feedback
- Click-to-browse file picker
- Upload progress indicator
- Image preview with remove button
- Multiple file support for gallery
- File validation (type, size)
- Optional URL input fallback

### 3. Update Client Logos Admin Page
**File:** `/src/app/admin/logos/page.tsx`

Changes:
- Import `ImageUpload` component
- Replace URL input (lines 293-318) with:
```tsx
<ImageUpload
  value={formData.logo_url}
  onChange={(url) => setFormData({ ...formData, logo_url: url as string })}
  bucket="client-logos"
  maxSizeMB={2}
  acceptedTypes={['image/png', 'image/svg+xml', 'image/webp']}
/>
```

### 4. Update Projects Admin Page
**File:** `/src/app/admin/projects/page.tsx`

Changes:
1. Add `images: [] as string[]` to formData state (line 39-50)
2. Load existing images when editing (line 92-108)
3. Replace URL input (lines 386-394) with featured image upload:
```tsx
<ImageUpload
  value={formData.image_url}
  onChange={(url) => setFormData({ ...formData, image_url: url as string })}
  bucket="project-images"
/>
```
4. Add gallery images section after featured image:
```tsx
<div className="space-y-2">
  <Label>Gallery Images</Label>
  <ImageUpload
    value={formData.images}
    onChange={(urls) => setFormData({ ...formData, images: urls as string[] })}
    bucket="project-images"
    multiple
    maxFiles={10}
  />
</div>
```
5. Include `images` in projectData for save (line 129-140)

---

## Files to Modify/Create

| File | Action |
|------|--------|
| `/src/components/ui/ImageUpload.tsx` | Create |
| `/src/app/admin/logos/page.tsx` | Modify |
| `/src/app/admin/projects/page.tsx` | Modify |
| `/docs/COMPONENTS.md` | Update |

---

## Verification

1. **Test logo upload:**
   - Go to Admin > Logos
   - Add new logo with file upload
   - Verify image uploads to Supabase and displays correctly

2. **Test project featured image:**
   - Go to Admin > Projects
   - Add/edit project with uploaded featured image
   - Verify image displays on portfolio

3. **Test project gallery:**
   - Add multiple gallery images to a project
   - Verify images save and can be reordered/removed

4. **Test validation:**
   - Try uploading oversized file (should show error)
   - Try uploading non-image file (should reject)
