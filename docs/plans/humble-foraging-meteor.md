# Fix: Web UI "unknown option '--plan'" Error

**Approach**: Pass plan content as initial prompt argument

## Problem
When starting a session from the web UI, the error `unknown option '--plan'` occurs because `claude-service.js` passes a non-existent `--plan` flag to Claude Code CLI.

**Location**: `option-e-web-ui/server/services/claude-service.js` lines 40-42:
```javascript
if (options.planPath) {
  args.push('--plan', options.planPath);
}
```

## Root Cause
Claude Code CLI does not have a `--plan` option. The available options for passing context are:
- `prompt` argument (positional) - initial prompt text
- `--system-prompt` - system prompt override
- `--append-system-prompt` - append to system prompt

## Solution
Replace the invalid `--plan` flag with a prompt-based approach:

1. Read the plan file content
2. Pass the content as the initial prompt argument to Claude

### Implementation Details

**File to modify**: `option-e-web-ui/server/services/claude-service.js`

**Changes**:
1. Add `fs` module import at top of file
2. Modify `createSession()` to read plan file and pass content as prompt:

```javascript
// In createSession(), replace the --plan logic:
if (options.planPath) {
  const planFullPath = path.join(this.projectDir, options.planPath);
  try {
    const planContent = fs.readFileSync(planFullPath, 'utf8');
    // Pass plan content as initial prompt
    args.push(`Please continue working on this plan:\n\n${planContent}`);
  } catch (err) {
    console.error(`Failed to read plan file: ${planFullPath}`, err);
  }
}
```

## Alternative Approaches Considered
1. **Use `--system-prompt`**: Could inject plan as system context, but this overrides default system prompt
2. **Use `--append-system-prompt`**: Better, but system prompt may not be ideal for plan content
3. **Send as first terminal input after session starts**: More complex, requires timing coordination

The prompt argument approach is simplest and most direct.

## Verification
1. Start the web UI server: `cd option-e-web-ui && npm start`
2. Open http://localhost:3847/
3. Select a plan from the list
4. Click "Start Session"
5. Verify session starts without error
6. Verify Claude receives the plan content as context
