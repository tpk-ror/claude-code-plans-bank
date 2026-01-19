# Database Schema Normalization Plan for CoLab

## Part 1: Analysis and Documentation

### 1.1 Naming Inconsistencies Found

The schema has two different naming conventions being used for database column names:

#### Tables using **camelCase** in DB (Inconsistent - should be snake_case):

1. **taskTemplates** (lines 202-212):
   - `createdBy` should be `created_by`
   - `formFields` should be `form_fields`
   - `isPublic` should be `is_public`
   - `createdAt` should be `created_at`
   - `updatedAt` should be `updated_at`

2. **workflowTemplates** (lines 215-226):
   - `createdBy` should be `created_by`
   - `isPublic` should be `is_public`
   - `createdAt` should be `created_at`
   - `updatedAt` should be `updated_at`

3. **standupTemplates** (lines 229-239):
   - `createdBy` should be `created_by`
   - `formFields` should be `form_fields`
   - `isPublic` should be `is_public`
   - `createdAt` should be `created_at`
   - `updatedAt` should be `updated_at`

4. **colabTemplates** (lines 242-252):
   - `createdBy` should be `created_by`
   - `formFields` should be `form_fields`
   - `isPublic` should be `is_public`
   - `createdAt` should be `created_at`
   - `updatedAt` should be `updated_at`

#### Tables using **snake_case** in DB (Correct):
- `users`, `tasks`, `comments`, `attachments`, `standups`, `colabSessions`, `teams`, `userPoints`, `departments`, `badges`, `activities`, `notifications`, `groups`, `userGroups`, `taskGroups`, `taskGroupItems`, `colabGroups`, `colabGroupItems`, `stickyNoteTemplates`, `stickyNotes`, `stickyNoteVotes`, `stickyNoteComments`, `agents`, `agentRuns`, `agentTemplates`, `workflowPlanners`

### 1.2 Array Fields That Should Be Junction Tables

| Table | Field | Type | Should Become Junction Table |
|-------|-------|------|------------------------------|
| `tasks` | `championIds` (line 35) | `integer[].array()` | `taskChampions` |
| `tasks` | `tags` (line 36) | `text[].array()` | Could be `taskTags` (optional, tags are simple strings) |
| `standups` | `participants` (line 67) | `integer[].array()` | `standupParticipants` |
| `colabSessions` | `participants` (line 80) | `integer[].array()` | `colabParticipants` |
| `teams` | `members` (line 93) | `integer[].array()` | `teamMembers` |
| `users` | `badges` (line 17) | `text[].array()` | Could be `userBadges` (links to badges table) |
| `stickyNotes` | `tags` (line 276) | `text[].array()` | Could be `stickyNoteTags` (optional) |
| `workflowPlanners` | `tags` (line 522) | `text[].array()` | Could be `workflowPlannerTags` (optional) |

**Priority junction tables to create (user IDs):**
1. `taskChampions` - tasks.championIds
2. `standupParticipants` - standups.participants
3. `colabParticipants` - colabSessions.participants
4. `teamMembers` - teams.members

### 1.3 JSONB Fields That Need Validation Schemas

| Table | Field | Current Type | Validation Needed |
|-------|-------|--------------|-------------------|
| `users` | `preferences` (line 15) | `jsonb` | `UserPreferences` interface already exists (line 652) |
| `tasks` | `templateFields` (line 41) | `jsonb` | Array of field values keyed by field ID |
| `standups` | `onFireItems` (line 68) | `jsonb` | Array of on-fire item objects |
| `standups` | `movingForwardItems` (line 69) | `jsonb` | Array of moving forward item objects |
| `standups` | `colabUpdates` (line 70) | `jsonb` | Array of colab update objects |
| `colabSessions` | `inputsReview` (line 81) | `jsonb` | Review items structure |
| `colabSessions` | `ideas` (line 82) | `jsonb` | Array of idea objects |
| `colabSessions` | `chatMessages` (line 83) | `jsonb` | Array of chat message objects |
| `colabSessions` | `actionItems` (line 84) | `jsonb` | Array of action item objects |
| `taskTemplates` | `formFields` (line 208) | `jsonb` | `FormField[]` interface exists (line 540) |
| `workflowTemplates` | `nodes` (line 221) | `jsonb` | `WorkflowNode[]` interface exists (line 577) |
| `workflowTemplates` | `edges` (line 222) | `jsonb` | `WorkflowEdge[]` interface exists (line 608) |
| `standupTemplates` | `formFields` (line 235) | `jsonb` | `FormField[]` interface exists |
| `colabTemplates` | `formFields` (line 248) | `jsonb` | `FormField[]` interface exists |
| `stickyNoteTemplates` | `formFields` (line 261) | `jsonb` | `FormField[]` interface exists |
| `stickyNotes` | `position` (line 278) | `jsonb` | `{x: number, y: number}` |
| `agents` | `parameters` (line 319) | `jsonb` | `AgentParameters` interface exists (line 692) |
| `agentRuns` | `input` (line 335) | `jsonb` | Generic input object |
| `agentRuns` | `output` (line 336) | `jsonb` | Generic output object |
| `agentTemplates` | `parameters` (line 352) | `jsonb` | `AgentParameters` interface exists |
| `workflowPlanners` | `nodes` (line 517) | `jsonb` | `WorkflowNode[]` interface exists |
| `workflowPlanners` | `edges` (line 518) | `jsonb` | `WorkflowEdge[]` interface exists |
| `workflowPlanners` | `agentConfigs` (line 519) | `jsonb` | Agent configuration object |

### 1.4 Unused Tables

- **`stickyNoteComments`** (lines 294-304): This table exists but based on the task description, it appears to be unused. Should be reviewed for removal or kept for future use.

---

## Part 2: Junction Tables to Create

```typescript
import { primaryKey } from "drizzle-orm/pg-core";

// Task champions junction table (replaces tasks.championIds array)
export const taskChampions = pgTable("task_champions", {
  taskId: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.taskId, table.userId] }),
}));

// Standup participants junction table (replaces standups.participants array)
export const standupParticipants = pgTable("standup_participants", {
  standupId: integer("standup_id").notNull().references(() => standups.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.standupId, table.userId] }),
}));

// Colab participants junction table (replaces colabSessions.participants array)
export const colabParticipants = pgTable("colab_participants", {
  colabId: integer("colab_id").notNull().references(() => colabSessions.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.colabId, table.userId] }),
}));

// Team members junction table (replaces teams.members array)
export const teamMembers = pgTable("team_members", {
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").default("member"), // Optional: member, lead, admin
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.teamId, table.userId] }),
}));
```

---

## Part 3: JSONB Validation Schemas to Create

```typescript
// ============================================
// JSONB Validation Schemas
// ============================================

// Template field schema (for formFields in templates)
export const templateFieldSchema = z.object({
  id: z.string(),
  type: z.enum([
    'text', 'textarea', 'number', 'date', 'time', 'select', 'multi-select',
    'checkbox', 'radio', 'user', 'rating', 'file', 'location', 'tags',
    'priority', 'section', 'header'
  ]),
  label: z.string(),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  defaultValue: z.any().optional(),
  value: z.any().optional(),
  required: z.boolean(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    minDate: z.string().optional(),
    maxDate: z.string().optional(),
  }).optional(),
  options: z.array(z.object({
    id: z.string(),
    label: z.string(),
    value: z.string(),
  })).optional(),
  conditional: z.object({
    field: z.string(),
    operator: z.enum([
      'equals', 'not_equals', 'contains', 'not_contains',
      'greater_than', 'less_than', 'is_empty', 'is_not_empty'
    ]),
    value: z.any(),
  }).optional(),
  style: z.object({
    width: z.enum(['full', 'half', 'third']).optional(),
    color: z.string().optional(),
    fontSize: z.enum(['small', 'medium', 'large']).optional(),
  }).optional(),
});

export const templateFieldsSchema = z.array(templateFieldSchema);

// Workflow node schema
export const workflowNodeSchema = z.object({
  id: z.string(),
  type: z.enum([
    'task', 'decision', 'start', 'end', 'delay', 'notification',
    'approval', 'integration', 'sub-process', 'comment'
  ]),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.object({
    label: z.string(),
    description: z.string().optional(),
    fields: z.array(templateFieldSchema).optional(),
    condition: z.object({
      type: z.enum(['and', 'or']),
      rules: z.array(z.object({
        field: z.string(),
        operator: z.string(),
        value: z.any(),
      })),
    }).optional(),
    duration: z.number().optional(),
    assignee: z.object({
      type: z.enum(['user', 'role', 'department']),
      value: z.union([z.string(), z.number()]),
    }).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    templateId: z.number().optional(),
  }),
  style: z.object({
    color: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    borderColor: z.string().optional(),
    icon: z.string().optional(),
  }).optional(),
});

export const workflowNodesSchema = z.array(workflowNodeSchema);

// Workflow edge schema
export const workflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  type: z.enum(['default', 'success', 'failure', 'conditional']).optional(),
  condition: z.object({
    field: z.string(),
    operator: z.string(),
    value: z.any(),
  }).optional(),
  style: z.object({
    color: z.string().optional(),
    strokeWidth: z.number().optional(),
    strokeDasharray: z.string().optional(),
  }).optional(),
});

export const workflowEdgesSchema = z.array(workflowEdgeSchema);

// Agent parameters schema
export const agentParametersSchema = z.object({
  // Core settings
  model: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().optional(),

  // Task-specific settings
  taskType: z.enum(['standup', 'colab', 'task', 'note', 'summary']).optional(),
  defaultPriority: z.enum(['low', 'medium', 'high']).optional(),
  defaultTags: z.array(z.string()).optional(),
  outputFormat: z.enum(['markdown', 'text', 'json', 'html']).optional(),

  // Scheduling parameters
  frequency: z.enum(['daily', 'weekly', 'monthly', 'custom']).optional(),
  timeOfDay: z.string().optional(),
  daysOfWeek: z.array(z.enum([
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ])).optional(),
  monthDay: z.number().min(1).max(31).optional(),

  // Behavior settings
  autonomyLevel: z.enum(['none', 'low', 'medium', 'high', 'full']).optional(),
  notifyOwner: z.boolean().optional(),
  notifyTeam: z.boolean().optional(),
  includeMetadata: z.boolean().optional(),

  // Input sources
  sources: z.array(z.object({
    type: z.enum(['tasks', 'colabs', 'standups', 'notes', 'api', 'file']),
    path: z.string().optional(),
    url: z.string().optional(),
    filter: z.string().optional(),
    timeRange: z.object({
      from: z.string(),
      to: z.string().optional(),
    }).optional(),
  })).optional(),

  // Integration settings
  webhooks: z.array(z.object({
    url: z.string(),
    events: z.array(z.string()),
    headers: z.record(z.string()).optional(),
  })).optional(),

  // Custom parameters
  customFields: z.record(z.any()).optional(),
});

// User preferences schema
export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  notifications: z.object({
    email: z.object({
      taskUpdates: z.boolean(),
      standupReminders: z.boolean(),
      colabInvites: z.boolean(),
      onFireAlerts: z.boolean(),
    }),
    inApp: z.object({
      taskUpdates: z.boolean(),
      mentions: z.boolean(),
      commentReplies: z.boolean(),
      achievements: z.boolean(),
    }),
  }),
  privacy: z.object({
    showOnlineStatus: z.boolean(),
    allowTagging: z.boolean(),
    profileVisibility: z.enum(['public', 'team', 'private']),
  }),
  profile: z.object({
    backgroundColor: z.string(),
    backgroundImage: z.string(),
    accentColor: z.string(),
    stickers: z.array(z.object({
      id: z.string(),
      image: z.string(),
      x: z.number(),
      y: z.number(),
      rotation: z.number(),
      scale: z.number(),
    })),
    fontStyle: z.enum(['default', 'playful', 'professional', 'bold']),
  }),
});

// Sticky note position schema
export const stickyNotePositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

// Standup item schemas
export const standupOnFireItemSchema = z.object({
  id: z.string().optional(),
  taskId: z.number().optional(),
  title: z.string(),
  description: z.string().optional(),
  assignee: z.number().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

export const standupMovingForwardItemSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  status: z.string().optional(),
});

export const standupColabUpdateSchema = z.object({
  id: z.string().optional(),
  colabId: z.number().optional(),
  title: z.string(),
  update: z.string().optional(),
});

// Colab session item schemas
export const colabIdeaSchema = z.object({
  id: z.string(),
  content: z.string(),
  author: z.number().optional(),
  votes: z.number().optional(),
  createdAt: z.string().optional(),
});

export const colabChatMessageSchema = z.object({
  id: z.string(),
  userId: z.number(),
  content: z.string(),
  timestamp: z.string(),
});

export const colabActionItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  assignee: z.number().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
});

// Agent configs schema (for workflow planners)
export const agentConfigSchema = z.object({
  agentId: z.number().optional(),
  templateId: z.number().optional(),
  parameters: agentParametersSchema.optional(),
  trigger: z.object({
    type: z.enum(['manual', 'schedule', 'event']),
    config: z.record(z.any()).optional(),
  }).optional(),
});

export const agentConfigsSchema = z.record(agentConfigSchema);
```

---

## Part 4: Insert Schemas for New Junction Tables

```typescript
// Insert schemas for junction tables
export const insertTaskChampionSchema = z.object({
  taskId: z.number(),
  userId: z.number(),
});

export const insertStandupParticipantSchema = z.object({
  standupId: z.number(),
  userId: z.number(),
});

export const insertColabParticipantSchema = z.object({
  colabId: z.number(),
  userId: z.number(),
});

export const insertTeamMemberSchema = z.object({
  teamId: z.number(),
  userId: z.number(),
  role: z.string().optional(),
});

// Types for junction tables
export type TaskChampion = typeof taskChampions.$inferSelect;
export type InsertTaskChampion = z.infer<typeof insertTaskChampionSchema>;

export type StandupParticipant = typeof standupParticipants.$inferSelect;
export type InsertStandupParticipant = z.infer<typeof insertStandupParticipantSchema>;

export type ColabParticipant = typeof colabParticipants.$inferSelect;
export type InsertColabParticipant = z.infer<typeof insertColabParticipantSchema>;

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
```

---

## Implementation Checklist

### Phase 1: Add Imports
- [ ] Add `primaryKey` to drizzle-orm/pg-core imports

### Phase 2: Add Junction Tables (after existing table definitions, before insert schemas)
- [ ] Add `taskChampions` table
- [ ] Add `standupParticipants` table
- [ ] Add `colabParticipants` table
- [ ] Add `teamMembers` table

### Phase 3: Add JSONB Validation Schemas (after imports, before table definitions)
- [ ] Add `templateFieldSchema` and `templateFieldsSchema`
- [ ] Add `workflowNodeSchema` and `workflowNodesSchema`
- [ ] Add `workflowEdgeSchema` and `workflowEdgesSchema`
- [ ] Add `agentParametersSchema`
- [ ] Add `userPreferencesSchema`
- [ ] Add `stickyNotePositionSchema`
- [ ] Add standup item schemas
- [ ] Add colab session item schemas
- [ ] Add `agentConfigSchema` and `agentConfigsSchema`

### Phase 4: Add Insert Schemas for Junction Tables
- [ ] Add `insertTaskChampionSchema`
- [ ] Add `insertStandupParticipantSchema`
- [ ] Add `insertColabParticipantSchema`
- [ ] Add `insertTeamMemberSchema`

### Phase 5: Add Types for Junction Tables
- [ ] Add `TaskChampion` and `InsertTaskChampion`
- [ ] Add `StandupParticipant` and `InsertStandupParticipant`
- [ ] Add `ColabParticipant` and `InsertColabParticipant`
- [ ] Add `TeamMember` and `InsertTeamMember`

### Phase 6: Run Type Checking
- [ ] Run `npm run check` to verify TypeScript compiles

---

## Notes

1. **Backward Compatibility**: The existing array fields (`championIds`, `participants`, `members`) are NOT being removed. The new junction tables are added alongside them to allow for gradual migration.

2. **Naming Conventions**: While the analysis identified camelCase column names in some template tables, fixing these would require database migration. For now, we're documenting the inconsistency but not changing existing column names to avoid breaking changes.

3. **stickyNoteComments Table**: This table is kept in place as it may be used for future features, despite being mentioned as potentially unused.

4. **Data Migration**: The actual data migration from array fields to junction tables will be done separately with a migration script that:
   - Reads existing array data
   - Populates the junction tables
   - (Eventually) removes the array columns

---

## File Changes Summary

**File to modify:** `/mnt/c/Users/tomka/Documents/apps/2026/CoLab/shared/schema.ts`

**Changes:**
1. Add `primaryKey` to imports from `drizzle-orm/pg-core`
2. Add all JSONB validation Zod schemas after imports
3. Add 4 new junction tables after existing table definitions
4. Add insert schemas for new junction tables
5. Add type exports for new junction tables
