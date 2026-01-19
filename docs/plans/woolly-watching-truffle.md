# Comprehensive E2E Test Suite & Documentation System

## Overview
Create a complete E2E test suite using Playwright that tests 100% of application features, with auto-documentation that serves as a single source of truth for both Claude Code development and user-facing website documentation at `/docs`.

---

## Architecture

### Single Source of Truth: `/docs` Folder
```
docs/
├── features/                    # Feature documentation (Markdown + frontmatter)
│   ├── apps.md
│   ├── agents.md
│   ├── projects.md
│   ├── meetings.md
│   ├── dashboard.md
│   ├── libraries.md
│   ├── templates.md
│   ├── logs.md
│   ├── data-catalog.md
│   └── compliance.md
├── api/
│   └── hooks.md                 # All data operations (24 hooks, 120+ functions)
├── test-results/                # Auto-generated test results
│   ├── summary.json
│   └── [module].json
├── index.md                     # Documentation home
└── _meta.json                   # Navigation structure
```

### Documentation Format
Markdown with YAML frontmatter - optimal for both:
- **Claude Code:** Structured frontmatter for programmatic parsing
- **Website:** Rendered markdown for human reading

```markdown
---
title: Apps
route: /apps
lastTested: 2026-01-10T15:30:00Z
testStatus: passing
coverage: 100%
features:
  - id: apps-view-cards
    name: Card View
    status: passing
---

# Apps
## Overview
The Apps page displays all applications...
```

---

## Feature Inventory (146 Features, ~192 Tests)

### Summary

| Module | Route | Features | Views | CRUD | Tests |
|--------|-------|----------|-------|------|-------|
| Apps | `/apps`, `/apps/:id` | 25 | 3 | CRUD | 35 |
| Agents | `/agents`, `/agents/:id` | 30 | 3 | CRUD | 40 |
| Projects | `/projects`, `/projects/:id` | 28 | 3 | CRUD | 38 |
| Meetings | `/meetings`, `/meetings/:id` | 18 | 1 | CRU | 22 |
| Dashboard | `/` | 12 | 1 | R | 15 |
| Libraries | `/libraries` | 8 | 1 | CR | 10 |
| Templates | `/templates` | 6 | 1 | R | 8 |
| Logs | `/logs` | 5 | 1 | R | 6 |
| Data Catalog | `/data-catalog` | 6 | 1 | CR | 8 |
| Compliance | `/compliance` | 8 | 1 | R | 10 |
| **Total** | **15 routes** | **146** | **16** | - | **~192** |

---

## Detailed Feature Lists

### 1. Apps (`/apps`, `/apps/:id`)

#### List Page
| ID | Feature | Type | Priority |
|----|---------|------|----------|
| apps-view-cards | Card View (default) | View | Critical |
| apps-view-table | Table View with sorting | View | Critical |
| apps-view-kanban | Kanban View with drag-drop | View | Critical |
| apps-filter-search | Search by name/description | Filter | Critical |
| apps-filter-status | Filter by status (8 options) | Filter | High |
| apps-filter-category | Filter by category (4 options) | Filter | High |
| apps-create | Create new app dialog | CRUD | Critical |
| apps-navigate-detail | Click card to detail | Navigation | Critical |
| apps-kanban-drag | Drag to change status | Interaction | High |
| apps-table-sort | Sort by columns | Interaction | Medium |

#### Detail Page
| ID | Feature | Type | Priority |
|----|---------|------|----------|
| app-detail-header | Header with badges, links | Display | Critical |
| app-detail-metrics | Dashboard metrics cards | Display | High |
| app-detail-owners | Owners section | Display | High |
| app-detail-projects | Projects list | Display | High |
| app-tab-roadmap | Roadmap with milestones | Tab | High |
| app-tab-releases | Releases pipeline | Tab | High |
| app-tab-dependencies | Dependency graph | Tab | Medium |
| app-tab-feedback | Feedback with voting | Tab | Medium |
| app-tab-docs | Documentation | Tab | Medium |
| app-edit | Edit app button | CRUD | High |
| app-github-link | External GitHub link | Navigation | Medium |
| app-create-milestone | Create milestone | CRUD | High |
| app-create-release | Create release | CRUD | High |
| app-create-feedback | Submit feedback | CRUD | Medium |
| app-vote-feedback | Vote on feedback | Interaction | Medium |

### 2. Agents (`/agents`, `/agents/:id`)

#### List Page
| ID | Feature | Type | Priority |
|----|---------|------|----------|
| agents-view-table | Table View (default) | View | Critical |
| agents-view-cards | Card View | View | Critical |
| agents-view-kanban | Kanban View | View | Critical |
| agents-filter-search | Search agents | Filter | Critical |
| agents-filter-division | Filter by division | Filter | High |
| agents-filter-status | Filter by status | Filter | High |
| agents-create | Create new agent | CRUD | Critical |
| agents-navigate-detail | Click to profile | Navigation | Critical |
| agents-kanban-drag | Drag to change status | Interaction | High |

#### Profile Page (7 tabs)
| ID | Feature | Type | Priority |
|----|---------|------|----------|
| agent-tab-overview | Overview with KPIs | Tab | Critical |
| agent-tab-config | Configuration | Tab | High |
| agent-tab-usage | Usage analytics | Tab | High |
| agent-tab-performance | Performance metrics | Tab | High |
| agent-tab-versions | Version history | Tab | Medium |
| agent-tab-recommendations | Recommendations | Tab | Medium |
| agent-tab-logs | Agent logs | Tab | Medium |
| agent-clone | Clone agent | Action | High |
| agent-export-json | Export JSON | Action | Medium |
| agent-export-yaml | Export YAML | Action | Medium |
| agent-share | Share link | Action | Low |
| agent-edit | Edit agent | CRUD | High |
| agent-rollback | Rollback version | Action | Medium |

### 3. Projects (`/projects`, `/projects/:id`)

#### List Page
| ID | Feature | Type | Priority |
|----|---------|------|----------|
| projects-view-table | Table View | View | Critical |
| projects-view-cards | Card View | View | Critical |
| projects-view-kanban | Kanban View | View | Critical |
| projects-filter-search | Search projects | Filter | Critical |
| projects-filter-status | Filter by status | Filter | High |
| projects-create | Create project | CRUD | Critical |
| projects-navigate-detail | Click to detail | Navigation | Critical |
| projects-kanban-drag | Drag status change | Interaction | High |

#### Detail Page (7 tabs)
| ID | Feature | Type | Priority |
|----|---------|------|----------|
| project-tab-overview | Overview with tasks | Tab | Critical |
| project-tab-health | Health dashboard | Tab | High |
| project-tab-team | Team members | Tab | High |
| project-tab-meetings | Project meetings | Tab | Medium |
| project-tab-data | Data & Tech | Tab | Medium |
| project-tab-compliance | Compliance checklist | Tab | Medium |
| project-tab-audit | Audit log | Tab | Low |
| project-task-create | Create task | CRUD | Critical |
| project-task-status | Change task status | CRUD | Critical |
| project-task-assign | Assign task | CRUD | High |
| project-status-change | Change project status | CRUD | High |
| project-add-team | Add team member | CRUD | High |
| project-add-data | Add data usage | CRUD | Medium |
| project-add-tech | Add technology | CRUD | Medium |

### 4. Meetings (`/meetings`, `/meetings/:id`)

#### List Page
| ID | Feature | Type | Priority |
|----|---------|------|----------|
| meetings-tab-all | All meetings | Tab | Critical |
| meetings-tab-steering | Steering committee | Tab | High |
| meetings-tab-security | Security review | Tab | High |
| meetings-tab-sprint | Sprint planning | Tab | Medium |
| meetings-tab-retro | Retrospective | Tab | Medium |
| meetings-tab-standup | Standup | Tab | Medium |
| meetings-tab-other | Other | Tab | Medium |
| meetings-create | Create meeting | CRUD | Critical |
| meetings-navigate-detail | Click to detail | Navigation | Critical |

#### Detail Page
| ID | Feature | Type | Priority |
|----|---------|------|----------|
| meeting-header | Header with actions | Display | Critical |
| meeting-start | Start meeting | Action | Critical |
| meeting-complete | Complete meeting | Action | Critical |
| meeting-attendees | Attendees display | Display | High |
| meeting-tab-notes | Collaborative notes | Tab | High |
| meeting-tab-ai | AI summary | Tab | Medium |
| meeting-add-note | Add note entry | CRUD | High |
| meeting-convert-action | Convert to task | Action | High |

### 5. Dashboard (`/`)
| ID | Feature | Type | Priority |
|----|---------|------|----------|
| dash-metrics-total | Total agents metric | Display | Critical |
| dash-metrics-active | Active agents metric | Display | Critical |
| dash-metrics-inactive | Inactive agents | Display | High |
| dash-metrics-performance | Performance metric | Display | High |
| dash-impact-savings | Cost savings card | Display | High |
| dash-impact-revenue | Revenue card | Display | High |
| dash-impact-time | Time saved card | Display | Medium |
| dash-impact-efficiency | Efficiency card | Display | Medium |
| dash-chart-savings | Savings trend chart | Chart | High |
| dash-chart-revenue | Revenue pie chart | Chart | Medium |
| dash-chart-efficiency | Efficiency bar chart | Chart | Medium |
| dash-live-logs | Live invocations | Display | High |

### 6. Libraries (`/libraries`)
| ID | Feature | Type | Priority |
|----|---------|------|----------|
| lib-tab-markdown | Markdown library | Tab | Critical |
| lib-tab-prompts | Prompts library | Tab | Critical |
| lib-search | Search libraries | Filter | High |
| lib-create-doc | Create document | CRUD | High |
| lib-create-prompt | Create prompt | CRUD | High |
| lib-view-doc | View document | Action | High |
| lib-copy-prompt | Copy prompt | Action | Medium |
| lib-edit-prompt | Edit prompt | CRUD | Medium |

### 7. Templates (`/templates`)
| ID | Feature | Type | Priority |
|----|---------|------|----------|
| templates-search | Search templates | Filter | High |
| templates-ai-input | AI description input | Input | High |
| templates-ai-generate | Generate agent | Action | High |
| templates-preview | Preview template | Action | Medium |
| templates-use | Use template | Action | High |
| templates-categories | Category boxes | Navigation | Medium |

### 8. Logs (`/logs`)
| ID | Feature | Type | Priority |
|----|---------|------|----------|
| logs-search | Search logs | Filter | High |
| logs-filter-source | Filter by source | Filter | High |
| logs-sort-columns | Sort by columns | Interaction | Medium |
| logs-expand-row | Expand details | Interaction | Medium |
| logs-display | Display log entries | Display | Critical |

### 9. Data Catalog (`/data-catalog`)
| ID | Feature | Type | Priority |
|----|---------|------|----------|
| catalog-stat-total | Total data types | Display | High |
| catalog-stat-pii | PII data types | Display | High |
| catalog-stat-critical | Critical sensitivity | Display | High |
| catalog-stat-system | System types | Display | Medium |
| catalog-browse | Browse catalog | Display | Critical |
| catalog-add-custom | Add custom type | CRUD | High |

### 10. Compliance (`/compliance`)
| ID | Feature | Type | Priority |
|----|---------|------|----------|
| compliance-select | Project selector | Filter | Critical |
| compliance-overview | Overview cards | Display | High |
| compliance-tab-checklist | Checklist tab | Tab | Critical |
| compliance-tab-audit | Audit log tab | Tab | High |
| compliance-update-checkpoint | Update checkpoint | CRUD | High |
| compliance-resources | Resource links | Navigation | Medium |
| compliance-empty-state | Empty state | Display | Medium |

---

## Data Operations (24 Hooks)

| Hook | Tables | Operations |
|------|--------|------------|
| useApps | apps, app_owners | CRUD + status |
| useAgents | agents, agent_kpis, activity_logs | CRUD + status |
| useProjects | projects, tasks | CRUD + status |
| useMeetings | meetings, attendees, notes | CRUD + status |
| useTemplates | agent_templates | Read |
| useLogs | api_logs | Read |
| useDataCatalog | data_types_catalog, project_data_usage | CRUD |
| useCompliance | compliance_checkpoints | CRUD |
| useAuditLog | audit_log | Create + Read |
| useEnhancedTasks | tasks, comments, time_entries | CRUD |
| useProjectHealth | project_health_snapshots | Create + Read |
| useMilestones | project_milestones | CRUD |
| useProjectTasks | tasks | CRUD |
| useMeetingNoteEntries | meeting_note_entries | CRUD + Realtime |
| useAgentVersions | agent_versions | Create + Rollback |
| useAgentTeam | agent_team_assignments | CRUD |
| useAgentUsage | agent_usage_logs | Create + Read |
| useAgentClone | agents | Clone |
| useAppDependencies | app_dependencies | CRUD |
| useAppMilestones | app_milestones | CRUD |
| useAppReleases | app_releases | CRUD + Promote |
| useAppFeedback | app_feedback, votes | CRUD + Vote |
| useCodeNames | code_names | Assign + Release |
| useProjectMetadata | project_data_usage, technologies | CRUD |

---

## Implementation Phases

### Phase 1: Documentation Structure
**Files to create:**
- `docs/index.md` - Documentation home
- `docs/features/*.md` - 10 feature docs
- `docs/_meta.json` - Navigation config
- `docs/api/hooks.md` - Hook documentation
- `docs/test-results/summary.json` - Empty results template

### Phase 2: Website Integration
**Files to create:**
- `src/pages/Docs.tsx` - Main docs page
- `src/pages/DocsModule.tsx` - Module detail page
- `src/components/docs/FeatureTable.tsx` - Feature list component
- `src/components/docs/TestResultsSummary.tsx` - Results display

**Files to modify:**
- `src/App.tsx` - Add `/docs`, `/docs/:module` routes
- `src/components/Navigation.tsx` - Add Docs nav item
- `package.json` - Add `gray-matter` dependency

### Phase 3: Test Infrastructure
**Files to create:**
- `/tmp/playwright-tests/runner.js` - Test runner
- `/tmp/playwright-tests/utils.js` - Test utilities
- `/tmp/playwright-tests/auto-fix.js` - Auto-fix logic

### Phase 4: Test Implementation (by module)
1. `apps.spec.js` - 35 tests
2. `agents.spec.js` - 40 tests
3. `projects.spec.js` - 38 tests
4. `meetings.spec.js` - 22 tests
5. `dashboard.spec.js` - 15 tests
6. `libraries.spec.js` - 10 tests
7. `templates.spec.js` - 8 tests
8. `logs.spec.js` - 6 tests
9. `data-catalog.spec.js` - 8 tests
10. `compliance.spec.js` - 10 tests

### Phase 5: Slash Command
**Files to create:**
- `.claude/skills/test-features/SKILL.md`

### Phase 6: Auto-Fix System
- Error pattern detection
- Common fix strategies
- Re-run and verify

---

## Auto-Fix Strategy

When a test fails:
1. **Capture:** Screenshot, error, expected vs actual
2. **Analyze:** Missing element? Wrong selector? Data issue?
3. **Fix:** Update component, add wait, fix selector
4. **Verify:** Re-run specific test
5. **Update:** Mark as fixed in docs
6. **Notify:** Console output with details

### Common Fix Patterns
| Error Type | Fix Strategy |
|------------|--------------|
| Element not found | Add data-testid, update selector |
| Timeout | Increase wait, add waitForLoadState |
| Wrong text | Fix component display logic |
| Navigation failed | Fix route or link href |
| Data missing | Check API call, add error handling |

---

## Test Template

```javascript
const { chromium } = require('playwright');
const fs = require('fs');

const TARGET_URL = process.env.TEST_URL || 'http://localhost:5173';
const DOCS_PATH = process.env.DOCS_PATH || './docs';

const results = {
  module: 'apps',
  timestamp: new Date().toISOString(),
  features: [],
  summary: { total: 0, passing: 0, failing: 0 }
};

function logFeature(id, name, status, error = null) {
  results.features.push({
    id, name, status, error,
    testedAt: new Date().toISOString()
  });
  results.summary.total++;
  status === 'passing' ? results.summary.passing++ : results.summary.failing++;
  console.log(`${status === 'passing' ? '✅' : '❌'} ${name}`);
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Test: apps-view-cards
    await page.goto(`${TARGET_URL}/apps`);
    await page.waitForLoadState('networkidle');
    const cards = await page.locator('[data-testid="app-card"]').count();
    logFeature('apps-view-cards', 'Card View', cards > 0 ? 'passing' : 'failing');

    // Test: apps-create
    await page.click('[data-testid="create-app-button"]');
    await page.waitForSelector('[data-testid="create-app-dialog"]');
    await page.fill('[data-testid="app-name-input"]', 'Test App');
    await page.click('[data-testid="submit-app"]');
    await page.waitForSelector('text=Test App');
    logFeature('apps-create', 'Create App', 'passing');

    // Cleanup
    // ... delete test app

  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: '/tmp/error.png' });
  } finally {
    fs.writeFileSync(
      `${DOCS_PATH}/test-results/apps.json`,
      JSON.stringify(results, null, 2)
    );
    await browser.close();
  }
})();
```

---

## Slash Command: `/test-features`

```markdown
# /test-features

Run E2E tests and update documentation.

## Usage
- `/test-features` - Run all tests
- `/test-features apps` - Test specific module
- `/test-features --fix` - Auto-fix failing tests

## Process
1. Detect dev server
2. Run Playwright tests
3. Update docs/test-results/
4. Update feature status in docs/features/
5. Report summary
```

---

## Verification

### Per Phase
```bash
# Phase 1: Docs structure
cat docs/index.md
ls docs/features/

# Phase 2: Website
npm run dev → http://localhost:5173/docs

# Phase 3-4: Tests
cd playwright-skill && node run.js /tmp/playwright-tests/apps.spec.js
cat docs/test-results/apps.json

# Phase 5: Slash command
/test-features apps
```

### Success Criteria
- [ ] 146 features documented in `/docs/features/`
- [ ] ~192 tests implemented
- [ ] `/docs` page renders documentation
- [ ] Test results update automatically
- [ ] `/test-features` slash command works
- [ ] Auto-fix handles common failures

---

## Critical Files Summary

### Create
| File | Purpose |
|------|---------|
| `docs/index.md` | Docs home |
| `docs/features/*.md` | 10 module docs |
| `docs/test-results/*.json` | Test results |
| `src/pages/Docs.tsx` | Docs page |
| `src/components/docs/*` | Doc components |
| `.claude/skills/test-features/SKILL.md` | Slash command |

### Modify
| File | Change |
|------|--------|
| `src/App.tsx` | Add /docs routes |
| `src/components/Navigation.tsx` | Add Docs nav |
| `package.json` | Add gray-matter |
