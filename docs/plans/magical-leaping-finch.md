# SEO Optimization & Lighthouse Performance Plan

## Summary
Add comprehensive per-page SEO configuration in admin and improve homepage Lighthouse scores.

**Current Issues:**
- Homepage RES: 79 (needs >90)
- TTFB: 3.03s (poor)
- FCP: 3.12s, LCP: 3.58s (slow)
- Missing: sitemap.xml, robots.txt, Twitter cards, canonical URLs, JSON-LD

---

## Phase 1: Database Schema

### Create Migration `/supabase/migrations/016_page_seo.sql`
New `page_seo_settings` table with:
- `page_slug` - 'home', 'about', 'projects', 'blog', 'videos', 'contact'
- Core SEO: `title`, `description`, `keywords[]`
- Open Graph: `og_image_url`, `og_type`
- Robots: `canonical_url`, `robots_noindex`, `robots_nofollow`
- Twitter: `twitter_card`, `twitter_site`, `twitter_creator`
- Structured data: `structured_data_type`, `structured_data_custom`
- RLS policies matching `site_settings` pattern

### Add Types to `/src/types/index.ts`
- `TwitterCardType`, `StructuredDataType`, `PageSeoSettings`, `ConfigurablePageSlug`

---

## Phase 2: SEO Infrastructure

### Create `/src/lib/seo.ts`
- `getPageSeoSettings(pageSlug)` - fetch from database
- `generatePageMetadata(pageSlug)` - returns Next.js Metadata object
- JSON-LD generators: `generatePersonJsonLd`, `generateArticleJsonLd`, `generateVideoJsonLd`, `generateCollectionPageJsonLd`
- Default fallbacks per page

### Create `/src/components/seo/JsonLd.tsx`
- Reusable component for injecting JSON-LD structured data

### Create `/src/app/sitemap.ts`
- Dynamic XML sitemap with all public pages
- Include: projects, blog posts, videos from database

### Create `/src/app/robots.ts`
- Allow `/`, disallow `/admin/`, `/api/`, `/login`
- Point to sitemap.xml

### Create `/src/app/api/page-seo/route.ts`
- GET: Fetch single page or all pages SEO settings
- POST: Upsert page SEO with validation (title ≤70, description ≤160)

---

## Phase 3: Admin UI

### Create `/src/app/admin/seo/page.tsx`
Card-based form following `/admin/settings` pattern with sections:

1. **Page Selector** - Tabs/dropdown for each configurable page
2. **Basic SEO Card** - Title (with char counter), Description (with char counter), Keywords (tag input)
3. **Open Graph Card** - OG Image URL with preview, OG Type dropdown
4. **Search Directives Card** - Canonical URL, noindex/nofollow switches
5. **Twitter Card** - Card type dropdown, @site handle, @creator handle
6. **Structured Data Card** - Type dropdown, optional custom JSON-LD textarea
7. **Google Preview** - Live SERP preview component

### Update `/src/app/admin/layout.tsx`
- Add `{ href: '/admin/seo', label: 'SEO', icon: Search }` to nav items

---

## Phase 4: Update Public Pages

### Pattern for All Pages
Convert to server components where possible, add `generateMetadata`:

```typescript
import { generatePageMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return generatePageMetadata('page-slug');
}
```

### Files to Update:
- `/src/app/(public)/page.tsx` - Home (add JSON-LD Person)
- `/src/app/(public)/about/page.tsx` - About (add JSON-LD Person)
- `/src/app/(public)/projects/page.tsx` - Projects listing (add JSON-LD CollectionPage)
- `/src/app/(public)/blog/page.tsx` - Blog listing (add JSON-LD CollectionPage)
- `/src/app/(public)/videos/page.tsx` - Videos listing (add JSON-LD CollectionPage)
- `/src/app/(public)/contact/page.tsx` - Contact (add JSON-LD ContactPage)

---

## Phase 5: Homepage Performance

### A. Add Loading Skeleton to DynamicHero
`/src/components/heroes/DynamicHero.tsx`:
- Add `loading: () => <HeroSceneSkeleton />` to dynamic import

### B. Static Generation with Revalidation
`/src/app/(public)/page.tsx`:
```typescript
export const revalidate = 60; // Revalidate every minute
```

### C. Font Preloading
`/src/app/layout.tsx`:
- Add `<link rel="preload" href="/fonts/GeistVF.woff2" ... />`
- Add `<link rel="preconnect" href="https://supabase-url" />`

### D. React Cache for Settings
Wrap `getHeroSettings()` with `cache()` to avoid redundant DB calls

### E. Dynamic Import Below-Fold Sections
Split `ClientLogosSection`, `SkillsSection`, `TestimonialsSection` into dynamic imports

---

## Phase 6: Documentation

### Update `/docs/DATABASE.md`
- Add `page_seo_settings` table documentation

### Update `/docs/FEATURES.md`
- Add SEO Configuration section

### Update `/docs/API.md`
- Add `/api/page-seo` endpoint documentation

---

## Critical Files

| File | Action |
|------|--------|
| `/supabase/migrations/016_page_seo.sql` | Create |
| `/src/types/index.ts` | Update |
| `/src/lib/seo.ts` | Create |
| `/src/components/seo/JsonLd.tsx` | Create |
| `/src/app/sitemap.ts` | Create |
| `/src/app/robots.ts` | Create |
| `/src/app/api/page-seo/route.ts` | Create |
| `/src/app/admin/seo/page.tsx` | Create |
| `/src/app/admin/layout.tsx` | Update |
| `/src/app/(public)/page.tsx` | Update |
| `/src/app/(public)/about/page.tsx` | Update |
| `/src/app/(public)/projects/page.tsx` | Update |
| `/src/app/(public)/blog/page.tsx` | Update |
| `/src/app/(public)/videos/page.tsx` | Update |
| `/src/app/(public)/contact/page.tsx` | Update |
| `/src/components/heroes/DynamicHero.tsx` | Update |
| `/src/app/layout.tsx` | Update |
| `/docs/DATABASE.md` | Update |
| `/docs/FEATURES.md` | Update |
| `/docs/API.md` | Update |
