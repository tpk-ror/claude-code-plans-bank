# Enhanced Project Management System Plan

## Overview
Enhance the project management section with comprehensive health tracking, advanced task management, a master data catalog, and full audit/compliance capabilities.

---

## Features Summary

| Feature | Description |
|---------|-------------|
| **Project Health Dashboard** | Visual health indicators, risk scores, burndown charts, milestone tracking |
| **Enhanced Tasks** | Subtasks, dependencies, time tracking, comments, attachments |
| **Master Data Catalog** | Predefined data types (Customer, Product, Order, etc.) + custom types |
| **Audit Trail** | Full change tracking, compliance checkpoints, technology vetting workflow |
| **Health Metrics** | Task completion rate, overdue counts, risk indicators, budget/timeline tracking |

---

## Phase 1: Database Schema

### Migration 1: Enhanced Tasks
**File:** `supabase/migrations/20260110000000_enhanced_tasks.sql`

```sql
-- Add subtask/hierarchy support to tasks
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(8,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Task dependencies table
CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  blocked_by_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  dependency_type TEXT DEFAULT 'finish_to_start',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, blocked_by_task_id),
  CHECK (task_id != blocked_by_task_id)
);

-- Task comments
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES team_members(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Task attachments
CREATE TABLE task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Time entries for tracking
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  team_member_id UUID REFERENCES team_members(id),
  hours DECIMAL(8,2) NOT NULL,
  description TEXT,
  entry_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Migration 2: Project Health & Milestones
**File:** `supabase/migrations/20260110000001_project_health.sql`

```sql
-- Project milestones
CREATE TABLE project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE NOT NULL,
  completed_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'at_risk', 'missed')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add health/budget fields to projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS budget_allocated DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS budget_spent DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS target_end_date DATE,
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS health_status TEXT DEFAULT 'green' CHECK (health_status IN ('green', 'yellow', 'red'));

-- Health snapshots for trend tracking
CREATE TABLE project_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  snapshot_date DATE DEFAULT CURRENT_DATE,
  health_status TEXT NOT NULL,
  risk_score INTEGER DEFAULT 0,
  tasks_total INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_overdue INTEGER DEFAULT 0,
  tasks_blocked INTEGER DEFAULT 0,
  budget_spent DECIMAL(12,2) DEFAULT 0,
  schedule_variance_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, snapshot_date)
);
```

### Migration 3: Master Data Catalog
**File:** `supabase/migrations/20260110000002_data_catalog.sql`

```sql
-- Master data types catalog
CREATE TABLE data_types_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT DEFAULT 'custom' CHECK (category IN ('system', 'custom')),
  default_sensitivity TEXT DEFAULT 'medium',
  is_pii_default BOOLEAN DEFAULT false,
  compliance_requirements TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed predefined data types
INSERT INTO data_types_catalog (name, description, category, default_sensitivity, is_pii_default, compliance_requirements) VALUES
  ('Customer Data', 'Customer profile, preferences, contact details', 'system', 'high', true, ARRAY['GDPR', 'CCPA']),
  ('Product Data', 'Product catalog, pricing, inventory', 'system', 'medium', false, ARRAY[]::TEXT[]),
  ('Order Data', 'Transaction records, purchase history', 'system', 'high', true, ARRAY['PCI-DSS', 'GDPR']),
  ('Employee Data', 'HR records, payroll, performance', 'system', 'critical', true, ARRAY['GDPR', 'HIPAA']),
  ('Vendor Data', 'Supplier info, contracts, pricing', 'system', 'medium', false, ARRAY[]::TEXT[]),
  ('Financial Data', 'Revenue, expenses, reports', 'system', 'critical', false, ARRAY['SOX', 'PCI-DSS']),
  ('Marketing Data', 'Campaign metrics, audience segments', 'system', 'medium', true, ARRAY['GDPR', 'CCPA']),
  ('Support Data', 'Tickets, resolutions, feedback', 'system', 'medium', true, ARRAY['GDPR']);

-- Enhance project_data_usage to reference catalog
ALTER TABLE project_data_usage
ADD COLUMN IF NOT EXISTS data_type_id UUID REFERENCES data_types_catalog(id),
ADD COLUMN IF NOT EXISTS usage_purpose TEXT,
ADD COLUMN IF NOT EXISTS data_volume TEXT,
ADD COLUMN IF NOT EXISTS retention_period TEXT,
ADD COLUMN IF NOT EXISTS compliance_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES team_members(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
```

### Migration 4: Audit & Compliance
**File:** `supabase/migrations/20260110000003_audit_compliance.sql`

```sql
-- Audit log table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'status_change', 'approval', 'assignment')),
  actor_id UUID REFERENCES team_members(id),
  actor_name TEXT,
  old_values JSONB,
  new_values JSONB,
  change_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Technology vetting workflow
ALTER TABLE project_technologies
ADD COLUMN IF NOT EXISTS vetting_status TEXT DEFAULT 'pending'
  CHECK (vetting_status IN ('pending', 'under_review', 'approved', 'rejected', 'conditionally_approved')),
ADD COLUMN IF NOT EXISTS vetting_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS vetting_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS vetted_by UUID REFERENCES team_members(id),
ADD COLUMN IF NOT EXISTS vetting_notes TEXT,
ADD COLUMN IF NOT EXISTS risk_assessment TEXT,
ADD COLUMN IF NOT EXISTS conditions TEXT[];

-- Compliance checkpoints
CREATE TABLE compliance_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  checkpoint_type TEXT NOT NULL CHECK (checkpoint_type IN
    ('data_classification', 'security_review', 'privacy_impact', 'access_control', 'encryption', 'retention_policy')),
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed', 'waived')),
  completed_by UUID REFERENCES team_members(id),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  evidence_url TEXT,
  next_review_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Approval requests
CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  request_type TEXT NOT NULL,
  requested_by UUID REFERENCES team_members(id),
  requested_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'more_info_needed')),
  reviewed_by UUID REFERENCES team_members(id),
  reviewed_at TIMESTAMPTZ,
  justification TEXT,
  review_notes TEXT
);
```

---

## Phase 2: New Hooks

| Hook File | Functions |
|-----------|-----------|
| `useProjectHealth.ts` | `useProjectHealthMetrics()`, `useProjectHealthSnapshots()`, `useCreateHealthSnapshot()` |
| `useMilestones.ts` | `useProjectMilestones()`, `useCreateMilestone()`, `useUpdateMilestone()` |
| `useEnhancedTasks.ts` | `useTaskWithDetails()`, `useAddTaskDependency()`, `useAddTaskComment()`, `useLogTime()`, `useCreateSubtask()` |
| `useDataCatalog.ts` | `useDataTypesCatalog()`, `useAddCustomDataType()`, `useProjectDataWithCatalog()` |
| `useAuditLog.ts` | `useEntityAuditLog()`, `useProjectAuditLog()`, `useLogAuditEntry()` |
| `useCompliance.ts` | `useComplianceCheckpoints()`, `useUpdateCheckpoint()`, `useTechnologyVetting()`, `useApprovalRequests()` |

---

## Phase 3: UI Components

### Project Health Components
```
src/components/projects/
  ProjectHealthDashboard.tsx    # Main health dashboard with all metrics
  HealthIndicator.tsx           # Green/Yellow/Red status badge
  RiskScoreGauge.tsx            # Visual risk score (0-100)
  BurndownChart.tsx             # Task burndown over time
  MilestoneTimeline.tsx         # Visual milestone tracker
  BudgetTracker.tsx             # Budget spent vs allocated
  ScheduleVarianceCard.tsx      # Timeline tracking
```

### Enhanced Task Components
```
src/components/tasks/
  TaskDetailPanel.tsx           # Full task view with all features
  SubtaskList.tsx               # Hierarchical subtask display
  TaskDependencySelect.tsx      # Add/manage dependencies
  TimeTrackingWidget.tsx        # Log time entries
  TaskComments.tsx              # Comment thread
  TaskAttachments.tsx           # File attachments
```

### Data Catalog Components
```
src/components/data-catalog/
  DataCatalogBrowser.tsx        # Browse master data types
  AddDataTypeDialog.tsx         # Create custom data type
  DataUsageForm.tsx             # Enhanced usage form with catalog selection
  ComplianceBadges.tsx          # Show compliance requirements (GDPR, PCI, etc.)
```

### Compliance Components
```
src/components/compliance/
  ComplianceChecklist.tsx       # Project compliance checkpoints
  TechnologyVettingCard.tsx     # Tech vetting workflow
  ApprovalRequestCard.tsx       # Approval request management
  AuditLogViewer.tsx            # Audit log timeline view
```

---

## Phase 4: Page Modifications

### ProjectDetail.tsx - New Tabs
```tsx
<TabsList>
  <TabsTrigger value="overview">Overview</TabsTrigger>
  <TabsTrigger value="health">Health</TabsTrigger>      {/* NEW */}
  <TabsTrigger value="tasks">Tasks</TabsTrigger>        {/* ENHANCED */}
  <TabsTrigger value="team">Team</TabsTrigger>
  <TabsTrigger value="meetings">Meetings</TabsTrigger>
  <TabsTrigger value="data-tech">Data & Tech</TabsTrigger>
  <TabsTrigger value="compliance">Compliance</TabsTrigger> {/* NEW */}
  <TabsTrigger value="audit">Audit Log</TabsTrigger>    {/* NEW */}
</TabsList>
```

### ProjectList.tsx - Health Column
- Add health status badge to project cards/table rows
- Color-coded: green/yellow/red
- Show task completion percentage
- Filter by health status

---

## Phase 5: Data Types Display Table

The Data & Tech tab will show data types in a table format:

| Data Type | Sensitivity | PII | Storage | Purpose | Compliance | Status |
|-----------|-------------|-----|---------|---------|------------|--------|
| Customer Data | High | Yes | Snowflake | Order processing | GDPR, CCPA | Approved |
| Product Data | Medium | No | PostgreSQL | Catalog management | - | Approved |
| Order Data | High | Yes | Snowflake | Analytics | PCI-DSS | Pending |

---

## Critical Files to Modify

| File | Changes |
|------|---------|
| `supabase/migrations/` | 4 new migration files |
| `src/integrations/supabase/types.ts` | Regenerate after migrations |
| `src/types/project-enhanced.ts` | New types file for all enhanced features |
| `src/pages/ProjectDetail.tsx` | Add Health, Compliance, Audit tabs |
| `src/pages/ProjectList.tsx` | Add health indicators to cards/rows |
| `src/components/tasks/CreateTaskDialog.tsx` | Add subtask, time estimate fields |

---

## Implementation Order

1. **Database Migrations** - Run all 4 migrations, regenerate types
2. **Core Hooks** - `useProjectHealth`, `useMilestones`, `useEnhancedTasks`
3. **Health Dashboard** - Build health visualization components
4. **Task Enhancements** - Subtasks, dependencies, time tracking, comments
5. **Data Catalog** - Master catalog + enhanced data usage forms
6. **Compliance/Audit** - Checkpoints, vetting workflow, audit log
7. **Page Integration** - Update ProjectDetail and ProjectList
8. **Testing** - End-to-end verification

---

## Verification Plan

1. **Database**: Run migrations, verify tables with `\d table_name`
2. **Health Metrics**: Create project with tasks, verify health calculations
3. **Milestones**: Create milestones, verify timeline display
4. **Tasks**: Create subtasks, add dependencies, log time, add comments
5. **Data Catalog**: Browse catalog, add custom type, assign to project
6. **Compliance**: Complete checkpoints, request technology vetting
7. **Audit Log**: Make changes, verify audit entries created
8. **Build**: Run `npm run build` to verify no TypeScript errors
