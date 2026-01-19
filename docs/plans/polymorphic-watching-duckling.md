# Plan: Connect Claude Code Export-Session to Prompt Flow

## Overview

Extend the `/export-session` skill to allow pushing sessions directly to Prompt Flow via API. This requires changes on both sides:
- **Prompt Flow**: API endpoints + API key management
- **Claude Code**: Skill updates with `--push` flag

## Architecture

```
Claude Code                    Prompt Flow
+------------------+          +------------------+
| /export-session  |  HTTP    | /api/v1/sessions |
| --push           | -------> | (Bearer auth)    |
| --post-id <id>   |          +------------------+
| --live           |  WS/SSE  | Supabase         |
+------------------+ -------> | Realtime         |
                              +------------------+
```

---

## Phase 1: Database Schema

### File: `supabase/migrations/002_api_keys.sql`

Add `api_keys` table:
- `id`, `user_id`, `name`, `key_hash`, `key_prefix`
- `last_used_at`, `expires_at`, `created_at`
- `rate_limit_per_minute` (default: 60)
- RLS policies for user-only access

---

## Phase 2: API Key Utilities

### File: `src/lib/utils/apiKeys.ts` (new)

- `generateApiKey()` - Creates `pf_<base64>` key, returns { key, hash, prefix }
- `hashApiKey(key)` - SHA-256 hash for storage
- `validateApiKeyFormat(key)` - Validates `pf_` prefix and length

### File: `src/lib/server/apiAuth.ts` (new)

- `validateApiKey(event)` - Extracts Bearer token, validates against DB
- Returns `{ authenticated, userId, error }`
- Updates `last_used_at` on successful auth

---

## Phase 3: API Endpoints

### File: `src/routes/api/v1/sessions/+server.ts` (new)

**POST /api/v1/sessions** - Push session
- Auth: API Key (Bearer token)
- Body: `{ session: ExportSessionJSON, postId?: string, createPost?: boolean, title?, visibility? }`
- Modes:
  1. `postId` provided → Add session to existing post
  2. `createPost: true` → Create new post with session
- Uses existing `importSession()` from sessionImporter.ts
- Returns: `{ success, postId, sessionId?, url }`

### File: `src/routes/api/v1/keys/+server.ts` (new)

**GET /api/v1/keys** - List user's API keys (requires session auth)
**POST /api/v1/keys** - Create new API key (returns raw key once)

### File: `src/routes/api/v1/keys/[id]/+server.ts` (new)

**DELETE /api/v1/keys/[id]** - Revoke API key

---

## Phase 4: Settings UI

### File: `src/routes/settings/+page.svelte` (modify)

Add new section after "Notifications":

**API Keys Section:**
- List existing keys (name, prefix, last used, created)
- "Create Key" button → modal with name input
- Show raw key ONCE after creation (copy button)
- Delete button for each key

**Claude Code Integration Section:**
- Setup instructions showing config format:
  ```json
  // ~/.claude/settings.json
  {
    "promptflow": {
      "apiKey": "pf_your_key_here",
      "url": "https://promptflow.app"
    }
  }
  ```

### File: `src/routes/settings/+page.server.ts` (new)

- Load user's API keys on page load
- Form actions for create/delete keys

---

## Phase 5: Claude Code Skill Updates

### File: `.claude/commands/export-session.md` (modify)

Add new section "## Push to Prompt Flow":

**New Flags:**
- `--push` - Push to Prompt Flow instead of saving locally
- `--post-id <id>` - Add to existing post (requires --push)

**New Interactive Wizard Question (after Step 5):**
- "Where should this session go?"
- Options: "Save locally", "Push to Prompt Flow (new post)", "Push to Prompt Flow (existing post)"

**Push Behavior:**
1. Read config from `~/.claude/settings.json`
2. Generate JSON export (existing Step 3-5)
3. POST to `{url}/api/v1/sessions` with Bearer auth
4. Display result URL or error message

---

## Phase 6: Live Sessions

### File: `supabase/migrations/003_live_sessions.sql`

Add `live_sessions` table for real-time streaming:
- `id`, `user_id`, `post_id` (nullable until finalized)
- `session_token` (unique identifier for the stream)
- `status` ('active', 'paused', 'completed')
- `conversation` (JSONB - updated in real-time)
- `metadata` (JSONB - name, project, etc.)
- `expires_at` (24h default)
- `created_at`, `updated_at`

### File: `src/routes/api/v1/live/+server.ts` (new)

**POST /api/v1/live** - Start live session
- Creates live_sessions record
- Returns `{ sessionToken, viewUrl }`

**PATCH /api/v1/live/[token]** - Update live session
- Appends conversation turns
- Broadcasts via Supabase Realtime

**POST /api/v1/live/[token]/complete** - End live session
- Sets status to 'completed'
- Optionally creates post from session

### File: `src/routes/live/[token]/+page.svelte` (new)

Live session viewer page:
- Subscribes to Supabase Realtime channel
- Displays conversation updating in real-time
- Shows "Live" indicator while active
- ConversationViewer component in streaming mode

### Skill Updates for Live Mode:

**New Flag:** `--live`
- Starts streaming session immediately
- Each prompt/response pushes update to API
- Displays shareable URL: `https://promptflow.app/live/abc123`
- On session end, prompts: "Save as post?" or "Discard"

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/002_api_keys.sql` | Create | API keys table |
| `supabase/migrations/003_live_sessions.sql` | Create | Live sessions table |
| `src/lib/types/database.ts` | Modify | Add ApiKey + LiveSession types |
| `src/lib/utils/apiKeys.ts` | Create | Key generation/hashing |
| `src/lib/server/apiAuth.ts` | Create | API auth middleware |
| `src/routes/api/v1/sessions/+server.ts` | Create | Session push endpoint |
| `src/routes/api/v1/keys/+server.ts` | Create | Key CRUD endpoints |
| `src/routes/api/v1/keys/[id]/+server.ts` | Create | Key delete endpoint |
| `src/routes/api/v1/live/+server.ts` | Create | Live session start |
| `src/routes/api/v1/live/[token]/+server.ts` | Create | Live session update/complete |
| `src/routes/live/[token]/+page.svelte` | Create | Live viewer page |
| `src/routes/live/[token]/+page.server.ts` | Create | Live viewer data loading |
| `src/routes/settings/+page.svelte` | Modify | API keys UI |
| `src/routes/settings/+page.server.ts` | Create | Settings server logic |
| `.claude/commands/export-session.md` | Modify | Add --push and --live flags |

---

## Implementation Order

1. **Database**: Create migrations for `api_keys` and `live_sessions` tables
2. **Types**: Add ApiKey and LiveSession interfaces to database.ts
3. **Utilities**: Create apiKeys.ts and apiAuth.ts
4. **API Routes - Auth**: Create keys endpoints (CRUD)
5. **API Routes - Push**: Create sessions endpoint (push)
6. **API Routes - Live**: Create live session endpoints (start/update/complete)
7. **Settings UI**: Add API key management to settings page
8. **Live Viewer**: Create live session viewer page with Realtime subscription
9. **Skill**: Update export-session.md with --push and --live flags
10. **Testing**: End-to-end test of push and live flows

---

## Security Considerations

- API keys hashed with SHA-256 before storage
- Raw key shown only once at creation
- Rate limiting (60 req/min default)
- Key expiration support
- RLS policies restrict key access to owner
- All API calls require HTTPS
