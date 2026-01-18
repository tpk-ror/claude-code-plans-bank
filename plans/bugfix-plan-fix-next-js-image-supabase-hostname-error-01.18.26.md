# Plan: Fix Next.js Image Supabase Hostname Error

## Problem
Next.js Image component throws error:
```
Invalid src prop (https://wsbdcrzzrknollrnvsbg.supabase.co/storage/v1/object/public/build-screenshots/...)
hostname "wsbdcrzzrknollrnvsbg.supabase.co" is not configured under images in your next.config.js
```

Despite adding `**.supabase.co` pattern to `remotePatterns`, the error persists.

## Root Cause Analysis
Potential causes:
1. **Turbopack caching** - Config changes may not be picked up without clearing `.next` cache
2. **Pattern syntax** - `**` wildcard may behave differently in Next.js 16 with Turbopack
3. **Stale process** - Old dev server process was blocking (confirmed earlier)

## Solution Options

### Option 1: Clear Cache and Restart (Try First)
```bash
rm -rf .next
npm run dev
```

### Option 2: Use Explicit Hostname (Most Reliable)
Instead of wildcard, use the actual Supabase project hostname:
```typescript
{
  protocol: 'https',
  hostname: 'wsbdcrzzrknollrnvsbg.supabase.co',
},
```

### Option 3: Dynamic Configuration from Environment
Extract hostname from `NEXT_PUBLIC_SUPABASE_URL`:
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : '';

// In remotePatterns:
...(supabaseHostname ? [{ protocol: 'https' as const, hostname: supabaseHostname }] : []),
```

### Option 4: Use `unoptimized` on Image (Quick Fix)
For the specific images causing issues:
```tsx
<Image
  src={screenshot.storage_url}
  unoptimized
  ...
/>
```

---

## Recommended Approach
1. **First**: Clear `.next` cache and restart dev server
2. **If still failing**: Use explicit hostname (Option 2)
3. **Long-term**: Consider Option 3 for portability across environments

## Files to Modify
- `next.config.ts` - Add explicit hostname or dynamic config

## Verification
1. Clear `.next` directory
2. Restart dev server with `npm run dev`
3. Navigate to `/admin/storyboards/[id]` to view screenshots
4. Confirm images load without error
