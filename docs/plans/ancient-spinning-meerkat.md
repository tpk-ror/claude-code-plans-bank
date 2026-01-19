# E2E Testing with Playwright + Long-Running Agent Harness

## Overview

Implement comprehensive Playwright E2E testing with a **long-running agent harness** following Anthropic's engineering patterns. This enables Claude Code to autonomously build features with tests, validate they pass, self-heal on failures, and maintain documentation across context windows.

## Architecture: Two-Agent System

Following the [Anthropic long-running agent pattern](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents):

1. **Initializer Agent** - Runs once to establish testing foundations
2. **Coding Agent** - Runs repeatedly, one feature at a time, across sessions

### Key Artifacts

| Artifact | Purpose |
|----------|---------|
| `e2e/feature_list.json` | Comprehensive feature requirements marked pass/fail |
| `e2e/claude-progress.txt` | Session log documenting completed work |
| `e2e/init.sh` | Bootstrap script for test environment |
| Git commits | Track changes with descriptive messages |

---

## Feature List (80% Coverage = 42 Features)

### Total Features Identified: 52
### Target Coverage: 42 features (80%)

```json
// e2e/feature_list.json structure
{
  "features": [
    {
      "id": "feature-id",
      "name": "Feature Name",
      "category": "public|auth|admin|api",
      "priority": "critical|high|medium|low",
      "status": "pending|passing|failing",
      "testFile": "e2e/specs/category/feature.spec.ts",
      "steps": [
        { "action": "navigate", "target": "/path" },
        { "action": "fill", "target": "input[name='email']", "value": "test@example.com" },
        { "action": "click", "target": "button[type='submit']" },
        { "action": "verify", "target": "text=Success" }
      ],
      "consoleErrorsAllowed": false,
      "lastTested": null,
      "notes": ""
    }
  ]
}
```

---

## Complete Feature Inventory

### Category: Public Pages (14 features)

| ID | Feature | Priority | Test File |
|----|---------|----------|-----------|
| PUB-001 | Home page loads with hero | critical | `public/home.spec.ts` |
| PUB-002 | Home hero variant rendering (6 types) | medium | `public/hero-variants.spec.ts` |
| PUB-003 | Client logos marquee displays | low | `public/home.spec.ts` |
| PUB-004 | About page content loads | high | `public/about.spec.ts` |
| PUB-005 | Projects listing with cards | high | `public/projects.spec.ts` |
| PUB-006 | Project detail page with case study | high | `public/projects.spec.ts` |
| PUB-007 | Blog listing with posts | high | `public/blog.spec.ts` |
| PUB-008 | Blog post detail with ToC | medium | `public/blog.spec.ts` |
| PUB-009 | Services listing | medium | `public/services.spec.ts` |
| PUB-010 | Service detail page | medium | `public/services.spec.ts` |
| PUB-011 | Videos gallery with badges | medium | `public/videos.spec.ts` |
| PUB-012 | Whiteboards gallery | low | `public/whiteboards.spec.ts` |
| PUB-013 | Storyboards gallery | low | `public/storyboards.spec.ts` |
| PUB-014 | Prompts library page | medium | `public/prompts.spec.ts` |

### Category: Authentication (4 features)

| ID | Feature | Priority | Test File |
|----|---------|----------|-----------|
| AUTH-001 | Login with valid credentials | critical | `auth/login.spec.ts` |
| AUTH-002 | Login error for invalid credentials | critical | `auth/login.spec.ts` |
| AUTH-003 | Password reset flow | high | `auth/password-reset.spec.ts` |
| AUTH-004 | Logout and redirect | critical | `auth/logout.spec.ts` |

### Category: Personalized Pages (4 features)

| ID | Feature | Priority | Test File |
|----|---------|----------|-----------|
| PERS-001 | View personalized page at /for/[slug] | critical | `personalized/view.spec.ts` |
| PERS-002 | Brand styling applied (colors, fonts) | high | `personalized/branding.spec.ts` |
| PERS-003 | CTA contact form on personalized page | high | `personalized/cta.spec.ts` |
| PERS-004 | View tracking analytics | medium | `personalized/analytics.spec.ts` |

### Category: Forms & Interactions (5 features)

| ID | Feature | Priority | Test File |
|----|---------|----------|-----------|
| FORM-001 | Contact form submission | critical | `forms/contact.spec.ts` |
| FORM-002 | Contact form validation | high | `forms/contact.spec.ts` |
| FORM-003 | Newsletter subscribe | critical | `forms/newsletter.spec.ts` |
| FORM-004 | Newsletter unsubscribe | high | `forms/newsletter.spec.ts` |
| FORM-005 | Toast notifications display | high | `forms/toasts.spec.ts` |

### Category: Admin Navigation (3 features)

| ID | Feature | Priority | Test File |
|----|---------|----------|-----------|
| ADMIN-NAV-001 | Sidebar navigation works | critical | `admin/navigation.spec.ts` |
| ADMIN-NAV-002 | All admin pages accessible | high | `admin/navigation.spec.ts` |
| ADMIN-NAV-003 | Mobile sidebar toggle | medium | `admin/navigation.spec.ts` |

### Category: Admin CRUD - Content (8 features)

| ID | Feature | Priority | Test File |
|----|---------|----------|-----------|
| ADMIN-001 | Projects CRUD | high | `admin/projects.spec.ts` |
| ADMIN-002 | Blog posts CRUD | high | `admin/blog.spec.ts` |
| ADMIN-003 | Services CRUD | medium | `admin/services.spec.ts` |
| ADMIN-004 | Skills CRUD | medium | `admin/skills.spec.ts` |
| ADMIN-005 | Experience CRUD | medium | `admin/experience.spec.ts` |
| ADMIN-006 | Videos CRUD | medium | `admin/videos.spec.ts` |
| ADMIN-007 | Prompts CRUD | low | `admin/prompts.spec.ts` |
| ADMIN-008 | Whiteboards CRUD | low | `admin/whiteboards.spec.ts` |

### Category: Admin - Personalized Links (4 features)

| ID | Feature | Priority | Test File |
|----|---------|----------|-----------|
| LINKS-001 | Links listing with view counts | critical | `admin/links.spec.ts` |
| LINKS-002 | Create link wizard step 1 (URL input) | critical | `admin/links-create.spec.ts` |
| LINKS-003 | Create link wizard step 2 (customize) | critical | `admin/links-create.spec.ts` |
| LINKS-004 | Create link wizard step 3 (AI + preview) | critical | `admin/links-create.spec.ts` |

### Category: Admin - AI Features (4 features)

| ID | Feature | Priority | Test File |
|----|---------|----------|-----------|
| AI-001 | AI copy generation for links | high | `admin/ai-features.spec.ts` |
| AI-002 | Job URL scraping | high | `admin/ai-features.spec.ts` |
| AI-003 | Image playground generation | medium | `admin/image-playground.spec.ts` |
| AI-004 | Ideas canvas AI expansion | low | `admin/ideas.spec.ts` |

### Category: Admin - Resume (3 features)

| ID | Feature | Priority | Test File |
|----|---------|----------|-----------|
| RESUME-001 | Resume builder interface | high | `admin/resume.spec.ts` |
| RESUME-002 | Resume PDF export | medium | `admin/resume.spec.ts` |
| RESUME-003 | Brand-matched resume | medium | `admin/resume.spec.ts` |

### Category: Smoke Tests (3 features)

| ID | Feature | Priority | Test File |
|----|---------|----------|-----------|
| SMOKE-001 | All public pages load without errors | critical | `smoke/pages.spec.ts` |
| SMOKE-002 | Admin dashboard accessible after login | critical | `smoke/admin.spec.ts` |
| SMOKE-003 | No console errors on critical paths | critical | `smoke/console.spec.ts` |

**Total: 52 features | Critical: 14 | High: 16 | Medium: 16 | Low: 6**

---

## Implementation Plan

### Phase 1: Harness Foundation

#### 1.1 Create `e2e/init.sh` - Bootstrap Script
```bash
#!/bin/bash
set -e

echo "=== E2E Test Environment Bootstrap ==="

# Check Node version
node -v

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  npm install
fi

# Install Playwright browsers
npx playwright install chromium

# Start dev server in background
npm run dev &
DEV_PID=$!

# Wait for server to be ready
echo "Waiting for dev server..."
npx wait-on http://localhost:3000 -t 60000

echo "Dev server ready on http://localhost:3000"
echo "Dev server PID: $DEV_PID"

# Export for cleanup
export DEV_PID
```

#### 1.2 Create `e2e/feature_list.json`
Complete JSON with all 52 features, each with:
- Unique ID
- Name and category
- Priority level
- Status (pending/passing/failing)
- Test file path
- Step-by-step verification actions
- Console error expectations

#### 1.3 Create `e2e/claude-progress.txt` Template
```
# E2E Testing Progress Log

## Session: [DATE]
### Features Completed:
- [FEATURE-ID]: [Status] - [Notes]

### Console Errors Captured:
- [None | Details]

### Next Priority:
- [FEATURE-ID]: [Feature Name]

---
```

### Phase 2: Playwright Configuration

#### 2.1 `/playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { outputFolder: 'e2e/reports/html' }],
    ['json', { outputFile: 'e2e/reports/results.json' }],
    ['list'],
  ],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 12'] },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

#### 2.2 Package.json Scripts
```json
{
  "test:e2e": "playwright test",
  "test:e2e:smoke": "playwright test e2e/specs/smoke/",
  "test:e2e:critical": "playwright test --grep @critical",
  "test:e2e:high": "playwright test --grep @high",
  "test:e2e:feature": "playwright test --grep",
  "test:e2e:headed": "playwright test --headed",
  "test:e2e:debug": "playwright test --debug",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:report": "playwright show-report e2e/reports/html",
  "test:e2e:update-features": "node e2e/scripts/update-feature-status.js"
}
```

### Phase 3: Test Utilities

#### 3.1 Console Error Capture (`e2e/utils/console-capture.ts`)
- Capture all browser console messages during tests
- Parse stack traces to identify source files
- Generate actionable error reports
- Flag tests with unexpected console errors

#### 3.2 Self-Healing Locators (`e2e/utils/self-healing.ts`) - Conservative Approach
- Multiple fallback selector strategies (role, label, id, data-testid, placeholder)
- Confidence scoring per strategy
- Automatic fallback on failure during test execution
- Logging of which strategy succeeded
- **Conservative Mode**: When failures occur:
  - Capture full error context
  - Generate fix suggestions
  - Log to `claude-progress.txt`
  - **Wait for human approval** before applying fixes
  - Never auto-fix without explicit approval

#### 3.3 Feature Status Updater (`e2e/scripts/update-feature-status.js`)
- Parse test results JSON
- Update feature_list.json statuses
- Generate progress summary
- Append to claude-progress.txt

### Phase 4: Test Fixtures

#### 4.1 Base Fixtures (`e2e/fixtures/index.ts`)
```typescript
import { test as base } from '@playwright/test';
import { createConsoleCapture } from '../utils/console-capture';

export const test = base.extend<{
  consoleCapture: ConsoleCapture;
  adminPage: Page;
}>({
  consoleCapture: async ({ page }, use) => {
    const capture = createConsoleCapture(page);
    await use(capture);
    // Report errors after test
    if (capture.errors.length > 0) {
      console.log('Console Errors:', capture.errors);
    }
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/admin.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});
```

### Phase 5: Test Specs (42 Features)

#### Directory Structure
```
e2e/specs/
├── smoke/
│   ├── pages.spec.ts           # SMOKE-001
│   ├── admin.spec.ts           # SMOKE-002
│   └── console.spec.ts         # SMOKE-003
├── auth/
│   ├── login.spec.ts           # AUTH-001, AUTH-002
│   ├── logout.spec.ts          # AUTH-004
│   └── password-reset.spec.ts  # AUTH-003
├── public/
│   ├── home.spec.ts            # PUB-001, PUB-003
│   ├── hero-variants.spec.ts   # PUB-002
│   ├── about.spec.ts           # PUB-004
│   ├── projects.spec.ts        # PUB-005, PUB-006
│   ├── blog.spec.ts            # PUB-007, PUB-008
│   ├── services.spec.ts        # PUB-009, PUB-010
│   ├── videos.spec.ts          # PUB-011
│   ├── whiteboards.spec.ts     # PUB-012
│   ├── storyboards.spec.ts     # PUB-013
│   └── prompts.spec.ts         # PUB-014
├── personalized/
│   ├── view.spec.ts            # PERS-001
│   ├── branding.spec.ts        # PERS-002
│   ├── cta.spec.ts             # PERS-003
│   └── analytics.spec.ts       # PERS-004
├── forms/
│   ├── contact.spec.ts         # FORM-001, FORM-002
│   ├── newsletter.spec.ts      # FORM-003, FORM-004
│   └── toasts.spec.ts          # FORM-005
└── admin/
    ├── navigation.spec.ts      # ADMIN-NAV-001,002,003
    ├── projects.spec.ts        # ADMIN-001
    ├── blog.spec.ts            # ADMIN-002
    ├── services.spec.ts        # ADMIN-003
    ├── skills.spec.ts          # ADMIN-004
    ├── experience.spec.ts      # ADMIN-005
    ├── videos.spec.ts          # ADMIN-006
    ├── links.spec.ts           # LINKS-001
    ├── links-create.spec.ts    # LINKS-002,003,004
    ├── ai-features.spec.ts     # AI-001, AI-002
    ├── image-playground.spec.ts # AI-003
    ├── ideas.spec.ts           # AI-004
    └── resume.spec.ts          # RESUME-001,002,003
```

### Phase 6: Claude Code Integration

#### 6.1 Leverage Existing Playwright MCP Skill

The project will use the **existing `playwright-skill` MCP** for browser automation, wrapped with a custom test workflow skill.

**Integration Approach:**
- Use `playwright-skill` for: page navigation, element interaction, screenshot capture
- Custom wrapper skill handles: test orchestration, feature tracking, progress logging

#### 6.2 Test Workflow Skill (`/.claude/skills/test.md`)
```markdown
# E2E Testing Workflow

## Trigger
Use when: running tests, debugging failures, building features with tests
Invokes: playwright-skill MCP for browser automation

## Agent Loop (Each Session)

1. **Orient**
   - Run `pwd` to confirm directory
   - Read `e2e/claude-progress.txt` for context
   - Read `e2e/feature_list.json` for current status
   - Check git log for recent changes

2. **Select Feature**
   - Find highest-priority feature with status "pending" or "failing"
   - Focus on ONE feature per session

3. **Bootstrap**
   - Run `./e2e/init.sh` to start dev server (localhost:3000)
   - Verify server is running

4. **Verify Fundamentals**
   - Run smoke tests: `npm run test:e2e:smoke`
   - If smoke fails, fix before proceeding

5. **Implement/Fix Feature Test**
   - Write or fix the test spec
   - Run single test: `npm run test:e2e:feature "[FEATURE-ID]"`
   - Use playwright-skill for visual verification
   - Capture console errors
   - If failing, analyze and suggest fix (conservative approach)

6. **Self-Healing (Conservative)**
   On test failure:
   - Capture error with full stack trace
   - Parse to identify source file:line
   - Generate fix suggestions for common patterns
   - **REQUIRE HUMAN APPROVAL** before applying fixes
   - Log suggested fixes to claude-progress.txt

7. **Update Status**
   - Update feature_list.json status
   - Append to claude-progress.txt
   - Commit with descriptive message

8. **Document**
   - Update relevant docs if needed
   - Note any architectural decisions

## Commands
- `/test` - Run full suite
- `/test:smoke` - Quick smoke tests
- `/test:feature <id>` - Test specific feature
- `/test:status` - Show feature coverage
- `/test:next` - Show next priority feature
- `/test:heal` - Show pending fix suggestions
```

#### 6.2 CLAUDE.md Updates

Add new sections:

```markdown
## Long-Running Agent Harness

This project uses a long-running agent pattern for feature development with integrated testing.

### Key Artifacts
- `e2e/feature_list.json` - Feature requirements (42 features, 80% coverage)
- `e2e/claude-progress.txt` - Session progress log
- `e2e/init.sh` - Environment bootstrap

### Agent Workflow (Each Session)
1. Read progress log and feature list
2. Select ONE highest-priority incomplete feature
3. Run smoke tests to verify fundamentals
4. Implement feature with test
5. Verify test passes, no console errors
6. Update progress log and commit
7. Update docs if needed

### Feature Development Process
When building NEW features:
1. Add feature to `e2e/feature_list.json` with status "pending"
2. Create test spec with verification steps
3. Implement the feature
4. Run test until passing
5. Mark feature "passing" in feature_list.json
6. Update claude-progress.txt
7. Run smoke tests for regressions
8. Update documentation

### Testing Commands
```bash
npm run test:e2e              # Full suite
npm run test:e2e:smoke        # Smoke tests (run first)
npm run test:e2e:critical     # Critical features only
npm run test:e2e:feature "ID" # Single feature
npm run test:e2e:debug        # Debug mode
npm run test:e2e:report       # View HTML report
```

### Console Error Handling
All tests capture browser console errors. On failure:
1. Errors logged with stack traces
2. Source file:line identified
3. Suggestions generated for common patterns
4. Test marked failing until fixed

### Documentation Updates
After completing features, update:
- `DECISION_LOG.md` - Architectural decisions (DEC-XXX)
- `DATABASE.md` - Schema changes
- `AI.md` - AI integration changes
- `FEATURES.md` - Feature documentation
- `TESTING.md` - New test patterns
```

### Phase 7: Documentation

#### 7.1 Create `/docs/TESTING.md`
- Testing architecture overview
- Feature list structure
- Writing test specs
- Console error capture
- Self-healing locators
- CI/CD integration
- Troubleshooting guide

#### 7.2 Update `/docs/DECISION_LOG.md`
Add DEC-031: Long-Running Agent E2E Testing
- Two-agent architecture
- Feature list pattern
- Progress tracking
- Self-healing approach

---

## Files to Create

| File | Purpose |
|------|---------|
| `/playwright.config.ts` | Playwright configuration |
| `/e2e/init.sh` | Bootstrap script |
| `/e2e/feature_list.json` | 52 features with status |
| `/e2e/claude-progress.txt` | Session log template |
| `/e2e/fixtures/index.ts` | Test fixtures |
| `/e2e/utils/console-capture.ts` | Console error capture |
| `/e2e/utils/self-healing.ts` | Self-healing locators |
| `/e2e/utils/auth-helpers.ts` | Auth utilities |
| `/e2e/utils/form-helpers.ts` | Form utilities |
| `/e2e/scripts/update-feature-status.js` | Status updater |
| `/e2e/specs/**/*.spec.ts` | 25+ test spec files |
| `/.claude/skills/test.md` | Testing agent skill |
| `/docs/TESTING.md` | Testing documentation |

## Files to Modify

| File | Changes |
|------|---------|
| `/package.json` | Add 10 test scripts |
| `/CLAUDE.md` | Add testing section + agent workflow |
| `/docs/DECISION_LOG.md` | Add DEC-031 |
| `/.gitignore` | Add e2e/.auth/, e2e/reports/ |

---

## Environment Variables

```env
# Add to .env.local
TEST_ADMIN_EMAIL=your-admin@email.com
TEST_ADMIN_PASSWORD=your-password
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

---

## Verification Checklist

- [ ] `./e2e/init.sh` bootstraps environment
- [ ] `feature_list.json` contains 52 features
- [ ] `claude-progress.txt` template created
- [ ] Smoke tests pass (SMOKE-001, 002, 003)
- [ ] Auth tests pass (AUTH-001, 002, 003, 004)
- [ ] Critical features tested (14 critical priority)
- [ ] Console capture working
- [ ] Self-healing locators working
- [ ] `/test` skill works
- [ ] CLAUDE.md updated with workflow
- [ ] TESTING.md created
- [ ] DECISION_LOG.md updated

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Feature coverage | 80% (42/52 features) |
| Critical features tested | 100% (14/14) |
| High priority tested | 100% (16/16) |
| Smoke test pass rate | 100% |
| Console error rate | 0% on critical paths |
