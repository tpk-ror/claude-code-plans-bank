# PromptFlow - Implementation Plan

> A web app for sharing Claude Code conversations and project builds, helping developers learn from each other.

## Tech Stack
- **Framework:** SvelteKit
- **Database/Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Auth:** Anonymous browsing + optional signup (magic link + GitHub OAuth)
- **Styling:** Tailwind CSS + dark/light mode toggle
- **Deployment:** Vercel

## Core Features

### 1. Conversation Import & Viewing
- **Import methods:** JSON file upload (Claude Code export) + markdown paste
- **Multi-conversation support:** Import multiple conversations as one project
  - Conversations shown as chapters/sessions
  - Navigation between sessions
  - Unified mind map spanning all sessions
  - Drag-and-drop to reorder sessions
- **Viewing modes:**
  - **Scroll view:** Traditional scrollable conversation
  - **Timeline scrubber:** Slider to jump to any point, see all messages up to that point
- Syntax highlighting for code blocks (Shiki)
- Collapsible sections for long outputs
- **Keyboard shortcuts:**
  - `←/→` Navigate messages
  - `c` Copy code block
  - `f` Toggle fullscreen
  - `t` Toggle view mode
  - `Esc` Exit fullscreen

### 2. Project Showcase (Posts)
Each post includes:
- Title, description (markdown)
- The Claude Code conversation
- Screenshots/images of the result
- Links (GitHub repo, live demo)
- Category (predefined) + custom tags

### 3. Discovery & Learning
- Browse by category (Website, Mobile App, CLI Tool, API, Library, etc.)
- Full-text search (title, description, tags)
- Sort by: newest, most liked, trending
- Filter by tags

### 4. Social Features
- **Likes** on posts
- **Comments** on posts (threaded)
- **Q&A Section** (Stack Overflow style) - questions users can ask the author
- User profiles

### 5. Collections (Playlists)
Users can curate posts into themed collections (e.g., "Building a SaaS from scratch")
- **Public collections:** Visible to everyone, great for curation/discovery
- **Private collections:** Personal bookmarks, only visible to owner
- Add/remove posts from collections
- Reorder posts within a collection
- Collection cover image (optional)
- Browse popular collections on discovery page

### 6. Fork/Remix Posts
Users can fork existing posts to build on someone else's work:
- **Fork button** on any post
- Creates a copy linked to the original
- Shows "Forked from [original]" attribution
- Fork tree visualization (see all derivatives)
- Original author gets notification of forks
- Forked post can be edited and extended
- Tracks fork lineage for discovery

### 7. Direct Claude Code Integration (Future)
- Auth with PromptFlow from Claude Code
- `/export-session --to promptflow` command
- Direct publish without file download/upload
- Auto-populate metadata from session

### 8. Planning Mind Map Visualization
When a conversation includes planning mode, show an interactive visualization of the decision-making process.

**Features:**
- **Interactive mind map:** Zoomable, expandable nodes showing decisions branching out
- **Toggle view:** Switch between conversation view and mind map view
- **Content extracted:**
  - Decision points (questions asked, options considered)
  - Chosen path (highlighted) vs rejected paths (dimmed)
  - Code/file changes at each step
  - Final outcomes and deliverables

**Node types in mind map:**
- 🎯 **Goal node:** What the user wanted to achieve
- ❓ **Decision node:** A question or choice point
- ✅ **Chosen option:** The path taken
- 💭 **Rejected option:** Alternatives that weren't chosen (dimmed)
- 📄 **File change:** Files created/modified
- 🏁 **Outcome:** Final result or deliverable

**Visualization library:** `@xyflow/svelte` (React Flow for Svelte) or `d3.js`

---

## Project Structure

```
prompt-flow/
├── src/
│   ├── app.html
│   ├── app.css                     # Tailwind
│   ├── hooks.server.ts             # Supabase auth
│   │
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/                 # Button, Modal, Toast, etc.
│   │   │   ├── conversation/       # ConversationViewer, TimelineScrubber, CodeBlock
│   │   │   ├── mindmap/            # MindMapViewer, MindMapNode, MindMapEdge
│   │   │   ├── post/               # PostCard, PostForm, LikeButton
│   │   │   ├── import/             # JsonUploader, MarkdownPaster
│   │   │   ├── comments/           # CommentSection, CommentItem
│   │   │   ├── qa/                 # QuestionSection, QuestionItem, AnswerForm
│   │   │   ├── collections/        # CollectionCard, CollectionForm, AddToCollection
│   │   │   ├── search/             # SearchBar, FilterPanel
│   │   │   ├── user/               # UserAvatar, UserProfile
│   │   │   ├── theme/              # ThemeToggle, ThemeProvider
│   │   │   └── layout/             # Header, Footer, Nav
│   │   │
│   │   ├── server/                 # Supabase server client, auth helpers
│   │   ├── stores/                 # Auth, toast, preferences
│   │   ├── utils/                  # conversationParser, validators
│   │   ├── types/                  # TypeScript types
│   │   └── constants/              # Categories, config
│   │
│   └── routes/
│       ├── +layout.svelte
│       ├── +page.svelte            # Homepage (feed)
│       ├── auth/                   # Login/signup, callbacks
│       ├── post/
│       │   ├── new/                # Create post
│       │   └── [id]/               # View post (conversation + Q&A)
│       ├── category/[slug]/        # Posts by category
│       ├── collections/
│       │   ├── +page.svelte        # Browse collections
│       │   ├── new/                # Create collection
│       │   └── [id]/               # View collection
│       ├── search/                 # Search results
│       ├── user/[username]/        # User profile
│       └── api/                    # REST endpoints
│
├── supabase/
│   └── migrations/                 # Database schema
│
├── static/
├── svelte.config.js
├── tailwind.config.js
└── package.json
```

---

## Database Schema

> **Note:** Schema aligned with the [export-session skill](/.claude/export-session-skill-spec.md) JSON format for seamless import.

### Core Tables

```sql
-- Categories (predefined)
CREATE TABLE categories (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT,
    display_order INTEGER
);

-- User profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    username TEXT UNIQUE,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    github_url TEXT
);

-- Posts (aligned with export-session JSON format)
CREATE TABLE posts (
    id UUID PRIMARY KEY,
    author_id UUID REFERENCES profiles(id),
    category_id UUID REFERENCES categories(id),

    -- Core fields
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,

    -- From export-session metadata
    export_version TEXT DEFAULT '1.0.0',
    project_name TEXT,
    session_duration TEXT,
    exported_at TIMESTAMPTZ,
    elements_included TEXT[],        -- ['prompts', 'responses', 'files', 'commits']

    -- Registry metadata (from export-session)
    visibility TEXT DEFAULT 'public',
    languages TEXT[],                 -- ['typescript', 'python']
    frameworks TEXT[],                -- ['sveltekit', 'react']
    difficulty TEXT,                  -- 'beginner', 'intermediate', 'advanced'

    -- Links
    github_url TEXT,
    demo_url TEXT,

    -- Fork tracking
    forked_from_id UUID REFERENCES posts(id),
    fork_count INTEGER DEFAULT 0,

    -- Engagement
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    question_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    trending_score FLOAT DEFAULT 0,

    -- Status
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Search
    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(description, '')), 'B')
    ) STORED
);

-- Sessions/Conversations (multiple per post, matches export-session format)
CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    title TEXT,                       -- Optional session title
    position INTEGER NOT NULL,        -- Order within post

    -- From export-session JSON structure
    conversation JSONB NOT NULL,      -- Array of conversation turns
    /*
      Each turn follows export-session format:
      {
        "index": 1,
        "userPrompt": "...",
        "claudeResponse": "...",
        "timestamp": null,
        "actions": [
          { "type": "file_create", "path": "...", "content": "..." },
          { "type": "command", "command": "...", "exitCode": 0 },
          { "type": "git_commit", "hash": "...", "message": "..." },
          { "type": "question", "description": "..." }
        ]
      }
    */

    -- Session summary (from export-session)
    files_created JSONB,              -- [{ "path": "...", "content": "..." }]
    files_modified JSONB,             -- [{ "path": "...", "diff": "..." }]
    commands_run JSONB,               -- [{ "command": "...", "output": "..." }]
    commits_made JSONB,               -- [{ "hash": "...", "message": "..." }]

    -- Summary stats
    prompt_count INTEGER DEFAULT 0,
    files_created_count INTEGER DEFAULT 0,
    files_modified_count INTEGER DEFAULT 0,
    commands_run_count INTEGER DEFAULT 0,
    commits_made_count INTEGER DEFAULT 0,

    -- Security
    redaction_count INTEGER DEFAULT 0,
    redaction_patterns TEXT[],

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post images (screenshots)
CREATE TABLE post_images (
    id UUID PRIMARY KEY,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    alt_text TEXT,
    display_order INTEGER
);

-- Tags
CREATE TABLE tags (
    id UUID PRIMARY KEY,
    name TEXT UNIQUE,
    slug TEXT UNIQUE,
    usage_count INTEGER DEFAULT 0
);

CREATE TABLE post_tags (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Likes
CREATE TABLE likes (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- Comments (threaded)
CREATE TABLE comments (
    id UUID PRIMARY KEY,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id),
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Collections Tables

```sql
-- Collections (playlists)
CREATE TABLE collections (
    id UUID PRIMARY KEY,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    is_public BOOLEAN DEFAULT true,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts in collections (junction with ordering)
CREATE TABLE collection_posts (
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,  -- For ordering posts in collection
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (collection_id, post_id)
);
```

### Q&A Tables (Stack Overflow Style)
- Anyone can answer questions (community-driven knowledge)
- No reputation system (keeping it simple)

```sql
-- Questions on posts
CREATE TABLE questions (
    id UUID PRIMARY KEY,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    vote_count INTEGER DEFAULT 0,
    answer_count INTEGER DEFAULT 0,
    is_answered BOOLEAN DEFAULT false,
    accepted_answer_id UUID,  -- Set when author accepts an answer
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Answers to questions
CREATE TABLE answers (
    id UUID PRIMARY KEY,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id),
    body TEXT NOT NULL,
    vote_count INTEGER DEFAULT 0,
    is_accepted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes on questions and answers
CREATE TABLE qa_votes (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    question_id UUID REFERENCES questions(id),
    answer_id UUID REFERENCES answers(id),
    vote_type SMALLINT NOT NULL,  -- 1 = upvote, -1 = downvote
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT one_target CHECK (
        (question_id IS NOT NULL AND answer_id IS NULL) OR
        (question_id IS NULL AND answer_id IS NOT NULL)
    ),
    UNIQUE(user_id, question_id),
    UNIQUE(user_id, answer_id)
);
```

---

## Key Components

### ConversationViewer
- Parses Claude Code JSON/markdown exports
- Two modes: step-by-step (tutorial) or scroll (full view)
- Syntax highlighting via Shiki
- Collapsible tool outputs
- Copy button on code blocks

### Q&A Section (QuestionSection.svelte)
- List of questions on a post
- Sort by: newest, most votes, unanswered
- Each question shows vote count, answer count, accepted badge
- Click to expand answers
- Author can mark accepted answer (green checkmark)
- Voting buttons (up/down) for questions and answers

### PostForm
- Title, description (markdown editor)
- Category dropdown + tag input (autocomplete)
- JSON file upload OR markdown paste for conversation
- Image upload with drag-and-drop reordering
- Preview before publish

---

## Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/` | Homepage feed | No |
| `/auth` | Login/signup | No |
| `/post/new` | Create post | Yes |
| `/post/[id]` | View post + Q&A | No |
| `/post/[id]/edit` | Edit post | Yes (author) |
| `/post/[id]/questions` | All questions for post | No |
| `/post/[id]/questions/[qid]` | Single question + answers | No |
| `/category/[slug]` | Posts by category | No |
| `/collections` | Browse public collections | No |
| `/collections/new` | Create collection | Yes |
| `/collections/[id]` | View collection | No (if public) |
| `/search` | Search results | No |
| `/user/[username]` | User profile + collections | No |
| `/settings` | User settings | Yes |

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Initialize SvelteKit + Tailwind
- [ ] Set up Supabase (project, env vars)
- [ ] Create database schema (migrations)
- [ ] Implement auth (magic link + GitHub OAuth)
- [ ] Create layout components (Header, Nav, Footer)
- [ ] Build auth flow (login/logout)
- [ ] Implement dark/light theme toggle (CSS variables + localStorage)

### Phase 2: Conversation Import & Viewing
- [ ] Build conversation parser (JSON + markdown)
- [ ] Create JsonUploader component (drag-and-drop, multi-file)
- [ ] Create MarkdownPaster component
- [ ] Implement multi-conversation support (sessions/chapters)
- [ ] Build session navigator (tabs or sidebar)
- [ ] Build ConversationViewer with scroll mode
- [ ] Add timeline scrubber mode (slider + progressive reveal)
- [ ] Implement syntax highlighting (Shiki)
- [ ] Add collapsible sections, copy buttons
- [ ] Implement keyboard shortcuts (←/→, c, f, t, Esc)

### Phase 3: Post Creation & Management
- [ ] Build PostForm component
- [ ] Create ImageUploader (Supabase Storage)
- [ ] Build TagInput with autocomplete
- [ ] Implement post CRUD API
- [ ] Create PostCard component
- [ ] Build post detail page

### Phase 4: Discovery & Search
- [ ] Implement homepage feed with pagination
- [ ] Build category browsing
- [ ] Implement full-text search
- [ ] Add filter panel (category, tags)
- [ ] Implement sort options (newest, likes, trending)
- [ ] Set up trending score calculation

### Phase 5: Social Features (Likes + Comments)
- [ ] Build LikeButton with optimistic UI
- [ ] Implement like/unlike API
- [ ] Build CommentSection (threaded)
- [ ] Create CommentForm
- [ ] Build user profile pages

### Phase 6: Q&A System
- [ ] Build QuestionSection component
- [ ] Create AskQuestionForm
- [ ] Build QuestionItem with vote buttons
- [ ] Create AnswerForm
- [ ] Build AnswerItem with accept button
- [ ] Implement voting API (questions + answers)
- [ ] Add "accepted answer" functionality (author only)
- [ ] Question/answer notifications (optional)

### Phase 7: Fork/Remix
- [ ] Add fork_count and forked_from_id to posts schema
- [ ] Build ForkButton component
- [ ] Implement fork API (creates copy linked to original)
- [ ] Show "Forked from" attribution on forked posts
- [ ] Build fork tree visualization (see all derivatives)
- [ ] Update fork_count on original when forked
- [ ] Add "Forks" tab to post detail page

### Phase 8: Collections
- [ ] Build CollectionCard component
- [ ] Create CollectionForm (title, description, visibility)
- [ ] Build collection detail page
- [ ] Implement AddToCollection button/modal on posts
- [ ] Build drag-and-drop reordering for posts in collection
- [ ] Create collections browse page
- [ ] Add collections tab to user profile

### Phase 9: Mind Map Visualization
- [ ] Set up @xyflow/svelte or d3.js
- [ ] Build planning extractor utility (parse decisions from conversation)
- [ ] Create MindMapViewer component
- [ ] Implement node types (goal, decision, chosen, rejected, file, outcome)
- [ ] Build zoom/pan controls
- [ ] Add expand/collapse for branches
- [ ] Implement toggle between conversation and mind map views
- [ ] Handle multi-session mind maps (show session boundaries)

### Phase 10: Polish & Launch
- [ ] Responsive design
- [ ] Accessibility audit (a11y)
- [ ] Performance optimization (lazy loading, code splitting)
- [ ] Error handling, loading states
- [ ] SEO (meta tags, Open Graph, structured data)
- [ ] Set up Vercel project
- [ ] Configure environment variables
- [ ] Set up Supabase production project
- [ ] Configure custom domain
- [ ] Set up Supabase cron for trending score updates

---

## Dependencies

**Core:**
- `@supabase/supabase-js`, `@supabase/ssr`

**UI:**
- `tailwindcss`, `@tailwindcss/typography`
- `lucide-svelte` (icons)
- `bits-ui` or `melt-ui` (headless components)

**Markdown & Code:**
- `marked` or `svelte-markdown`
- `shiki` (syntax highlighting)

**Forms:**
- `sveltekit-superforms`, `zod`

**Utilities:**
- `date-fns`, `slugify`, `nanoid`

**Visualization:**
- `@xyflow/svelte` (interactive mind map / flow diagrams)
- `svelte-dnd-action` (drag-and-drop for reordering)

---

## Import/Export Format

### Importing from export-session skill

The app directly accepts JSON files generated by the `/export-session` Claude Code skill:

```typescript
// src/lib/utils/sessionImporter.ts

interface ExportSessionJSON {
  version: string;
  metadata: {
    name: string;
    exportedAt: string;
    duration: string;
    project: string;
    elements: string[];
    redactions: { count: number; patterns: string[] };
  };
  registry: {
    id: string | null;
    visibility: string;
    tags: string[];
    category: string | null;
    languages: string[];
    frameworks: string[];
    description: string | null;
  };
  conversation: Array<{
    index: number;
    userPrompt: string;
    claudeResponse: string;
    timestamp: string | null;
    actions: Array<{
      type: 'file_create' | 'file_modify' | 'command' | 'git_commit' | 'question';
      path?: string;
      content?: string;
      description?: string;
      command?: string;
      exitCode?: number;
      hash?: string;
      message?: string;
    }>;
  }>;
  files: { created: any[]; modified: any[] };
  commands: any[];
  commits: any[];
  summary: {
    promptCount: number;
    filesCreated: number;
    filesModified: number;
    commandsRun: number;
    commitsMade: number;
  };
}

// Import function maps export-session JSON to database schema
export function importSession(json: ExportSessionJSON): SessionInsert { ... }
```

### Import Flow
1. User uploads `.json` file from `/export-session` skill
2. System validates against expected schema
3. Auto-populates metadata (languages, frameworks, duration)
4. User adds title, description, screenshots
5. Publish to PromptFlow

---

## Critical Files to Create First

1. `supabase/migrations/001_initial_schema.sql` - All tables, indexes, RLS policies
2. `src/hooks.server.ts` - Supabase auth session management
3. `src/lib/utils/sessionImporter.ts` - Import export-session JSON format
4. `src/lib/utils/conversationParser.ts` - Parse/transform conversation data
5. `src/lib/utils/planningExtractor.ts` - Extract decisions for mind map
6. `src/lib/components/conversation/ConversationViewer.svelte` - Core conversation viewer
7. `src/lib/components/conversation/TimelineScrubber.svelte` - Slider navigation
8. `src/lib/components/mindmap/MindMapViewer.svelte` - Interactive mind map
9. `src/lib/components/post/ForkButton.svelte` - Fork functionality
10. `src/lib/stores/theme.ts` - Dark/light mode state
