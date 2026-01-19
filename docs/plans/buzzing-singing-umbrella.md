# Fix Canvas Visibility for /ideas and /whiteboards

## Problem Summary
The canvas components (React Flow for Ideas, Excalidraw for Whiteboards) are not rendering/visible when creating new boards or editing existing ones. The UI loads but the canvas area appears blank.

## Root Cause Analysis

### Primary Issue: **Container Height Chain Not Established**

Both Excalidraw and React Flow require their container to have an **explicit height** to render properly. The current layout chain breaks height inheritance:

**Admin Layout (`src/app/admin/layout.tsx:142-146`):**
```tsx
<main className="lg:pl-64 min-h-screen flex flex-col">
  <div className="flex-1 flex flex-col p-6 lg:p-8">
    {children}
  </div>
</main>
```

The problem: `min-h-screen` only sets a **minimum** height, not a **definite** height. For `flex-1` to work on children, the parent needs `h-screen` (or another definite height constraint).

### Secondary Issues:

1. **Whiteboard canvas container lacks explicit height** (`src/components/whiteboard/WhiteboardEditor.tsx:505`):
   ```tsx
   <div className="flex-1" ref={containerRef}>
   ```
   This only has `flex-1` without a fallback height.

2. **Ideas canvas has explicit height but depends on broken layout chain** (`src/app/admin/ideas/[id]/page.tsx:720`):
   ```tsx
   <div className="flex-1 ... h-[calc(100vh-200px)] min-h-[400px]">
   ```
   This has a fallback but the outer container's `flex-1` may still cause issues.

## Implementation Plan

### Step 1: Fix Admin Layout Height Chain
**File:** `src/app/admin/layout.tsx`

Change line 142 from:
```tsx
<main className="lg:pl-64 min-h-screen flex flex-col">
```
to:
```tsx
<main className="lg:pl-64 h-screen flex flex-col overflow-hidden">
```

This establishes a definite height constraint that allows `flex-1` children to properly fill space.

### Step 2: Fix Whiteboard Canvas Container
**File:** `src/components/whiteboard/WhiteboardEditor.tsx`

Change line 505 from:
```tsx
<div className="flex-1" ref={containerRef}>
```
to:
```tsx
<div className="flex-1 h-full min-h-[500px]" ref={containerRef}>
```

This ensures the Excalidraw container has an explicit height even if flex inheritance fails.

### Step 3: Verify Ideas Canvas Container
**File:** `src/app/admin/ideas/[id]/page.tsx`

The Ideas canvas already has `h-[calc(100vh-200px)] min-h-[400px]` on line 720 which should work after the layout fix. No changes needed unless testing reveals issues.

### Step 4: Add Overflow Handling to Inner Layout Wrapper
**File:** `src/app/admin/layout.tsx`

Change line 143 from:
```tsx
<div className="flex-1 flex flex-col p-6 lg:p-8">
```
to:
```tsx
<div className="flex-1 flex flex-col p-6 lg:p-8 min-h-0 overflow-auto">
```

The `min-h-0` is critical for flex containers - it allows the child to shrink below content size, and `overflow-auto` handles scrolling for the admin content area.

## Files to Modify

| File | Change |
|------|--------|
| `src/app/admin/layout.tsx` | Fix height chain with `h-screen` and `min-h-0` |
| `src/components/whiteboard/WhiteboardEditor.tsx` | Add explicit height to canvas container |

## Verification Steps

1. **Test Whiteboards:**
   - Navigate to `/admin/whiteboards`
   - Create a new whiteboard - verify Excalidraw canvas is visible
   - Edit an existing whiteboard - verify canvas renders with data
   - Draw something and save - verify persistence

2. **Test Ideas:**
   - Navigate to `/admin/ideas`
   - Create a new idea canvas - verify React Flow canvas is visible
   - Edit an existing canvas - verify nodes render
   - Add a node and save - verify persistence

3. **Test Layout:**
   - Verify admin sidebar navigation still works
   - Verify scrolling works for pages with lots of content
   - Verify no overflow issues on different screen sizes

## Technical Notes

- Excalidraw v0.18.0 requires explicit container dimensions
- React Flow v11.11.4 works with flex layouts but benefits from explicit heights
- The `min-h-0` on flex containers is a common fix for overflow issues in nested flex layouts
- Both components use dynamic imports with `ssr: false` which is correct for browser-only APIs
