# Plan: Add Video Background Option for Split Screen Template

## Overview
Add a video background option in project settings that replaces the hero section image with a video background when using the split-screen layout template.

## Files to Modify

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `hero_video_url` field to Project interface |
| `supabase/migrations/036_project_hero_video.sql` | Add `hero_video_url` column to projects table |
| `src/app/admin/projects/page.tsx` | Add video URL input field (shown when split-screen selected) |
| `src/components/projects/layouts/SplitScreenLayout.tsx` | Update hero to render video when URL is provided |

## Implementation Details

### 1. Database Migration
Create `supabase/migrations/036_project_hero_video.sql`:
```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS hero_video_url TEXT;
```

### 2. TypeScript Types
Update `src/types/index.ts` (line ~56):
```typescript
export interface Project {
  // ... existing fields
  image_url: string | null;
  hero_video_url: string | null;  // NEW: Video background for split-screen hero
  images: string[];
  // ...
}
```

### 3. Admin Projects Page
In `src/app/admin/projects/page.tsx`:
- Add `hero_video_url: ''` to formData state
- Add conditional input field after Featured Image section that shows when `layout_template === 'split-screen'`:
  - Label: "Hero Video URL (Split Screen only)"
  - Input for video URL (Supabase storage or external URL)
  - Helper text explaining it replaces the hero image
- Include `hero_video_url` in projectData submission

### 4. SplitScreenLayout Component
In `src/components/projects/layouts/SplitScreenLayout.tsx` (lines 61-78):

Replace the static Image with conditional video/image rendering:
```typescript
{project.hero_video_url ? (
  <>
    <video
      autoPlay
      muted
      loop
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
    >
      <source src={project.hero_video_url} type="video/mp4" />
    </video>
    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
  </>
) : project.image_url ? (
  <>
    <Image ... />
    <div className="absolute inset-0 bg-gradient-to-t ..." />
  </>
) : null}
```

## Verification
1. Run `npm run dev` to start development server
2. Navigate to `/admin/projects`
3. Edit a project and select "Split Screen" template
4. Verify video URL input appears
5. Enter a video URL and save
6. Navigate to the project page
7. Verify video plays in hero section (autoplays, muted, loops)
8. Verify fallback to image when no video URL is set
