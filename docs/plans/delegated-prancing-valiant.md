# User Profile Page - Implementation Plan

## Executive Summary

Build a comprehensive User Profile Page that serves as a living source of context for employees, enabling project assignment, task planning, performance reviews, and career development. The feature follows the **long-running agent methodology** with a granular JSON feature list of 127 specifications.

---

## Requirements Summary (From Clarification Questions)

| Area | Decision |
|------|----------|
| **Edit Access** | Role-based granular (different sections have different edit permissions) |
| **Compass Input** | Manual entry + in-app appreciation language quiz |
| **Goal Rollover** | Allow incomplete goals to roll over to next quarter |
| **Goal Completion** | Both bonus goals AND extra work tracking options |
| **Capacity Calc** | Hybrid approach (system calculates, employee can override) |
| **Task Scope** | Show all projects user is on + separate section for assigned tasks |
| **Goal Progress** | All visualization options (percentage, milestone, kanban) |
| **Goal-Task Link** | Flexible linking (optional task linking with manual progress) |
| **Timeline Content** | Comprehensive log with checkbox filters for activity types |
| **1:1 Integration** | Hybrid view (summary on profile, full details in Meetings) |
| **Value Metrics** | Both qualitative notes + quantitative metrics |
| **Goal Evidence** | Rich evidence (attachments + link to tasks/commits/deliverables) |
| **Profile Fields** | Full professional (skills, interests, aspirations, work style, strengths) |
| **Career Section** | Development plan (skills to acquire, experiences, mentorship) |
| **View Access** | Manager + self only (configurable privacy) |
| **Integrations** | Design for future integrations but don't build now |
| **Compass Scope** | Full work profile (appreciation + work preferences + feedback preferences) |
| **Recommendations** | Alerts + AI suggestions + manual manager input (manager-only viewable) |
| **Benchmarking** | Team averages comparison (anonymized) |
| **Quarters** | Calendar quarters (Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec) |
| **View Modes** | Tabbed views: 'My Profile', 'Manager View', '1:1 Prep' |
| **History View** | Cumulative view (historical trends + all past quarters inline) |
| **Goal Categories** | Custom tags for flexible categorization |
| **Support Tracking** | Full peer-to-peer recognition system tied to appreciation languages |
| **Manager Dashboard** | Full dashboard (team capacity, goal progress, alerts across all reports) |
| **Org Structure** | Full org hierarchy with reporting lines |
| **MVP Scope** | Full feature set using long-running agent methodology |
| **Notifications** | In-app only (toasts and badges) |

---

## Database Schema

### New Tables (16 total)

```sql
-- 1. Core profile data
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE UNIQUE NOT NULL,
  bio TEXT,
  title TEXT,
  location TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  hire_date DATE,
  phone TEXT,
  linkedin_url TEXT,
  manager_id UUID REFERENCES team_members(id),
  privacy_settings JSONB DEFAULT '{"profile_visible": "manager_and_self", "goals_visible": "manager_and_self"}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Skills & Expertise
CREATE TABLE user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  skill_name TEXT NOT NULL,
  proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_experience DECIMAL(3,1),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Professional interests
CREATE TABLE user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  interest_name TEXT NOT NULL,
  category TEXT CHECK (category IN ('technical', 'domain', 'personal', 'other')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Compass/How I Work Best
CREATE TABLE user_work_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  -- Appreciation Language (5 Languages)
  appreciation_language_primary TEXT CHECK (appreciation_language_primary IN
    ('acts_of_service', 'quality_time', 'words_of_affirmation', 'tangible_gifts', 'physical_touch')),
  appreciation_language_secondary TEXT,
  appreciation_quiz_completed BOOLEAN DEFAULT false,
  appreciation_quiz_results JSONB,
  -- Communication Preferences
  communication_style TEXT CHECK (communication_style IN ('direct', 'collaborative', 'detailed', 'concise')),
  preferred_communication_channel TEXT CHECK (preferred_communication_channel IN ('slack', 'email', 'meeting', 'call')),
  response_time_expectation TEXT,
  -- Meeting Preferences
  meeting_preference TEXT CHECK (meeting_preference IN ('minimal', 'moderate', 'frequent')),
  preferred_meeting_times JSONB,
  max_meeting_hours_per_day INTEGER DEFAULT 4,
  -- Focus Time
  focus_hours_start TIME,
  focus_hours_end TIME,
  focus_days TEXT[],
  -- Collaboration
  collaboration_style TEXT CHECK (collaboration_style IN ('independent', 'pair_work', 'team_based', 'flexible')),
  -- Feedback Preferences
  feedback_frequency TEXT CHECK (feedback_frequency IN ('daily', 'weekly', 'bi_weekly', 'monthly')),
  feedback_style TEXT CHECK (feedback_style IN ('direct', 'sandwich', 'written', 'verbal')),
  prefers_public_recognition BOOLEAN DEFAULT true,
  -- Strengths & Weaknesses
  strengths TEXT[],
  growth_areas TEXT[],
  -- Work Style
  work_environment_preference TEXT CHECK (work_environment_preference IN ('remote', 'office', 'hybrid')),
  energy_peak_time TEXT CHECK (energy_peak_time IN ('morning', 'afternoon', 'evening')),
  decision_making_style TEXT CHECK (decision_making_style IN ('analytical', 'intuitive', 'collaborative', 'decisive')),
  stress_indicators TEXT[],
  stress_relief_methods TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Quarterly Goals
CREATE TABLE quarterly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  quarter INTEGER CHECK (quarter BETWEEN 1 AND 4),
  year INTEGER NOT NULL,
  goal_type TEXT CHECK (goal_type IN ('primary', 'bonus', 'stretch')),
  status TEXT DEFAULT 'not_started' CHECK (status IN
    ('not_started', 'in_progress', 'at_risk', 'completed', 'rolled_over', 'cancelled')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  visualization_type TEXT DEFAULT 'percentage' CHECK (visualization_type IN ('percentage', 'milestone', 'kanban')),
  milestone_stages JSONB,
  kanban_column TEXT,
  tags TEXT[],
  rolled_over_from UUID REFERENCES quarterly_goals(id),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Goal Evidence
CREATE TABLE goal_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES quarterly_goals(id) ON DELETE CASCADE NOT NULL,
  evidence_type TEXT CHECK (evidence_type IN ('attachment', 'task_link', 'commit_link', 'external_link', 'note')),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  linked_task_id UUID REFERENCES tasks(id),
  created_by UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Goal-Task Links (optional linking)
CREATE TABLE goal_task_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES quarterly_goals(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  link_type TEXT CHECK (link_type IN ('contributes_to', 'blocks', 'related')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(goal_id, task_id)
);

-- 8. Activity Timeline
CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'task_started', 'task_updated', 'task_completed', 'task_commented',
    'goal_created', 'goal_progress', 'goal_completed',
    'meeting_attended', 'meeting_organized',
    'project_joined', 'project_milestone',
    'recognition_received', 'recognition_given',
    'feedback_received', 'feedback_given'
  )),
  entity_type TEXT,
  entity_id UUID,
  entity_title TEXT,
  details JSONB,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Capacity Tracking
CREATE TABLE user_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  weekly_hours_available DECIMAL(4,1) DEFAULT 40,
  weekly_hours_override DECIMAL(4,1),
  current_utilization_percentage DECIMAL(5,2),
  calculated_at TIMESTAMPTZ,
  is_overloaded BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. 1:1 Meeting Support
CREATE TABLE one_on_one_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID REFERENCES team_members(id) NOT NULL,
  employee_id UUID REFERENCES team_members(id) NOT NULL,
  meeting_id UUID REFERENCES meetings(id),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  immediate_fires JSONB DEFAULT '[]',
  goal_updates JSONB DEFAULT '[]',
  career_discussion_notes TEXT,
  manager_support_requests JSONB DEFAULT '[]',
  action_items JSONB DEFAULT '[]',
  ai_suggested_topics JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Performance Notes (Qualitative)
CREATE TABLE performance_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES team_members(id) NOT NULL,
  note_type TEXT CHECK (note_type IN ('observation', 'feedback', 'achievement', 'concern', 'development')),
  content TEXT NOT NULL,
  visibility TEXT DEFAULT 'manager_only' CHECK (visibility IN ('manager_only', 'shared_with_employee', 'hr_only')),
  related_goal_id UUID REFERENCES quarterly_goals(id),
  related_task_id UUID REFERENCES tasks(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Performance Metrics (Quantitative)
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(10,2),
  metric_unit TEXT,
  period_start DATE,
  period_end DATE,
  source TEXT,
  calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Peer Recognition
CREATE TABLE peer_recognitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES team_members(id) NOT NULL,
  giver_id UUID REFERENCES team_members(id) NOT NULL,
  appreciation_type TEXT CHECK (appreciation_type IN
    ('acts_of_service', 'quality_time', 'words_of_affirmation', 'tangible_gifts', 'physical_touch')),
  message TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Manager Alerts
CREATE TABLE manager_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID REFERENCES team_members(id) NOT NULL,
  employee_id UUID REFERENCES team_members(id) NOT NULL,
  alert_type TEXT CHECK (alert_type IN
    ('overdue_goal', 'capacity_warning', 'missed_check_in', 'performance_concern', 'recognition_needed', 'ai_suggestion')),
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. Career Development Plans
CREATE TABLE career_development_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  current_role TEXT,
  target_role TEXT,
  target_timeline TEXT,
  skills_to_acquire JSONB DEFAULT '[]',
  experiences_needed JSONB DEFAULT '[]',
  mentors JSONB DEFAULT '[]',
  milestones JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 16. Organizational Hierarchy
CREATE TABLE org_hierarchy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES team_members(id) NOT NULL UNIQUE,
  manager_id UUID REFERENCES team_members(id),
  level INTEGER DEFAULT 0,
  path TEXT[],
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Component Architecture

```
src/
  pages/
    UserProfile.tsx              # Main profile page with tabs
    ManagerDashboard.tsx         # Manager's team dashboard
  components/
    profile/
      ProfileHeader.tsx          # Header with avatar, name, actions
      EditProfileDialog.tsx      # Edit basic profile info
      SkillsList.tsx             # Skills display and management
      AddSkillDialog.tsx         # Add new skill
      InterestsList.tsx          # Interests display
      CompassSection.tsx         # Work preferences wrapper
        AppreciationLanguageCard.tsx
        AppreciationQuiz.tsx     # 15-20 question in-app quiz
        CommunicationPreferences.tsx
        MeetingPreferences.tsx
        FocusTimePreferences.tsx
        FeedbackPreferences.tsx
        StrengthsWeaknesses.tsx
        WorkStylePreferences.tsx
      QuarterlyGoalsSection.tsx  # Goals container with quarter nav
        GoalCard.tsx
        GoalProgressPercentage.tsx
        GoalProgressMilestone.tsx
        GoalProgressKanban.tsx
        CreateGoalDialog.tsx
        GoalEvidencePanel.tsx
        GoalRolloverDialog.tsx
        GoalTaskLinker.tsx
      ActivityTimeline.tsx       # Activity feed with filters
        ActivityItem.tsx
        ActivityFilters.tsx
      CapacitySection.tsx        # Workload display
        ProjectAssignments.tsx
        AssignedTasks.tsx
      OneOnOnePrepSection.tsx    # 1:1 prep tab
        OneOnOneAgendaEditor.tsx
        OneOnOneHistory.tsx
      ManagerViewTab.tsx         # Manager-only tab
        PerformanceNotesList.tsx
        AddPerformanceNoteDialog.tsx
        PerformanceMetricsCard.tsx
        ManagerAlertsPanel.tsx
      PeerRecognitionSection.tsx
        GiveRecognitionDialog.tsx
      CareerDevelopmentSection.tsx
        CareerRoadmapVisualization.tsx
        EditCareerPlanDialog.tsx
      HistoricalQuartersView.tsx
      TrendsVisualization.tsx
      TeamAverageComparison.tsx
      ProfileSummaryCard.tsx
    manager/
      TeamOverviewCard.tsx
      TeamCapacityOverview.tsx
      TeamGoalProgress.tsx
      ManagerAlertsDashboard.tsx
    org/
      OrgChartVisualization.tsx
    shared/
      QuarterNavigator.tsx
    notifications/
      NotificationBadge.tsx
  hooks/
    useUserProfile.ts
    useUserSkills.ts
    useWorkPreferences.ts
    useQuarterlyGoals.ts
    useGoalEvidence.ts
    useActivityLog.ts
    useUserCapacity.ts
    useOneOnOne.ts
    usePerformance.ts
    usePeerRecognition.ts
    useManagerDashboard.ts
    useCareerDevelopment.ts
    useOrgHierarchy.ts
    useEditPermissions.ts
  types/
    user-profile.ts              # All profile-related types
```

---

## Implementation Phases

### Phase 1: Database Foundation
- All 16 database table migrations
- RLS policies for user_profiles, goals, performance data
- Type regeneration with `supabase gen types`

### Phase 2: Types and Hooks
- TypeScript type definitions for all entities
- 13 custom hooks for data fetching and mutations
- Label constants and helpers

### Phase 3: Core Profile Components
- UserProfilePage with tabbed layout
- ProfileHeader and EditProfileDialog
- Skills and interests management
- Complete Compass section (8 subsections + quiz)

### Phase 4: Goals and Activity
- Quarterly goals system (all 3 visualizations)
- Goal evidence and task linking
- Activity timeline with filters
- Capacity tracking and workload display
- Quarter navigation and historical view

### Phase 5: 1:1 and Performance
- 1:1 meeting preparation section
- Manager view tab with performance notes/metrics
- Peer recognition system
- Career development section

### Phase 6: Manager Dashboard
- Full manager dashboard page
- Team overview, capacity, goal progress, alerts
- Org chart visualization
- Navigation updates and routes

### Phase 7: Backend Logic and Permissions
- Capacity calculation function
- Goal progress auto-calculation
- Alert generation system
- Activity logging triggers
- Edit permission system

### Phase 8: Polish
- Unit and integration tests
- Seed data for development
- Documentation
- Future integration point design

---

## Critical Files to Reference/Modify

| File | Purpose |
|------|---------|
| `src/pages/AgentProfile.tsx` | Reference for detail page with tabs, cards, charts |
| `src/hooks/useTeamMembers.ts` | Pattern for TanStack Query hooks |
| `src/components/tasks/CreateTaskDialog.tsx` | Pattern for form dialogs |
| `src/components/projects/ProjectHealthDashboard.tsx` | Pattern for dashboard metrics |
| `src/integrations/supabase/types.ts` | Will be regenerated after migrations |
| `src/App.tsx` | Add new routes for profile pages |
| `src/components/Navigation.tsx` | Add profile links |

---

## Feature List Summary

**Total Features: 127**

| Phase | Category | Feature Count |
|-------|----------|---------------|
| 1 | Database | 17 |
| 2 | Types | 7 |
| 2 | Hooks | 13 |
| 3 | Core Components | 15 |
| 4 | Goals & Activity | 16 |
| 5 | 1:1 & Performance | 13 |
| 6 | Manager Dashboard | 8 |
| 7 | Backend Logic | 10 |
| 8 | Testing & Polish | 6 |
| - | Navigation | 2 |
| - | Notifications | 2 |
| - | Security/RLS | 3 |
| - | Permissions | 1 |

---

## Verification Steps

1. **Database**: Run migrations, verify all tables exist with correct constraints
2. **Types**: Regenerate Supabase types, verify no TypeScript errors
3. **Hooks**: Test each hook can fetch/mutate data
4. **Components**: Manually test each component renders correctly
5. **Permissions**: Verify self can see own profile, manager can see reports, others cannot
6. **Goals**: Test all 3 visualization types, rollover, evidence upload
7. **Activity**: Test timeline loads, filters work, infinite scroll works
8. **Compass**: Take the appreciation quiz, verify results save
9. **1:1**: Create meeting, verify agenda sections editable
10. **Manager Dashboard**: Verify manager sees all direct reports, alerts show
11. **End-to-end**: Full user journey from creating profile to quarterly review

---

## Long-Running Agent Methodology Notes

Following the Anthropic engineering blog guidelines:

1. **Feature list as specification**: The 127 features above serve as the granular spec with steps and verification criteria
2. **Checkpointing**: Use `claude-progress.txt` to track completed features
3. **Single-feature sessions**: Each coding session should complete 1-3 related features
4. **Git commits**: Create descriptive commits after each feature completion
5. **End-to-end verification**: Test features using browser after implementation
6. **Init script**: Create `init.sh` to set up dev environment quickly

---

## Long-Running Agent Infrastructure Files

### File 1: `user-profile-features.json`

This JSON feature list serves as the granular specification. Each feature has steps and verification criteria.

```json
{
  "projectName": "User Profile Page",
  "version": "1.0.0",
  "totalFeatures": 127,
  "phases": 8,
  "createdAt": "2026-01-10",
  "features": [
    {
      "id": "DB-001",
      "name": "Create user_profiles table",
      "description": "Create the core user_profiles table with basic profile fields, manager relationship, and privacy settings",
      "category": "Database",
      "phase": 1,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create migration file 20260111000000_user_profiles.sql",
        "Define table with id, team_member_id FK, bio, title, location, timezone, hire_date, phone, linkedin_url, manager_id FK, privacy_settings JSONB",
        "Add created_at and updated_at timestamps",
        "Create unique constraint on team_member_id",
        "Create indexes for manager_id and team_member_id",
        "Enable RLS and create appropriate policies"
      ],
      "verificationCriteria": [
        "Table exists in database",
        "Foreign key to team_members works",
        "Self-referential manager_id FK works",
        "RLS policies allow appropriate access"
      ],
      "dependencies": []
    },
    {
      "id": "DB-002",
      "name": "Create user_skills table",
      "description": "Create table for storing user skills with proficiency levels",
      "category": "Database",
      "phase": 1,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create migration file or add to existing",
        "Define table with profile_id FK, skill_name, proficiency_level enum, years_experience, is_primary",
        "Add indexes on profile_id",
        "Enable RLS"
      ],
      "verificationCriteria": [
        "Table accepts skill entries",
        "Proficiency level constraint works",
        "Cascade delete works with profile"
      ],
      "dependencies": ["DB-001"]
    },
    {
      "id": "DB-003",
      "name": "Create user_interests table",
      "description": "Create table for professional interests categorized by type",
      "category": "Database",
      "phase": 1,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Define table with profile_id FK, interest_name, category enum",
        "Add indexes and RLS"
      ],
      "verificationCriteria": [
        "Categories work correctly",
        "CRUD operations successful"
      ],
      "dependencies": ["DB-001"]
    },
    {
      "id": "DB-004",
      "name": "Create user_work_preferences table (Compass)",
      "description": "Create comprehensive work preferences table with appreciation language, communication, meeting, focus, collaboration, and feedback preferences",
      "category": "Database",
      "phase": 1,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create table with all compass fields",
        "Add appreciation_language_primary and secondary with enum constraint",
        "Add appreciation_quiz_completed boolean and quiz_results JSONB",
        "Add communication_style, preferred_channel, response_time fields",
        "Add meeting preferences including times JSONB and max hours",
        "Add focus hours (start, end times) and focus_days array",
        "Add collaboration_style and feedback preference fields",
        "Add strengths and growth_areas as TEXT arrays",
        "Add work environment, energy peak time, decision making style",
        "Add stress indicators and relief methods arrays",
        "Create unique constraint on profile_id (one-to-one)"
      ],
      "verificationCriteria": [
        "All enum constraints work",
        "JSONB fields accept valid JSON",
        "One-to-one relationship enforced",
        "All field types are correct"
      ],
      "dependencies": ["DB-001"]
    },
    {
      "id": "DB-005",
      "name": "Create quarterly_goals table",
      "description": "Create table for quarterly goals with progress tracking, rollover support, and multiple visualization options",
      "category": "Database",
      "phase": 1,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create table with profile_id FK, title, description",
        "Add quarter (1-4 constraint) and year fields",
        "Add goal_type enum (primary, bonus, stretch)",
        "Add status enum with rollover and cancelled options",
        "Add progress_percentage with 0-100 constraint",
        "Add visualization_type enum (percentage, milestone, kanban)",
        "Add milestone_stages JSONB for milestone view",
        "Add kanban_column for kanban view",
        "Add tags array",
        "Add rolled_over_from self-referential FK",
        "Add order_index for ordering",
        "Create indexes on profile_id, quarter/year, status"
      ],
      "verificationCriteria": [
        "Goals can be created with all types",
        "Rollover FK works correctly",
        "Quarter constraint enforced",
        "All visualization types work"
      ],
      "dependencies": ["DB-001"]
    },
    {
      "id": "DB-006",
      "name": "Create goal_evidence table",
      "description": "Create table for goal evidence including attachments, task links, and external references",
      "category": "Database",
      "phase": 1,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create table with goal_id FK",
        "Add evidence_type enum",
        "Add title, description, url fields",
        "Add file fields (path, name, size, mime_type)",
        "Add linked_task_id FK to tasks",
        "Add created_by FK to team_members",
        "Create index on goal_id"
      ],
      "verificationCriteria": [
        "All evidence types can be stored",
        "File metadata stored correctly",
        "Task linking works"
      ],
      "dependencies": ["DB-005"]
    },
    {
      "id": "DB-007",
      "name": "Create goal_task_links table",
      "description": "Create junction table for optional task-goal linking with link types",
      "category": "Database",
      "phase": 1,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create table with goal_id and task_id FKs",
        "Add link_type enum (contributes_to, blocks, related)",
        "Add unique constraint on goal_id + task_id",
        "Create indexes"
      ],
      "verificationCriteria": [
        "Many-to-many relationship works",
        "Unique constraint prevents duplicates",
        "Cascade deletes work"
      ],
      "dependencies": ["DB-005"]
    },
    {
      "id": "DB-008",
      "name": "Create user_activity_log table",
      "description": "Create comprehensive activity log for timeline with all activity types",
      "category": "Database",
      "phase": 1,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create table with profile_id FK",
        "Add activity_type with comprehensive enum",
        "Add entity_type, entity_id, entity_title for references",
        "Add details JSONB for extra info",
        "Add occurred_at timestamp (separate from created_at)",
        "Create indexes on profile_id, activity_type, occurred_at",
        "Create composite index for efficient timeline queries"
      ],
      "verificationCriteria": [
        "All activity types work",
        "Timeline queries are efficient",
        "Filtering works correctly"
      ],
      "dependencies": ["DB-001"]
    },
    {
      "id": "DB-009",
      "name": "Create user_capacity table",
      "description": "Create table for tracking workload capacity with system calculation and employee override",
      "category": "Database",
      "phase": 1,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create table with profile_id FK (unique)",
        "Add weekly_hours_available default 40",
        "Add weekly_hours_override for employee overrides",
        "Add current_utilization_percentage",
        "Add calculated_at timestamp",
        "Add is_overloaded boolean flag",
        "Add notes field"
      ],
      "verificationCriteria": [
        "One-to-one relationship enforced",
        "Override supersedes calculated values",
        "Utilization percentage calculated correctly"
      ],
      "dependencies": ["DB-001"]
    },
    {
      "id": "DB-010",
      "name": "Create one_on_one_meetings table",
      "description": "Create table for 1:1 meeting support with agenda sections and AI suggestions",
      "category": "Database",
      "phase": 1,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create table with manager_id and employee_id FKs",
        "Add optional meeting_id FK to existing meetings table",
        "Add status enum",
        "Add immediate_fires, goal_updates, manager_support_requests as JSONB arrays",
        "Add career_discussion_notes text",
        "Add action_items JSONB",
        "Add ai_suggested_topics JSONB",
        "Create indexes"
      ],
      "verificationCriteria": [
        "1:1 meetings link to regular meetings",
        "JSONB arrays work for agenda items",
        "Manager-employee relationship enforced"
      ],
      "dependencies": ["DB-001"]
    },
    {
      "id": "DB-011",
      "name": "Create performance_notes table",
      "description": "Create table for qualitative performance feedback with visibility controls",
      "category": "Database",
      "phase": 1,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create table with profile_id FK",
        "Add author_id FK to team_members",
        "Add note_type enum",
        "Add content text",
        "Add visibility enum (manager_only, shared, hr_only)",
        "Add optional related_goal_id and related_task_id FKs",
        "Create indexes"
      ],
      "verificationCriteria": [
        "Visibility controls work",
        "Linking to goals and tasks works",
        "Author tracking works"
      ],
      "dependencies": ["DB-001"]
    },
    {
      "id": "DB-012",
      "name": "Create performance_metrics table",
      "description": "Create table for quantitative performance metrics with periods and sources",
      "category": "Database",
      "phase": 1,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create table with profile_id FK",
        "Add metric_name, metric_value, metric_unit",
        "Add period_start and period_end dates",
        "Add source field",
        "Add calculated_at timestamp",
        "Create indexes for efficient querying"
      ],
      "verificationCriteria": [
        "Metrics can be stored and retrieved",
        "Period-based queries work",
        "Different sources tracked"
      ],
      "dependencies": ["DB-001"]
    },
    {
      "id": "DB-013",
      "name": "Create peer_recognitions table",
      "description": "Create table for peer recognition tied to appreciation languages",
      "category": "Database",
      "phase": 1,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create table with recipient_id and giver_id FKs",
        "Add appreciation_type enum matching 5 languages",
        "Add message text",
        "Add is_public boolean",
        "Create indexes"
      ],
      "verificationCriteria": [
        "Recognition types match appreciation languages",
        "Public/private visibility works",
        "Recipient and giver tracking works"
      ],
      "dependencies": ["DB-001"]
    },
    {
      "id": "DB-014",
      "name": "Create manager_alerts table",
      "description": "Create table for manager dashboard alerts including AI suggestions",
      "category": "Database",
      "phase": 1,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create table with manager_id and employee_id FKs",
        "Add alert_type enum",
        "Add title, description",
        "Add severity enum",
        "Add is_read and is_dismissed booleans",
        "Create indexes for efficient dashboard queries"
      ],
      "verificationCriteria": [
        "Alerts show for correct manager",
        "Read/dismiss status works",
        "Severity levels work"
      ],
      "dependencies": ["DB-001"]
    },
    {
      "id": "DB-015",
      "name": "Create career_development_plans table",
      "description": "Create table for career roadmap with skills, experiences, mentors, and milestones",
      "category": "Database",
      "phase": 1,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create table with profile_id FK (unique)",
        "Add current_role and target_role",
        "Add target_timeline",
        "Add skills_to_acquire, experiences_needed, mentors, milestones as JSONB",
        "Add notes text",
        "Create index"
      ],
      "verificationCriteria": [
        "Career plan links to profile",
        "JSONB fields store complex data",
        "One-to-one relationship enforced"
      ],
      "dependencies": ["DB-001"]
    },
    {
      "id": "DB-016",
      "name": "Create org_hierarchy table",
      "description": "Create table for organizational hierarchy and reporting lines",
      "category": "Database",
      "phase": 1,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create table with employee_id FK (unique)",
        "Add manager_id FK (nullable for top level)",
        "Add level integer",
        "Add path array for hierarchical queries",
        "Add effective_from and effective_to dates",
        "Create indexes for hierarchy traversal"
      ],
      "verificationCriteria": [
        "Hierarchy queries work efficiently",
        "Path array enables ancestor/descendant queries",
        "Time-based relationships work"
      ],
      "dependencies": []
    },
    {
      "id": "DB-017",
      "name": "Run all migrations and regenerate types",
      "description": "Execute all migrations and regenerate Supabase TypeScript types",
      "category": "Database",
      "phase": 1,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Run supabase db push or supabase migration up",
        "Run supabase gen types typescript to regenerate types",
        "Verify types file includes all new tables",
        "Commit generated types"
      ],
      "verificationCriteria": [
        "All tables exist in database",
        "TypeScript types generated correctly",
        "No type errors in IDE"
      ],
      "dependencies": ["DB-001", "DB-002", "DB-003", "DB-004", "DB-005", "DB-006", "DB-007", "DB-008", "DB-009", "DB-010", "DB-011", "DB-012", "DB-013", "DB-014", "DB-015", "DB-016"]
    },
    {
      "id": "TYPE-001",
      "name": "Create user profile TypeScript types",
      "description": "Create comprehensive TypeScript types for all user profile related entities",
      "category": "Types",
      "phase": 2,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/types/user-profile.ts",
        "Define UserProfile interface with all fields",
        "Define UserSkill interface",
        "Define UserInterest interface",
        "Define privacy settings type",
        "Export all types"
      ],
      "verificationCriteria": [
        "Types compile without errors",
        "Types match database schema",
        "All fields are properly typed"
      ],
      "dependencies": ["DB-017"]
    },
    {
      "id": "TYPE-002",
      "name": "Create work preferences (Compass) types",
      "description": "Create TypeScript types for the Compass/How I Work Best section",
      "category": "Types",
      "phase": 2,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Define AppreciationLanguage union type",
        "Define CommunicationStyle, MeetingPreference enums",
        "Define FeedbackPreference types",
        "Define WorkPreferences interface",
        "Define AppreciationQuizResult interface"
      ],
      "verificationCriteria": [
        "All enum values match database",
        "Quiz result type is flexible for quiz logic"
      ],
      "dependencies": ["DB-017"]
    },
    {
      "id": "TYPE-003",
      "name": "Create quarterly goals types",
      "description": "Create TypeScript types for goals, evidence, and task links",
      "category": "Types",
      "phase": 2,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Define QuarterlyGoal interface",
        "Define GoalStatus, GoalType, VisualizationType enums",
        "Define MilestoneStage interface for milestone view",
        "Define GoalEvidence interface",
        "Define GoalTaskLink interface",
        "Define helper types for quarter calculations"
      ],
      "verificationCriteria": [
        "All visualization types supported",
        "Evidence types are flexible",
        "Quarter helpers work correctly"
      ],
      "dependencies": ["DB-017"]
    },
    {
      "id": "TYPE-004",
      "name": "Create activity and capacity types",
      "description": "Create TypeScript types for activity log and capacity tracking",
      "category": "Types",
      "phase": 2,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Define ActivityType union type with all activity types",
        "Define UserActivityLog interface",
        "Define ActivityFilter interface for filtering",
        "Define UserCapacity interface",
        "Define CapacityOverride interface"
      ],
      "verificationCriteria": [
        "All activity types defined",
        "Filter type supports all filter options"
      ],
      "dependencies": ["DB-017"]
    },
    {
      "id": "TYPE-005",
      "name": "Create performance and 1:1 types",
      "description": "Create TypeScript types for performance tracking and 1:1 meetings",
      "category": "Types",
      "phase": 2,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Define OneOnOneMeeting interface",
        "Define PerformanceNote interface with visibility",
        "Define PerformanceMetric interface",
        "Define PeerRecognition interface",
        "Define ManagerAlert interface"
      ],
      "verificationCriteria": [
        "Types support all visibility levels",
        "Alert types comprehensive"
      ],
      "dependencies": ["DB-017"]
    },
    {
      "id": "TYPE-006",
      "name": "Create career development types",
      "description": "Create TypeScript types for career development and org hierarchy",
      "category": "Types",
      "phase": 2,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Define CareerDevelopmentPlan interface",
        "Define SkillToAcquire, ExperienceNeeded, Mentor interfaces",
        "Define OrgHierarchy interface",
        "Define OrgNode for tree visualization"
      ],
      "verificationCriteria": [
        "Career plan supports complex structures",
        "Org hierarchy supports tree rendering"
      ],
      "dependencies": ["DB-017"]
    },
    {
      "id": "TYPE-007",
      "name": "Create label constants and helpers",
      "description": "Create label constants for all enums similar to MEETING_TYPE_LABELS pattern",
      "category": "Types",
      "phase": 2,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create APPRECIATION_LANGUAGE_LABELS",
        "Create COMMUNICATION_STYLE_LABELS",
        "Create GOAL_STATUS_LABELS",
        "Create ACTIVITY_TYPE_LABELS",
        "Create ALERT_TYPE_LABELS",
        "Create helper functions for quarter calculation"
      ],
      "verificationCriteria": [
        "Labels match design requirements",
        "Helpers calculate quarters correctly"
      ],
      "dependencies": ["TYPE-001", "TYPE-002", "TYPE-003", "TYPE-004", "TYPE-005"]
    },
    {
      "id": "HOOK-001",
      "name": "Create useUserProfile hook",
      "description": "Create custom hook for fetching and managing user profile data",
      "category": "Hooks",
      "phase": 2,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/hooks/useUserProfile.ts",
        "Implement useUserProfile(teamMemberId) query",
        "Include related skills, interests, work preferences in query",
        "Implement useCreateUserProfile mutation",
        "Implement useUpdateUserProfile mutation",
        "Add proper query key management"
      ],
      "verificationCriteria": [
        "Profile loads with nested data",
        "Mutations invalidate correctly",
        "Error handling works"
      ],
      "dependencies": ["TYPE-001", "DB-017"]
    },
    {
      "id": "HOOK-002",
      "name": "Create useUserSkills hook",
      "description": "Create custom hook for managing user skills",
      "category": "Hooks",
      "phase": 2,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create useUserSkills(profileId) query",
        "Implement useAddSkill mutation",
        "Implement useUpdateSkill mutation",
        "Implement useRemoveSkill mutation",
        "Implement useSetPrimarySkill mutation"
      ],
      "verificationCriteria": [
        "CRUD operations work",
        "Primary skill toggle works",
        "List updates after mutations"
      ],
      "dependencies": ["TYPE-001", "DB-017"]
    },
    {
      "id": "HOOK-003",
      "name": "Create useWorkPreferences hook",
      "description": "Create custom hook for Compass/work preferences data",
      "category": "Hooks",
      "phase": 2,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create useWorkPreferences(profileId) query",
        "Implement useUpdateWorkPreferences mutation",
        "Implement useSubmitAppreciationQuiz mutation",
        "Add validation for preference updates"
      ],
      "verificationCriteria": [
        "Preferences load correctly",
        "Quiz submission saves results",
        "Partial updates work"
      ],
      "dependencies": ["TYPE-002", "DB-017"]
    },
    {
      "id": "HOOK-004",
      "name": "Create useQuarterlyGoals hook",
      "description": "Create custom hook for quarterly goals with filtering",
      "category": "Hooks",
      "phase": 2,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create useQuarterlyGoals(profileId, quarter?, year?) query",
        "Implement useCreateGoal mutation",
        "Implement useUpdateGoal mutation",
        "Implement useUpdateGoalProgress mutation",
        "Implement useRolloverGoal mutation",
        "Implement useDeleteGoal mutation",
        "Add getCurrentQuarter helper"
      ],
      "verificationCriteria": [
        "Goals filter by quarter/year",
        "Rollover creates new goal with FK",
        "Progress updates work"
      ],
      "dependencies": ["TYPE-003", "DB-017"]
    },
    {
      "id": "HOOK-005",
      "name": "Create useGoalEvidence hook",
      "description": "Create custom hook for managing goal evidence and attachments",
      "category": "Hooks",
      "phase": 2,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create useGoalEvidence(goalId) query",
        "Implement useAddEvidence mutation",
        "Implement useRemoveEvidence mutation",
        "Add file upload handling integration",
        "Implement useLinkTaskToGoal mutation"
      ],
      "verificationCriteria": [
        "Evidence loads for goal",
        "File uploads tracked",
        "Task linking works"
      ],
      "dependencies": ["TYPE-003", "DB-017"]
    },
    {
      "id": "HOOK-006",
      "name": "Create useActivityLog hook",
      "description": "Create custom hook for activity timeline with filtering",
      "category": "Hooks",
      "phase": 2,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create useActivityLog(profileId, filters?) query with pagination",
        "Add filter support for activity types",
        "Add date range filtering",
        "Implement infinite scroll support",
        "Create useLogActivity mutation for recording new activities"
      ],
      "verificationCriteria": [
        "Timeline loads with infinite scroll",
        "Filters work correctly",
        "Activity recording works"
      ],
      "dependencies": ["TYPE-004", "DB-017"]
    },
    {
      "id": "HOOK-007",
      "name": "Create useUserCapacity hook",
      "description": "Create custom hook for capacity and workload data",
      "category": "Hooks",
      "phase": 2,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create useUserCapacity(profileId) query",
        "Implement useUpdateCapacityOverride mutation",
        "Create useCalculateCapacity for system calculation",
        "Create useTeamCapacityAverage for comparison"
      ],
      "verificationCriteria": [
        "Capacity loads correctly",
        "Override supersedes calculated",
        "Team average anonymized"
      ],
      "dependencies": ["TYPE-004", "DB-017"]
    },
    {
      "id": "HOOK-008",
      "name": "Create useOneOnOne hook",
      "description": "Create custom hook for 1:1 meeting support",
      "category": "Hooks",
      "phase": 2,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create useOneOnOneMeetings(employeeId) query",
        "Create useUpcomingOneOnOne(employeeId) query",
        "Implement useCreateOneOnOne mutation",
        "Implement useUpdateOneOnOneAgenda mutation",
        "Implement useSaveOneOnOneNotes mutation"
      ],
      "verificationCriteria": [
        "1:1s linked to regular meetings",
        "Agenda sections editable",
        "Notes save correctly"
      ],
      "dependencies": ["TYPE-005", "DB-017"]
    },
    {
      "id": "HOOK-009",
      "name": "Create usePerformance hook",
      "description": "Create custom hook for performance notes and metrics",
      "category": "Hooks",
      "phase": 2,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create usePerformanceNotes(profileId, visibility?) query",
        "Create usePerformanceMetrics(profileId, period?) query",
        "Implement useAddPerformanceNote mutation",
        "Implement useAddPerformanceMetric mutation"
      ],
      "verificationCriteria": [
        "Visibility filtering works",
        "Period filtering works",
        "Only authorized users see manager-only notes"
      ],
      "dependencies": ["TYPE-005", "DB-017"]
    },
    {
      "id": "HOOK-010",
      "name": "Create usePeerRecognition hook",
      "description": "Create custom hook for peer recognition",
      "category": "Hooks",
      "phase": 2,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create useRecognitionsReceived(recipientId) query",
        "Create useRecognitionsGiven(giverId) query",
        "Implement useGiveRecognition mutation",
        "Add appreciation type filtering"
      ],
      "verificationCriteria": [
        "Recognition lists work",
        "Giving recognition works",
        "Appreciation types match languages"
      ],
      "dependencies": ["TYPE-005", "DB-017"]
    },
    {
      "id": "HOOK-011",
      "name": "Create useManagerDashboard hook",
      "description": "Create custom hook for manager dashboard data",
      "category": "Hooks",
      "phase": 2,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create useDirectReports(managerId) query",
        "Create useManagerAlerts(managerId) query",
        "Create useTeamGoalProgress(managerId) query",
        "Create useTeamCapacity(managerId) query",
        "Implement useDismissAlert mutation",
        "Implement useMarkAlertRead mutation"
      ],
      "verificationCriteria": [
        "All reports load correctly",
        "Alerts show for direct reports only",
        "Alert management works"
      ],
      "dependencies": ["TYPE-005", "DB-017"]
    },
    {
      "id": "HOOK-012",
      "name": "Create useCareerDevelopment hook",
      "description": "Create custom hook for career development plans",
      "category": "Hooks",
      "phase": 2,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create useCareerPlan(profileId) query",
        "Implement useUpdateCareerPlan mutation",
        "Implement useAddCareerMilestone mutation",
        "Implement useUpdateSkillProgress mutation"
      ],
      "verificationCriteria": [
        "Career plan loads correctly",
        "Complex JSONB updates work",
        "Skill progress tracking works"
      ],
      "dependencies": ["TYPE-006", "DB-017"]
    },
    {
      "id": "HOOK-013",
      "name": "Create useOrgHierarchy hook",
      "description": "Create custom hook for organizational hierarchy",
      "category": "Hooks",
      "phase": 2,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create useOrgHierarchy() query for full tree",
        "Create useTeamHierarchy(managerId) for subtree",
        "Create useReportingChain(employeeId) for upward chain",
        "Add tree data structure helpers"
      ],
      "verificationCriteria": [
        "Full hierarchy loads",
        "Subtree queries work",
        "Chain traversal works"
      ],
      "dependencies": ["TYPE-006", "DB-017"]
    },
    {
      "id": "COMP-001",
      "name": "Create UserProfilePage component",
      "description": "Create main page component with tabbed layout (My Profile, Manager View, 1:1 Prep)",
      "category": "Components",
      "phase": 3,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/pages/UserProfile.tsx",
        "Add route in App.tsx: /profile/:id",
        "Implement header with avatar, name, role, department",
        "Add Tabs component with 3 tabs",
        "Implement tab content switching",
        "Add loading skeleton",
        "Add permission check for Manager View tab"
      ],
      "verificationCriteria": [
        "Page renders correctly",
        "Tabs switch content",
        "Manager tab hidden for non-managers",
        "URL updates with tab"
      ],
      "dependencies": ["HOOK-001"]
    },
    {
      "id": "COMP-002",
      "name": "Create ProfileHeader component",
      "description": "Create profile header with avatar, basic info, and edit controls",
      "category": "Components",
      "phase": 3,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/ProfileHeader.tsx",
        "Add large avatar with fallback initials",
        "Display name, title, department, location",
        "Add timezone display",
        "Add Edit Profile button (conditionally visible)",
        "Add manager link",
        "Add hire date and tenure calculation"
      ],
      "verificationCriteria": [
        "Header displays all info",
        "Edit only visible to self/manager",
        "Tenure calculates correctly"
      ],
      "dependencies": ["HOOK-001"]
    },
    {
      "id": "COMP-003",
      "name": "Create EditProfileDialog component",
      "description": "Create dialog for editing basic profile information",
      "category": "Components",
      "phase": 3,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/EditProfileDialog.tsx",
        "Use react-hook-form with Zod validation",
        "Add fields for bio, title, location, timezone, phone, linkedin",
        "Add form validation",
        "Implement save with mutation",
        "Add loading states"
      ],
      "verificationCriteria": [
        "Form validates correctly",
        "Save updates profile",
        "Dialog closes on success"
      ],
      "dependencies": ["HOOK-001", "COMP-002"]
    },
    {
      "id": "COMP-004",
      "name": "Create SkillsList component",
      "description": "Create component for displaying and managing skills",
      "category": "Components",
      "phase": 3,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/SkillsList.tsx",
        "Display skills as badges with proficiency indicator",
        "Highlight primary skills",
        "Add Add Skill button when editable",
        "Implement inline skill removal",
        "Add empty state"
      ],
      "verificationCriteria": [
        "Skills display correctly",
        "Proficiency levels shown",
        "Add/remove works"
      ],
      "dependencies": ["HOOK-002"]
    },
    {
      "id": "COMP-005",
      "name": "Create AddSkillDialog component",
      "description": "Create dialog for adding new skills",
      "category": "Components",
      "phase": 3,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/AddSkillDialog.tsx",
        "Add skill name input with autocomplete suggestions",
        "Add proficiency level select",
        "Add years experience input",
        "Add is_primary checkbox",
        "Implement form validation"
      ],
      "verificationCriteria": [
        "Skill added successfully",
        "Validation prevents duplicates",
        "Autocomplete helps discovery"
      ],
      "dependencies": ["HOOK-002"]
    },
    {
      "id": "COMP-006",
      "name": "Create InterestsList component",
      "description": "Create component for displaying professional interests",
      "category": "Components",
      "phase": 3,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create src/components/profile/InterestsList.tsx",
        "Display interests grouped by category",
        "Add category badges",
        "Add edit capabilities when allowed"
      ],
      "verificationCriteria": [
        "Interests grouped correctly",
        "Categories distinguishable"
      ],
      "dependencies": ["HOOK-001"]
    },
    {
      "id": "COMP-007",
      "name": "Create CompassSection component (Wrapper)",
      "description": "Create main wrapper component for How I Work Best section",
      "category": "Components",
      "phase": 3,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/CompassSection.tsx",
        "Add collapsible card layout",
        "Include AppreciationLanguage subsection",
        "Include CommunicationPreferences subsection",
        "Include MeetingPreferences subsection",
        "Include FocusTime subsection",
        "Include FeedbackPreferences subsection",
        "Include StrengthsWeaknesses subsection"
      ],
      "verificationCriteria": [
        "All subsections render",
        "Collapsible sections work",
        "Edit mode toggles all"
      ],
      "dependencies": ["HOOK-003"]
    },
    {
      "id": "COMP-008",
      "name": "Create AppreciationLanguageCard component",
      "description": "Create component displaying appreciation language with quiz option",
      "category": "Components",
      "phase": 3,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/AppreciationLanguageCard.tsx",
        "Display primary and secondary languages with icons",
        "Add description of what each language means",
        "Add Take Quiz button if not completed",
        "Add Retake Quiz option if completed",
        "Show manual selection alternative",
        "Add visual representation (bars, icons)"
      ],
      "verificationCriteria": [
        "Languages display clearly",
        "Quiz completion status shown",
        "Manual selection works"
      ],
      "dependencies": ["HOOK-003"]
    },
    {
      "id": "COMP-009",
      "name": "Create AppreciationQuiz component",
      "description": "Create in-app quiz for determining appreciation language",
      "category": "Components",
      "phase": 3,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/AppreciationQuiz.tsx",
        "Design 15-20 scenario-based questions",
        "Implement step-by-step wizard UI",
        "Add progress indicator",
        "Calculate scores for each language",
        "Determine primary and secondary",
        "Display results with explanations",
        "Save results to database"
      ],
      "verificationCriteria": [
        "Quiz flows smoothly",
        "Scoring algorithm correct",
        "Results save and display"
      ],
      "dependencies": ["HOOK-003"]
    },
    {
      "id": "COMP-010",
      "name": "Create CommunicationPreferences component",
      "description": "Create component for communication style preferences",
      "category": "Components",
      "phase": 3,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/CommunicationPreferences.tsx",
        "Add communication style selector with descriptions",
        "Add preferred channel selector",
        "Add response time expectation input",
        "Add visual icons for channels"
      ],
      "verificationCriteria": [
        "All options selectable",
        "Clear descriptions shown",
        "Updates save correctly"
      ],
      "dependencies": ["HOOK-003"]
    },
    {
      "id": "COMP-011",
      "name": "Create MeetingPreferences component",
      "description": "Create component for meeting preferences and availability",
      "category": "Components",
      "phase": 3,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/MeetingPreferences.tsx",
        "Add meeting frequency preference selector",
        "Add max meetings per day input",
        "Add preferred meeting times grid (by day/time)",
        "Add visual weekly calendar preview"
      ],
      "verificationCriteria": [
        "Time grid is intuitive",
        "Preferences save correctly",
        "Calendar preview accurate"
      ],
      "dependencies": ["HOOK-003"]
    },
    {
      "id": "COMP-012",
      "name": "Create FocusTimePreferences component",
      "description": "Create component for focus hours and deep work preferences",
      "category": "Components",
      "phase": 3,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/FocusTimePreferences.tsx",
        "Add focus hours start/end time pickers",
        "Add focus days multi-select",
        "Add visual representation of focus blocks",
        "Add Do Not Disturb indicator explanation"
      ],
      "verificationCriteria": [
        "Time selection intuitive",
        "Days multi-select works",
        "Visual is clear"
      ],
      "dependencies": ["HOOK-003"]
    },
    {
      "id": "COMP-013",
      "name": "Create FeedbackPreferences component",
      "description": "Create component for feedback frequency and style preferences",
      "category": "Components",
      "phase": 3,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/FeedbackPreferences.tsx",
        "Add feedback frequency selector",
        "Add feedback style preference selector",
        "Add public recognition toggle",
        "Add descriptions for each option"
      ],
      "verificationCriteria": [
        "All options work",
        "Toggle saves correctly",
        "Descriptions are helpful"
      ],
      "dependencies": ["HOOK-003"]
    },
    {
      "id": "COMP-014",
      "name": "Create StrengthsWeaknesses component",
      "description": "Create component for strengths and growth areas",
      "category": "Components",
      "phase": 3,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/StrengthsWeaknesses.tsx",
        "Add strengths list with add/remove capability",
        "Add growth areas list with add/remove capability",
        "Use tag-style input for easy entry",
        "Add suggestions/autocomplete"
      ],
      "verificationCriteria": [
        "Tags add/remove smoothly",
        "Suggestions helpful",
        "Lists save correctly"
      ],
      "dependencies": ["HOOK-003"]
    },
    {
      "id": "COMP-015",
      "name": "Create WorkStylePreferences component",
      "description": "Create component for work environment and style preferences",
      "category": "Components",
      "phase": 3,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create src/components/profile/WorkStylePreferences.tsx",
        "Add work environment preference selector",
        "Add energy peak time selector",
        "Add decision making style selector",
        "Add stress indicators and relief methods inputs"
      ],
      "verificationCriteria": [
        "All selectors work",
        "Stress items editable",
        "Saves correctly"
      ],
      "dependencies": ["HOOK-003"]
    },
    {
      "id": "COMP-016",
      "name": "Create QuarterlyGoalsSection component",
      "description": "Create main container for quarterly goals with quarter navigation",
      "category": "Components",
      "phase": 4,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/QuarterlyGoalsSection.tsx",
        "Add quarter selector (Q1-Q4) and year selector",
        "Display current quarter prominently",
        "Add Add Goal button with limit check (max 3 primary)",
        "Show rollover indicator for inherited goals",
        "Add visualization toggle (percentage/milestone/kanban)"
      ],
      "verificationCriteria": [
        "Quarter navigation works",
        "Goal limit enforced",
        "Visualization toggle works"
      ],
      "dependencies": ["HOOK-004"]
    },
    {
      "id": "COMP-017",
      "name": "Create GoalCard component",
      "description": "Create individual goal card with progress tracking",
      "category": "Components",
      "phase": 4,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/GoalCard.tsx",
        "Display title, description, status badge",
        "Add goal type indicator (primary/bonus/stretch)",
        "Show progress based on visualization type",
        "Add tags display",
        "Add rollover indicator if applicable",
        "Add quick actions (edit, rollover, delete)"
      ],
      "verificationCriteria": [
        "All info displays correctly",
        "Progress visualization accurate",
        "Actions work"
      ],
      "dependencies": ["HOOK-004"]
    },
    {
      "id": "COMP-018",
      "name": "Create GoalProgressPercentage component",
      "description": "Create percentage-based progress visualization",
      "category": "Components",
      "phase": 4,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/GoalProgressPercentage.tsx",
        "Add circular or linear progress bar",
        "Add percentage number display",
        "Add color coding based on progress",
        "Add inline edit capability for updating percentage"
      ],
      "verificationCriteria": [
        "Progress renders correctly",
        "Color coding works",
        "Inline edit saves"
      ],
      "dependencies": ["HOOK-004"]
    },
    {
      "id": "COMP-019",
      "name": "Create GoalProgressMilestone component",
      "description": "Create milestone/stage-based progress visualization",
      "category": "Components",
      "phase": 4,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/GoalProgressMilestone.tsx",
        "Add horizontal milestone timeline",
        "Show completed vs pending stages",
        "Allow clicking to mark stages complete",
        "Add stage name labels"
      ],
      "verificationCriteria": [
        "Stages display correctly",
        "Click to complete works",
        "Visual timeline clear"
      ],
      "dependencies": ["HOOK-004"]
    },
    {
      "id": "COMP-020",
      "name": "Create GoalProgressKanban component",
      "description": "Create kanban-style progress visualization",
      "category": "Components",
      "phase": 4,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/GoalProgressKanban.tsx",
        "Add three columns: To Do, In Progress, Done",
        "Display goal card in appropriate column",
        "Enable drag-and-drop between columns",
        "Save column position on drop"
      ],
      "verificationCriteria": [
        "Columns render correctly",
        "Drag and drop works",
        "Position saves"
      ],
      "dependencies": ["HOOK-004"]
    },
    {
      "id": "COMP-021",
      "name": "Create CreateGoalDialog component",
      "description": "Create dialog for adding new quarterly goals",
      "category": "Components",
      "phase": 4,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/CreateGoalDialog.tsx",
        "Add title and description inputs",
        "Add goal type selector",
        "Add visualization type selector",
        "Add tags input",
        "Add milestone stages input for milestone view",
        "Add form validation"
      ],
      "verificationCriteria": [
        "All fields work",
        "Validation enforces requirements",
        "Goal creates successfully"
      ],
      "dependencies": ["HOOK-004"]
    },
    {
      "id": "COMP-022",
      "name": "Create GoalEvidencePanel component",
      "description": "Create panel for viewing and adding goal evidence",
      "category": "Components",
      "phase": 4,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/GoalEvidencePanel.tsx",
        "Display list of evidence items",
        "Show evidence type icons",
        "Add file upload for attachments",
        "Add URL input for links",
        "Add task selector for task links",
        "Add notes input"
      ],
      "verificationCriteria": [
        "All evidence types addable",
        "File uploads work",
        "Task linking works"
      ],
      "dependencies": ["HOOK-005"]
    },
    {
      "id": "COMP-023",
      "name": "Create GoalRolloverDialog component",
      "description": "Create dialog for rolling over incomplete goals",
      "category": "Components",
      "phase": 4,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/GoalRolloverDialog.tsx",
        "Show source goal details",
        "Allow editing before rollover",
        "Allow adjusting targets if needed",
        "Create new goal with rollover FK",
        "Mark source goal as rolled_over"
      ],
      "verificationCriteria": [
        "Rollover creates new goal",
        "FK link maintained",
        "Source status updated"
      ],
      "dependencies": ["HOOK-004"]
    },
    {
      "id": "COMP-024",
      "name": "Create GoalTaskLinker component",
      "description": "Create component for linking tasks to goals",
      "category": "Components",
      "phase": 4,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create src/components/profile/GoalTaskLinker.tsx",
        "Add task search/selector",
        "Add link type selector (contributes_to, blocks, related)",
        "Display linked tasks list",
        "Allow unlinking tasks",
        "Show task status inline"
      ],
      "verificationCriteria": [
        "Task search works",
        "Link types assignable",
        "Unlink works"
      ],
      "dependencies": ["HOOK-005"]
    },
    {
      "id": "COMP-025",
      "name": "Create ActivityTimeline component",
      "description": "Create comprehensive activity timeline with filters",
      "category": "Components",
      "phase": 4,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/ActivityTimeline.tsx",
        "Add vertical timeline layout",
        "Display activity items with icons by type",
        "Add checkbox filters for activity types",
        "Add date range filter",
        "Implement infinite scroll loading",
        "Add empty state"
      ],
      "verificationCriteria": [
        "Timeline loads correctly",
        "Filters work independently",
        "Infinite scroll works"
      ],
      "dependencies": ["HOOK-006"]
    },
    {
      "id": "COMP-026",
      "name": "Create ActivityItem component",
      "description": "Create individual activity item with details",
      "category": "Components",
      "phase": 4,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/ActivityItem.tsx",
        "Add type-specific icon",
        "Display activity description",
        "Add entity link (task, goal, meeting, etc.)",
        "Display relative timestamp",
        "Add collapsible details section"
      ],
      "verificationCriteria": [
        "All activity types render",
        "Links navigate correctly",
        "Details expand"
      ],
      "dependencies": ["HOOK-006"]
    },
    {
      "id": "COMP-027",
      "name": "Create ActivityFilters component",
      "description": "Create filter controls for activity timeline",
      "category": "Components",
      "phase": 4,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/ActivityFilters.tsx",
        "Add checkbox group for activity types",
        "Add Select All / Clear All buttons",
        "Add date range picker",
        "Style as collapsible filter panel"
      ],
      "verificationCriteria": [
        "Checkboxes toggle filters",
        "Date range works",
        "Bulk actions work"
      ],
      "dependencies": ["COMP-025"]
    },
    {
      "id": "COMP-028",
      "name": "Create CapacitySection component",
      "description": "Create workload and capacity overview section",
      "category": "Components",
      "phase": 4,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/CapacitySection.tsx",
        "Display current utilization percentage with gauge",
        "Show weekly hours available and override",
        "Add override input capability",
        "Display warning if overloaded",
        "Show team average comparison (anonymized)"
      ],
      "verificationCriteria": [
        "Utilization displays correctly",
        "Override saves",
        "Team average anonymized"
      ],
      "dependencies": ["HOOK-007"]
    },
    {
      "id": "COMP-029",
      "name": "Create ProjectAssignments component",
      "description": "Create component showing all projects user is assigned to",
      "category": "Components",
      "phase": 4,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/ProjectAssignments.tsx",
        "List all project assignments",
        "Show role on each project",
        "Show project status indicator",
        "Add link to project detail page",
        "Show estimated hours allocation"
      ],
      "verificationCriteria": [
        "All projects listed",
        "Links work",
        "Roles display correctly"
      ],
      "dependencies": ["HOOK-007"]
    },
    {
      "id": "COMP-030",
      "name": "Create AssignedTasks component",
      "description": "Create component showing tasks assigned to user",
      "category": "Components",
      "phase": 4,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/AssignedTasks.tsx",
        "List tasks grouped by project",
        "Show task status and priority",
        "Add due date indicator",
        "Add estimated hours",
        "Allow quick status updates"
      ],
      "verificationCriteria": [
        "Tasks group correctly",
        "Status updates work",
        "Overdue highlighted"
      ],
      "dependencies": ["HOOK-007"]
    },
    {
      "id": "COMP-031",
      "name": "Create OneOnOnePrepSection component",
      "description": "Create 1:1 preparation tab content",
      "category": "Components",
      "phase": 5,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/OneOnOnePrepSection.tsx",
        "Show next 1:1 meeting date and time",
        "Display agenda preview with sections",
        "Add quick actions for each section",
        "Link to full meeting detail page",
        "Show recent meeting history"
      ],
      "verificationCriteria": [
        "Next meeting shows correctly",
        "Agenda sections editable",
        "Link to full view works"
      ],
      "dependencies": ["HOOK-008"]
    },
    {
      "id": "COMP-032",
      "name": "Create OneOnOneAgendaEditor component",
      "description": "Create editor for 1:1 meeting agenda sections",
      "category": "Components",
      "phase": 5,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/OneOnOneAgendaEditor.tsx",
        "Add Immediate Fires section with item list",
        "Add Goal Updates section with goal selector",
        "Add Manager Support section with items",
        "Add Career Discussion notes area",
        "Make sections collapsible",
        "Add AI suggestions display"
      ],
      "verificationCriteria": [
        "All sections editable",
        "Items add/remove",
        "Auto-save works"
      ],
      "dependencies": ["HOOK-008"]
    },
    {
      "id": "COMP-033",
      "name": "Create OneOnOneHistory component",
      "description": "Create component showing past 1:1 meetings",
      "category": "Components",
      "phase": 5,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create src/components/profile/OneOnOneHistory.tsx",
        "List past 1:1 meetings with dates",
        "Show summary of each meeting",
        "Display completed action items count",
        "Allow expanding for full notes"
      ],
      "verificationCriteria": [
        "History loads correctly",
        "Expansion works",
        "Links to meetings work"
      ],
      "dependencies": ["HOOK-008"]
    },
    {
      "id": "COMP-034",
      "name": "Create ManagerViewTab component",
      "description": "Create Manager View tab content with performance data",
      "category": "Components",
      "phase": 5,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/ManagerViewTab.tsx",
        "Check manager permission before rendering",
        "Include PerformanceNotesList component",
        "Include PerformanceMetrics component",
        "Include AlertsPanel component",
        "Include QuickNoteInput component"
      ],
      "verificationCriteria": [
        "Only managers see this tab",
        "All subsections render",
        "Data loads correctly"
      ],
      "dependencies": ["HOOK-009", "HOOK-011"]
    },
    {
      "id": "COMP-035",
      "name": "Create PerformanceNotesList component",
      "description": "Create component for viewing and adding performance notes",
      "category": "Components",
      "phase": 5,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/PerformanceNotesList.tsx",
        "Display notes filtered by visibility",
        "Show note type badge",
        "Add author and date info",
        "Add Add Note button",
        "Allow filtering by note type"
      ],
      "verificationCriteria": [
        "Notes display correctly",
        "Visibility filtering works",
        "Adding notes works"
      ],
      "dependencies": ["HOOK-009"]
    },
    {
      "id": "COMP-036",
      "name": "Create AddPerformanceNoteDialog component",
      "description": "Create dialog for adding performance notes",
      "category": "Components",
      "phase": 5,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/AddPerformanceNoteDialog.tsx",
        "Add note type selector",
        "Add content textarea",
        "Add visibility selector",
        "Add optional goal/task link",
        "Add form validation"
      ],
      "verificationCriteria": [
        "Note creates successfully",
        "Visibility saved correctly",
        "Links work"
      ],
      "dependencies": ["HOOK-009"]
    },
    {
      "id": "COMP-037",
      "name": "Create PerformanceMetricsCard component",
      "description": "Create component for displaying quantitative metrics",
      "category": "Components",
      "phase": 5,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create src/components/profile/PerformanceMetricsCard.tsx",
        "Display metrics in card/grid layout",
        "Show period info",
        "Add mini charts for trends",
        "Add Add Metric button",
        "Allow time period filtering"
      ],
      "verificationCriteria": [
        "Metrics display correctly",
        "Charts render",
        "Period filtering works"
      ],
      "dependencies": ["HOOK-009"]
    },
    {
      "id": "COMP-038",
      "name": "Create ManagerAlertsPanel component",
      "description": "Create panel for manager alerts about the employee",
      "category": "Components",
      "phase": 5,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create src/components/profile/ManagerAlertsPanel.tsx",
        "Display active alerts for this employee",
        "Show severity indicators",
        "Add mark as read action",
        "Add dismiss action",
        "Show AI-generated suggestions"
      ],
      "verificationCriteria": [
        "Alerts display correctly",
        "Actions work",
        "AI suggestions shown"
      ],
      "dependencies": ["HOOK-011"]
    },
    {
      "id": "COMP-039",
      "name": "Create PeerRecognitionSection component",
      "description": "Create section for peer recognition display and giving",
      "category": "Components",
      "phase": 5,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create src/components/profile/PeerRecognitionSection.tsx",
        "Display received recognitions",
        "Show appreciation type icons",
        "Add Give Recognition button",
        "Filter by public/private",
        "Show recognition count by type"
      ],
      "verificationCriteria": [
        "Recognitions display correctly",
        "Type icons match languages",
        "Counts accurate"
      ],
      "dependencies": ["HOOK-010"]
    },
    {
      "id": "COMP-040",
      "name": "Create GiveRecognitionDialog component",
      "description": "Create dialog for giving peer recognition",
      "category": "Components",
      "phase": 5,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create src/components/profile/GiveRecognitionDialog.tsx",
        "Add appreciation type selector with explanations",
        "Suggest type based on recipient preferences",
        "Add message textarea",
        "Add public/private toggle",
        "Add form validation"
      ],
      "verificationCriteria": [
        "Recognition creates successfully",
        "Type suggestions work",
        "Visibility saves"
      ],
      "dependencies": ["HOOK-010"]
    },
    {
      "id": "COMP-041",
      "name": "Create CareerDevelopmentSection component",
      "description": "Create section for career development plan",
      "category": "Components",
      "phase": 5,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create src/components/profile/CareerDevelopmentSection.tsx",
        "Display current role and target role",
        "Show career roadmap visualization",
        "List skills to acquire with progress",
        "List experiences needed",
        "Show mentors list"
      ],
      "verificationCriteria": [
        "Career plan displays correctly",
        "Roadmap visual is clear",
        "Progress tracking works"
      ],
      "dependencies": ["HOOK-012"]
    },
    {
      "id": "COMP-042",
      "name": "Create CareerRoadmapVisualization component",
      "description": "Create visual roadmap from current to target role",
      "category": "Components",
      "phase": 5,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create src/components/profile/CareerRoadmapVisualization.tsx",
        "Display horizontal progression",
        "Show current role box",
        "Show target role box",
        "Display intermediate milestones",
        "Add timeline indication"
      ],
      "verificationCriteria": [
        "Visualization renders correctly",
        "Milestones positioned correctly",
        "Timeline accurate"
      ],
      "dependencies": ["HOOK-012"]
    },
    {
      "id": "COMP-043",
      "name": "Create EditCareerPlanDialog component",
      "description": "Create dialog for editing career development plan",
      "category": "Components",
      "phase": 5,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create src/components/profile/EditCareerPlanDialog.tsx",
        "Add target role input",
        "Add target timeline selector",
        "Add skills to acquire list editor",
        "Add experiences needed list editor",
        "Add mentors list editor"
      ],
      "verificationCriteria": [
        "All fields editable",
        "Lists add/remove work",
        "Saves correctly"
      ],
      "dependencies": ["HOOK-012"]
    },
    {
      "id": "COMP-044",
      "name": "Create ManagerDashboardPage component",
      "description": "Create dedicated manager dashboard page for all reports",
      "category": "Components",
      "phase": 6,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/pages/ManagerDashboard.tsx",
        "Add route in App.tsx: /manager-dashboard",
        "Include team overview section",
        "Include capacity overview section",
        "Include goal progress section",
        "Include alerts section",
        "Add navigation to individual profiles"
      ],
      "verificationCriteria": [
        "Dashboard loads for managers",
        "All sections render",
        "Navigation works"
      ],
      "dependencies": ["HOOK-011", "HOOK-013"]
    },
    {
      "id": "COMP-045",
      "name": "Create TeamOverviewCard component",
      "description": "Create card showing team member overview for managers",
      "category": "Components",
      "phase": 6,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/manager/TeamOverviewCard.tsx",
        "List all direct reports",
        "Show quick stats per person",
        "Add status indicators",
        "Allow clicking to view profile"
      ],
      "verificationCriteria": [
        "All reports listed",
        "Stats accurate",
        "Navigation works"
      ],
      "dependencies": ["HOOK-011"]
    },
    {
      "id": "COMP-046",
      "name": "Create TeamCapacityOverview component",
      "description": "Create capacity overview for manager's team",
      "category": "Components",
      "phase": 6,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/manager/TeamCapacityOverview.tsx",
        "Display capacity bars for each team member",
        "Highlight overloaded members",
        "Show team average",
        "Add drill-down to individual"
      ],
      "verificationCriteria": [
        "All team members shown",
        "Overloaded highlighted",
        "Average calculated"
      ],
      "dependencies": ["HOOK-011"]
    },
    {
      "id": "COMP-047",
      "name": "Create TeamGoalProgress component",
      "description": "Create goal progress overview across team",
      "category": "Components",
      "phase": 6,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/manager/TeamGoalProgress.tsx",
        "Show goal completion rates",
        "List at-risk goals",
        "Show overdue goals",
        "Allow filtering by quarter"
      ],
      "verificationCriteria": [
        "Progress accurate",
        "At-risk identified",
        "Filtering works"
      ],
      "dependencies": ["HOOK-011"]
    },
    {
      "id": "COMP-048",
      "name": "Create ManagerAlertsDashboard component",
      "description": "Create alerts dashboard for manager with all reports' alerts",
      "category": "Components",
      "phase": 6,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/manager/ManagerAlertsDashboard.tsx",
        "Display all alerts grouped by severity",
        "Show alert counts by employee",
        "Add bulk dismiss capability",
        "Add filter by alert type"
      ],
      "verificationCriteria": [
        "Alerts grouped correctly",
        "Bulk actions work",
        "Filtering works"
      ],
      "dependencies": ["HOOK-011"]
    },
    {
      "id": "COMP-049",
      "name": "Create OrgChartVisualization component",
      "description": "Create organizational chart visualization",
      "category": "Components",
      "phase": 6,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create src/components/org/OrgChartVisualization.tsx",
        "Display hierarchical tree structure",
        "Show employee cards with basic info",
        "Allow expanding/collapsing branches",
        "Add zoom and pan controls",
        "Click to navigate to profile"
      ],
      "verificationCriteria": [
        "Tree renders correctly",
        "Expand/collapse works",
        "Navigation works"
      ],
      "dependencies": ["HOOK-013"]
    },
    {
      "id": "COMP-050",
      "name": "Create QuarterNavigator component",
      "description": "Create reusable quarter navigation component",
      "category": "Components",
      "phase": 4,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/shared/QuarterNavigator.tsx",
        "Add year selector",
        "Add Q1-Q4 buttons",
        "Highlight current quarter",
        "Add prev/next navigation"
      ],
      "verificationCriteria": [
        "Navigation intuitive",
        "Current quarter highlighted",
        "Year changes correctly"
      ],
      "dependencies": []
    },
    {
      "id": "NAV-001",
      "name": "Add User Profile to navigation",
      "description": "Add Profile link to navigation and header",
      "category": "Navigation",
      "phase": 6,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Add Profile item to Navigation.tsx dropdown",
        "Add current user avatar to header",
        "Add dropdown with profile link",
        "Add Manager Dashboard link for managers"
      ],
      "verificationCriteria": [
        "Profile link visible",
        "Avatar shows in header",
        "Manager link conditional"
      ],
      "dependencies": ["COMP-001"]
    },
    {
      "id": "NAV-002",
      "name": "Add routes for profile pages",
      "description": "Add all profile-related routes to App.tsx",
      "category": "Navigation",
      "phase": 6,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Add /profile route for current user",
        "Add /profile/:id route for viewing others",
        "Add /manager-dashboard route",
        "Add route guards for permissions"
      ],
      "verificationCriteria": [
        "All routes work",
        "Guards prevent unauthorized access"
      ],
      "dependencies": ["COMP-001", "COMP-044"]
    },
    {
      "id": "RLS-001",
      "name": "Implement RLS policies for user_profiles",
      "description": "Create Row Level Security policies for profile access",
      "category": "Security",
      "phase": 1,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create policy for self-view",
        "Create policy for manager view",
        "Create policy for public fields based on privacy settings",
        "Test policies with different user roles"
      ],
      "verificationCriteria": [
        "Users can view own profile",
        "Managers can view reports' profiles",
        "Privacy settings respected"
      ],
      "dependencies": ["DB-001"]
    },
    {
      "id": "RLS-002",
      "name": "Implement RLS policies for goals and evidence",
      "description": "Create RLS policies for quarterly goals",
      "category": "Security",
      "phase": 1,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create policy for self-access",
        "Create policy for manager access",
        "Create policy based on goal privacy settings"
      ],
      "verificationCriteria": [
        "Goal visibility respects settings",
        "Evidence access tied to goal access"
      ],
      "dependencies": ["DB-005"]
    },
    {
      "id": "RLS-003",
      "name": "Implement RLS policies for performance data",
      "description": "Create RLS policies for manager-only performance data",
      "category": "Security",
      "phase": 1,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create policy restricting notes to manager/HR",
        "Create policy for shared notes visibility",
        "Create policy for metrics access"
      ],
      "verificationCriteria": [
        "Manager-only notes hidden from employee",
        "Shared notes visible to employee"
      ],
      "dependencies": ["DB-011"]
    },
    {
      "id": "EDIT-001",
      "name": "Implement edit permission system",
      "description": "Create permission system for granular edit controls",
      "category": "Permissions",
      "phase": 7,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create useEditPermissions hook",
        "Define edit rules per section",
        "Self can edit: basic info, skills, interests, compass, goals",
        "Manager can edit: performance notes, career plan, capacity override",
        "Pass edit flags to components"
      ],
      "verificationCriteria": [
        "Edit buttons only show when allowed",
        "Mutations check permissions server-side"
      ],
      "dependencies": ["HOOK-001"]
    },
    {
      "id": "CALC-001",
      "name": "Implement capacity calculation function",
      "description": "Create function to calculate user capacity from assignments and tasks",
      "category": "Backend",
      "phase": 7,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create Supabase edge function for capacity calculation",
        "Sum estimated hours from assigned tasks",
        "Factor in project assignments",
        "Calculate utilization percentage",
        "Determine overloaded status"
      ],
      "verificationCriteria": [
        "Calculation accurate",
        "Updates capacity table",
        "Runs on schedule or trigger"
      ],
      "dependencies": ["DB-009"]
    },
    {
      "id": "CALC-002",
      "name": "Implement goal progress auto-calculation",
      "description": "Create function to update goal progress from linked tasks",
      "category": "Backend",
      "phase": 7,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create function to calculate progress from linked tasks",
        "Weight by task estimated hours",
        "Update goal percentage when tasks change",
        "Handle goals without linked tasks"
      ],
      "verificationCriteria": [
        "Progress updates automatically",
        "Manual override still works"
      ],
      "dependencies": ["DB-007"]
    },
    {
      "id": "ALERT-001",
      "name": "Implement alert generation system",
      "description": "Create system for generating manager alerts",
      "category": "Backend",
      "phase": 7,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create triggers for overdue goal alerts",
        "Create triggers for capacity warning alerts",
        "Create triggers for missed check-in alerts",
        "Add AI suggestion generation (placeholder)",
        "Schedule periodic alert checks"
      ],
      "verificationCriteria": [
        "Alerts generate correctly",
        "No duplicate alerts"
      ],
      "dependencies": ["DB-014"]
    },
    {
      "id": "ACT-001",
      "name": "Implement activity logging triggers",
      "description": "Create database triggers to log user activity",
      "category": "Backend",
      "phase": 7,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create trigger for task status changes",
        "Create trigger for goal updates",
        "Create trigger for meeting attendance",
        "Create trigger for recognition events",
        "Log to user_activity_log table"
      ],
      "verificationCriteria": [
        "Activities logged automatically",
        "All activity types captured"
      ],
      "dependencies": ["DB-008"]
    },
    {
      "id": "HIER-001",
      "name": "Implement hierarchy path calculation",
      "description": "Create function to calculate and update org hierarchy paths",
      "category": "Backend",
      "phase": 7,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create recursive function to build path array",
        "Calculate level from root",
        "Update on manager changes",
        "Add trigger for maintaining consistency"
      ],
      "verificationCriteria": [
        "Paths accurate",
        "Hierarchy queries efficient"
      ],
      "dependencies": ["DB-016"]
    },
    {
      "id": "NOTIF-001",
      "name": "Create notification badge component",
      "description": "Create badge for notification counts in navigation",
      "category": "Notifications",
      "phase": 7,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create src/components/notifications/NotificationBadge.tsx",
        "Show count of unread notifications",
        "Style as small badge on icon",
        "Update in real-time or on page load"
      ],
      "verificationCriteria": [
        "Badge shows count",
        "Updates when notifications change"
      ],
      "dependencies": ["HOOK-011"]
    },
    {
      "id": "NOTIF-002",
      "name": "Create notification toast system",
      "description": "Implement in-app toast notifications using existing Sonner",
      "category": "Notifications",
      "phase": 7,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Use existing Sonner toaster",
        "Create notification trigger functions",
        "Add notification for goal progress milestones",
        "Add notification for recognition received",
        "Add notification for 1:1 reminders"
      ],
      "verificationCriteria": [
        "Toasts appear correctly",
        "Different types styled differently"
      ],
      "dependencies": []
    },
    {
      "id": "HIST-001",
      "name": "Create historical quarters view",
      "description": "Implement cumulative view showing all past quarters inline",
      "category": "Components",
      "phase": 4,
      "priority": "P0",
      "status": "pending",
      "steps": [
        "Create src/components/profile/HistoricalQuartersView.tsx",
        "Load all past quarters for a user",
        "Display in chronological order with year headers",
        "Show summary stats per quarter",
        "Allow expanding to see full goals"
      ],
      "verificationCriteria": [
        "All quarters load",
        "Chronological order correct",
        "Expansion works"
      ],
      "dependencies": ["HOOK-004"]
    },
    {
      "id": "TREND-001",
      "name": "Create historical trends visualization",
      "description": "Create charts showing historical trends across quarters",
      "category": "Components",
      "phase": 4,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create src/components/profile/TrendsVisualization.tsx",
        "Add goal completion rate over time chart",
        "Add capacity utilization trend chart",
        "Add activity volume trend chart",
        "Use Recharts for visualizations"
      ],
      "verificationCriteria": [
        "Charts render correctly",
        "Data accurate",
        "Responsive"
      ],
      "dependencies": ["HOOK-004", "HOOK-006"]
    },
    {
      "id": "COMPARE-001",
      "name": "Create team average comparison component",
      "description": "Create anonymized team average comparison display",
      "category": "Components",
      "phase": 4,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create src/components/profile/TeamAverageComparison.tsx",
        "Calculate team averages server-side",
        "Display as comparison bars or indicators",
        "Ensure anonymization (no individual data)",
        "Show for capacity, goals, activity"
      ],
      "verificationCriteria": [
        "Averages calculated correctly",
        "No individual data exposed",
        "Comparison clear"
      ],
      "dependencies": ["HOOK-007"]
    },
    {
      "id": "SUMMARY-001",
      "name": "Create profile summary card for lists",
      "description": "Create compact profile card for use in lists and dashboards",
      "category": "Components",
      "phase": 6,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Create src/components/profile/ProfileSummaryCard.tsx",
        "Display avatar, name, role, department",
        "Show quick stats (capacity, goal progress)",
        "Add click to navigate to full profile"
      ],
      "verificationCriteria": [
        "Card displays correctly",
        "Stats accurate",
        "Navigation works"
      ],
      "dependencies": ["HOOK-001"]
    },
    {
      "id": "TEST-001",
      "name": "Create unit tests for hooks",
      "description": "Write unit tests for all custom hooks",
      "category": "Testing",
      "phase": 8,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Set up testing environment with vitest",
        "Mock Supabase client",
        "Write tests for useUserProfile",
        "Write tests for useQuarterlyGoals",
        "Write tests for useActivityLog",
        "Write tests for useManagerDashboard"
      ],
      "verificationCriteria": [
        "All hooks have tests",
        "Coverage > 80%"
      ],
      "dependencies": ["HOOK-001", "HOOK-004", "HOOK-006", "HOOK-011"]
    },
    {
      "id": "TEST-002",
      "name": "Create integration tests for profile page",
      "description": "Write integration tests for profile page flows",
      "category": "Testing",
      "phase": 8,
      "priority": "P1",
      "status": "pending",
      "steps": [
        "Test profile loading",
        "Test tab navigation",
        "Test goal CRUD operations",
        "Test activity filtering",
        "Test permission-based UI"
      ],
      "verificationCriteria": [
        "All major flows tested",
        "Tests pass reliably"
      ],
      "dependencies": ["COMP-001"]
    },
    {
      "id": "SEED-001",
      "name": "Create seed data for profiles",
      "description": "Create migration with sample profile data for development",
      "category": "Database",
      "phase": 8,
      "priority": "P2",
      "status": "pending",
      "steps": [
        "Create sample user profiles linked to existing team_members",
        "Create sample work preferences",
        "Create sample goals with evidence",
        "Create sample activity log entries",
        "Create sample org hierarchy"
      ],
      "verificationCriteria": [
        "Seed data loads without errors",
        "Sample data demonstrates all features"
      ],
      "dependencies": ["DB-017"]
    },
    {
      "id": "DOC-001",
      "name": "Create documentation for profile feature",
      "description": "Document the profile feature for developers and users",
      "category": "Documentation",
      "phase": 8,
      "priority": "P2",
      "status": "pending",
      "steps": [
        "Document database schema",
        "Document API/hooks usage",
        "Create user guide for profile features",
        "Document permission model"
      ],
      "verificationCriteria": [
        "Documentation is comprehensive",
        "Examples provided"
      ],
      "dependencies": ["COMP-001"]
    },
    {
      "id": "FUTURE-001",
      "name": "Design integration points for future features",
      "description": "Add hooks and interfaces for future integrations without implementing",
      "category": "Architecture",
      "phase": 8,
      "priority": "P2",
      "status": "pending",
      "steps": [
        "Add placeholder for HRIS integration in profile sync",
        "Add placeholder for external calendar integration",
        "Add placeholder for performance review system integration",
        "Add placeholder for learning management system integration",
        "Document integration points"
      ],
      "verificationCriteria": [
        "Interfaces defined",
        "No functional implementation",
        "Documentation clear"
      ],
      "dependencies": ["DOC-001"]
    }
  ]
}
```

---

### File 2: `claude-progress.txt`

This file tracks completed features and session progress.

```
# User Profile Feature - Progress Tracker
# ========================================
# Created: 2026-01-10
# Last Updated: 2026-01-10
#
# Status Legend:
# [x] Completed
# [~] In Progress
# [ ] Pending
# [!] Blocked

## Current Session
Session Start: N/A
Current Feature: N/A
Session Goal: N/A

## Completed Features (0/127)
(None yet)

## Phase 1: Database Foundation (0/20 features)
[ ] DB-001: Create user_profiles table
[ ] DB-002: Create user_skills table
[ ] DB-003: Create user_interests table
[ ] DB-004: Create user_work_preferences table (Compass)
[ ] DB-005: Create quarterly_goals table
[ ] DB-006: Create goal_evidence table
[ ] DB-007: Create goal_task_links table
[ ] DB-008: Create user_activity_log table
[ ] DB-009: Create user_capacity table
[ ] DB-010: Create one_on_one_meetings table
[ ] DB-011: Create performance_notes table
[ ] DB-012: Create performance_metrics table
[ ] DB-013: Create peer_recognitions table
[ ] DB-014: Create manager_alerts table
[ ] DB-015: Create career_development_plans table
[ ] DB-016: Create org_hierarchy table
[ ] DB-017: Run all migrations and regenerate types
[ ] RLS-001: Implement RLS policies for user_profiles
[ ] RLS-002: Implement RLS policies for goals and evidence
[ ] RLS-003: Implement RLS policies for performance data

## Phase 2: Types and Hooks (0/20 features)
[ ] TYPE-001: Create user profile TypeScript types
[ ] TYPE-002: Create work preferences (Compass) types
[ ] TYPE-003: Create quarterly goals types
[ ] TYPE-004: Create activity and capacity types
[ ] TYPE-005: Create performance and 1:1 types
[ ] TYPE-006: Create career development types
[ ] TYPE-007: Create label constants and helpers
[ ] HOOK-001: Create useUserProfile hook
[ ] HOOK-002: Create useUserSkills hook
[ ] HOOK-003: Create useWorkPreferences hook
[ ] HOOK-004: Create useQuarterlyGoals hook
[ ] HOOK-005: Create useGoalEvidence hook
[ ] HOOK-006: Create useActivityLog hook
[ ] HOOK-007: Create useUserCapacity hook
[ ] HOOK-008: Create useOneOnOne hook
[ ] HOOK-009: Create usePerformance hook
[ ] HOOK-010: Create usePeerRecognition hook
[ ] HOOK-011: Create useManagerDashboard hook
[ ] HOOK-012: Create useCareerDevelopment hook
[ ] HOOK-013: Create useOrgHierarchy hook

## Phase 3: Core Profile Components (0/15 features)
[ ] COMP-001: Create UserProfilePage component
[ ] COMP-002: Create ProfileHeader component
[ ] COMP-003: Create EditProfileDialog component
[ ] COMP-004: Create SkillsList component
[ ] COMP-005: Create AddSkillDialog component
[ ] COMP-006: Create InterestsList component
[ ] COMP-007: Create CompassSection component (Wrapper)
[ ] COMP-008: Create AppreciationLanguageCard component
[ ] COMP-009: Create AppreciationQuiz component
[ ] COMP-010: Create CommunicationPreferences component
[ ] COMP-011: Create MeetingPreferences component
[ ] COMP-012: Create FocusTimePreferences component
[ ] COMP-013: Create FeedbackPreferences component
[ ] COMP-014: Create StrengthsWeaknesses component
[ ] COMP-015: Create WorkStylePreferences component

## Phase 4: Goals and Activity (0/19 features)
[ ] COMP-016: Create QuarterlyGoalsSection component
[ ] COMP-017: Create GoalCard component
[ ] COMP-018: Create GoalProgressPercentage component
[ ] COMP-019: Create GoalProgressMilestone component
[ ] COMP-020: Create GoalProgressKanban component
[ ] COMP-021: Create CreateGoalDialog component
[ ] COMP-022: Create GoalEvidencePanel component
[ ] COMP-023: Create GoalRolloverDialog component
[ ] COMP-024: Create GoalTaskLinker component
[ ] COMP-025: Create ActivityTimeline component
[ ] COMP-026: Create ActivityItem component
[ ] COMP-027: Create ActivityFilters component
[ ] COMP-028: Create CapacitySection component
[ ] COMP-029: Create ProjectAssignments component
[ ] COMP-030: Create AssignedTasks component
[ ] COMP-050: Create QuarterNavigator component
[ ] HIST-001: Create historical quarters view
[ ] TREND-001: Create historical trends visualization
[ ] COMPARE-001: Create team average comparison component

## Phase 5: 1:1 and Performance (0/13 features)
[ ] COMP-031: Create OneOnOnePrepSection component
[ ] COMP-032: Create OneOnOneAgendaEditor component
[ ] COMP-033: Create OneOnOneHistory component
[ ] COMP-034: Create ManagerViewTab component
[ ] COMP-035: Create PerformanceNotesList component
[ ] COMP-036: Create AddPerformanceNoteDialog component
[ ] COMP-037: Create PerformanceMetricsCard component
[ ] COMP-038: Create ManagerAlertsPanel component
[ ] COMP-039: Create PeerRecognitionSection component
[ ] COMP-040: Create GiveRecognitionDialog component
[ ] COMP-041: Create CareerDevelopmentSection component
[ ] COMP-042: Create CareerRoadmapVisualization component
[ ] COMP-043: Create EditCareerPlanDialog component

## Phase 6: Manager Dashboard (0/8 features)
[ ] COMP-044: Create ManagerDashboardPage component
[ ] COMP-045: Create TeamOverviewCard component
[ ] COMP-046: Create TeamCapacityOverview component
[ ] COMP-047: Create TeamGoalProgress component
[ ] COMP-048: Create ManagerAlertsDashboard component
[ ] COMP-049: Create OrgChartVisualization component
[ ] NAV-001: Add User Profile to navigation
[ ] NAV-002: Add routes for profile pages
[ ] SUMMARY-001: Create profile summary card for lists

## Phase 7: Backend Logic and Permissions (0/10 features)
[ ] EDIT-001: Implement edit permission system
[ ] CALC-001: Implement capacity calculation function
[ ] CALC-002: Implement goal progress auto-calculation
[ ] ALERT-001: Implement alert generation system
[ ] ACT-001: Implement activity logging triggers
[ ] HIER-001: Implement hierarchy path calculation
[ ] NOTIF-001: Create notification badge component
[ ] NOTIF-002: Create notification toast system

## Phase 8: Polish (0/6 features)
[ ] TEST-001: Create unit tests for hooks
[ ] TEST-002: Create integration tests for profile page
[ ] SEED-001: Create seed data for profiles
[ ] DOC-001: Create documentation for profile feature
[ ] FUTURE-001: Design integration points for future features

## Session Log
# Format: [Date] [Session#] [Features Completed] [Notes]
# Example: 2026-01-11 Session 1: DB-001, DB-002, DB-003 - Created core tables

(No sessions recorded yet)

## Blockers & Issues
(None recorded)

## Notes
- Follow single-feature sessions: Complete 1-3 related features per session
- Create descriptive git commits after each feature
- Verify features end-to-end using browser before marking complete
- Run `npm run dev` to start development server for testing
```

---

### File 3: `init.sh`

This script sets up the development environment for each session.

```bash
#!/bin/bash
# init.sh - User Profile Feature Development Setup
# Run this at the start of each coding session

set -e

echo "==================================="
echo "User Profile Feature - Session Init"
echo "==================================="
echo ""

# 1. Navigate to project directory
cd /mnt/c/Users/tomka/Documents/apps/2026/forge-ops
echo "Working directory: $(pwd)"
echo ""

# 2. Check Node.js and npm
echo "Checking Node.js..."
node --version
npm --version
echo ""

# 3. Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "Dependencies already installed."
fi
echo ""

# 4. Check Supabase CLI
echo "Checking Supabase CLI..."
if command -v supabase &> /dev/null; then
    supabase --version
else
    echo "WARNING: Supabase CLI not found. Install with: npm install -g supabase"
fi
echo ""

# 5. Check git status
echo "Git Status:"
echo "Branch: $(git branch --show-current)"
git status --short
echo ""

# 6. Show recent commits
echo "Recent commits:"
git log --oneline -5
echo ""

# 7. Read progress file
echo "==================================="
echo "Progress Summary"
echo "==================================="
if [ -f "claude-progress.txt" ]; then
    echo ""
    grep -A 5 "## Current Session" claude-progress.txt 2>/dev/null || echo "No current session"
    echo ""
    echo "Completed features:"
    grep -c "\[x\]" claude-progress.txt 2>/dev/null || echo "0"
    echo ""
    echo "Pending features:"
    grep -c "\[ \]" claude-progress.txt 2>/dev/null || echo "127"
else
    echo "Progress file not found. Will be created."
fi
echo ""

# 8. Start dev server in background (optional)
echo "==================================="
echo "Ready to Start Development"
echo "==================================="
echo ""
echo "To start the dev server, run:"
echo "  npm run dev"
echo ""
echo "To run Supabase locally:"
echo "  supabase start"
echo ""
echo "Key files:"
echo "  - Feature list: user-profile-features.json"
echo "  - Progress: claude-progress.txt"
echo "  - Plan: /home/tomka/.claude/plans/delegated-prancing-valiant.md"
echo ""
echo "==================================="
echo "Session initialized. Happy coding!"
echo "==================================="
```

---

## Next Steps

After plan approval, the first session will:
1. Create these three files in the project root:
   - `user-profile-features.json`
   - `claude-progress.txt`
   - `init.sh`
2. Make `init.sh` executable
3. Begin Phase 1 (Database Foundation) with DB-001
