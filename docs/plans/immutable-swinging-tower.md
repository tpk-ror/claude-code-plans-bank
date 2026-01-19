# Fix Admin Pages Scroll Clipping Issue

## Problem
Content on admin pages (logos, experience, etc.) is being cut off before users can scroll to see all items. The scroll stops prematurely.

## Root Cause
In `src/app/admin/layout.tsx` at line 146:
```tsx
<main className="lg:pl-64 h-screen flex flex-col overflow-hidden">
```

Two issues:
1. **`h-screen`** - Locks the main container to exactly viewport height
2. **`overflow-hidden`** - Prevents any content from scrolling beyond the viewport

## Solution
Change line 146 from:
```tsx
<main className="lg:pl-64 h-screen flex flex-col overflow-hidden">
```

To:
```tsx
<main className="lg:pl-64 min-h-screen flex flex-col overflow-y-auto">
```

And simplify line 147 from:
```tsx
<div className="flex-1 flex flex-col p-6 lg:p-8 min-h-0">
```

To:
```tsx
<div className="flex-1 p-6 lg:p-8">
```

## Files to Modify
- `src/app/admin/layout.tsx` (lines 146-147)

## Verification
1. Run `npm run dev`
2. Navigate to http://localhost:3000/admin/logos - scroll should reach all logos
3. Navigate to http://localhost:3000/admin/experience - scroll should reach all experience items
4. Test a few other admin pages (skills, projects) to confirm fix applies globally
5. Test mobile view to ensure no regressions
