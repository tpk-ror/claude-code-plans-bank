# AI Image Prompts Crawler Implementation Plan

## Overview
Build a Playwright-based web crawler to scrape AI image prompts from Medium and other sources, with a new "AI Images" tab in the admin prompts library.

---

## 1. Database Schema

**New file:** `/supabase/migrations/026_ai_image_prompts.sql`

### Tables

**`ai_image_prompts`** - Stores scraped prompts
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | TEXT | Article/prompt title |
| slug | TEXT | URL-safe identifier |
| prompt_text | TEXT | The actual AI image prompt |
| description | TEXT | Optional description |
| source_url | TEXT | Original article URL |
| source_domain | TEXT | e.g., "medium.com" |
| source_platform | TEXT | 'medium', 'reddit', 'substack', 'blog', 'other' |
| author_name | TEXT | Author if available |
| ai_model | TEXT | 'midjourney', 'dalle', 'stable-diffusion', 'flux' |
| style_category | TEXT | 'photorealistic', 'anime', 'abstract', etc. |
| tags | TEXT[] | Tag array |
| content_hash | TEXT | SHA256 hash for deduplication |
| is_public, featured, display_order | - | Standard visibility controls |

**`prompt_crawl_jobs`** - Tracks crawl operations
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| source_url | TEXT | URL being crawled |
| status | TEXT | 'pending', 'running', 'completed', 'failed' |
| prompts_found | INT | Count found |
| prompts_saved | INT | Count saved (excluding duplicates) |
| error_message | TEXT | Error details if failed |

---

## 2. TypeScript Types

**Add to:** `/src/types/index.ts`

```typescript
export type SourcePlatform = 'medium' | 'reddit' | 'substack' | 'blog' | 'other';
export type AIModel = 'midjourney' | 'dalle' | 'stable-diffusion' | 'flux' | 'ideogram' | 'other';

export interface AIImagePrompt {
  id: string;
  title: string;
  slug: string;
  prompt_text: string;
  source_url: string;
  source_domain: string;
  source_platform: SourcePlatform;
  author_name: string | null;
  ai_model: AIModel | null;
  tags: string[];
  content_hash: string | null;
  is_public: boolean;
  featured: boolean;
  // ... timestamps
}

export interface PromptCrawlJob { ... }
```

---

## 3. API Route

**New file:** `/src/app/api/crawl-prompts/route.ts`

### Features
- **POST** endpoint with authentication
- Accepts: `{ urls?: string[], limit?: number, use_playwright?: boolean }`
- Default URL: `https://medium.com/tag/ai-image-prompt`
- Uses SSRF protection from existing `validateURLForSSRF()`

### Crawler Logic
1. **Playwright mode** (default, local dev):
   - Launch headless Chromium
   - Navigate to tag page, scroll to load articles
   - Extract article links, visit each one
   - Parse content for prompts using patterns

2. **Fetch mode** (fallback, Vercel):
   - Simple fetch + Cheerio parsing
   - Works for static content

### Prompt Extraction
- Pattern matching: quoted text, code blocks, "Prompt:" labels
- Keyword detection: "style", "lighting", "cinematic", "8k", etc.
- AI model detection: "--ar", "--v" = Midjourney, "dall-e", etc.

### Deduplication
- SHA256 hash of normalized prompt text
- Skip insertion if hash exists

---

## 4. Admin UI Changes

**Modify:** `/src/app/admin/prompts/page.tsx`

### Changes
1. Add 5th tab: "AI Images" with `ImageIcon`
2. Change `grid-cols-4` to `grid-cols-5` in TabsList
3. Add state for AI image prompts and crawl jobs
4. Add crawl dialog with URL input
5. Add prompts list with copy/delete actions

### New Components in Page
- **Crawl Dialog**: URL input, platform selector, limit slider, "Start Crawl" button
- **Prompts Grid**: Cards showing title, prompt preview, source, copy button
- **Job History**: Recent crawl jobs with status

---

## 5. Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `/supabase/migrations/026_ai_image_prompts.sql` | Create | Database tables |
| `/src/types/index.ts` | Modify | Add AIImagePrompt types |
| `/src/app/api/crawl-prompts/route.ts` | Create | Crawler API endpoint |
| `/src/app/admin/prompts/page.tsx` | Modify | Add "AI Images" tab |
| `/docs/API.md` | Modify | Document new endpoint |
| `/docs/FEATURES.md` | Modify | Document feature |

---

## 6. Improvement Ideas

### Immediate Enhancements
- **Batch operations**: Select multiple prompts to delete/tag
- **Search & filter**: By model, style, source, tags
- **Export**: Copy all selected, export to JSON/CSV

### Future Enhancements
- **Scheduled crawling**: Vercel Cron for automatic updates
- **AI categorization**: Use Claude to auto-tag style/quality
- **More sources**: Reddit (r/midjourney), Civitai, Lexica.art
- **Semantic dedup**: Embeddings for near-duplicate detection
- **Direct integration**: "Try in Midjourney" button

---

## 7. Verification Plan

1. **Database**: Run migration, verify tables in Supabase dashboard
2. **API**: Test with curl/Postman:
   ```bash
   curl -X POST http://localhost:3000/api/crawl-prompts \
     -H "Content-Type: application/json" \
     -d '{"limit": 5}'
   ```
3. **UI**: Navigate to /admin/prompts, click "AI Images" tab, run crawl
4. **Dedup**: Run same crawl twice, verify no duplicates

---

## 8. User Preferences (Confirmed)

- **AI Models**: All models - Midjourney, DALL-E, Stable Diffusion, Flux, Ideogram
- **Default Visibility**: Public by default (immediately visible)
- **Sources**: Medium only for now (generic URL support for future expansion)
