# Enhanced Personalized Links with Automatic Company Branding

**Goal:** When user pastes a job URL, automatically extract company branding (colors, fonts, logo) and apply it to the personalized landing page to show employers you put in extra effort.

---

## Overview

Transform the current personalized links feature from hardcoded purple/pink gradients to fully dynamic company-branded pages. The system will:
1. Scrape job posting for company info
2. Crawl company website for brand styles
3. Auto-apply brand colors, fonts, and styling to `/for/[company-slug]` page
4. Generate brand-voice-matched cover letter

**Existing infrastructure we'll leverage:**
- `/api/scrape-job` - Already extracts company name, domain, job title
- `/api/analyze-brand` - Already screenshots website + Gemini extracts colors/fonts
- `/src/lib/logo/fetch-logo.ts` - Already fetches logos
- `company_brand_analysis` table - Already stores design systems

---

## Implementation Steps

### Phase 1: Dynamic Brand Styling System

#### 1.1 Create Brand Style Provider
**New file:** `/src/components/personalized/BrandStyleProvider.tsx`
- React context that injects CSS custom properties from brand analysis
- Maps brand colors to `--brand-primary`, `--brand-secondary`, `--brand-accent`, etc.
- Maps typography to `--brand-font-heading`, `--brand-font-body`
- Provides sensible defaults when no brand analysis exists

#### 1.2 Create Brand Font Loader
**New file:** `/src/components/personalized/BrandFontLoader.tsx`
- Dynamically loads detected fonts from Google Fonts API
- Maps common font names (Helvetica → Inter, Arial → Open Sans)
- Falls back gracefully when font unavailable

#### 1.3 Create Brand Utilities
**New file:** `/src/lib/brand-utils.ts`
- `generateGradient(primary, secondary, direction)` - Creates CSS gradients
- `getContrastColor(hex)` - Returns white/black for text readability
- `hexToOklch(hex)` - Converts to Tailwind CSS 4 OKLCH format

### Phase 2: Update Personalized Page Components

#### 2.1 Update Page Data Fetching
**Modify:** `/src/app/for/[slug]/page.tsx`
- Join `company_brand_analysis` when fetching company link
- Wrap page in `BrandStyleProvider`
- Include `BrandFontLoader` in head

#### 2.2 Update PersonalizedHero
**Modify:** `/src/components/personalized/PersonalizedHero.tsx`
- Replace hardcoded `from-primary via-purple-500 to-pink-500` with brand variables
- Use `var(--brand-primary)` for gradients
- Apply brand heading font

#### 2.3 Update Remaining Components
**Modify:**
- `PersonalizedPitch.tsx` - Brand body font
- `HighlightedProjects.tsx` - Brand accent on cards
- `SkillsMatch.tsx` - Brand colors for progress bars
- `PersonalizedCTA.tsx` - Brand button styling

### Phase 3: Unified Link Creation API

#### 3.1 Create Orchestration Endpoint
**New file:** `/src/app/api/company-links/create-from-url/route.ts`
- Receives job URL
- Calls scrape-job internally
- Auto-generates slug from company name
- Fetches logo via Logo.dev/Clearbit
- Triggers brand analysis (async)
- Returns all extracted data in one response

### Phase 4: Simplified Create Link UX

#### 4.1 Redesign Create Flow
**Modify:** `/src/app/admin/links/create/page.tsx`
- Reduce from 4 steps to 3:
  1. **Paste URL** → Auto-triggers all extraction
  2. **Customize** → Edit auto-filled data, see brand preview
  3. **Preview & Create** → Live preview with brand styling

#### 4.2 Add Brand Preview Card
**New file:** `/src/components/admin/BrandPreviewCard.tsx`
- Shows extracted color palette
- Displays typography preview
- Shows company logo
- Loading state while analyzing

### Phase 5: Cover Letter Generator

#### 5.1 Create Cover Letter API
**New file:** `/src/app/api/generate-cover-letter/route.ts`
- Uses Claude with brand voice from `brand_analysis.voice_tone`
- Takes company_link_id and format (formal/modern/casual)
- Generates cover letter matching company's tone/formality

#### 5.2 Create Cover Letter UI
**New file:** `/src/components/personalized/CoverLetterDialog.tsx`
- Format selector (formal/modern/casual)
- Generate button with loading state
- Copy to clipboard
- Regenerate option

#### 5.3 Database Migration
**New file:** `/supabase/migrations/021_cover_letters.sql`
```sql
CREATE TABLE generated_cover_letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  company_link_id UUID REFERENCES company_links(id),
  format VARCHAR(20) DEFAULT 'formal',
  content TEXT NOT NULL,
  word_count INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Phase 6: Types & Documentation

#### 6.1 Add Types
**Modify:** `/src/types/index.ts`
- `CreateFromUrlRequest/Response`
- `GenerateCoverLetterRequest/Response`
- `GeneratedCoverLetter`

#### 6.2 Update Documentation
**Modify:** `/docs/FEATURES.md`, `/docs/AI.md`
- Document brand styling system
- Cover letter API documentation

---

## Files Summary

### New Files (8)
| File | Purpose |
|------|---------|
| `/src/components/personalized/BrandStyleProvider.tsx` | CSS variable injection |
| `/src/components/personalized/BrandFontLoader.tsx` | Google Fonts loading |
| `/src/lib/brand-utils.ts` | Color/gradient utilities |
| `/src/app/api/company-links/create-from-url/route.ts` | Unified creation API |
| `/src/components/admin/BrandPreviewCard.tsx` | Brand preview in admin |
| `/src/app/api/generate-cover-letter/route.ts` | Cover letter API |
| `/src/components/personalized/CoverLetterDialog.tsx` | Cover letter UI |
| `/supabase/migrations/021_cover_letters.sql` | Cover letter storage |

### Modified Files (10)
| File | Changes |
|------|---------|
| `/src/app/for/[slug]/page.tsx` | Add brand fetch, wrap in provider |
| `/src/components/personalized/PersonalizedHero.tsx` | Dynamic brand styling |
| `/src/components/personalized/PersonalizedPitch.tsx` | Brand typography |
| `/src/components/personalized/HighlightedProjects.tsx` | Brand card styling |
| `/src/components/personalized/SkillsMatch.tsx` | Brand accent colors |
| `/src/components/personalized/PersonalizedCTA.tsx` | Brand button styling |
| `/src/app/admin/links/create/page.tsx` | Simplified 3-step flow |
| `/src/types/index.ts` | New type definitions |
| `/docs/FEATURES.md` | Feature documentation |
| `/docs/AI.md` | Cover letter AI docs |

---

## Verification Plan

### Manual Testing
1. **Create a new link** with LinkedIn job URL (e.g., Anthropic job)
2. **Verify extraction:** Company name, logo, job title auto-populated
3. **Check brand analysis:** Colors extracted from anthropic.com
4. **Visit personalized page:** `/for/anthropic` shows Anthropic's brand colors
5. **Generate cover letter:** Verify tone matches Anthropic's voice
6. **Test fallback:** Create link without brand analysis, verify default styling works

### Automated Tests
- Unit tests for `brand-utils.ts` color functions
- Integration test for create-from-url API pipeline
- E2E test for full link creation flow

---

## Dependencies
- Existing: Playwright (for screenshots), Google Gemini (for brand analysis), Claude (for copy)
- New: None required - leveraging existing infrastructure
