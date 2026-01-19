# Projects Section Refactor Plan

## User Requirements Summary

| Aspect | Decision |
|--------|----------|
| **Goals** | Stand out visually + Tell better stories |
| **Audience** | Hiring managers + Freelance clients |
| **Portfolio Type** | Mixed (dev, design, strategy) |
| **Project Count** | 10+ projects |
| **Visual Style** | Immersive & 3D |
| **3D Priority** | Hero animations |
| **Case Study Gaps** | Visual artifacts, metrics, technical depth |
| **Metrics Status** | Need to gather |
| **Approach** | Quick wins first |

---

## Phase 1: Quick Wins (Highest Impact, Lowest Effort)

### 1.1 Hero Metrics Badge on Project Cards
Add prominent metric overlay on cards (e.g., "382% increase", "50K users").

**Files:**
- `src/app/(public)/projects/page.tsx` - Add metric badge to card
- `src/types/index.ts` - Add `featured_metric` field

**Implementation:**
```typescript
// Add to Project type
featured_metric?: { value: string; label: string; };
```

### 1.2 Live Demo + GitHub Above the Fold
Make action links always visible, not just on hover.

**Files:**
- `src/app/(public)/projects/page.tsx` - Add visible icons in card corner
- `src/app/(public)/projects/[slug]/page.tsx` - Move CTAs inline with title

### 1.3 Tech Stack Filter Enhancement
Add filterable tech tags beyond category (web/design/app).

**Files:**
- `src/app/(public)/projects/page.tsx` - Add tech filter chips row

### 1.4 Featured Projects Hero Section
Large cards for 3-5 deep case studies at top, compact cards for rest.

**Files:**
- `src/app/(public)/projects/page.tsx` - Split featured vs. other projects

---

## Phase 2: Case Study Enhancement

### 2.1 Before/After Comparison Slider
Draggable image comparison component.

**New File:**
- `src/components/projects/BeforeAfterSlider.tsx`

**Modify:**
- `src/types/index.ts` - Add `before_after` to CaseStudySolution
- `src/app/admin/projects/[id]/case-study/page.tsx` - Add upload fields

### 2.2 Animated Metrics Display
Counting animations and progress bars for metrics.

**Files:**
- `src/components/projects/MetricsDisplay.tsx` - Add useSpring animations

### 2.3 Process Artifacts Gallery
Visual artifacts (sketches, wireframes, prototypes) per process step.

**New File:**
- `src/components/projects/ArtifactGallery.tsx`

**Modify:**
- `src/types/index.ts` - Extend `CaseStudyProcessStep` with `artifacts`
- `src/app/(public)/projects/[slug]/page.tsx` - Render artifacts

### 2.4 Technical Depth Section
Architecture decisions, challenges overcome, code walkthroughs.

**New File:**
- `src/components/projects/TechnicalSection.tsx`

**New Type:**
```typescript
export interface CaseStudyChallenge {
  title: string;
  problem: string;
  solution: string;
  code_snippet?: CaseStudyCodeSnippet;
}

export interface CaseStudyTechnical {
  architecture_diagram?: string;
  challenges?: CaseStudyChallenge[];
  key_decisions?: { decision: string; rationale: string; alternatives_considered?: string[]; }[];
}
```

### 2.5 Client Testimonial Integration
Link testimonials to specific case studies.

**Files:**
- `src/types/index.ts` - Add `testimonial_id` to CaseStudy
- `src/app/(public)/projects/[slug]/page.tsx` - Fetch and display testimonial

---

## Phase 3: 3D/Immersive Features

### 3.1 3D Hero Scene for Projects Page
Floating 3D project frames with parallax depth.

**New File:**
- `src/components/3d/ProjectsHeroScene.tsx`

**Modify:**
- `src/app/(public)/projects/page.tsx` - Import and render scene

**Pattern:** Follow `src/components/3d/HeroScene.tsx` with mobile optimization.

### 3.2 Scroll Progress Navigation
Sticky sidebar showing current case study section.

**New File:**
- `src/components/projects/CaseStudyNav.tsx`

### 3.3 Parallax Project Images
Depth effects on images using existing `Parallax` component.

**Files:**
- `src/app/(public)/projects/[slug]/page.tsx` - Wrap images with Parallax

### 3.4 Interactive Tech Stack Visualization
Animated floating tech icons.

**New File:**
- `src/components/projects/TechStackVisualization.tsx`

---

## Phase 4: Advanced Features (Optional)

### 4.1 AI-Generated Case Study Summaries
"TL;DR" card using Claude to summarize for skimmers.

**New File:**
- `src/app/api/generate-project-summary/route.ts`

**Modify:**
- `src/types/index.ts` - Add `ai_summary` to Project

### 4.2 Interactive Results Dashboard
Animated charts, comparison bars, sparklines.

**New File:**
- `src/components/projects/MetricsDashboard.tsx`

### 4.3 Team Collaboration Section
Show team context and your specific responsibilities.

**New Type:**
```typescript
export interface CaseStudyTeam {
  my_responsibilities: string[];
  team_members?: { name: string; role: string; avatar_url?: string; }[];
}
```

---

## Priority Matrix

| Feature | Impact | Effort | Phase |
|---------|--------|--------|-------|
| Hero Metrics Badge | High | Low | 1 |
| Live Demo/GitHub Prominence | High | Low | 1 |
| Tech Stack Filters | Medium | Low | 1 |
| Featured Projects Section | High | Medium | 1 |
| Before/After Slider | High | Medium | 2 |
| Animated Metrics | Medium | Low | 2 |
| Process Artifacts | High | Medium | 2 |
| Technical Section | High | Medium | 2 |
| 3D Projects Hero | High | High | 3 |
| Scroll Progress Nav | Medium | Medium | 3 |
| AI Summaries | Medium | Medium | 4 |

---

## Database Changes

```sql
ALTER TABLE projects ADD COLUMN featured_metric JSONB;
ALTER TABLE projects ADD COLUMN ai_summary TEXT;
```

Case study JSONB structure extends naturally (no migration needed).

---

## Critical Files

1. `src/app/(public)/projects/page.tsx` - Main listing
2. `src/app/(public)/projects/[slug]/page.tsx` - Detail page
3. `src/types/index.ts` - Type definitions
4. `src/components/ui/ScrollAnimations.tsx` - Animation utilities
5. `src/app/admin/projects/[id]/case-study/page.tsx` - Admin editor

---

## Verification

### Phase 1 Testing
1. Run `npm run dev`
2. Navigate to `/projects`
3. Verify metrics badges display on cards
4. Verify live/GitHub links visible without hover
5. Verify tech stack filters work
6. Verify featured projects appear in hero section

### Phase 2 Testing
1. Navigate to a project with case study
2. Verify before/after slider works (drag functionality)
3. Verify metrics animate on scroll
4. Verify artifacts gallery displays with lightbox
5. Verify technical section renders properly

### Phase 3 Testing
1. Verify 3D hero loads on projects page
2. Test mobile fallback (disable 3D on mobile)
3. Verify scroll navigation highlights current section
4. Verify parallax effects on project images

### E2E Tests
- Add feature to `e2e/feature_list.json`
- Create test spec in `e2e/tests/`
- Run `npm run test:e2e:feature "ID"`
