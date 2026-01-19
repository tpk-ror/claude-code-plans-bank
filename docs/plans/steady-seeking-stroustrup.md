# Task Management Feature Plan

## Summary
Add ability for users to change task status and create tasks directly (without converting meeting notes).

## Files to Modify

### 1. `src/hooks/useProjectTasks.ts`
- Extend `useUpdateTaskAssignment` to include `status` field
- Add new `useCreateTask` mutation
- Add query invalidation for `['project']` and `['projects']` keys

### 2. New: `src/components/tasks/TaskStatusSelect.tsx`
- Inline dropdown component for changing task status
- Statuses: todo, in-progress, completed, blocked
- Optimistic updates with error rollback
- Uses Select component from shadcn/ui

### 3. New: `src/components/tasks/CreateTaskDialog.tsx`
- Dialog with form for creating new tasks
- Fields: title, description, status, priority, assignee, due date
- Follow pattern from `CreateMeetingDialog.tsx`
- Uses react-hook-form + zod validation

### 4. `src/pages/ProjectDetail.tsx`
- Add "Add Task" button to Tasks card header
- Replace static status Badge with TaskStatusSelect component

### 5. `src/components/meetings/ProjectOpenItemsView.tsx`
- Add "Add Task" button in project sections
- Replace static status display with TaskStatusSelect component

## Implementation Steps

1. **Update useProjectTasks.ts hook**
   - Add `status` param to update mutation
   - Add `useCreateTask` mutation
   - Fix query invalidations

2. **Create TaskStatusSelect component**
   - Status dropdown with icons
   - Optimistic update handling

3. **Create CreateTaskDialog component**
   - Form with all task fields
   - Team member dropdown for assignee

4. **Integrate into ProjectDetail.tsx**
   - Import new components
   - Add create button and status selects

5. **Integrate into ProjectOpenItemsView.tsx**
   - Import new components
   - Add create button and status selects in table

## No Database Changes Required
The `tasks` table already has all needed columns and the `task_status` enum includes: todo, in-progress, completed, blocked.
