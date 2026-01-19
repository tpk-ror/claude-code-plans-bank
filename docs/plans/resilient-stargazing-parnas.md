# Plan: Fix Navbar Hydration Mismatch

## Problem Analysis

The hydration error shows that the server renders `/services` with "Services" while the client renders `/videos` with "Videos" at the same DOM position. These are adjacent items (index 3 and 4) in the static `navItems` array in `src/components/layout/Navbar.tsx`.

### Root Cause

The Navbar component is a client component (`'use client'`) but doesn't handle the initial render properly. While `MobileNav.tsx` and `ThemeToggle.tsx` both use a `mounted` pattern to prevent hydration mismatches, the desktop navigation in `Navbar.tsx` renders immediately without waiting for client hydration.

The mismatch likely occurs because:
1. Server renders the HTML with the navItems
2. Between server render and client hydration, something causes a position shift
3. React cannot reconcile the server HTML with the client VDOM

## Solution

Apply the same `mounted` pattern used in `MobileNav.tsx` to the desktop navigation rendering in `Navbar.tsx`.

### Files to Modify

- `src/components/layout/Navbar.tsx`

### Implementation Steps

1. Add a `mounted` state variable (already have `useState` imported)
2. Add a `useEffect` to set `mounted = true` on client
3. For the desktop nav items, render a skeleton/placeholder until mounted
4. This ensures server and client render identical content initially

### Code Changes

In `Navbar.tsx`:

```tsx
// Add mounted state (around line 29)
const [mounted, setMounted] = useState(false);

// Add useEffect (after existing useEffect, around line 45)
useEffect(() => {
  setMounted(true);
}, []);

// Update desktop navigation section (lines 66-85)
// Wrap navItems.map in a conditional that shows placeholder until mounted
{mounted ? (
  navItems.map((item) => {
    const isActive = pathname === item.href;
    return (
      <Link key={item.href} href={item.href}>
        <Button ... >
          {item.label}
          {isActive && (...)}
        </Button>
      </Link>
    );
  })
) : (
  // Render placeholder buttons to prevent layout shift
  navItems.map((item) => (
    <Button key={item.href} variant="ghost" className="..." disabled>
      {item.label}
    </Button>
  ))
)}
```

## Verification

1. Run `npm run dev`
2. Navigate to the home page
3. Check browser console - hydration error should be gone
4. Verify navigation links work correctly
5. Test page refresh to confirm no flash of content

## Alternative Solutions (if needed)

If the above doesn't fully resolve it:
1. Clear `.next` cache: `rm -rf .next && npm run dev`
2. Check for browser extensions that modify DOM
3. Consider using `dynamic()` with `ssr: false` for the entire Navbar (not recommended as it would affect SEO/initial load)
