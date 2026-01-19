# Plan: Long-Running Agent Harness Skills

## Summary

Build 4 skill files to complete the Two-Agent Architecture pattern from the Anthropic article "Effective Harnesses for Long-Running Agents".

## What Already Exists

- `e2e/feature_list.json` - 52 features tracked
- `e2e/claude-progress.txt` - Session progress logging
- `e2e/init.sh` - Bootstrap script
- `.claude/skills/test.md` - Testing workflow (complete)
- Full Playwright infrastructure
- `docs/TESTING.md` - Comprehensive documentation

## Files to Create

### 1. `.claude/skills/start-new-project.md`
**Purpose:** Initializer Agent - runs once to scaffold new projects

Key sections:
- Assess current state (check if e2e/ exists)
- Create directory structure
- Generate feature_list.json from discovered routes/components
- Create progress log with template
- Create init.sh bootstrap script
- Make initial git commit
- Checklist before completion

### 2. `.claude/skills/new-feature.md`
**Purpose:** Coding Agent for implementing ONE new feature per session

Key sections:
- Orient: Read progress log, check feature status
- Define feature with acceptance criteria
- Bootstrap environment
- Run smoke tests first (always)
- Write test first (TDD)
- Implement feature
- Run tests until passing
- Update status and document
- Commit with descriptive message
- Verify merge-ready state

### 3. `.claude/skills/continue-project.md`
**Purpose:** Resume work from previous session

Key sections:
- Read progress log for context
- Check git state (uncommitted changes?)
- Review feature status (failing > critical > high > medium > low)
- Bootstrap environment
- Run smoke tests
- Select ONE feature following priority order
- Continue with standard implementation workflow
- Session state diagram

### 4. `.claude/skills/end-session.md`
**Purpose:** Properly close session with merge-ready state

Key sections:
- Verify all tests pass
- Handle uncommitted changes (commit/WIP/discard)
- Update feature status
- Document session in progress log
- Identify next priority
- Final verification checklist
- Session summary template for user

## CLAUDE.md Update

Add to "Long-Running Agent Harness" section:

```markdown
### Agent Skills

| Skill | Command | Purpose |
|-------|---------|---------|
| Start New Project | `/start-new-project` | Initialize E2E harness |
| New Feature | `/new-feature` | Implement ONE feature |
| Continue Project | `/continue-project` | Resume from last session |
| End Session | `/end-session` | Close session properly |
| Test | `/test` | Run tests, debug failures |
```

## File Structure After Implementation

```
.claude/
├── commands/
│   └── startup.md              # Existing
├── skills/
│   ├── test.md                 # Existing
│   ├── start-new-project.md    # NEW
│   ├── new-feature.md          # NEW
│   ├── continue-project.md     # NEW
│   └── end-session.md          # NEW
├── settings.local.json
└── mcp.json
```

## Verification

After implementation:
1. Review each skill file renders correctly in Claude Code
2. Test `/continue-project` skill invocation
3. Verify skill commands appear in `/help` or skill listings
4. Run through one cycle: continue → implement feature → end session
