# Plan: 10 New Project Layout Templates + Gallery Fixes

## Overview
Add 10 new project layout templates and fix the Gallery layout's hero section issues. Ensure all templates are mobile-friendly and optimize screen width utilization.

---

## Part 1: Fix Gallery Layout Hero Issues

**Problem:** Hero text is positioned top-right and touches browser edge due to:
- Minimal padding (`px-4 md:px-8`)
- No centered container (`max-w-4xl` without `mx-auto`)

**Fix in `src/components/projects/layouts/GalleryLayout.tsx` (lines 64-77):**
```tsx
// Before:
<div className="h-full flex flex-col justify-end pb-20 px-4 md:px-8">
  <div className="max-w-4xl">

// After:
<div className="h-full flex flex-col justify-end pb-20 px-6 sm:px-8 md:px-12 lg:px-16">
  <div className="max-w-7xl mx-auto w-full">
    <div className="max-w-4xl">
```

**Additional Gallery Improvements:**
- Add safe area padding for notched devices
- Improve text shadow for readability on varied backgrounds
- Ensure scroll indicator is centered properly

---

## Part 2: 10 New Layout Templates

### Template 1: **Minimal**
- Clean typography-focused, maximum whitespace
- No hero image, large centered title
- Single-column prose (max-width 65ch)
- Best for: Personal projects, design philosophy pieces

### Template 2: **Timeline**
- Chronological storytelling with vertical timeline
- Split hero (40% image, 60% content)
- Alternating left/right milestone nodes
- Best for: Long-term projects, product evolution stories

### Template 3: **Split-Screen**
- Two-panel layout (sticky left, scrolling right)
- Full-width hero splits on scroll
- Visual/text pairing throughout
- Best for: Before/after, design iterations

### Template 4: **Dashboard**
- Data-driven with metric cards and KPIs
- Compact header with animated hero metric
- 4-column grid of analytics-style cards
- Best for: Optimization case studies, data projects

### Template 5: **Story**
- Full-viewport scroll-triggered scenes
- Cinematic title animations
- Scene-based navigation dots
- Best for: Creative campaigns, branding projects

### Template 6: **Card Stack**
- Overlapping cards that reveal on scroll
- 3D perspective tilt effects
- Layered shadow depth
- Best for: Mobile app showcases, feature tours

### Template 7: **Masonry**
- Pinterest-style dynamic grid
- Mixed content types (images, text, code)
- Filterable by section
- Best for: Visual portfolios, design systems

### Template 8: **Scroll-Snap**
- Horizontal scroll with snap points
- Carousel-like section navigation
- Progress bar for position
- Best for: Interactive presentations, pitch decks

### Template 9: **Asymmetric**
- Intentionally off-center dramatic layout
- Diagonal dividers and offset elements
- Visual tension for artistic flair
- Best for: Creative/artistic projects

### Template 10: **Terminal**
- Developer-focused IDE aesthetic
- Monospace typography, syntax highlighting
- Typewriter text effects
- Best for: Technical projects, developer tools

---

## Part 3: New Shared Components

| Component | Used By | Purpose |
|-----------|---------|---------|
| `TimelineNode` | Timeline, Story | Date-stamped milestone |
| `ProgressDots` | Story, Scroll-Snap | Navigation indicators |
| `MetricDashboardCard` | Dashboard, Bento | Analytics-style metric |
| `SplitPanel` | Split-Screen, Asymmetric | Two-column sticky layout |
| `SceneContainer` | Story, Scroll-Snap | Full-viewport scene wrapper |
| `TypewriterText` | Terminal, Story | Typing animation effect |
| `MasonryGrid` | Masonry | Dynamic column layout |
| `StackCard` | Card Stack | 3D layered card |

---

## Part 4: Mobile Responsiveness Standards

All templates will follow:
- **Mobile-first** Tailwind classes
- **Breakpoints:** `sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`
- **Container widths:**
  - Mobile: Full width with `px-4` (16px) padding
  - Tablet: `max-w-3xl` or `max-w-4xl` centered
  - Desktop: `max-w-6xl` or `max-w-7xl` with `px-6` to `px-16`
- **Typography scaling:** Base 16px, headers scale `text-2xl md:text-3xl lg:text-4xl`
- **Touch targets:** Minimum 44px for interactive elements
- **Safe areas:** Padding for notched devices

---

## Part 5: Files to Create/Modify

### New Files:
```
src/components/projects/layouts/
├── MinimalLayout.tsx
├── TimelineLayout.tsx
├── SplitScreenLayout.tsx
├── DashboardLayout.tsx
├── StoryLayout.tsx
├── CardStackLayout.tsx
├── MasonryLayout.tsx
├── ScrollSnapLayout.tsx
├── AsymmetricLayout.tsx
└── TerminalLayout.tsx

src/components/projects/layouts/shared/
├── TimelineNode.tsx
├── ProgressDots.tsx
├── MetricDashboardCard.tsx
├── SplitPanel.tsx
├── SceneContainer.tsx
├── TypewriterText.tsx
├── MasonryGrid.tsx
└── StackCard.tsx
```

### Files to Modify:
- `src/components/projects/layouts/GalleryLayout.tsx` - Fix hero
- `src/components/projects/layouts/shared/index.ts` - Export new components
- `src/components/projects/layouts/index.ts` - Export new layouts
- `src/types/index.ts` - Add new template types to union
- `src/app/(public)/projects/[slug]/page.tsx` - Add switch cases
- `supabase/migrations/034_project_layout_templates.sql` - Update enum (if needed)
- `docs/COMPONENTS.md` - Document new templates

---

## Part 6: Type Updates

```typescript
// src/types/index.ts
export type ProjectLayoutTemplate =
  | 'editorial'
  | 'bento'
  | 'gallery'
  | 'minimal'
  | 'timeline'
  | 'split-screen'
  | 'dashboard'
  | 'story'
  | 'card-stack'
  | 'masonry'
  | 'scroll-snap'
  | 'asymmetric'
  | 'terminal';
```

---

## Implementation Order (All 10 Templates)

**Phase 1: Foundation**
1. Fix Gallery hero (quick win)
2. Update types in `index.ts` with all 13 template values
3. Create shared components (TimelineNode, ProgressDots, etc.)

**Phase 2: Core Templates**
4. **Minimal** - Establishes clean baseline
5. **Timeline** - Chronological storytelling
6. **Dashboard** - Data-driven metrics
7. **Story** - Cinematic scroll scenes

**Phase 3: Visual Templates**
8. **Split-Screen** - Sticky panel comparisons
9. **Terminal** - Developer aesthetic
10. **Card Stack** - 3D layered cards
11. **Masonry** - Dynamic grid layout

**Phase 4: Creative Templates**
12. **Asymmetric** - Artistic off-center layout
13. **Scroll-Snap** - Horizontal navigation

**Phase 5: Integration**
14. Update project page switch statement
15. Update exports and documentation

---

## Verification

1. **Visual testing:** View each template on project pages
2. **Mobile testing:** Check at 375px, 768px, 1024px, 1440px widths
3. **Browser DevTools:** Test responsive breakpoints
4. **Lighthouse:** Check performance scores
5. **Run existing E2E tests:** `npm run test:e2e:smoke`
