# CoLab Server Routes Modularization Plan

## Overview
Refactor the monolithic `server/routes.ts` (4,195 lines) into modular files with proper utilities, error handling, and logging.

## Current State Analysis
- All routes in single `server/routes.ts` file
- Uses `console.log` for logging
- No standardized error classes
- No centralized error handling middleware
- Passport.js authentication with session store

## Files to Create

### 1. Utility Files (`server/utils/`)

#### `server/utils/logger.ts`
- Structured logging with log levels (debug, info, warn, error)
- Timestamp formatting
- Context support for request tracing
- Replace all `console.log` statements

#### `server/utils/errors.ts`
- `AppError` - Base error class with status code
- `NotFoundError` - 404 errors
- `ValidationError` - 400 errors for invalid input
- `UnauthorizedError` - 401 errors
- `ForbiddenError` - 403 errors

#### `server/utils/response.ts`
- `sendSuccess(res, data, statusCode)` - Standardized success responses
- `sendError(res, error)` - Standardized error responses
- `sendPaginated(res, data, pagination)` - Paginated responses

### 2. Middleware Files (`server/middleware/`)

#### `server/middleware/auth.ts`
- Extract from routes.ts:
  - `isAuthenticated` middleware
  - `isAdmin` middleware
  - Passport configuration
  - Session configuration
  - Password hashing utilities (hashPassword, comparePasswords)

#### `server/middleware/errorHandler.ts`
- Global error handler that catches all errors
- Handles custom error classes appropriately
- Logs errors using logger utility

#### `server/middleware/validation.ts`
- `validate(schema)` - Middleware wrapper for Zod schema validation
- `parseId(paramName)` - Validate and parse numeric ID params

### 3. Route Files (`server/routes/`)

#### `server/routes/auth.ts`
Routes to extract:
- POST `/api/auth/login` - Login
- POST `/api/auth/register` - Register
- POST `/api/auth/logout` - Logout
- POST `/api/auth/forgot-password` - Password reset request
- GET `/api/auth/session` - Get current session

#### `server/routes/users.ts`
Routes to extract:
- POST `/api/users` - Create user
- GET `/api/users` - Get all users
- GET `/api/users/:id` - Get user by ID
- GET `/api/user/preferences` - Get preferences
- PATCH `/api/user/preferences` - Update preferences
- PATCH `/api/profile` - Update profile
- GET `/api/user/groups` - Get user's groups
- GET `/api/user/group-members` - Get users in same groups
- GET `/api/user/task-groups` - Get user's task groups
- GET `/api/user/colab-groups` - Get user's colab groups

#### `server/routes/tasks.ts`
Routes to extract:
- POST `/api/tasks` - Create task
- GET `/api/tasks` - Get tasks
- GET `/api/tasks/:id` - Get task by ID
- PATCH `/api/tasks/:id` - Update task
- DELETE `/api/tasks/:id` - Delete task
- POST `/api/comments` - Create comment
- GET `/api/tasks/:taskId/comments` - Get task comments
- GET `/api/tasks/:id/groups` - Get groups for task

#### `server/routes/standups.ts`
Routes to extract:
- POST `/api/standups` - Create standup
- GET `/api/standups/recent` - Get recent standups
- GET `/api/standups/:id` - Get standup by ID

#### `server/routes/colabs.ts`
Routes to extract:
- POST `/api/colabs` - Create colab session
- GET `/api/colabs/upcoming` - Get upcoming colabs
- GET `/api/colabs/:id` - Get colab by ID
- PATCH `/api/colabs/:id` - Update colab
- DELETE `/api/colabs/:id` - Delete colab
- GET `/api/colabs/:id/groups` - Get groups for colab

#### `server/routes/stickyNotes.ts`
Routes to extract:
- GET `/api/sticky-notes` - Get all sticky notes
- GET `/api/sticky-notes/:id` - Get sticky note by ID
- GET `/api/sticky-notes/colab/:colabId` - Get colab's sticky notes
- GET `/api/sticky-notes/user/:userId` - Get user's sticky notes
- POST `/api/sticky-notes` - Create sticky note
- PUT `/api/sticky-notes/:id` - Update sticky note
- DELETE `/api/sticky-notes/:id` - Delete sticky note
- GET `/api/sticky-notes/:noteId/vote` - Get user's vote
- POST `/api/sticky-notes/:noteId/vote` - Add/update vote
- DELETE `/api/sticky-notes/:noteId/vote` - Remove vote

#### `server/routes/agents.ts`
Routes to extract:
- GET `/api/agents/all` - Get all agents (admin)
- GET `/api/agents` - Get user's agents
- GET `/api/agents/:id` - Get agent by ID
- POST `/api/agents` - Create agent
- PUT `/api/agents/:id` - Update agent
- DELETE `/api/agents/:id` - Delete agent
- GET `/api/agents/:id/runs` - Get agent runs
- POST `/api/agents/:id/run` - Start agent run
- GET `/api/agent-runs/:id` - Get agent run
- PUT `/api/agent-runs/:id/review` - Review agent run
- Agent template routes

#### `server/routes/templates.ts`
Routes to extract:
- GET `/api/templates` - Get all template types
- Task templates CRUD
- Workflow templates CRUD
- Standup templates CRUD
- Colab templates CRUD
- Sticky note templates CRUD
- OpenAI template generation endpoints

#### `server/routes/groups.ts`
Routes to extract:
- Group CRUD: POST/GET/GET:id/PATCH/DELETE `/api/groups`
- Group members: POST/DELETE/GET `/api/groups/:id/members`
- Task groups CRUD
- Task group items CRUD
- Colab groups CRUD
- Colab group items CRUD

#### `server/routes/notifications.ts`
Routes to extract:
- GET `/api/notifications` - Get user notifications
- GET `/api/notifications/unread-count` - Get unread count
- POST `/api/notifications/:id/read` - Mark as read
- POST `/api/notifications/mark-all-read` - Mark all read
- GET `/api/feed` - Get activity feed
- POST `/api/feed/seed` - Seed sample data

#### `server/routes/points.ts`
Routes to extract:
- GET `/api/leaderboard` - Get leaderboard
- GET `/api/users/:id/points` - Get user points
- POST `/api/points` - Add points

#### `server/routes/admin.ts`
Routes to extract:
- Department CRUD: POST/PATCH/DELETE `/api/admin/departments/:id`
- Badge CRUD: POST/PATCH/DELETE `/api/admin/badges/:id`
- User management: POST/PATCH `/api/admin/users/:id`
- GET `/api/departments` - List departments
- GET `/api/badges` - List badges

#### `server/routes/misc.ts` (additional routes)
Routes to extract:
- POST `/api/contact` - Contact form
- POST `/api/feedback` - Feedback submission
- POST `/api/leads` - Lead generation
- Stripe payment routes
- Workflow planner routes

#### `server/routes/index.ts`
- Import all route modules
- Export `registerRoutes(app)` function that:
  - Sets up session/passport middleware
  - Registers all route modules
  - Returns HTTP server

### 4. Update `server/index.ts`
- Import from modular routes
- Use error handler middleware
- Minimal changes to maintain same functionality

## Implementation Order
1. Create utilities (logger, errors, response)
2. Create middleware (auth, errorHandler, validation)
3. Create route modules one by one
4. Create routes/index.ts to wire everything
5. Update server/index.ts
6. Test with npm run check

## Key Considerations
- Maintain exact same API endpoints
- No breaking changes to frontend
- Import storage from existing storage.ts
- Keep Express User type declaration
- Preserve Passport.js session configuration
- Keep default preferences object in users route
