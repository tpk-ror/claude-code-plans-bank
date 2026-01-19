# Refactoring Plan: Client-Side API and Hooks

## Overview
Restructure the CoLab application's client-side API layer by creating centralized query keys, API endpoint constants, HTTP client, and domain-specific query/mutation hooks.

## Current State Analysis

### Patterns Observed:
1. **Query keys are scattered string literals** throughout pages (e.g., `['/api/tasks']`, `['/api/users']`)
2. **No centralized API configuration** - endpoints hardcoded in components
3. **Inconsistent hook patterns** - some use TanStack Query v5 patterns, some use raw fetch
4. **Existing `apiRequest` helper** in `client/src/lib/queryClient.ts` handles basic error throwing
5. **Existing `use-notifications.tsx`** hook combines queries and mutations (good pattern to follow)

### API Endpoints Discovered (from server/routes.ts):

**Auth:**
- POST /api/auth/login, /api/auth/register, /api/auth/logout, /api/auth/forgot-password
- GET /api/auth/session

**Users:**
- GET/POST /api/users
- GET /api/users/:id
- GET /api/users/:id/points
- GET/PATCH /api/user/preferences
- PATCH /api/profile

**Tasks:**
- GET/POST /api/tasks
- GET/PATCH/DELETE /api/tasks/:id
- GET /api/tasks/:taskId/comments
- POST /api/comments
- GET /api/tasks/:id/groups

**Standups:**
- POST /api/standups
- GET /api/standups/recent
- GET /api/standups/:id

**Colabs:**
- GET/POST /api/colabs
- GET /api/colabs/upcoming
- GET/PATCH/DELETE /api/colabs/:id
- GET /api/colabs/:id/groups

**Sticky Notes:**
- GET/POST /api/sticky-notes
- GET /api/sticky-notes/:id
- PUT /api/sticky-notes/:id
- DELETE /api/sticky-notes/:id
- GET /api/sticky-notes/colab/:colabId
- GET /api/sticky-notes/user/:userId
- GET/POST/DELETE /api/sticky-notes/:noteId/vote

**Agents:**
- GET /api/agents (user's agents)
- GET /api/agents/all (admin)
- GET/POST /api/agents
- GET/PUT/DELETE /api/agents/:id
- POST /api/agents/:id/run
- GET /api/agents/:id/runs
- GET /api/agent-runs/:id
- PUT /api/agent-runs/:id/review

**Templates:**
- GET/POST /api/task-templates, GET/PUT/DELETE /api/task-templates/:id
- GET/POST /api/workflow-templates, GET/PUT/DELETE /api/workflow-templates/:id
- GET/POST /api/standup-templates, GET/PUT/DELETE /api/standup-templates/:id
- GET/POST /api/colab-templates, GET/PUT/DELETE /api/colab-templates/:id
- GET/POST /api/sticky-note-templates, GET/PUT/DELETE /api/sticky-note-templates/:id
- GET /api/templates (all), GET /api/templates/:type

**Groups:**
- GET/POST /api/groups, GET/PATCH/DELETE /api/groups/:id
- GET/POST /api/groups/:id/members
- DELETE /api/groups/:groupId/members/:userId
- GET /api/user/groups
- GET /api/user/group-members

**Task Groups:**
- GET/POST /api/task-groups
- GET/PUT/DELETE /api/task-groups/:id
- GET /api/user/task-groups
- POST /api/task-groups/:id/tasks
- DELETE /api/task-groups/:groupId/tasks/:taskId
- GET /api/task-groups/:id/tasks

**Colab Groups:**
- GET/POST /api/colab-groups
- GET/PUT/DELETE /api/colab-groups/:id
- GET /api/user/colab-groups
- POST /api/colab-groups/:id/colabs
- DELETE /api/colab-groups/:groupId/colabs/:colabId
- GET /api/colab-groups/:id/colabs

**Notifications:**
- GET /api/notifications
- GET /api/notifications/unread-count
- POST /api/notifications/:id/read
- POST /api/notifications/mark-all-read

**Other:**
- GET /api/leaderboard
- POST /api/points
- GET /api/feed
- GET /api/departments, GET /api/departments/:id
- GET /api/badges, GET /api/badges/:id
- POST /api/contact, POST /api/feedback
- POST /api/leads
- GET/POST /api/workflow-planners

---

## Files to Create

### 1. `client/src/lib/queryKeys.ts`
Centralized query key factory with hierarchical structure for proper cache invalidation.

```typescript
export const queryKeys = {
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.users.all, 'detail', id] as const,
    me: () => [...queryKeys.users.all, 'me'] as const,
    preferences: () => [...queryKeys.users.all, 'preferences'] as const,
    points: (id: number) => [...queryKeys.users.all, 'points', id] as const,
    groups: () => [...queryKeys.users.all, 'groups'] as const,
    groupMembers: () => [...queryKeys.users.all, 'group-members'] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.tasks.all, 'detail', id] as const,
    byUser: (userId: number) => [...queryKeys.tasks.all, 'user', userId] as const,
    byStatus: (status: string) => [...queryKeys.tasks.all, 'status', status] as const,
    forStandup: () => [...queryKeys.tasks.all, 'standup'] as const,
    comments: (taskId: number) => [...queryKeys.tasks.all, 'comments', taskId] as const,
    groups: (taskId: number) => [...queryKeys.tasks.all, 'groups', taskId] as const,
  },
  standups: {
    all: ['standups'] as const,
    recent: (limit?: number) => [...queryKeys.standups.all, 'recent', limit] as const,
    detail: (id: number) => [...queryKeys.standups.all, 'detail', id] as const,
  },
  colabs: {
    all: ['colabs'] as const,
    upcoming: () => [...queryKeys.colabs.all, 'upcoming'] as const,
    detail: (id: number) => [...queryKeys.colabs.all, 'detail', id] as const,
    groups: (id: number) => [...queryKeys.colabs.all, 'groups', id] as const,
  },
  stickyNotes: {
    all: ['stickyNotes'] as const,
    lists: () => [...queryKeys.stickyNotes.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.stickyNotes.all, 'detail', id] as const,
    byColab: (colabId: number) => [...queryKeys.stickyNotes.all, 'colab', colabId] as const,
    byUser: (userId: number) => [...queryKeys.stickyNotes.all, 'user', userId] as const,
    vote: (noteId: number) => [...queryKeys.stickyNotes.all, 'vote', noteId] as const,
  },
  agents: {
    all: ['agents'] as const,
    lists: () => [...queryKeys.agents.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.agents.all, 'detail', id] as const,
    runs: (agentId: number) => [...queryKeys.agents.all, 'runs', agentId] as const,
    runDetail: (runId: number) => [...queryKeys.agents.all, 'run', runId] as const,
  },
  templates: {
    all: ['templates'] as const,
    task: () => [...queryKeys.templates.all, 'task'] as const,
    taskDetail: (id: number) => [...queryKeys.templates.all, 'task', id] as const,
    workflow: () => [...queryKeys.templates.all, 'workflow'] as const,
    workflowDetail: (id: number) => [...queryKeys.templates.all, 'workflow', id] as const,
    standup: () => [...queryKeys.templates.all, 'standup'] as const,
    standupDetail: (id: number) => [...queryKeys.templates.all, 'standup', id] as const,
    colab: () => [...queryKeys.templates.all, 'colab'] as const,
    colabDetail: (id: number) => [...queryKeys.templates.all, 'colab', id] as const,
    stickyNote: () => [...queryKeys.templates.all, 'sticky-note'] as const,
    stickyNoteDetail: (id: number) => [...queryKeys.templates.all, 'sticky-note', id] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },
  groups: {
    all: ['groups'] as const,
    lists: () => [...queryKeys.groups.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.groups.all, 'detail', id] as const,
    members: (id: number) => [...queryKeys.groups.all, 'members', id] as const,
  },
  taskGroups: {
    all: ['taskGroups'] as const,
    lists: () => [...queryKeys.taskGroups.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.taskGroups.all, 'detail', id] as const,
    tasks: (id: number) => [...queryKeys.taskGroups.all, 'tasks', id] as const,
    userGroups: () => [...queryKeys.taskGroups.all, 'user'] as const,
  },
  colabGroups: {
    all: ['colabGroups'] as const,
    lists: () => [...queryKeys.colabGroups.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.colabGroups.all, 'detail', id] as const,
    colabs: (id: number) => [...queryKeys.colabGroups.all, 'colabs', id] as const,
    userGroups: () => [...queryKeys.colabGroups.all, 'user'] as const,
  },
  feed: {
    all: ['feed'] as const,
  },
  leaderboard: {
    all: ['leaderboard'] as const,
  },
  departments: {
    all: ['departments'] as const,
    detail: (id: number) => [...queryKeys.departments.all, 'detail', id] as const,
  },
  badges: {
    all: ['badges'] as const,
    detail: (id: number) => [...queryKeys.badges.all, 'detail', id] as const,
  },
};
```

### 2. `client/src/api/endpoints.ts`
All API endpoint constants organized by domain.

```typescript
export const API = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    forgotPassword: '/api/auth/forgot-password',
    session: '/api/auth/session',
  },
  users: {
    list: '/api/users',
    detail: (id: number) => `/api/users/${id}`,
    points: (id: number) => `/api/users/${id}/points`,
    preferences: '/api/user/preferences',
    profile: '/api/profile',
    groups: '/api/user/groups',
    groupMembers: '/api/user/group-members',
  },
  tasks: {
    list: '/api/tasks',
    detail: (id: number) => `/api/tasks/${id}`,
    comments: (taskId: number) => `/api/tasks/${taskId}/comments`,
    groups: (taskId: number) => `/api/tasks/${taskId}/groups`,
  },
  comments: {
    create: '/api/comments',
  },
  standups: {
    create: '/api/standups',
    recent: '/api/standups/recent',
    detail: (id: number) => `/api/standups/${id}`,
  },
  colabs: {
    list: '/api/colabs',
    upcoming: '/api/colabs/upcoming',
    detail: (id: number) => `/api/colabs/${id}`,
    groups: (id: number) => `/api/colabs/${id}/groups`,
  },
  stickyNotes: {
    list: '/api/sticky-notes',
    detail: (id: number) => `/api/sticky-notes/${id}`,
    byColab: (colabId: number) => `/api/sticky-notes/colab/${colabId}`,
    byUser: (userId: number) => `/api/sticky-notes/user/${userId}`,
    vote: (noteId: number) => `/api/sticky-notes/${noteId}/vote`,
  },
  agents: {
    list: '/api/agents',
    all: '/api/agents/all',
    detail: (id: number) => `/api/agents/${id}`,
    run: (id: number) => `/api/agents/${id}/run`,
    runs: (id: number) => `/api/agents/${id}/runs`,
    runDetail: (runId: number) => `/api/agent-runs/${runId}`,
    runReview: (runId: number) => `/api/agent-runs/${runId}/review`,
  },
  agentTemplates: {
    public: '/api/agent-templates/public',
    all: '/api/agent-templates/all',
    detail: (id: number) => `/api/agent-templates/${id}`,
  },
  templates: {
    all: '/api/templates',
    task: {
      list: '/api/task-templates',
      detail: (id: number) => `/api/task-templates/${id}`,
    },
    workflow: {
      list: '/api/workflow-templates',
      detail: (id: number) => `/api/workflow-templates/${id}`,
    },
    standup: {
      list: '/api/standup-templates',
      detail: (id: number) => `/api/standup-templates/${id}`,
    },
    colab: {
      list: '/api/colab-templates',
      detail: (id: number) => `/api/colab-templates/${id}`,
    },
    stickyNote: {
      list: '/api/sticky-note-templates',
      detail: (id: number) => `/api/sticky-note-templates/${id}`,
    },
  },
  notifications: {
    list: '/api/notifications',
    unreadCount: '/api/notifications/unread-count',
    markRead: (id: number) => `/api/notifications/${id}/read`,
    markAllRead: '/api/notifications/mark-all-read',
  },
  groups: {
    list: '/api/groups',
    detail: (id: number) => `/api/groups/${id}`,
    members: (id: number) => `/api/groups/${id}/members`,
    removeMember: (groupId: number, userId: number) => `/api/groups/${groupId}/members/${userId}`,
  },
  taskGroups: {
    list: '/api/task-groups',
    detail: (id: number) => `/api/task-groups/${id}`,
    tasks: (id: number) => `/api/task-groups/${id}/tasks`,
    removeTask: (groupId: number, taskId: number) => `/api/task-groups/${groupId}/tasks/${taskId}`,
    userGroups: '/api/user/task-groups',
  },
  colabGroups: {
    list: '/api/colab-groups',
    detail: (id: number) => `/api/colab-groups/${id}`,
    colabs: (id: number) => `/api/colab-groups/${id}/colabs`,
    removeColab: (groupId: number, colabId: number) => `/api/colab-groups/${groupId}/colabs/${colabId}`,
    userGroups: '/api/user/colab-groups',
  },
  feed: '/api/feed',
  leaderboard: '/api/leaderboard',
  points: '/api/points',
  departments: {
    list: '/api/departments',
    detail: (id: number) => `/api/departments/${id}`,
  },
  badges: {
    list: '/api/badges',
    detail: (id: number) => `/api/badges/${id}`,
  },
  openai: {
    checkCredentials: '/api/openai/check-credentials',
    generateTemplate: '/api/openai/generate-template',
  },
  workflowPlanners: {
    list: '/api/workflow-planners',
    detail: (id: number) => `/api/workflow-planners/${id}`,
  },
  contact: '/api/contact',
  feedback: '/api/feedback',
  leads: '/api/leads',
} as const;
```

### 3. `client/src/api/client.ts`
HTTP client with error handling.

```typescript
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(endpoint, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, errorText || response.statusText);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) return {} as T;

  return JSON.parse(text);
}

// Helper methods for common HTTP methods
export const api = {
  get: <T>(endpoint: string, options?: Omit<RequestInit, 'method'>) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: Omit<RequestInit, 'method' | 'body'>) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    }),

  put: <T>(endpoint: string, data?: unknown, options?: Omit<RequestInit, 'method' | 'body'>) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    }),

  patch: <T>(endpoint: string, data?: unknown, options?: Omit<RequestInit, 'method' | 'body'>) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    }),

  delete: <T>(endpoint: string, options?: Omit<RequestInit, 'method'>) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};
```

### 4-10. Query Hooks

**Pattern for each hook file:**
- Import queryKeys, API endpoints, apiClient
- Export named hooks for each query operation
- Use proper TypeScript types from @shared/schema
- Include `enabled` option to conditionally run queries

**Files:**
- `client/src/hooks/queries/useTasks.ts`
- `client/src/hooks/queries/useStandups.ts`
- `client/src/hooks/queries/useColabs.ts`
- `client/src/hooks/queries/useStickyNotes.ts`
- `client/src/hooks/queries/useAgents.ts`
- `client/src/hooks/queries/useTemplates.ts`
- `client/src/hooks/queries/useNotifications.ts`

### 11-15. Mutation Hooks

**Pattern for each mutation hook file:**
- Import queryKeys, API endpoints, apiClient, useQueryClient
- Export named hooks for each mutation
- Include proper cache invalidation using queryClient.invalidateQueries
- Use onSuccess/onError callbacks appropriately

**Files:**
- `client/src/hooks/mutations/useTaskMutations.ts`
- `client/src/hooks/mutations/useStandupMutations.ts`
- `client/src/hooks/mutations/useColabMutations.ts`
- `client/src/hooks/mutations/useStickyNoteMutations.ts`
- `client/src/hooks/mutations/useAgentMutations.ts`

### 16. `client/src/hooks/index.ts`
Re-export all hooks for easy importing.

```typescript
// Query hooks
export * from './queries/useTasks';
export * from './queries/useStandups';
export * from './queries/useColabs';
export * from './queries/useStickyNotes';
export * from './queries/useAgents';
export * from './queries/useTemplates';
export * from './queries/useNotifications';

// Mutation hooks
export * from './mutations/useTaskMutations';
export * from './mutations/useStandupMutations';
export * from './mutations/useColabMutations';
export * from './mutations/useStickyNoteMutations';
export * from './mutations/useAgentMutations';

// Re-export existing hooks
export * from './useAuth';
export * from './use-toast';
export * from './use-mobile';
export * from './useScrollToTop';
```

---

## Implementation Order

1. Create `client/src/lib/queryKeys.ts`
2. Create `client/src/api/endpoints.ts`
3. Create `client/src/api/client.ts`
4. Create query hooks directory and files:
   - `client/src/hooks/queries/useTasks.ts`
   - `client/src/hooks/queries/useStandups.ts`
   - `client/src/hooks/queries/useColabs.ts`
   - `client/src/hooks/queries/useStickyNotes.ts`
   - `client/src/hooks/queries/useAgents.ts`
   - `client/src/hooks/queries/useTemplates.ts`
   - `client/src/hooks/queries/useNotifications.ts`
5. Create mutation hooks directory and files:
   - `client/src/hooks/mutations/useTaskMutations.ts`
   - `client/src/hooks/mutations/useStandupMutations.ts`
   - `client/src/hooks/mutations/useColabMutations.ts`
   - `client/src/hooks/mutations/useStickyNoteMutations.ts`
   - `client/src/hooks/mutations/useAgentMutations.ts`
6. Create `client/src/hooks/index.ts`
7. Run `npm run check` to verify TypeScript compiles

---

## Type Imports

From `@shared/schema` we can import:
- `User` (inferred from users table)
- `Task` (inferred from tasks table)
- `Standup` (inferred from standups table)
- `ColabSession` (inferred from colabSessions table)
- `StickyNote` (inferred from stickyNotes table)
- `Agent`, `AgentRun`, `AgentTemplate`
- `NotificationItem`
- And various insert schemas

From `@/lib/types.ts` for additional client-side types.

---

## Testing

After creating all files, run:
```bash
npm run check
```

This should pass without TypeScript errors.
