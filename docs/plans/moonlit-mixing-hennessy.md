# Resume Builder Implementation Plan

## Overview
Build an ATS-optimized resume builder that pulls from existing `/experience` data, supports inline editing, multiple saved resumes, and exports to PDF/Word formats optimized for applicant tracking systems.

## Core User Flow

```
1. Create New Resume
   └── Select experiences, projects, skills to include (from existing DB records)
   └── Optionally add education

2. Target a Job (Optional but recommended)
   └── Enter job URL → System scrapes job posting
   └── See Match Score (0-100%) showing how well resume fits
   └── View missing keywords and suggestions

3. AI Tailor (One-click optimization)
   └── Claude rewrites experience bullets to include job keywords
   └── User can accept/reject/edit suggestions

4. Cover Letter
   └── Generate custom cover letter based on job requirements
   └── Inline editing before export

5. Export & Apply
   └── Download PDF or Word (ATS-optimized)
   └── Track application in Application Tracker (status, notes, timeline)
```

## Current State
Your codebase already has:
- **Experience type** with company, role, dates, description, highlights (`src/types/index.ts:59-69`)
- **React-PDF generation** via `ResumeDocument.tsx` (`src/components/resume/`)
- **Resume types**: `ResumeTemplate`, `ResumeLayoutConfig`, `ResumeGeneration`
- **Brand-matched resume system** with HTML generation

## Open-Resume Library Analysis
- **Tech stack**: TypeScript, React, Redux, Tailwind, Next.js 13, React-PDF (same as yours!)
- **Key features**: ATS-optimized formatting, real-time preview, resume parsing
- **License**: AGPL-3.0 (requires attribution, derivative works must be open-source)
- **Recommendation**: Adopt patterns/principles rather than direct integration due to license

---

## Database Schema

### New Tables

```sql
-- User's saved resumes with custom content
CREATE TABLE user_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,

  -- Target job information
  company_link_id UUID REFERENCES company_links(id) ON DELETE SET NULL,
  target_job_title VARCHAR(255),
  target_company VARCHAR(255),
  job_url TEXT,

  -- Template selection
  template_id UUID REFERENCES resume_templates(id),

  -- Custom content overrides (editable per resume)
  profile_overrides JSONB DEFAULT '{}',
  experience_overrides JSONB DEFAULT '{}',
  project_overrides JSONB DEFAULT '{}',
  custom_skills TEXT[] DEFAULT '{}',

  -- Section configuration
  sections_enabled JSONB DEFAULT '{"summary":true,"experience":true,"projects":true,"skills":true,"education":true}',
  sections_order TEXT[] DEFAULT ARRAY['summary','experience','projects','skills','education'],

  -- Selected items (which records to include)
  selected_experience_ids UUID[] DEFAULT '{}',
  selected_project_ids UUID[] DEFAULT '{}',
  selected_skill_ids UUID[] DEFAULT '{}',

  -- ATS optimization data
  ats_score INTEGER,
  ats_keywords TEXT[],
  ats_missing_keywords TEXT[],
  ats_suggestions JSONB DEFAULT '[]',

  -- Generated outputs
  generated_pdf_url TEXT,
  generated_docx_url TEXT,
  last_generated_at TIMESTAMPTZ,

  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Education table (new - not in current schema)
CREATE TABLE education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution VARCHAR(255) NOT NULL,
  degree VARCHAR(255) NOT NULL,
  field_of_study VARCHAR(255),
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  gpa DECIMAL(3,2),
  achievements TEXT[],
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resume export tracking
CREATE TABLE resume_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_resume_id UUID NOT NULL REFERENCES user_resumes(id) ON DELETE CASCADE,
  export_type VARCHAR(10) NOT NULL, -- 'pdf' or 'docx'
  file_url TEXT,
  ats_score_at_export INTEGER,
  exported_at TIMESTAMPTZ DEFAULT NOW()
);

-- Application tracker
CREATE TABLE job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_resume_id UUID REFERENCES user_resumes(id) ON DELETE SET NULL,
  cover_letter_id UUID REFERENCES generated_cover_letters(id) ON DELETE SET NULL,
  company_name VARCHAR(255) NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  job_url TEXT,
  job_requirements JSONB,
  status VARCHAR(50) DEFAULT 'draft', -- draft, applied, interviewing, rejected, offer
  match_score INTEGER,
  applied_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cover letters (extends existing generated_cover_letters)
-- Add inline_edits column to store user modifications
ALTER TABLE generated_cover_letters ADD COLUMN IF NOT EXISTS
  inline_edits TEXT,
  job_url TEXT,
  match_score INTEGER;
```

---

## Component Architecture

```
src/components/resume/
├── ResumeDocument.tsx          # EXISTING - Enhance for ATS
├── builder/                    # NEW
│   ├── ResumeBuilder.tsx       # Main orchestrator (3-panel layout)
│   ├── ResumeCanvas.tsx        # Live PDF preview
│   ├── ResumeSidebar.tsx       # Section selection & reordering
│   │
│   ├── sections/               # Editable section components
│   │   ├── SummaryEditor.tsx
│   │   ├── ExperienceEditor.tsx
│   │   ├── ProjectsEditor.tsx
│   │   ├── SkillsEditor.tsx
│   │   └── EducationEditor.tsx
│   │
│   ├── inline/                 # Inline editing primitives
│   │   ├── InlineText.tsx
│   │   ├── BulletList.tsx
│   │   └── DateRange.tsx
│   │
│   └── ats/                    # ATS optimization
│       ├── ATSScorePanel.tsx
│       ├── KeywordMatcher.tsx
│       └── SuggestionsList.tsx
│
└── export/                     # Export functionality
    ├── PDFExporter.tsx
    └── DocxExporter.tsx
```

---

## Implementation Phases

### Phase 1: Database & Types
1. Create migration `xxx_resume_builder.sql`
2. Add TypeScript interfaces to `src/types/index.ts`:
   - `UserResume`
   - `Education`
   - `ATSScore`, `ATSSuggestion`
   - `ExperienceOverride`, `ProfileOverride`
3. Update `docs/DATABASE.md`

### Phase 2: Core Resume Builder UI
1. Create `ResumeBuilder.tsx` - 3-panel layout:
   - Left: Section list with checkboxes & drag-to-reorder
   - Center: Live preview (rendered PDF)
   - Right: ATS score & suggestions
2. Create section editors that:
   - Load from existing experience/projects/skills
   - Allow inline text editing
   - Save overrides to `user_resumes` table

### Phase 3: Experience Integration
1. Fetch all experience records on builder load
2. Display checkboxes to select which experiences to include
3. Map Experience type to resume format:
   ```typescript
   function mapExperienceToResume(exp: Experience, override?: ExperienceOverride) {
     return {
       company: override?.company ?? exp.company,
       role: override?.role ?? exp.role,
       dates: formatDateRange(exp.start_date, exp.end_date, exp.is_current),
       description: override?.description ?? exp.description,
       highlights: override?.highlights ?? exp.highlights,
     };
   }
   ```

### Phase 4: API Routes
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/resumes` | GET/POST | List/create resumes |
| `/api/resumes/[id]` | GET/PATCH/DELETE | CRUD operations |
| `/api/resumes/[id]/export` | POST | Generate PDF or DOCX |
| `/api/resumes/[id]/ats-score` | GET | Calculate ATS score |
| `/api/analyze-job-ats` | POST | Extract keywords from job posting |

### Phase 5: ATS Optimization
1. **Keyword extraction**: Use Claude to analyze job posting and extract required skills/keywords
2. **Score calculation**:
   - Keywords match: 40%
   - Formatting compliance: 25%
   - Readability: 20%
   - Completeness: 15%
3. **Suggestions**: Generate actionable items like "Add 'React' to skills section"

### Phase 6: Export Functionality
1. **PDF**: Enhance existing React-PDF with ATS-optimized styles:
   - Single column layout (ATS reads left-to-right)
   - Standard fonts (Helvetica/Arial)
   - Clear section headers
   - No tables/columns/graphics
2. **Word (.docx)**: Add `docxtemplater` + `pizzip`:
   ```bash
   npm install docxtemplater pizzip
   ```
   Create ATS-friendly Word template in `/public/templates/`

### Phase 7: Admin Pages
1. Update `/admin/resume/page.tsx` - Resume list dashboard
2. Create `/admin/resume/[id]/page.tsx` - Builder interface
3. Add education management to admin

---

## ATS Optimization Best Practices (Built-in)

1. **Formatting**:
   - Single column layout
   - Standard fonts (Helvetica, Arial, Times New Roman)
   - No headers/footers (ATS often ignores them)
   - No tables, text boxes, or graphics
   - Standard bullet points (•)

2. **Content**:
   - Use standard section headings (Experience, Skills, Education)
   - Include keywords from job description verbatim
   - Quantify achievements where possible
   - Use industry-standard job titles

3. **File format**:
   - PDF as primary (preserves formatting)
   - DOCX as fallback (some ATS prefer it)

---

## Additional Features (Included in Build)

### 1. AI Resume Tailor
Automatically rewrite experience descriptions to match job requirements using Claude.
- Input: Job URL + selected experiences
- Output: Tailored bullet points with matched keywords
- One-click "Optimize for this job" button
- **Value**: Saves hours of manual rewriting

### 2. Custom Cover Letters
Generate tailored cover letters based on job URL input.
- Scrape job posting to understand requirements
- Generate cover letter that addresses specific job needs
- Multiple format options (formal, modern, casual)
- Inline editing before export
- **Value**: Personalized cover letters in seconds

### 3. Application Tracker
Track which resume version was sent to which company.
- Status tracking (draft, applied, interviewing, rejected, offer)
- Link resumes to specific job applications
- Timeline view of application history
- Notes field for each application
- **Value**: Full job search management

### 4. Job URL Match Scoring
Central feature - when user inputs a job URL:
- Scrape and analyze job posting requirements
- Calculate match score (0-100%) showing how well resume fits
- Highlight missing keywords and skills
- Suggest specific changes to improve score
- **Value**: Know exactly how competitive your resume is

---

## Job URL Integration (Core Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Resume Builder                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Target Job (Optional)                                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ https://jobs.lever.co/anthropic/senior-engineer           │ │
│  └────────────────────────────────────────────────────────────┘ │
│  [Analyze Job]                                                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Job Analysis Results                                      │   │
│  │ Company: Anthropic | Role: Senior Engineer               │   │
│  │                                                           │   │
│  │ Your Match Score: 72%  ████████░░                        │   │
│  │                                                           │   │
│  │ Missing Keywords:                                         │   │
│  │ • "distributed systems" - Add to experience description  │   │
│  │ • "Python" - Add to skills section                       │   │
│  │ • "ML pipelines" - Mention in project descriptions       │   │
│  │                                                           │   │
│  │ [AI Tailor Resume] [Generate Cover Letter]               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Job Analysis API Enhancement

Extend existing `/api/scrape-job` to return ATS-relevant data:

```typescript
interface JobAnalysisResponse {
  success: boolean;
  data?: {
    company_name: string;
    job_title: string;
    // Existing fields...

    // New ATS fields
    required_keywords: string[];      // Must-have skills/terms
    preferred_keywords: string[];     // Nice-to-have
    experience_level: 'entry' | 'mid' | 'senior' | 'lead';
    years_required: number | null;
    education_requirements: string[];
    industry_keywords: string[];      // Industry-specific terms
  };
}
```

---

## Future Considerations (Not in Initial Build)

### Resume Version History
Track all changes with ability to restore previous versions.
- Git-like versioning for resume content
- Compare versions side-by-side

### LinkedIn Profile Import
Parse LinkedIn profile to auto-populate resume sections.
- Use LinkedIn public profile scraping or manual paste
- Map LinkedIn sections to resume format

---

## Critical Files to Modify

| File | Changes |
|------|---------|
| `src/types/index.ts` | Add UserResume, Education, ATS types |
| `src/components/resume/ResumeDocument.tsx` | Add ATS-optimized styles, education section |
| `src/app/admin/resume/page.tsx` | Transform to multi-resume dashboard |
| `supabase/migrations/` | New migration for tables |
| `docs/DATABASE.md` | Document new schema |
| `docs/FEATURES.md` | Document resume builder feature |

## New Files to Create

| File | Purpose |
|------|---------|
| `src/components/resume/builder/ResumeBuilder.tsx` | Main builder component |
| `src/components/resume/builder/sections/*.tsx` | Section editors |
| `src/components/resume/builder/JobAnalyzer.tsx` | Job URL input + match scoring |
| `src/components/resume/builder/AITailor.tsx` | AI resume optimization |
| `src/components/resume/export/DocxExporter.tsx` | Word export |
| `src/components/cover-letter/CoverLetterEditor.tsx` | Cover letter with inline editing |
| `src/components/applications/ApplicationTracker.tsx` | Application status board |
| `src/app/api/resumes/route.ts` | Resume CRUD API |
| `src/app/api/resumes/[id]/export/route.ts` | Export API |
| `src/app/api/resumes/[id]/tailor/route.ts` | AI tailoring API |
| `src/app/api/applications/route.ts` | Application tracker API |
| `src/app/admin/resume/[id]/page.tsx` | Builder page |
| `src/app/admin/applications/page.tsx` | Application tracker page |
| `src/app/admin/education/page.tsx` | Education management |
| `public/templates/ats-resume.docx` | Word template |

---

## Verification Plan

1. **Unit tests**: Test ATS score calculation, keyword matching
2. **Integration tests**: Test export endpoints with sample data
3. **Manual testing**:
   - Create resume with 4 experiences
   - Inline edit descriptions
   - Export to PDF and DOCX
   - Upload exports to ATS tools (Greenhouse test, Lever test) to verify parsing
4. **ATS validation**: Use free ATS checkers to validate output format

---

## Dependencies to Add

```bash
npm install docxtemplater pizzip  # Word export
```

## Estimated Scope
- Database: 1 migration file
- Types: ~100 lines
- Components: ~15 new files
- API routes: 5 new endpoints
- Admin pages: 2 new pages
