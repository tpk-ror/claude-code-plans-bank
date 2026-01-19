# Cinematic Storyboard Animation Experience

## Overview
Replace the current grid-based storyboard detail page with a full-width, scroll-driven cinematic experience inspired by [Scrollsequence](https://scrollsequence.com/).

## User Requirements
- **View mode**: Replace current view (cinematic is default)
- **UI elements**: Caption overlay + navigation dots
- **Entry**: Title card intro with "scroll to begin" prompt
- **Transitions**: Crossfade between screenshots
- **Ending**: End card with CTA (links to other storyboards/contact)
- **Mobile**: Touch-optimized with swipe gestures
- **Implementation**: GSAP ScrollTrigger
- **Extras**: Keep it simple (no additional features)

---

## Implementation Plan

### 1. Install Dependency
```bash
npm install gsap
```

### 2. File Structure
```
src/
├── app/(public)/storyboards/[slug]/
│   ├── page.tsx                    # MODIFY: Pass data to new client component
│   └── CinematicStoryboard.tsx     # NEW: Main scroll experience orchestrator
└── components/storyboards/         # NEW: Directory
    ├── TitleCard.tsx               # Title intro with "scroll to begin"
    ├── ScreenshotFrame.tsx         # Full-viewport screenshot + caption
    ├── NavigationDots.tsx          # Clickable dots (right side desktop, bottom mobile)
    └── EndCard.tsx                 # CTA with links to other storyboards
```

### 3. Component Details

#### A. `page.tsx` (Modify)
- Keep existing server-side data fetching
- Fetch 3 other public storyboards for EndCard
- Pass all data to `CinematicStoryboard` client component

#### B. `CinematicStoryboard.tsx` (New - ~300-400 lines)
- Register GSAP ScrollTrigger
- Preload first 3 images before showing content (loading screen)
- Create scroll container: `height: (screenshots.length + 2) * 100vh`
- Configure ScrollTrigger for crossfade transitions between panels
- Handle touch gestures for mobile swipe navigation
- Keyboard navigation (arrow keys, spacebar, Home/End)
- Reduced motion support (`prefers-reduced-motion`)

#### C. `TitleCard.tsx` (New)
- Full viewport height
- Session name, description, tags
- Screenshot count
- Animated "scroll to begin" indicator with bouncing chevron

#### D. `ScreenshotFrame.tsx` (New)
- Full viewport screenshot display
- Caption overlay at bottom (fades in/out based on scroll position)
- Handles image object-fit for different aspect ratios

#### E. `NavigationDots.tsx` (New)
- Fixed position: right side on desktop, bottom on mobile
- Clickable dots with active state
- Smooth scroll to index on click
- ARIA labels for accessibility

#### F. `EndCard.tsx` (New)
- "Thanks for viewing" message
- Grid of 3 other storyboard cards
- Contact CTA button
- Back to storyboards link

### 4. Technical Implementation

**Scroll Structure:**
```
[Title Card - 100vh, fades out on scroll]
[Screenshot 1 - 100vh, crossfades to next]
[Screenshot 2 - 100vh, crossfades to next]
...
[Screenshot N - 100vh, crossfades to end]
[End Card - 100vh]
```

**GSAP ScrollTrigger Config:**
- Each screenshot panel triggers crossfade animation
- `scrub: true` for scroll-linked animation
- Update current index for navigation dots
- Smooth programmatic scroll with `gsap.to(window, { scrollTo: y })`

**Image Preloading:**
- Show loading screen until first 3 images loaded
- Continue loading remaining images in background (staggered)

**Mobile Touch:**
- Detect vertical swipes > 100px for quick navigation
- Let ScrollTrigger handle normal scroll behavior

**Accessibility:**
- Skip link to end of storyboard
- ARIA labels on navigation dots
- Live region announcing current screenshot
- Keyboard navigation support
- Reduced motion support

---

## Implementation Sequence

1. Install GSAP package
2. Create `/src/components/storyboards/` directory
3. Create `TitleCard.tsx`
4. Create `NavigationDots.tsx`
5. Create `ScreenshotFrame.tsx`
6. Create `EndCard.tsx`
7. Create `CinematicStoryboard.tsx` (orchestrator)
8. Modify `page.tsx` to use new component
9. Test on desktop and mobile
10. Update docs (`/docs/COMPONENTS.md`, `/docs/FEATURES.md`)

---

## Critical Files
| File | Action |
|------|--------|
| `src/app/(public)/storyboards/[slug]/page.tsx` | Modify |
| `src/app/(public)/storyboards/[slug]/CinematicStoryboard.tsx` | Create |
| `src/components/storyboards/TitleCard.tsx` | Create |
| `src/components/storyboards/ScreenshotFrame.tsx` | Create |
| `src/components/storyboards/NavigationDots.tsx` | Create |
| `src/components/storyboards/EndCard.tsx` | Create |
| `src/types/index.ts` | Reference (no changes) |

---

## Verification
1. Run `npm run dev` and navigate to `/storyboards/[slug]`
2. Verify title card displays with "scroll to begin"
3. Scroll through screenshots - verify crossfade transitions
4. Test navigation dots - clicking jumps to correct screenshot
5. Verify captions fade in/out correctly
6. Test end card displays with other storyboards and CTA
7. Test on mobile - verify touch swipe works
8. Test keyboard navigation (arrows, spacebar, Home/End)
9. Test with `prefers-reduced-motion` enabled
10. Run `npm run build` to verify no build errors
