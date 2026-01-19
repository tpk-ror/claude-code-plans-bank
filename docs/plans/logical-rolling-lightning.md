# SEO-Optimized Blog Post Design Plan

## Objective
Redesign the blog post pages to maximize organic search traffic while delivering a visually stunning, Vercel-inspired experience with rich interactions.

---

## Research Summary

### SEO Best Practices (2025-2026)
- **Structured Data**: BlogPosting schema with author, dates, images, headline
- **Content Structure**: Clear H1 → H2 → H3 hierarchy, 4-line max paragraphs
- **Reading Width**: 50-75 characters per line (`max-width: 75ch`)
- **Above the Fold**: Headline, author, date, reading time immediately visible
- **Rich Snippets**: Schema markup increases CTR by 51%
- **Table of Contents**: Essential for 1,500+ word posts, improves navigation & SEO

### Visual Design (Vercel/Geist-Inspired)
- **Typography Scale**: Heading 32-40px, Body 16-18px, balanced line-height
- **Bold & Modern**: Strong colors, dynamic elements, generous whitespace
- **Full-width Hero**: Large, impactful featured images
- **Rich Interactions**: Scroll-triggered animations, hover effects, progress indicators

### User Requirements
- **Audience**: Business/recruiters
- **Goals**: Showcase expertise + organic traffic + thought leadership
- **Key Elements**: Reading time, related content, floating "Let's Chat" CTA
- **Progress**: Top fixed reading progress bar
- **Templates**: Multiple layout templates to choose from

---

## Implementation Plan

### Phase 1: Schema Markup & Meta Tags
**Files to modify:**
- `src/app/(public)/blog/[slug]/page.tsx`

**Changes:**
1. Add JSON-LD BlogPosting schema with:
   - `@type: "BlogPosting"`
   - `headline`, `description`, `datePublished`, `dateModified`
   - `author` with `name`, `url`, `@type: "Person"`
   - `image` (multiple sizes: 16:9, 4:3, 1:1)
   - `publisher` organization
   - `mainEntityOfPage`

2. Enhance `generateMetadata()` with:
   - Canonical URL
   - Twitter card metadata
   - Article-specific Open Graph tags
   - Keywords from tags

### Phase 2: Reading Progress Bar Component
**New file:** `src/components/blog/ReadingProgressBar.tsx`

**Features:**
- Fixed position at viewport top
- Smooth animation on scroll
- Primary color gradient fill
- 3px height, subtle shadow
- Only visible on blog post pages

### Phase 3: Table of Contents Component
**New file:** `src/components/blog/TableOfContents.tsx`

**Features:**
- Auto-generated from H2/H3 headings in content
- Sticky positioning on desktop (left sidebar)
- Collapsible on mobile (below hero)
- Smooth scroll to sections
- Active section highlighting on scroll
- Framer Motion animations

### Phase 4: Blog Post Layout Redesign
**Files to modify:**
- `src/app/(public)/blog/[slug]/page.tsx`
- `src/app/(public)/blog/[slug]/BlogContent.tsx`

**Layout Structure:**
```
┌─────────────────────────────────────────────────┐
│ [Reading Progress Bar - full width, fixed top]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  ← Back to Blog                                 │
│                                                 │
│  [Full-Width Hero Image - aspect-video]         │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Tags]  •  Jan 13, 2026  •  8 min read         │
│                                                 │
│  # Article Title (H1 - 40px bold)               │
│                                                 │
│  Excerpt/subtitle (20px, muted)                 │
│                                                 │
│  [Author card with avatar, name, credentials]   │
│                                                 │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│  [TOC]   │  [Article Content - max-w: 75ch]     │
│  sticky  │                                      │
│          │  - Prose styling                     │
│          │  - Code blocks with copy button      │
│          │  - Image zoom on click               │
│          │  - Blockquote styling                │
│          │                                      │
├──────────┴──────────────────────────────────────┤
│                                                 │
│  [Related Posts - 3 cards horizontal]           │
│                                                 │
│  [Author Bio Card - full width]                 │
│                                                 │
│  [Floating "Let's Chat" CTA - bottom right]     │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Typography Updates:**
- H1: 40px (2.5rem) bold, tracking-tight
- H2: 32px (2rem) semibold
- H3: 24px (1.5rem) medium
- Body: 18px (1.125rem), line-height 1.75
- Content width: `max-w-[75ch]` for optimal reading

### Phase 5: Floating CTA Component
**New file:** `src/components/blog/FloatingCTA.tsx`

**Features:**
- Fixed bottom-right position
- "Let's Chat" button with icon
- Entrance animation (slide up + fade)
- Hover effects (scale, glow)
- Links to contact page or opens contact modal
- Hide when scrolled to footer

### Phase 6: Template System
**New files:**
- `src/components/blog/templates/StandardTemplate.tsx`
- `src/components/blog/templates/FeaturedTemplate.tsx`
- `src/components/blog/templates/MinimalTemplate.tsx`

**Database change:**
- Add `template` column to `blog_posts` table (enum: 'standard', 'featured', 'minimal')

**Templates:**
1. **Standard**: Default layout with sidebar TOC
2. **Featured**: Hero takes full viewport, cinematic feel
3. **Minimal**: Text-focused, no sidebar, maximum reading focus

### Phase 7: Related Posts Component
**New file:** `src/components/blog/RelatedPosts.tsx`

**Features:**
- Query posts with matching tags
- Display 3 cards in horizontal scroll on mobile
- Hover animations
- Lazy load images

### Phase 8: Enhanced Blog Listing Page
**Files to modify:**
- `src/app/(public)/blog/page.tsx`

**SEO Additions:**
- CollectionPage schema markup
- Breadcrumb schema
- Improved meta description

**Visual Updates:**
- Featured post hero at top
- Grid layout for remaining posts
- Infinite scroll or pagination
- Filter animations

### Phase 9: Author Component
**New file:** `src/components/blog/AuthorCard.tsx`

**Features:**
- Avatar with fallback
- Name, title/credentials
- Social links
- Brief bio
- Links to author page/profile

---

## Technical Implementation Details

### Schema Markup Example
```typescript
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.excerpt,
  image: [
    post.featured_image_url, // 16:9
    // Generate 4:3 and 1:1 variants
  ],
  datePublished: post.published_at,
  dateModified: post.updated_at,
  author: {
    '@type': 'Person',
    name: 'Tom Karlen',
    url: 'https://etomco.com/about',
  },
  publisher: {
    '@type': 'Organization',
    name: 'etomco',
    logo: {
      '@type': 'ImageObject',
      url: 'https://etomco.com/logo.png',
    },
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': `https://etomco.com/blog/${post.slug}`,
  },
};
```

### Reading Time Calculation
```typescript
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}
```

### TOC Generation
```typescript
function extractHeadings(content: string): Heading[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: Heading[] = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2],
      id: slugify(match[2]),
    });
  }
  return headings;
}
```

---

## Files to Create
1. `src/components/blog/ReadingProgressBar.tsx`
2. `src/components/blog/TableOfContents.tsx`
3. `src/components/blog/FloatingCTA.tsx`
4. `src/components/blog/RelatedPosts.tsx`
5. `src/components/blog/AuthorCard.tsx`
6. `src/components/blog/templates/StandardTemplate.tsx`
7. `src/components/blog/templates/FeaturedTemplate.tsx`
8. `src/components/blog/templates/MinimalTemplate.tsx`
9. `src/lib/blog-utils.ts` (reading time, TOC extraction, schema generation)
10. `supabase/migrations/018_blog_templates.sql`

## Files to Modify
1. `src/app/(public)/blog/[slug]/page.tsx` - Main layout refactor
2. `src/app/(public)/blog/[slug]/BlogContent.tsx` - Enhanced prose styling
3. `src/app/(public)/blog/page.tsx` - Listing page SEO + visual updates
4. `src/types/index.ts` - Add template type to BlogPost
5. `src/components/layout/create-dialogs/CreateBlogDialog.tsx` - Template selection

---

## Verification Plan

### SEO Testing
1. Google Rich Results Test: https://search.google.com/test/rich-results
2. Schema.org Validator: https://validator.schema.org/
3. Lighthouse SEO audit (target: 100)
4. Check Open Graph with Facebook Debugger
5. Twitter Card Validator

### Visual Testing
1. Test all 3 templates with real content
2. Mobile responsive testing (320px - 428px)
3. Dark/light mode toggle
4. Animation performance (60fps)
5. Reading progress accuracy

### Functional Testing
1. TOC navigation and highlighting
2. Floating CTA visibility logic
3. Related posts query accuracy
4. Reading time calculation
5. Schema markup validation in browser devtools

---

## Sources
- [Backlinko SEO Checklist](https://backlinko.com/seo-checklist)
- [Google Article Schema Documentation](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Vercel Geist Typography](https://vercel.com/geist/typography)
- [Blog Layout Best Practices 2025](https://www.linnworks.com/blog/blog-layout-best-practices/)
- [Optimal Blog Post Width](https://schwartz-edmisten.com/blog/the-scientifically-optimal-blog-post-width)
- [Schema Markup for Blogs](https://sapphireseosolutions.com/blog/why-is-schema-markup-important)
