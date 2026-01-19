# Marketing Content Assembly Platform - Implementation Plan

## Overview

Build a full marketing content assembly platform based on PRD at `/docs/features/marketing-app-PRD.md`.

**Tech Stack:**
- Backend: Supabase (local) - PostgreSQL database + Storage
- AI: Gemini API + OpenAI ChatGPT/DALL-E (ready)
- Frontend: Next.js 16, React 19, TypeScript, Tailwind, shadcn/ui
- State: Jotai (client) + TanStack Query (server)
- PDF: Existing @react-pdf/renderer system
- PPTX: PptxGenJS (new)

**Skipping for now:** Auth, Dynamics CRM integration

---

## Feature Module Structure

```
features/marketing/
├── components/
│   ├── canvas/               # Campaign Canvas
│   │   ├── AssetBrowser/
│   │   ├── CanvasViewport/
│   │   ├── ContentEditor/
│   │   └── index.ts
│   ├── brands/
│   │   ├── BrandList/
│   │   ├── BrandEditor/
│   │   └── index.ts
│   ├── campaigns/
│   │   ├── CampaignList/
│   │   ├── CampaignForm/
│   │   └── index.ts
│   ├── customers/
│   │   └── CustomerBrandEditor/
│   └── index.ts
├── lib/
│   ├── hooks/
│   │   ├── use-campaign.ts
│   │   ├── use-canvas-state.ts
│   │   ├── use-asset-generation.ts
│   │   └── use-ai-assist.ts
│   ├── helpers/
│   │   ├── content-validation.ts
│   │   ├── ai-service.ts
│   │   └── brand-helpers.ts
│   ├── workers/
│   │   └── pptx.worker.ts
│   └── atoms/
│       ├── campaign-atoms.ts
│       ├── canvas-atoms.ts
│       └── content-atoms.ts
├── templates/
│   ├── hero-banner/
│   ├── product-sell-sheet/
│   ├── ecom-powerpoint/
│   ├── sales-email/
│   └── social-instagram/
├── types.ts
├── constants.ts
└── index.ts
```

---

## Database Schema (Supabase)

### Tables to Create

1. **brands** - Internal brand identities
   - Colors (JSONB), typography (JSONB), voice (JSONB), messaging guidelines (JSONB), photography style (JSONB)
   - Logo URLs, legal info

2. **customer_brands** - External customer branding
   - Logo URLs, colors, co-branding rules

3. **media_types** - Output classifiers
   - slug (homepage-banner, product-sell-sheet, etc.)
   - category, output_format, rendering_engine

4. **data_structures** - Field schemas
   - field_definitions (JSONB array)
   - field_groupings, pim_mapping

5. **templates** - Code-based templates
   - Links to media_type, data_structure
   - template_code_path, rendering_engine

6. **campaigns** - Orchestration layer
   - brand_id, customer_brand_id
   - Timing fields, UTM tracking, localization, tags
   - Status workflow

7. **campaign_templates** - Junction table

8. **content** - Actual content for assets
   - field_values (JSONB)
   - AI tracking fields

9. **generated_assets** - Output artifacts
   - storage_url, file_format, markup

### Seed Data
- 2-3 sample brands
- 5 media types (homepage-banner, product-sell-sheet, ecom-powerpoint, sales-email, social-instagram)
- Matching data structures and templates

---

## API Routes

```
/app/api/v1/
├── brands/
│   ├── route.ts              # GET (list), POST
│   └── [id]/route.ts         # GET, PATCH, DELETE
├── customer-brands/
│   ├── route.ts
│   └── [id]/route.ts
├── media-types/
│   ├── route.ts
│   └── [id]/route.ts
├── data-structures/
│   ├── route.ts
│   └── [id]/route.ts
├── templates/
│   ├── route.ts
│   └── [id]/route.ts
├── campaigns/
│   ├── route.ts
│   ├── [id]/route.ts
│   └── [id]/assets/route.ts  # Bulk asset retrieval
├── content/
│   ├── route.ts
│   └── [id]/route.ts
├── assets/
│   ├── route.ts              # GET by campaign+media_type
│   ├── generate/route.ts     # POST trigger generation
│   └── [id]/route.ts
└── ai/
    ├── text/route.ts         # AI text generation
    └── image/route.ts        # AI image generation
```

---

## Campaign Canvas Components

```
CampaignCanvas (page.tsx)
├── CanvasHeader
│   ├── CampaignTitle + Status
│   └── LocaleSelector
├── CanvasBody (3-panel layout)
│   ├── AssetBrowser (left, collapsible)
│   │   ├── AssetCard[] - thumbnails + status
│   │   └── AddAssetButton
│   ├── CanvasViewport (main)
│   │   ├── ViewportToolbar (zoom, view mode)
│   │   ├── HTMLAssetRenderer (realtime)
│   │   ├── PDFAssetRenderer (async)
│   │   ├── PPTXAssetRenderer (async)
│   │   └── LoadingOverlay (progress bar)
│   └── ContentEditor (right)
│       ├── FieldGroup[]
│       │   ├── FieldInput (text/richtext/image/url)
│       │   ├── AIAssistButton
│       │   ├── CharacterCounter
│       │   └── SharedFieldIndicator
│       └── EditorActions
└── CanvasStatusBar
    ├── AutoSaveStatus
    ├── AssetCount + Locale
    └── ExportButton
```

---

## Rendering Architecture

### Realtime (HTML/Email) - 50ms debounce
- React component renders instantly
- Brand styles applied via CSS variables
- Content from Jotai atoms

### Async (PDF/PPTX) - 2s debounce
1. Content changes trigger render job queue
2. Show loading overlay with progress
3. Server generates file, uploads to Supabase Storage
4. Return storage URL for preview
5. Download available

### PowerPoint Generation (PptxGenJS)
```typescript
const pptx = new PptxGenJS();
pptx.defineLayout({ name: 'LAYOUT_16x9', width: 13.333, height: 7.5 });
// Add slides with brand colors, fonts, logos
// Return ArrayBuffer for storage
```

---

## State Management (Jotai)

```typescript
// Campaign state
currentCampaignAtom
currentBrandAtom
campaignListAtom

// Canvas state
selectedAssetIdAtom
canvasViewModeAtom ('single' | 'multi')
canvasZoomAtom
assetLoadingStatesAtom

// Content state
contentFieldsAtom (Record<string, unknown>)
dirtyFieldsAtom (Set<string>)
autoSaveStatusAtom ('saved' | 'saving' | 'error')
lastSavedAtAtom
```

---

## AI Integration

### Text Generation
- Build prompt from brand voice + messaging guidelines
- Call Gemini or ChatGPT based on config
- Return 3-5 suggestions
- Track AI-generated fields

### Image Generation
- Build prompt from brand photography style
- Include product image if available
- Call Gemini or DALL-E
- Return generated image URLs

---

## Templates to Build

| Template | Media Type | Format | Rendering |
|----------|------------|--------|-----------|
| Hero Banner | homepage-banner | HTML | Realtime |
| Product Sell Sheet | product-sell-sheet | PDF | Async |
| eCommerce PowerPoint | ecom-powerpoint | PPTX | Async |
| Sales Email | sales-email | HTML | Realtime |
| Social Instagram | social-instagram | Image | Realtime |

Each template needs:
- `template.config.ts` - Field definitions, dimensions
- `preview.tsx` - React component for rendering
- Generator file (pdf-generator.tsx or pptx-generator.ts for async)

---

## Pages to Create

| Route | Purpose |
|-------|---------|
| `/marketing` | Marketing dashboard |
| `/marketing/brands` | Brand management |
| `/marketing/brands/[id]` | Brand editor |
| `/marketing/customers` | Customer brand management |
| `/marketing/campaigns` | Campaign list |
| `/marketing/campaigns/new` | Campaign wizard |
| `/marketing/campaigns/[id]` | Campaign Canvas |

---

## Files to Create

### Core Feature Files
- `/features/marketing/index.ts`
- `/features/marketing/types.ts`
- `/features/marketing/constants.ts`

### Components (~25 files)
- Canvas: AssetBrowser, CanvasViewport, ContentEditor, LoadingOverlay
- Brands: BrandList, BrandEditor, ColorPicker, LogoUpload
- Campaigns: CampaignList, CampaignForm, CampaignStatus
- Shared: AIAssistButton, FieldRenderer, LocaleSelector

### API Routes (~15 files)
- CRUD for all entities
- Asset generation endpoint
- AI endpoints

### Templates (~10 files)
- 5 templates × (config + preview + generator)

### Hooks & Atoms (~10 files)
- use-campaign, use-canvas-state, use-asset-generation, use-ai-assist
- campaign-atoms, canvas-atoms, content-atoms

### Database
- Supabase migration file with all tables
- Seed data script

---

## Files to Modify

| File | Change |
|------|--------|
| `/config/features.config.ts` | Add marketing nav items |
| `/app/dashboard/constants.ts` | Add marketing feature card |
| `/package.json` | Add pptxgenjs, @supabase/supabase-js, openai, @google/generative-ai |
| `/shared/types/index.ts` | Re-export marketing types |

---

## Dependencies to Add

```bash
npm install pptxgenjs @supabase/supabase-js @supabase/auth-helpers-nextjs @google/generative-ai openai @tanstack/react-query
```

---

## Implementation Order

### Phase 1: Foundation
1. Supabase setup (local) with database schema
2. Core types in `/features/marketing/types.ts`
3. API routes for brands, media-types, data-structures
4. Brand management UI

### Phase 2: Campaign & Content
5. Campaign CRUD + API
6. Content entity + API
7. Campaign list and form UI

### Phase 3: Campaign Canvas
8. Canvas layout (3-panel)
9. AssetBrowser component
10. ContentEditor with field types
11. Realtime HTML rendering
12. Async PDF/PPTX rendering with loading states
13. Auto-save with debouncing

### Phase 4: Templates
14. Hero Banner template (HTML)
15. Product Sell Sheet template (PDF)
16. eCommerce PowerPoint template (PPTX)
17. Sales Email template (HTML)
18. Social Instagram template (Image)

### Phase 5: AI Integration
19. AI text generation (Gemini + ChatGPT)
20. AI image generation (DALL-E + Gemini)
21. AIAssistButton component

### Phase 6: Polish
22. Navigation integration
23. Dashboard card
24. Testing
25. Documentation

---

## Critical Implementation Notes

1. **Reuse PDF patterns** from `/features/pdf-generator/` for async rendering, worker architecture, and loading states

2. **PowerPoint is new** - needs PptxGenJS setup and worker implementation

3. **Supabase Storage** replaces Azure Blob - use public bucket for generated assets

4. **AI providers** - abstract behind service layer so both Gemini and OpenAI can be swapped

5. **Shared content propagation** - when content field updates, trigger re-render for all assets using that field

6. **Auto-save** - debounce at 2s, save to Supabase, update dirty state tracking
