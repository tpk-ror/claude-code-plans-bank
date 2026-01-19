# TypeScript Error Fixes Plan

## Overview
Fix TypeScript errors in 8 files related to:
1. API responses returning `{}` instead of expected arrays - need proper typing and default values
2. Property name mismatches (`lastRun` should be `lastRunAt`)
3. Missing toast import
4. Unknown types needing proper type assertions

## Files to Fix

### 1. Dashboard.tsx (lines 43, 177, 224, 228, 323, 337)

**Issues:**
- Line 43: `userPreferences?.hasSeenWelcomePopup` - Property doesn't exist on type `{}`
- Line 177: `tasks.slice(0, 3)` - Property 'slice' doesn't exist on type `{}`
- Line 224: `myTasks.map(task =>` - Property 'map' doesn't exist on type `{}`
- Line 228: `users || []` - users could be `{}`
- Line 323: `departments.map` - Property 'map' doesn't exist on type `{}`
- Line 337: `users.filter` - Property 'filter' doesn't exist on type `{}`

**Fixes:**
- Add type assertions for `userPreferences` as `{ hasSeenWelcomePopup?: boolean }`
- Cast `tasks` query result to array type: `(tasks as Task[] || [])`
- Cast `users` query result to array type: `(users as User[] || [])`
- Cast `departments` query result to array type: `(departments as Department[] || [])`

---

### 2. Scoreboard.tsx (lines 51, 128, 208, 321, 413-417)

**Issues:**
- Line 51: `databaseBadges.map` - badges data could be `{}`
- Line 128: `leaderboard.length >= 3` - Property 'length' doesn't exist on type `{}`
- Line 208: `leaderboard.map` - Property 'map' doesn't exist on type `{}`
- Line 321: `recentAchievements.map` - needs array type
- Lines 413-417: `recentAchievements.filter` - needs array type

**Fixes:**
- Cast `databaseBadges` to array: `(databaseBadges as any[] || [])`
- Cast `leaderboard` to array: `(leaderboard as any[] || [])`
- Default `recentAchievements` is already initialized as `[]` but still needs guards

---

### 3. Standups.tsx (lines 115, 117, 135, 215, 217, 218)

**Issues:**
- Line 115: `standups && standups.length > 0` - Property 'length' doesn't exist on type `{}`
- Line 117: `standups.map` - Property 'map' doesn't exist on type `{}`
- Line 135: `users?.find` - users could be `{}`
- Line 215: `tasks && tasks.length > 0` - Property 'length' doesn't exist on type `{}`
- Lines 217-218: `tasks.map` - Property 'map' doesn't exist on type `{}`

**Fixes:**
- Cast `standups` to array type
- Cast `tasks` to array type
- Cast `users` to array type

---

### 4. Agents.tsx (lines 209, 217, 218)

**Issues:**
- Line 217: `agent.lastRun` - should be `lastRunAt` (schema field name)
- Line 218: `formatDistanceToNow(new Date(agent.lastRun))` - `lastRun` could be null

**Fixes:**
- Change `agent.lastRun` to `agent.lastRunAt`
- Add null check before passing to `new Date()`

---

### 5. StickyNotes.tsx (lines 330, 337)

**Issues:**
- Lines 330, 337: `toast({...})` - Cannot find name 'toast'

**Context:**
- `toast` is destructured from `useToast()` hook at component level (line 366)
- But these references are inside `RedditStyleCard` component which doesn't have access

**Fixes:**
- Either: Pass toast function as prop to RedditStyleCard
- Or: Call useToast() inside RedditStyleCard component
- The simpler fix: use a global toast approach or pass as prop

---

### 6. TaskTemplates.tsx (lines 90, 96, 342, 472, 477, 495, 539, 544, 562)

**Issues:**
- Line 90: `template.formFields` - `taskTemplates` data may be typed as `{}`
- Line 96: `template.formFields?.length` - same issue
- Line 342: `template.formFields` - accessing `formFields` on template object
- Line 472: `taskTemplates.length === 0` - Property 'length' doesn't exist on type `{}`
- Line 477: `taskTemplates.map` - Property 'map' doesn't exist on type `{}`
- Line 495: `template.formFields?.length` - same pattern
- Line 539: `workflowTemplates.length === 0` - Property 'length' doesn't exist on type `{}`
- Line 544: `workflowTemplates.map` - Property 'map' doesn't exist on type `{}`
- Line 562: `template.nodes?.length`, `template.edges?.length` - same pattern

**Fixes:**
- Cast `taskTemplates` to `TaskTemplate[]`: `(taskTemplates as TaskTemplate[] || [])`
- Cast `workflowTemplates` to `WorkflowTemplate[]`: `(workflowTemplates as WorkflowTemplate[] || [])`
- Use type guards or optional chaining where needed

---

### 7. TaskWizard.tsx (lines 263, 693, 1066)

**Issues:**
- Line 263: `taskTemplates.find((t: any) => t.id === templateId)` - taskTemplates could be `{}`
- Line 693: `users.find` - users could be `{}`
- Line 1066: `users.find` - same issue

**Fixes:**
- Cast `taskTemplates` to array: `(taskTemplates as any[])`
- Cast `users` to array with guards: `Array.isArray(users) && users.find(...)`
- Already has some `Array.isArray` checks but need to add more

---

### 8. WorkflowPlanner.tsx (lines 97, 98)

**Issues:**
- Line 97-98: `planner.isPublic`, `planner.tags` - Accessing properties on planner that might not exist
- The issue is that `planner` type from useQuery could be `{}`

**Fixes:**
- Add type annotation for planner query
- Use optional chaining: `planner?.isPublic || false`
- Use safe array conversion: `planner?.tags ? planner.tags.join(', ') : ''`

---

## Implementation Order

1. **Agents.tsx** - Simple fix: `lastRun` -> `lastRunAt`
2. **StickyNotes.tsx** - Add toast prop to component
3. **Dashboard.tsx** - Add type casts for arrays
4. **Scoreboard.tsx** - Add type casts for arrays
5. **Standups.tsx** - Add type casts for arrays
6. **TaskTemplates.tsx** - Add type casts for arrays
7. **TaskWizard.tsx** - Add type casts/guards for arrays
8. **WorkflowPlanner.tsx** - Add safe property access

## Verification

After all fixes, run:
```bash
npm run check
```

This should pass with no TypeScript errors.
