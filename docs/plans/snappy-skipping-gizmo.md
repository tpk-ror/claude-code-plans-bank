# Fix: Hydration Mismatch in Navbar

## Problem
Hydration error occurs because the service worker is serving cached HTML from a previous build with different navigation items. The error shows:
- Server (cached): `href="/services"` with "Services"
- Client (current): `href="/videos"` with "Videos"

## Root Cause
1. **Service worker cache conflict**: `public/sw.js` (modified per git status) contains stale cached pages
2. **Development mode doesn't regenerate SW**: Serwist is disabled in dev (`next.config.ts:7`)
3. **Browser still has old SW registered**: Even though SW is disabled in dev, the previously registered service worker continues to intercept requests

## Solution

### Step 1: Clear Browser Service Worker (User Action Required)
The user needs to unregister the service worker in their browser:
1. Open DevTools → Application → Service Workers
2. Click "Unregister" on any registered service worker
3. Clear site data: Application → Storage → Clear site data

### Step 2: Delete Stale Service Worker File
Remove the outdated `public/sw.js` that was built from a previous version:

```bash
rm public/sw.js
```

### Step 3: Add public/sw.js to .gitignore
Since this is a build artifact, it should be gitignored:

**File: `.gitignore`**
Add:
```
# Serwist service worker (generated during build)
public/sw.js
```

### Step 4: Git Clean Up
Unstage and remove the file from tracking:

```bash
git rm --cached public/sw.js
```

## Critical Files
- `public/sw.js` - Stale build artifact to delete
- `.gitignore` - Add service worker to ignore list
- `src/app/sw.ts` - Source file (no changes needed)
- `next.config.ts` - Serwist config (no changes needed)

## Verification
1. Delete `public/sw.js`
2. Clear browser service worker/cache
3. Run `npm run dev`
4. Navigate to the site - hydration error should be gone
5. Run `npm run build` - new `public/sw.js` will be generated for production
