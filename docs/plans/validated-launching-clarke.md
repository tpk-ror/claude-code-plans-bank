# Blog Layout & Lazy Loading + Excalidraw Worker Fix

## Overview
Two tasks:
1. Improve blog page layout and add lazy loading (first 5 posts, then load more)
2. Fix Excalidraw Worker SecurityError on whiteboard pages

---

## Task 1: Blog Page Improvements

### File: `src/app/(public)/blog/page.tsx`

### Current Issues
- Loads ALL posts at once (slow with many posts)
- Single-column list layout (not visually appealing)
- Basic "Loading posts..." text (no skeleton loaders)

### Changes

#### 1.1 Lazy Loading Implementation
- Load first 5 posts initially with `.limit(5)`
- Add "Load More" button to fetch remaining posts
- State changes:
  ```tsx
  const [displayedPosts, setDisplayedPosts] = useState<BlogPost[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const INITIAL_LOAD = 5;
  const LOAD_MORE_COUNT = 6;
  ```

#### 1.2 YouTube-Style Grid Layout
- Responsive grid that maximizes posts per row based on screen size:
  ```
  grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5
  ```
- Card design (YouTube-style):
  - Aspect-video thumbnail on top (16:9 ratio)
  - Title below (2-line clamp)
  - Date + tags as metadata
  - Hover effect: slight scale + shadow
- Expand container to `max-w-7xl` for more horizontal space

#### 1.3 Skeleton Loading States
- Add skeleton cards during initial load (matching card dimensions)
- Show loading spinner in "Load More" button when fetching

#### 1.4 Layout Structure
```
[Header - unchanged]
[Search Bar - unchanged]
[Tag Filters - unchanged]

[Posts Grid - YouTube-style responsive]
  [Card] [Card] [Card] [Card] [Card]  (xl: 5 cols)
  [Card] [Card] [Card] [Card]         (lg: 4 cols)
  [Card] [Card] [Card]                (md: 3 cols)

[Load More Button - if hasMore]
```

---

## Task 2: Excalidraw Worker Fix

### Current Error
```
SecurityError: Failed to construct 'Worker': Script at 'file:///...' cannot be accessed from origin 'http://localhost:3000'
```

### Root Cause
Excalidraw's worker scripts (`subset-worker.chunk.js`) can't be loaded due to CORS when running in Turbopack dev mode. The current `ExcalidrawWrapper.tsx` only suppresses console warnings but doesn't fix the underlying issue.

### Solution: Configure Excalidraw to not use workers in development

#### File: `src/components/whiteboard/WhiteboardEditor.tsx`
#### File: `src/components/whiteboard/WhiteboardViewer.tsx`

Pass `UIOptions.tools.image: false` or configure the Excalidraw initializer to disable worker-based font subsetting in development.

**Approach**: Use Excalidraw's built-in configuration to gracefully handle unavailable workers:

```tsx
<Excalidraw
  // ... existing props
  UIOptions={{
    // Disable features that require workers in dev
    ...(process.env.NODE_ENV === 'development' && {
      tools: { image: false }
    })
  }}
/>
```

**Alternative (Better)**: Add worker files to public folder and configure webpack in `next.config.ts`:

```ts
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
  }
  return config;
},
```

And copy worker files to `public/excalidraw-assets/` with a postinstall script.

**Simplest Fix**: The current console suppression works, but we should also catch the SecurityError itself. Update `ExcalidrawWrapper.tsx` to also suppress SecurityError console messages containing "Worker".

---

## Implementation Order

1. **Blog lazy loading** - Add state management for pagination
2. **Blog layout** - Featured post + grid layout
3. **Blog skeletons** - Add skeleton loading states
4. **Excalidraw fix** - Improve worker error handling

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/(public)/blog/page.tsx` | Lazy loading, grid layout, skeleton states |
| `src/components/whiteboard/ExcalidrawWrapper.tsx` | Better error suppression for SecurityError |

---

## Verification

1. **Blog:**
   - Visit `/blog` - should see first 5 posts load quickly
   - Click "Load More" - should fetch additional posts
   - Verify skeleton loaders appear during initial load
   - Check responsive grid at different viewport sizes

2. **Whiteboard:**
   - Visit `/admin/whiteboards/[id]` - no SecurityError in console
   - Verify whiteboard is editable (draw, add shapes, etc.)
   - Check that font rendering still works (fallback to main thread)

3. **Build:**
   ```bash
   npm run build
   ```
