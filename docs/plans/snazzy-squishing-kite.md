# Project Detail Page Layout Templates

## Overview

Create 3 distinct layout templates for project detail pages. Each project can select which template to use based on content type and visual needs.

---

## Template 1: Editorial Story Layout

**Best for:** Deep case studies with extensive written content, UX projects, process-heavy work

**Visual Style:** Magazine-inspired, typography-focused, long-scroll narrative

### Structure

```
┌─────────────────────────────────────────────┐
│  ← Back to Projects                         │
├─────────────────────────────────────────────┤
│                                             │
│  [Category Badge]                           │
│  PROJECT TITLE                              │
│  Subtitle / tagline                         │
│                                             │
│  [Tags]  [Tags]  [Tags]                     │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │                                       │  │
│  │      FULL-WIDTH HERO IMAGE            │  │
│  │      (with featured metric overlay)   │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  Quick Facts Bar (horizontal)               │
│  ┌────────┬────────┬────────┬────────┐     │
│  │Duration│  Role  │  Team  │  Tech  │     │
│  └────────┴────────┴────────┴────────┘     │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  CHAPTER 1: THE PROBLEM                     │
│  ─────────────────────                      │
│  [Full-width narrative text]                │
│  [Pull quote callout]                       │
│  [Supporting image - centered]              │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  CHAPTER 2: RESEARCH & DISCOVERY            │
│  ─────────────────────────────              │
│  [Research items in 2-col grid]             │
│  [Ideas Canvas - full width]                │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  CHAPTER 3: THE PROCESS                     │
│  ─────────────────────                      │
│  [Timeline visualization]                   │
│  [Step-by-step with artifacts]              │
│  [Storyboard Canvas - full width]           │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  CHAPTER 4: THE SOLUTION                    │
│  ───────────────────────                    │
│  [Before/After Slider - full width]         │
│  [Code snippets with explanations]          │
│  [Technical deep dive - expandable]         │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  CHAPTER 5: RESULTS & IMPACT                │
│  ─────────────────────────────              │
│  [Large animated metrics - 2x2 grid]        │
│  [Testimonial - full width card]            │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  REFLECTIONS                                │
│  [Lessons learned - categorized]            │
│  [Team credits]                             │
│                                             │
├─────────────────────────────────────────────┤
│  Sticky Section Nav (appears on scroll)     │
│  [Problem] [Research] [Process] [Solution]  │
└─────────────────────────────────────────────┘
```

### Key Features
- Chapter-based navigation with sticky nav
- Pull quotes for key insights
- Full-width imagery between text sections
- Generous whitespace and large typography
- Reading progress indicator

### New Components Needed
- `ChapterHeading` - Large numbered chapter titles
- `PullQuote` - Highlighted quote callout
- `ReadingProgress` - Progress bar at top

---

## Template 2: Bento Grid Layout

**Best for:** Visual projects, design work, projects with many images/artifacts

**Visual Style:** Modern, asymmetric cards, dense information display

### Structure

```
┌─────────────────────────────────────────────┐
│  ← Back                     [Live] [GitHub] │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────┬───────────────────┐   │
│  │                 │    PROJECT TITLE   │   │
│  │   HERO IMAGE    │    Description     │   │
│  │   (16:9)        │    ─────────────   │   │
│  │                 │    [Tags]          │   │
│  │                 │    [Category]      │   │
│  └─────────────────┴───────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│  BENTO GRID SECTION                         │
│  ┌───────────┬───────────┬─────────────┐   │
│  │           │  METRIC   │   METRIC    │   │
│  │  PROBLEM  │   +45%    │   2.3s      │   │
│  │  CARD     │  Growth   │  Load time  │   │
│  │  (tall)   ├───────────┴─────────────┤   │
│  │           │                         │   │
│  │           │    TECH STACK CARD      │   │
│  │           │    [icons in grid]      │   │
│  ├───────────┼─────────────────────────┤   │
│  │  PROCESS  │                         │   │
│  │  IMAGE    │      SOLUTION CARD      │   │
│  │  (square) │      [text summary]     │   │
│  ├───────────┤                         │   │
│  │  METRIC   │                         │   │
│  │  12 weeks │                         │   │
│  └───────────┴─────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│  BEFORE / AFTER (full width slider)         │
│  ┌─────────────────────────────────────┐   │
│  │          [Interactive Slider]        │   │
│  └─────────────────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│  IMAGE GALLERY BENTO                        │
│  ┌───────────────────┬─────────┬───────┐   │
│  │                   │         │       │   │
│  │   LARGE ARTIFACT  │  SMALL  │ SMALL │   │
│  │   (wireframe)     │         │       │   │
│  │                   ├─────────┴───────┤   │
│  │                   │                 │   │
│  │                   │   MEDIUM        │   │
│  └───────────────────┴─────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│  RESULTS ROW                                │
│  ┌─────────┬─────────┬─────────┬───────┐   │
│  │ Metric  │ Metric  │ Metric  │Metric │   │
│  │  +45%   │  -30%   │  2.3s   │ 50k   │   │
│  └─────────┴─────────┴─────────┴───────┘   │
│                                             │
├─────────────────────────────────────────────┤
│  ┌─────────────────┬───────────────────┐   │
│  │   TESTIMONIAL   │    TEAM CARD      │   │
│  │   [full quote]  │    [avatars]      │   │
│  │   [avatar]      │    [my role]      │   │
│  └─────────────────┴───────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

### Key Features
- Asymmetric card grid with varying sizes
- Metrics prominently displayed in cards
- Dense information without overwhelming
- Hover effects reveal more detail
- Visual hierarchy through card sizes

### New Components Needed
- `BentoGrid` - CSS Grid container with named areas
- `BentoCard` - Flexible card with size variants (small, medium, large, tall, wide)
- `MetricCard` - Standalone metric display for bento
- `ImageBento` - Image gallery in bento layout

---

## Template 3: Immersive Gallery Layout

**Best for:** Visual/creative projects, photography, design showcases, minimal text

**Visual Style:** Full-bleed images, parallax effects, cinematic feel

### Structure

```
┌─────────────────────────────────────────────┐
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │                                       │  │
│  │     FULL-SCREEN HERO IMAGE            │  │
│  │     (with parallax scroll)            │  │
│  │                                       │  │
│  │     PROJECT TITLE                     │  │
│  │     [Category]                        │  │
│  │                                       │  │
│  │              ↓ Scroll                 │  │
│  └───────────────────────────────────────┘  │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Quick Info Strip (sticky on scroll) │   │
│  │  Title | Duration | Role | [Actions] │   │
│  └─────────────────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│     Brief Description (centered, max-w)     │
│     [Tags row]                              │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │     FULL-BLEED IMAGE 1                │  │
│  │     (with parallax)                   │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌────────────┐                            │
│  │  Caption   │  (offset text block)       │
│  │  + detail  │                            │
│  └────────────┘                            │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │     FULL-BLEED IMAGE 2                │  │
│  │     (horizontal scroll gallery)       │  │
│  └───────────────────────────────────────┘  │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  TWO-COLUMN: Image | Text                   │
│  ┌─────────────────┬───────────────────┐   │
│  │                 │                   │   │
│  │    IMAGE        │   Problem &       │   │
│  │    (sticky)     │   Solution text   │   │
│  │                 │   (scrolls)       │   │
│  │                 │                   │   │
│  └─────────────────┴───────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  BEFORE/AFTER (full-screen slider)          │
│  ┌───────────────────────────────────────┐  │
│  │                                       │  │
│  │     [Immersive comparison]            │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  HORIZONTAL SCROLL GALLERY                  │
│  ← [img] [img] [img] [img] [img] →         │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  METRICS (large, animated on scroll)        │
│  ┌───────────────────────────────────────┐  │
│  │         +45%          2.3s            │  │
│  │        Revenue      Load Time         │  │
│  └───────────────────────────────────────┘  │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  TESTIMONIAL (full-width, large text)       │
│  "Quote in large italic typography"         │
│  — Client Name, Title                       │
│                                             │
├─────────────────────────────────────────────┤
│  Next Project →                             │
│  [Large preview of next project]            │
└─────────────────────────────────────────────┘
```

### Key Features
- Full-screen hero with scroll indicator
- Parallax images throughout
- Horizontal scroll galleries
- Sticky info bar for context
- Minimal text, maximum visual impact
- "Next project" navigation at bottom

### New Components Needed
- `ParallaxHero` - Full-screen parallax hero
- `StickyInfoBar` - Compact project info strip
- `HorizontalGallery` - Touch/mouse horizontal scroll
- `OffsetCaption` - Positioned text overlay
- `NextProjectTeaser` - Bottom navigation to next project

---

## Implementation Plan

### Phase 1: Layout System Foundation
1. Create `ProjectLayoutSelector` component to choose template
2. Add `layout_template` field to projects table (enum: 'editorial' | 'bento' | 'gallery')
3. Create shared layout wrapper with common elements

### Phase 2: Editorial Layout
1. Create `ChapterHeading`, `PullQuote`, `ReadingProgress` components
2. Build `EditorialLayout` template component
3. Refactor existing sections to fit editorial flow

### Phase 3: Bento Layout
1. Create `BentoGrid`, `BentoCard`, `MetricCard`, `ImageBento` components
2. Build `BentoLayout` template component
3. Create responsive grid configurations

### Phase 4: Gallery Layout
1. Create `ParallaxHero`, `StickyInfoBar`, `HorizontalGallery` components
2. Create `OffsetCaption`, `NextProjectTeaser` components
3. Build `GalleryLayout` template component

### Phase 5: Integration
1. Update project detail page to render based on `layout_template`
2. Add layout preview/selection in admin
3. Test all layouts with existing project data

---

## Files to Create/Modify

### New Components
```
src/components/projects/layouts/
├── EditorialLayout.tsx
├── BentoLayout.tsx
├── GalleryLayout.tsx
├── shared/
│   ├── ChapterHeading.tsx
│   ├── PullQuote.tsx
│   ├── ReadingProgress.tsx
│   ├── BentoGrid.tsx
│   ├── BentoCard.tsx
│   ├── MetricCard.tsx
│   ├── ImageBento.tsx
│   ├── ParallaxHero.tsx
│   ├── StickyInfoBar.tsx
│   ├── HorizontalGallery.tsx
│   ├── OffsetCaption.tsx
│   └── NextProjectTeaser.tsx
```

### Modifications
- `src/app/(public)/projects/[slug]/page.tsx` - Layout selection logic
- `src/types/index.ts` - Add `layout_template` to Project type
- `supabase/migrations/` - Add layout_template column

---

## Verification

1. Each layout renders correctly with existing project data
2. All existing components work within new layouts
3. Responsive behavior on mobile/tablet/desktop
4. Animations perform smoothly (60fps)
5. Accessibility: keyboard navigation, screen readers
6. SEO: proper heading hierarchy maintained
