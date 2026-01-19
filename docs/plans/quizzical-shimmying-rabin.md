# Plan: Add Company Logos to Experience Section on About Page

## Summary
Add company logos to the experience timeline on the `/about` page by adding a `logo_url` field to the experience table and updating the UI to display logos.

## Files to Modify

1. **`src/types/index.ts`** - Add `logo_url` field to Experience interface
2. **`src/app/(public)/about/AboutContent.tsx`** - Update experience card to display logo
3. **`supabase/migrations/032_experience_logos.sql`** - Add logo_url column to experience table

## Implementation Steps

### Step 1: Database Migration
Create migration to add `logo_url` column to `experience` table:
```sql
ALTER TABLE experience ADD COLUMN logo_url TEXT;
```

### Step 2: Update TypeScript Interface
Add to `Experience` interface in `src/types/index.ts`:
```typescript
logo_url: string | null;
```

### Step 3: Update AboutContent.tsx
Modify the experience card (around line 250) to display logo alongside company name:
- Add Next.js Image import
- Display logo in a small container (32x32 or 40x40) next to company name
- Follow existing pattern from PersonalizedHero.tsx

## Verification
1. Run the migration in Supabase SQL Editor
2. Add a logo_url to an existing experience record via admin or SQL
3. Visit `/about` page and verify logo displays correctly
4. Test with and without logo_url (should gracefully handle null)
