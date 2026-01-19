# Fix Expo Router & Optimize Startup Performance

## Problem Summary
- App shows "Welcome to Expo" instead of actual app routes
- Startup time is 5-10+ seconds due to artificial delays and sequential initialization

## Root Cause
**Missing `expo-router/babel` plugin in babel.config.js** - Without this, expo-router cannot generate file-based routes.

---

## Implementation Steps

### Step 1: Fix babel.config.js (CRITICAL - fixes "Welcome to Expo")
**File:** `babel.config.js`

Add `require.resolve('expo-router/babel')` as the first plugin:
```javascript
plugins: [
  require.resolve('expo-router/babel'),  // ADD THIS
  ['module:react-native-dotenv', {...}],
],
```

After change: Run `npx expo start --clear`

---

### Step 2: Simplify app/index.tsx (saves 2 seconds)
**File:** `app/index.tsx`

Replace entire file with simple redirect:
```typescript
import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/(tabs)" />;
}
```

---

### Step 3: Optimize app/_layout.tsx (parallel initialization)
**File:** `app/_layout.tsx`

Key changes:
- Run auth and audio initialization in parallel (not sequential)
- Make sound preloading non-blocking (fire and forget)
- Defer background sync by 1 second after app loads
- Reduce initialization timeout from 10s to 5s

---

### Step 4: Make preloadSounds non-blocking
**File:** `constants/defaultSounds.ts`

Change `preloadSounds` to fire-and-forget pattern:
- Start loading sounds in background
- Don't block app startup waiting for completion
- Remove 5-second timeout that blocks rendering

---

### Step 5: Reduce CustomSplashScreen delay
**File:** `components/CustomSplashScreen.tsx`

Change post-animation setTimeout from 1500ms to 200ms (saves 1.3 seconds)

---

### Step 6: Remove redundant initialization in home screen
**File:** `app/(tabs)/index.tsx`

- Remove redundant `preloadSounds()` call (already done in _layout)
- Remove 200ms setTimeout wrapper
- Simplify board initialization logic

---

### Step 7: Defer background sync
**File:** `services/backgroundSyncService.ts`

In `initialize()`, wrap `triggerSync('initial')` in setTimeout with 3-second delay so network calls don't block startup.

---

### Step 8: Convert dynamic imports to static (optional)
**File:** `store/soundStore.ts`

Move dynamic imports to static imports at top of file:
```typescript
// Change from:
const { useAuthStore } = await import('./authStore');
// To:
import { useAuthStore } from './authStore';
```

---

## Files to Modify
1. `babel.config.js` - Add expo-router/babel plugin
2. `app/index.tsx` - Remove debug delay, simplify redirect
3. `app/_layout.tsx` - Parallel initialization, non-blocking preload
4. `constants/defaultSounds.ts` - Make preloadSounds non-blocking
5. `components/CustomSplashScreen.tsx` - Reduce delay from 1500ms to 200ms
6. `app/(tabs)/index.tsx` - Remove redundant initialization
7. `services/backgroundSyncService.ts` - Defer initial sync
8. `store/soundStore.ts` - Static imports (optional)

---

## Expected Results
- App loads correctly (no more "Welcome to Expo")
- Startup time reduced from 5-10+ seconds to under 2 seconds
- All functionality preserved (auth, sync, audio)

## Testing
1. Run `npx expo start --clear` after babel change
2. Verify app shows FartMaster UI
3. Test sound playback, board navigation, auth flow
4. Measure startup time with timestamps
