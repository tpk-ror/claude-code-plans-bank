# Storage Layer Modularization Plan

## Current State Analysis

**File:** `server/storage.ts` (3,489 lines)
- Contains monolithic `DatabaseStorage` class with 100+ methods
- Exports `IStorage` interface and `storage` singleton instance
- Used by `server/index.ts` and `server/routes.ts`

### Identified Issues
1. **Duplicate agent method definitions in IStorage interface** (lines 52-76 and 250-272):
   - Agent methods defined twice
   - Agent Run methods defined twice
   - Agent Template methods defined twice
   - Second definition has slightly different signatures (missing `getAgentTemplatesByType`, `getAgentTemplatesByUser`)

2. **Implementation also has alias method:**
   - `getUserAgents` is an alias for `getAgentsByUser` (line 3141-3143)

---

## Modularization Plan

### File Structure
```
server/storage/
├── types.ts              # IStorage interface (deduplicated)
├── userStorage.ts        # User operations
├── taskStorage.ts        # Task, Comment, Attachment operations
├── standupStorage.ts     # Standup operations
├── colabStorage.ts       # Colab session operations
├── stickyNoteStorage.ts  # Sticky note + vote operations
├── agentStorage.ts       # Agent, AgentRun, AgentTemplate operations
├── templateStorage.ts    # All template operations (task, workflow, standup, colab, stickyNote)
├── groupStorage.ts       # Group, UserGroup, TaskGroup, ColabGroup operations
├── activityStorage.ts    # Activity and Notification operations
├── teamStorage.ts        # Team operations
├── pointsStorage.ts      # Points, Badge, Department operations
└── index.ts              # Compose all modules, export storage instance
```

---

## Detailed File Specifications

### 1. `server/storage/types.ts`

**Purpose:** Define the unified `IStorage` interface with deduplicated methods

**Methods to include (deduplicated):**
- User methods (8): getUser, getUserByUsername, getUserByEmail, getUserByStripeCustomerId, getUserByStripeSubscriptionId, createUser, updateUser, getAllUsers
- Task methods (7): createTask, getTask, getUserTasks, updateTask, deleteTask, getTasksByStatus, getTasksForStandup
- Comment methods (2): createComment, getTaskComments
- Attachment methods (2): createAttachment, getTaskAttachments
- Standup methods (3): createStandup, getStandup, getRecentStandups
- Colab methods (5): createColabSession, getColabSession, getUpcomingColabSessions, updateColabSession, deleteColabSession
- Team methods (3): createTeam, getTeam, getUserTeams
- Points methods (3): addUserPoints, getUserPoints, getLeaderboard
- Department methods (5): createDepartment, getDepartment, getDepartmentByName, getAllDepartments, updateDepartment, deleteDepartment
- Badge methods (5): createBadge, getBadge, getBadgeByName, getAllBadges, updateBadge, deleteBadge
- Activity methods (2): createActivity, getActivities
- Notification methods (5): createNotification, getUserNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification
- Group methods (5): createGroup, getGroup, getAllGroups, updateGroup, deleteGroup
- User-Group methods (5): addUserToGroup, removeUserFromGroup, getUserGroups, getGroupUsers, getUsersInSameGroups
- Task Group methods (5): createTaskGroup, getTaskGroup, getUserTaskGroups, getAllTaskGroups, updateTaskGroup, deleteTaskGroup
- Task Group Item methods (4): addTaskToGroup, removeTaskFromGroup, getTasksInGroup, getGroupsForTask
- Colab Group methods (5): createColabGroup, getColabGroup, getUserColabGroups, getAllColabGroups, updateColabGroup, deleteColabGroup
- Colab Group Item methods (4): addColabToGroup, removeColabFromGroup, getColabsInGroup, getGroupsForColab
- Task Template methods (5): createTaskTemplate, getTaskTemplate, getTaskTemplates, getAllTaskTemplates, updateTaskTemplate, deleteTaskTemplate
- Workflow Template methods (5): createWorkflowTemplate, getWorkflowTemplate, getWorkflowTemplates, getAllWorkflowTemplates, updateWorkflowTemplate, deleteWorkflowTemplate
- Standup Template methods (5): createStandupTemplate, getStandupTemplate, getStandupTemplates, getAllStandupTemplates, updateStandupTemplate, deleteStandupTemplate
- Colab Template methods (5): createColabTemplate, getColabTemplate, getColabTemplates, getAllColabTemplates, updateColabTemplate, deleteColabTemplate
- Sticky Note Template methods (5): createStickyNoteTemplate, getStickyNoteTemplate, getStickyNoteTemplates, getAllStickyNoteTemplates, updateStickyNoteTemplate, deleteStickyNoteTemplate
- Sticky Note methods (6): createStickyNote, getStickyNote, getAllStickyNotes, getColabStickyNotes, getUserStickyNotes, updateStickyNote, deleteStickyNote
- Sticky Note Vote methods (4): addStickyNoteVote, getUserVoteForStickyNote, updateStickyNoteVote, removeStickyNoteVote
- Agent methods (6): createAgent, getAgent, getAgentsByUser, getUserAgents, getAllAgents, updateAgent, deleteAgent
- Agent Run methods (5): createAgentRun, getAgentRun, getAgentRuns, getUserAgentRuns, updateAgentRun, deleteAgentRun
- Agent Template methods (7): createAgentTemplate, getAgentTemplate, getAgentTemplatesByType, getAgentTemplatesByUser, getAllAgentTemplates, getPublicAgentTemplates, updateAgentTemplate, deleteAgentTemplate
- Workflow Planner methods (5): createWorkflowPlanner, getWorkflowPlanner, getUserWorkflowPlanners, getPublicWorkflowPlanners, updateWorkflowPlanner, deleteWorkflowPlanner

---

### 2. `server/storage/userStorage.ts`

**Methods:**
- getUser(id: number): Promise<User | undefined>
- getUserByUsername(username: string): Promise<User | undefined>
- getUserByEmail(email: string): Promise<User | undefined>
- getUserByStripeCustomerId(customerId: string): Promise<User | undefined>
- getUserByStripeSubscriptionId(subscriptionId: string): Promise<User | undefined>
- createUser(user: InsertUser): Promise<User>
- updateUser(id: number, user: Partial<User>): Promise<User | undefined>
- getAllUsers(): Promise<User[]>

**Implementation:** Lines 277-337 of current storage.ts

---

### 3. `server/storage/taskStorage.ts`

**Methods:**
- createTask(task: InsertTask): Promise<Task>
- getTask(id: number): Promise<Task | undefined>
- getUserTasks(userId: number): Promise<Task[]>
- updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>
- deleteTask(id: number): Promise<boolean>
- getTasksByStatus(status: string): Promise<Task[]>
- getTasksForStandup(): Promise<Task[]>
- createComment(comment: InsertComment): Promise<Comment>
- getTaskComments(taskId: number): Promise<Comment[]>
- createAttachment(attachment: InsertAttachment): Promise<Attachment>
- getTaskAttachments(taskId: number): Promise<Attachment[]>

**Implementation:** Lines 340-451 of current storage.ts

---

### 4. `server/storage/standupStorage.ts`

**Methods:**
- createStandup(standup: InsertStandup): Promise<Standup>
- getStandup(id: number): Promise<Standup | undefined>
- getRecentStandups(limit: number): Promise<Standup[]>

**Implementation:** Lines 454-480 of current storage.ts

---

### 5. `server/storage/colabStorage.ts`

**Methods:**
- createColabSession(colabSession: InsertColabSession): Promise<ColabSession>
- getColabSession(id: number): Promise<ColabSession | undefined>
- getUpcomingColabSessions(): Promise<ColabSession[]>
- updateColabSession(id: number, colabData: Partial<ColabSession>): Promise<ColabSession | undefined>
- deleteColabSession(id: number): Promise<boolean>

**Implementation:** Lines 483-538 of current storage.ts

---

### 6. `server/storage/teamStorage.ts`

**Methods:**
- createTeam(team: InsertTeam): Promise<Team>
- getTeam(id: number): Promise<Team | undefined>
- getUserTeams(userId: number): Promise<Team[]>

**Implementation:** Lines 541-566 of current storage.ts

---

### 7. `server/storage/pointsStorage.ts`

**Methods:**
- addUserPoints(points: InsertUserPoints): Promise<UserPoints>
- getUserPoints(userId: number): Promise<number>
- getLeaderboard(limit: number): Promise<{user: User, points: number}[]>
- createDepartment(department: InsertDepartment): Promise<Department>
- getDepartment(id: number): Promise<Department | undefined>
- getDepartmentByName(name: string): Promise<Department | undefined>
- getAllDepartments(): Promise<Department[]>
- updateDepartment(id: number, department: Partial<Department>): Promise<Department | undefined>
- deleteDepartment(id: number): Promise<boolean>
- createBadge(badge: InsertBadge): Promise<Badge>
- getBadge(id: number): Promise<Badge | undefined>
- getBadgeByName(name: string): Promise<Badge | undefined>
- getAllBadges(): Promise<Badge[]>
- updateBadge(id: number, badge: Partial<Badge>): Promise<Badge | undefined>
- deleteBadge(id: number): Promise<boolean>

**Implementation:** Lines 569-722 of current storage.ts

---

### 8. `server/storage/activityStorage.ts`

**Methods:**
- createActivity(activity: InsertActivity): Promise<Activity>
- getActivities(limit?: number, offset?: number): Promise<ActivityFeedItem[]>
- createNotification(notification: InsertNotification): Promise<Notification>
- getUserNotifications(userId: number): Promise<NotificationItem[]>
- getUnreadNotificationCount(userId: number): Promise<number>
- markNotificationAsRead(id: number): Promise<boolean>
- markAllNotificationsAsRead(userId: number): Promise<boolean>
- deleteNotification(id: number): Promise<boolean>

**Implementation:** Lines 724-904 of current storage.ts

---

### 9. `server/storage/groupStorage.ts`

**Methods:**
- createGroup(group: InsertGroup): Promise<Group>
- getGroup(id: number): Promise<Group | undefined>
- getAllGroups(): Promise<Group[]>
- updateGroup(id: number, groupData: Partial<Group>): Promise<Group | undefined>
- deleteGroup(id: number): Promise<boolean>
- addUserToGroup(userGroup: InsertUserGroup): Promise<UserGroup>
- removeUserFromGroup(userId: number, groupId: number): Promise<boolean>
- getUserGroups(userId: number): Promise<Group[]>
- getGroupUsers(groupId: number): Promise<User[]>
- getUsersInSameGroups(userId: number): Promise<User[]>
- createTaskGroup(taskGroup: InsertTaskGroup): Promise<TaskGroup>
- getTaskGroup(id: number): Promise<TaskGroup | undefined>
- getUserTaskGroups(userId: number): Promise<TaskGroup[]>
- getAllTaskGroups(): Promise<TaskGroup[]>
- updateTaskGroup(id: number, data: Partial<TaskGroup>): Promise<TaskGroup | undefined>
- deleteTaskGroup(id: number): Promise<boolean>
- addTaskToGroup(taskGroupItem: InsertTaskGroupItem): Promise<TaskGroupItem>
- removeTaskFromGroup(taskId: number, groupId: number): Promise<boolean>
- getTasksInGroup(groupId: number): Promise<Task[]>
- getGroupsForTask(taskId: number): Promise<TaskGroup[]>
- createColabGroup(colabGroup: InsertColabGroup): Promise<ColabGroup>
- getColabGroup(id: number): Promise<ColabGroup | undefined>
- getUserColabGroups(userId: number): Promise<ColabGroup[]>
- getAllColabGroups(): Promise<ColabGroup[]>
- updateColabGroup(id: number, data: Partial<ColabGroup>): Promise<ColabGroup | undefined>
- deleteColabGroup(id: number): Promise<boolean>
- addColabToGroup(colabGroupItem: InsertColabGroupItem): Promise<ColabGroupItem>
- removeColabFromGroup(colabId: number, groupId: number): Promise<boolean>
- getColabsInGroup(groupId: number): Promise<ColabSession[]>
- getGroupsForColab(colabId: number): Promise<ColabGroup[]>

**Implementation:** Lines 906-1716 of current storage.ts
**Note:** Depends on taskStorage (getTask), colabStorage (getColabSession) for validation

---

### 10. `server/storage/templateStorage.ts`

**Methods:**
- Task templates: createTaskTemplate, getTaskTemplate, getTaskTemplates, getAllTaskTemplates, updateTaskTemplate, deleteTaskTemplate
- Workflow templates: createWorkflowTemplate, getWorkflowTemplate, getWorkflowTemplates, getAllWorkflowTemplates, updateWorkflowTemplate, deleteWorkflowTemplate
- Standup templates: createStandupTemplate, getStandupTemplate, getStandupTemplates, getAllStandupTemplates, updateStandupTemplate, deleteStandupTemplate
- Colab templates: createColabTemplate, getColabTemplate, getColabTemplates, getAllColabTemplates, updateColabTemplate, deleteColabTemplate
- Sticky note templates: createStickyNoteTemplate, getStickyNoteTemplate, getStickyNoteTemplates, getAllStickyNoteTemplates, updateStickyNoteTemplate, deleteStickyNoteTemplate

**Implementation:** Lines 1718-2430 of current storage.ts

---

### 11. `server/storage/stickyNoteStorage.ts`

**Methods:**
- createStickyNote(note: InsertStickyNote): Promise<StickyNote>
- getStickyNote(id: number): Promise<StickyNote | undefined>
- getAllStickyNotes(limit?: number, offset?: number): Promise<StickyNote[]>
- getColabStickyNotes(colabId: number): Promise<StickyNote[]>
- getUserStickyNotes(userId: number): Promise<StickyNote[]>
- updateStickyNote(id: number, note: Partial<StickyNote>): Promise<StickyNote | undefined>
- deleteStickyNote(id: number): Promise<boolean>
- addStickyNoteVote(vote: InsertStickyNoteVote): Promise<StickyNoteVote>
- getUserVoteForStickyNote(userId: number, noteId: number): Promise<StickyNoteVote | undefined>
- updateStickyNoteVote(userId: number, noteId: number, voteType: string): Promise<StickyNoteVote | undefined>
- removeStickyNoteVote(userId: number, noteId: number): Promise<boolean>

**Implementation:** Lines 2432-2920 of current storage.ts
**Note:** Uses transactions, creates activities and notifications

---

### 12. `server/storage/agentStorage.ts`

**Methods:**
- createAgent(agent: InsertAgent): Promise<Agent>
- getAgent(id: number): Promise<Agent | undefined>
- getAgentsByUser(userId: number): Promise<Agent[]>
- getUserAgents(userId: number): Promise<Agent[]> (alias)
- getAllAgents(): Promise<Agent[]>
- updateAgent(id: number, agent: Partial<Agent>): Promise<Agent | undefined>
- deleteAgent(id: number): Promise<boolean>
- createAgentRun(run: InsertAgentRun): Promise<AgentRun>
- getAgentRun(id: number): Promise<AgentRun | undefined>
- getAgentRuns(agentId: number): Promise<AgentRun[]>
- getUserAgentRuns(userId: number): Promise<AgentRun[]>
- updateAgentRun(id: number, run: Partial<AgentRun>): Promise<AgentRun | undefined>
- deleteAgentRun(id: number): Promise<boolean>
- createAgentTemplate(template: InsertAgentTemplate): Promise<AgentTemplate>
- getAgentTemplate(id: number): Promise<AgentTemplate | undefined>
- getAgentTemplatesByType(type: string): Promise<AgentTemplate[]>
- getAgentTemplatesByUser(userId: number): Promise<AgentTemplate[]>
- getAllAgentTemplates(): Promise<AgentTemplate[]>
- getPublicAgentTemplates(): Promise<AgentTemplate[]>
- updateAgentTemplate(id: number, template: Partial<AgentTemplate>): Promise<AgentTemplate | undefined>
- deleteAgentTemplate(id: number): Promise<boolean>
- createWorkflowPlanner(planner: InsertWorkflowPlanner): Promise<WorkflowPlanner>
- getWorkflowPlanner(id: number): Promise<WorkflowPlanner | undefined>
- getUserWorkflowPlanners(userId: number): Promise<WorkflowPlanner[]>
- getPublicWorkflowPlanners(): Promise<WorkflowPlanner[]>
- updateWorkflowPlanner(id: number, planner: Partial<WorkflowPlanner>): Promise<WorkflowPlanner | undefined>
- deleteWorkflowPlanner(id: number): Promise<boolean>

**Implementation:** Lines 3085-3486 of current storage.ts

---

### 13. `server/storage/index.ts`

**Purpose:** Compose all storage modules into a unified storage object

**Approach:**
1. Import all storage module classes/objects
2. Create instances of each
3. Compose into single object that implements IStorage
4. Export as `storage` singleton
5. Export `IStorage` interface for backward compatibility
6. Do NOT include seedInitialData (leave in main storage.ts or separate seed file)

---

## Implementation Steps

1. Create `server/storage/` directory
2. Create `types.ts` with deduplicated IStorage interface
3. Create individual storage modules (userStorage, taskStorage, etc.)
4. Create `index.ts` to compose all modules
5. Update imports in `server/routes.ts` and `server/index.ts`
6. Run `npm run check` to verify TypeScript compilation
7. Keep original `storage.ts` as backup until verification complete

---

## Dependencies Between Modules

Some modules have cross-dependencies:
- `groupStorage` needs `taskStorage.getTask()` and `colabStorage.getColabSession()` for validation
- `stickyNoteStorage.createStickyNote` uses transactions with `userPoints`, `users`, `activities` tables

**Solution:** Pass db connection to each module; use direct table queries rather than calling other storage methods. For validation, query tables directly.

---

## Backward Compatibility

The composed storage object must:
1. Implement all methods from IStorage interface
2. Be exported as `storage` singleton
3. Also export `DatabaseStorage` class (can be removed in future)
4. Keep same method signatures

---

## Testing Strategy

1. Run `npm run check` to verify TypeScript compilation
2. Start dev server with `npm run dev`
3. Test critical paths:
   - User authentication (login/signup)
   - Task CRUD operations
   - Agent operations
   - Template operations
