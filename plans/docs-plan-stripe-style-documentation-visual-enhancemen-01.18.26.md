# Plan: Stripe-Style Documentation Visual Enhancement

## Summary
Enhance the `/docs` pages with Stripe-style visual polish: syntax highlighting, on-page TOC, search, copy-to-clipboard, hero section, and improved typography.

## User Preferences
- **Style:** Stripe-style (clean whitespace, subtle gradients, professional)
- **Features:** Syntax highlighting, On-page TOC, Search, Copy code button
- **Homepage:** Hero section + category cards
- **Code Theme:** One Dark / Monokai
- **Accent:** Keep app's primary color
- **Sidebar:** Sticky with scroll, active highlighting

---

## 1. Dependencies to Add

```bash
npm install shiki @tailwindcss/typography
```

- **shiki** - Modern syntax highlighter with One Dark Pro theme
- **@tailwindcss/typography** - Enhanced prose styling

---

## 2. Files to Create

### Hooks
| File | Purpose |
|------|---------|
| `src/hooks/useShikiHighlighter.ts` | Lazy-load Shiki highlighter singleton |
| `src/hooks/useExtractHeadings.ts` | Extract h2/h3 headings for TOC |

### Components
| File | Purpose |
|------|---------|
| `src/components/docs/CodeBlock.tsx` | Syntax highlighting + copy button |
| `src/components/docs/TableOfContents.tsx` | Right sidebar on-page navigation |
| `src/components/docs/DocsSearch.tsx` | Ctrl+K command palette for docs |
| `src/components/docs/DocsHero.tsx` | Homepage hero with gradient |

---

## 3. Files to Modify

| File | Changes |
|------|---------|
| `tailwind.config.ts` | Add typography plugin, prose color config |
| `src/index.css` | Add One Dark code theme CSS variables |
| `src/components/docs/DocsContent.tsx` | CodeBlock integration, enhanced prose classes, TOC integration |
| `src/components/docs/DocsLayout.tsx` | Three-column layout (sidebar + content + TOC) |
| `src/components/docs/DocsSidebar.tsx` | Active states, hover effects, visual polish |
| `src/components/docs/DocsHomeCard.tsx` | Stripe-style hover gradients |
| `src/pages/Docs.tsx` | Add DocsHero, integrate DocsSearch |

---

## 4. Key Component Designs

### CodeBlock.tsx
```tsx
// Features:
// - Shiki syntax highlighting with One Dark Pro theme
// - Language badge in header bar
// - Copy-to-clipboard button (appears on hover)
// - Dark background: bg-[#282c34] (One Dark)
```

### TableOfContents.tsx
```tsx
// Features:
// - Sticky right sidebar (hidden on small screens)
// - IntersectionObserver for active heading tracking
// - Smooth scroll on click
// - Visual active indicator line
```

### DocsSearch.tsx
```tsx
// Features:
// - Reuses existing cmdk CommandDialog
// - Ctrl+K keyboard shortcut
// - Searches doc titles, descriptions, and h2/h3 headings
// - Groups results by "Pages" and "Sections"
```

### DocsHero.tsx
```tsx
// Features:
// - Gradient background with decorative blur orbs
// - Bold headline with gradient text accent
// - Search button trigger
// - Responsive layout with decorative elements
```

---

## 5. Styling Enhancements

### Enhanced Prose Classes
```tsx
className="prose prose-slate dark:prose-invert max-w-none
  prose-headings:scroll-mt-24 prose-headings:font-semibold
  prose-h2:border-b prose-h2:border-border prose-h2:pb-2
  prose-p:leading-7 prose-p:text-muted-foreground
  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
  prose-blockquote:border-l-primary prose-blockquote:bg-muted/30
  prose-code:bg-muted prose-code:rounded-md prose-code:px-1.5
"
```

### Sidebar Active States
```tsx
// Active item styling:
"bg-primary/10 text-primary font-medium border-l-2 border-primary"

// Hover states:
"hover:bg-accent/50 hover:text-foreground transition-all duration-200"
```

### Card Hover Effects
```tsx
// Stripe-style gradient border on hover:
"group-hover:shadow-lg group-hover:shadow-primary/5 group-hover:-translate-y-0.5"
```

---

## 6. Implementation Order

1. **Dependencies** - Install shiki, @tailwindcss/typography
2. **Hooks** - Create useShikiHighlighter.ts, useExtractHeadings.ts
3. **CodeBlock** - Build component with syntax highlighting + copy
4. **DocsContent** - Integrate CodeBlock, add prose enhancements
5. **TableOfContents** - Build TOC with scroll tracking
6. **DocsLayout** - Update to three-column layout
7. **DocsSidebar** - Add visual polish and active states
8. **DocsSearch** - Build search with cmdk integration
9. **DocsHero** - Create hero section
10. **DocsHomeCard** - Add hover effects
11. **Docs.tsx** - Integrate hero and search

---

## 7. Verification

1. `npm run dev` and navigate to `/docs`
2. Verify hero section displays with gradient and search button
3. Press Ctrl+K - verify search dialog opens
4. Navigate to `/docs/api/hooks` - verify:
   - Code blocks have syntax highlighting (colors)
   - Copy button appears on hover
   - TOC appears on right side
   - Active heading highlights in TOC as you scroll
5. Verify sidebar active states work correctly
6. Test on mobile - TOC should hide, sidebar should collapse
7. `npm run build` - verify no errors
