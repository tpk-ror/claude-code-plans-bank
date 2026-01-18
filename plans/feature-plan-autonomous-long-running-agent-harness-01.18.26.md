# Plan: Autonomous Long-Running Agent Harness

Based on [Anthropic's "Effective Harnesses for Long-Running Agents"](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

## Current State
- **9/35 features completed** (26%)
- Tests passing (160 total), TypeScript clean

## Problem
The current `/ralph-loop` stops and asks for confirmation. We need an **autonomous harness** that runs continuously without user intervention.

---

## Implementation Plan

### Architecture: External Orchestration Loop

The key insight from the article: **Don't rely on a single agent session to run forever**. Instead, use an external bash script that:
1. Runs Claude Code for ONE feature
2. Lets Claude complete and exit cleanly
3. Checks if more features remain
4. Loops until done

This handles context limits naturally by starting fresh each iteration.

---

### File 1: `scripts/agent-harness/init.sh` (Enhanced)

Bootstraps environment and verifies state before each session:

```bash
#!/bin/bash
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "🔧 Initializing agent harness..."

# 1. Verify Node.js
command -v node >/dev/null 2>&1 || { echo "❌ Node.js required"; exit 1; }

# 2. Install dependencies if needed
[ -d "node_modules" ] || npm install

# 3. Run verification suite
echo "📋 Running TypeScript check..."
npm run typecheck || { echo "❌ TypeScript errors"; exit 1; }

echo "🧪 Running tests..."
npm test || { echo "❌ Tests failing"; exit 1; }

# 4. Show current state
echo ""
echo "📊 Feature Progress:"
echo "  Completed: $(grep -c '"passes": true' scripts/agent-harness/feature_list.json)"
echo "  Remaining: $(grep -c '"passes": false' scripts/agent-harness/feature_list.json)"
echo ""
echo "✅ Environment ready"
```

---

### File 2: `scripts/agent-harness/run-loop.sh` (New - Main Runner)

The autonomous orchestration loop:

```bash
#!/bin/bash
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FEATURE_LIST="$PROJECT_ROOT/scripts/agent-harness/feature_list.json"
PROGRESS_LOG="$PROJECT_ROOT/scripts/agent-harness/claude-progress.txt"

cd "$PROJECT_ROOT"

# Initialize first
bash scripts/agent-harness/init.sh

echo ""
echo "🚀 Starting autonomous feature loop..."
echo ""

while true; do
    # Count remaining features
    remaining=$(grep -c '"passes": false' "$FEATURE_LIST" || echo "0")

    if [ "$remaining" -eq 0 ]; then
        echo ""
        echo "🎉 All features completed!"
        exit 0
    fi

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 Features remaining: $remaining"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Run Claude Code to build ONE feature
    # --dangerously-skip-permissions allows autonomous operation
    # The /build-feature command implements exactly one feature
    claude --dangerously-skip-permissions -p "
Read scripts/agent-harness/feature_list.json and scripts/agent-harness/claude-progress.txt.
Find the next feature where passes=false (prioritize high priority).
Implement ONLY that one feature following existing code patterns.
Run npm run typecheck and npm test to verify.
If tests pass: update feature_list.json (passes=true), append to claude-progress.txt, commit changes.
If tests fail: fix the issues until tests pass, then update and commit.
Do NOT ask for confirmation - work autonomously.
Exit when the single feature is complete.
"

    # Brief pause between iterations
    sleep 3

    # Verify tests still pass after Claude's changes
    echo "🔍 Post-iteration verification..."
    npm run typecheck || { echo "⚠️ TypeScript errors after iteration"; }
    npm test || { echo "⚠️ Test failures after iteration"; }
done
```

---

### File 3: Update `.claude/commands/build-feature.md`

Make the command work autonomously without asking:

```markdown
# /build-feature

Build the next incomplete feature from the feature list autonomously.

## Instructions

1. Read `scripts/agent-harness/feature_list.json` to find the next feature where `passes: false`
   - Prioritize: high > medium > low
2. Read `scripts/agent-harness/claude-progress.txt` for context on recent work
3. Implement the feature following existing patterns in the codebase
4. Run verification: `npm run typecheck && npm test`
5. If tests pass:
   - Update `feature_list.json`: set `passes: true` for this feature
   - Append completion note to `claude-progress.txt`
   - Commit with message: `feat(marketing): <description>`
6. If tests fail: fix issues and retry until passing
7. Exit when complete - DO NOT continue to next feature

## Critical Rules
- Work on exactly ONE feature per invocation
- NEVER ask for user confirmation - work autonomously
- ALWAYS verify tests pass before marking complete
- ALWAYS commit after successful completion
```

---

## Usage

```bash
# Make executable
chmod +x scripts/agent-harness/init.sh
chmod +x scripts/agent-harness/run-loop.sh

# Run until all features complete
./scripts/agent-harness/run-loop.sh
```

The loop will:
1. Initialize and verify environment
2. Start Claude Code for one feature
3. Claude implements, tests, commits
4. Loop checks remaining count
5. Repeat until all 35 features pass

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `scripts/agent-harness/init.sh` | **Modify** - enhance with verification |
| `scripts/agent-harness/run-loop.sh` | **Create** - main orchestration loop |
| `.claude/commands/build-feature.md` | **Modify** - make autonomous |

---

## Recovery & Monitoring

- **Git commits**: Each feature creates a checkpoint
- **feature_list.json**: Real-time progress tracking
- **claude-progress.txt**: Session history
- **Ctrl+C**: Safe to interrupt - next run picks up where it left off
