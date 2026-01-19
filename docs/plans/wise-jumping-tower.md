# Intelligent Task Automation Feature

## Overview

Transform the task system into an AI-powered automation engine that detects repetitive work patterns, recommends agent automation, and executes tasks with configurable autonomy levels.

**User-Defined Requirements:**
- Multi-channel suggestions: inline banners, insights dashboard, AI chat
- AI-driven holistic pattern detection (full task context analysis)
- Hybrid timing: real-time quick checks + batch deep analysis
- Confidence-based thresholds (AI decides when patterns are strong)
- Flexible agent autonomy: autonomous, approval-required, or guided
- Hierarchical visibility: personal → team → org rollup
- Full audit trail: execution logs + task-linked results
- Active feedback loop: implicit learning + explicit user corrections

---

## Database Schema (New Tables)

### Core Tables

| Table | Purpose |
|-------|---------|
| `task_patterns` | Detected automation patterns with keywords, embeddings, confidence thresholds |
| `pattern_matches` | Links tasks to patterns with confidence scores |
| `automation_suggestions` | User-facing suggestions with status tracking |
| `agent_executions` | Full audit trail of agent task executions |
| `task_embeddings` | Cached vector embeddings for similarity search (pgvector) |
| `user_automation_preferences` | Per-user autonomy and notification settings |
| `user_pattern_feedback` | Explicit "mark similar/different" feedback for learning |

### Key Fields in `agent_executions`

```
- task_id, agent_id, pattern_id
- execution_mode: 'guided' | 'approval_required' | 'autonomous'
- input_context (JSONB): full task context sent to agent
- status: pending → awaiting_approval → running → completed/failed
- output_data, output_summary, changes_made
- created_comment_ids[], created_attachment_ids[]
- tokens_used, cost_estimate, user_satisfaction_rating
```

---

## Edge Functions (Supabase)

| Function | Purpose |
|----------|---------|
| `task-pattern-detector` | Real-time pattern check on task create/update |
| `batch-pattern-analysis` | Daily job for new pattern discovery |
| `agent-task-executor` | Execute agents on tasks with approval workflow |
| `embedding-generator` | Generate text embeddings via OpenAI |

---

## Frontend Components

### New Components (`src/components/automation/`)

| Component | Description |
|-----------|-------------|
| `AutomationSuggestionBanner` | Inline banner on task lists showing automation opportunities |
| `AutomationOpportunitiesDashboard` | Full page at `/automation` with metrics and suggestions |
| `AgentExecutionHistory` | New tab in TaskDetailPanel showing execution audit trail |
| `AgentExecutionApprovalDialog` | Approval workflow with context preview |
| `PatternFeedbackDialog` | "Mark as similar/different" feedback UI |
| `AutomationSettingsPanel` | User preferences for autonomy levels |

### Integration Points

- `TaskDetailPanel.tsx`: Add "Automation" tab with execution history
- `ProjectDetail.tsx`: Show suggestion banner above task list
- `App.tsx`: Add route `/automation` for dashboard

---

## Hooks (`src/hooks/useTaskAutomation.ts`)

```typescript
// Query keys
automationKeys.suggestions(taskId?, projectId?)
automationKeys.executions(taskId)
automationKeys.patterns()
automationKeys.userPreferences(userId)
automationKeys.dashboard()

// Hooks
useTaskSuggestions(taskId?, projectId?)
useAgentExecutions(taskId)
useRequestAgentExecution()
useApproveExecution()
useRejectExecution()
useSubmitPatternFeedback()
useUserAutomationPreferences(userId)
useUpdateAutomationPreferences()
useAutomationDashboard()
useDismissSuggestion()
```

---

## AI/ML Approach

### Task Similarity
1. Generate embeddings from combined task context (title, description, comments, attachments)
2. Use pgvector for fast similarity search
3. Hybrid: vector similarity (40%) + category match (15%) + keywords (15%) + success rate (20%) + feedback (10%)

### Confidence Scoring
- No fixed threshold; AI determines based on composite score
- Minimum ~70% default, adjustable per pattern based on success history

### Hierarchical Learning
```
Individual patterns (user-specific)
    ↓ promote at 80% success after 10+ uses
Team patterns
    ↓ promote at 85% success after 50+ uses
Division patterns
    ↓ promote at 90% success
Organization patterns (global)
```

---

## Types (`src/types/automation.ts`)

```typescript
type AutonomyLevel = 'guided' | 'approval_required' | 'autonomous' | 'disabled';
type PatternScope = 'individual' | 'team' | 'division' | 'organization';
type ExecutionStatus = 'pending' | 'awaiting_approval' | 'running' | 'completed' | 'failed';
type FeedbackType = 'mark_similar' | 'mark_different' | 'rate_suggestion' | 'rate_execution';

interface TaskPattern { ... }
interface PatternMatch { ... }
interface AutomationSuggestion { ... }
interface AgentExecution { ... }
interface UserAutomationPreferences { ... }
```

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Create database migration with all new tables + pgvector setup
- [ ] Implement `embedding-generator` Edge Function
- [ ] Create `task_embeddings` trigger and population
- [ ] Scaffold `useTaskAutomation.ts` hooks

### Phase 2: Pattern Detection
- [ ] Implement `task-pattern-detector` Edge Function
- [ ] Create database trigger for real-time task analysis
- [ ] Build similarity search SQL function (`find_similar_tasks`)
- [ ] Create `AutomationSuggestionBanner` component

### Phase 3: Suggestions UI
- [ ] Build `AutomationOpportunitiesDashboard` page
- [ ] Integrate suggestion banner into `ProjectDetail.tsx`
- [ ] Add "Automation" tab to `TaskDetailPanel.tsx`
- [ ] Implement suggestion accept/dismiss mutations

### Phase 4: Agent Execution
- [ ] Implement `agent-task-executor` Edge Function
- [ ] Build approval workflow (`AgentExecutionApprovalDialog`)
- [ ] Create `AgentExecutionHistory` component
- [ ] Post execution results as task comments/attachments

### Phase 5: Learning & Polish
- [ ] Implement `batch-pattern-analysis` job (daily cron)
- [ ] Build feedback UI (`PatternFeedbackDialog`)
- [ ] Create user preferences panel
- [ ] Add hierarchical pattern promotion logic
- [ ] Performance optimization and testing

---

## Verification

### Testing Checklist
1. Create 5+ similar tasks → verify suggestion banner appears
2. Accept suggestion → verify agent execution created with correct status
3. Approve execution → verify agent runs and results posted to task
4. Mark tasks as "different" → verify pattern confidence adjusts
5. Check dashboard shows aggregate metrics across projects
6. Verify hierarchical visibility (user sees own patterns, manager sees team)

### Key Files to Modify
- `src/components/tasks/TaskDetailPanel.tsx` - Add automation tab
- `src/pages/ProjectDetail.tsx` - Add suggestion banner
- `src/App.tsx` - Add `/automation` route
- `supabase/functions/` - New edge functions

### Reference Files (Patterns to Follow)
- `src/hooks/useEnhancedTasks.ts` - Hook patterns
- `src/types/project-enhanced.ts` - Type definitions
- `supabase/functions/ai-meeting-assistant/index.ts` - Edge function AI calls
- `supabase/migrations/20260110000000_enhanced_tasks.sql` - Migration patterns
