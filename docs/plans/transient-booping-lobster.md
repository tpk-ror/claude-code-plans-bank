# Claude Code ↔ PromptFlow Integration Plan

## Goal
Enable one-command export of Claude Code sessions to PromptFlow, with optional real-time live streaming for others to watch coding sessions.

## Architecture Decision

**Hybrid approach using Skills + Hooks:**
- **Skill** (`/export-session --push`) for manual export
- **Stop Hook** for automatic post-session sync
- **PostToolUse Hook** for real-time live streaming

This is optimal because:
1. Skills give user control and interactive options
2. Hooks provide zero-friction automation
3. Both use the same transformer code

---

## Implementation Phases

### Phase 1: JSONL Transformer (Core)
Create Node.js script to transform Claude Code's JSONL format to PromptFlow's ExportSessionJSON format.

**Create:** `~/.claude/hooks/lib/jsonl-to-export.js`

Key transformations:
- Parse JSONL lines from `~/.claude/projects/*/agent-*.jsonl`
- Group user/assistant pairs into conversation turns
- Extract tool calls (Write, Edit, Bash) as actions
- Calculate summary stats (files created, commands run, etc.)
- Apply redaction patterns for secrets

**Input format (JSONL):**
```json
{"type":"user","message":{"role":"user","content":"..."},"timestamp":"..."}
{"type":"assistant","message":{"role":"assistant","content":[...]}}
```

**Output format:** `ExportSessionJSON` (defined in `src/lib/utils/sessionImporter.ts:19-56`)

---

### Phase 2: Configuration
Add PromptFlow config to Claude Code settings.

**Edit:** `~/.claude/settings.json`

```json
{
  "promptflow": {
    "apiKey": "pf_xxx",
    "url": "https://promptflow.app",
    "autoStream": false,
    "streamMode": "after_session",
    "visibility": "public"
  }
}
```

---

### Phase 3: Manual Push (Skill Implementation)
The skill spec already exists at `.claude/commands/export-session.md` with `--push` and `--live` flags documented. Implementation needs to:

1. Read config from `~/.claude/settings.json`
2. Call transformer to convert current session
3. POST to `/api/v1/sessions` with Bearer auth
4. Display result URL

**API endpoint:** `POST /api/v1/sessions` (exists at `src/routes/api/v1/sessions/+server.ts`)

---

### Phase 4: Stop Hook (Auto-Sync)
**Create:** `~/.claude/hooks/promptflow-sync.sh`

Triggered when session ends. Workflow:
1. Check if `autoStream: true` in settings
2. Read transcript path from hook input
3. Transform JSONL → ExportSessionJSON
4. POST to `/api/v1/sessions`
5. Display result (non-blocking)

**Hook config in settings.json:**
```json
{
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "$HOME/.claude/hooks/promptflow-sync.sh"
      }]
    }]
  }
}
```

---

### Phase 5: Live Streaming
**Create:** `~/.claude/hooks/promptflow-live.sh`

For real-time streaming:
1. User starts with `/export-session --live`
2. Skill calls `POST /api/v1/live` → gets session token
3. Stores token in `/tmp/promptflow-live-session`
4. PostToolUse hook detects token file
5. Each turn: `PATCH /api/v1/live/{token}` with new content
6. End: `POST /api/v1/live/{token}?action=complete`

**Live API endpoints:** (exist at `src/routes/api/v1/live/`)
- `POST /api/v1/live` - Start session, get token
- `PATCH /api/v1/live/[token]` - Update with new turns
- `POST /api/v1/live/[token]?action=complete` - End session

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `~/.claude/hooks/lib/jsonl-to-export.js` | Create | JSONL→ExportSessionJSON transformer |
| `~/.claude/hooks/promptflow-sync.sh` | Create | Stop hook for auto-sync |
| `~/.claude/hooks/promptflow-live.sh` | Create | PostToolUse hook for live streaming |
| `~/.claude/settings.json` | Modify | Add promptflow config section |
| `.claude/commands/export-session.md` | Already exists | Skill spec (no changes needed) |

---

## Critical Existing Files

- `src/lib/utils/sessionImporter.ts` - TypeScript interfaces for ExportSessionJSON
- `src/routes/api/v1/sessions/+server.ts` - Sessions push API
- `src/routes/api/v1/live/[token]/+server.ts` - Live streaming API
- `.claude/commands/export-session.md` - Skill specification

---

## User Workflow (Final)

**Manual export:**
```bash
/export-session --push --name "My Feature"
# → Session pushed! View at: https://promptflow.app/post/abc123
```

**Start live session:**
```bash
/export-session --live --name "Live Coding"
# → Share URL: https://promptflow.app/live/xyz789
# → (coding happens, viewers watch in real-time)
/export-session --end
# → Save as post? [Yes/No]
```

**Automatic sync (when enabled):**
- Session ends naturally → auto-pushed to PromptFlow
- User sees: "Session synced: https://promptflow.app/post/def456"

---

## Implementation Order

1. **jsonl-to-export.js** - Core transformer (required by everything)
2. **Settings schema** - Add promptflow config
3. **Skill implementation** - Make `/export-session --push` work
4. **Stop hook** - Auto-sync after sessions
5. **Live streaming** - Real-time updates
