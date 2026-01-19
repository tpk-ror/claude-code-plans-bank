# TypeScript Error Fixes Plan

## Summary
Fix all remaining TypeScript errors in the server-side code. There are 37 errors across 5 files.

## Files to Fix

### 1. server/index.ts (line 4)
**Error:** `'"./storage"' has no exported member named 'DatabaseStorage'`

**Fix:** Remove `DatabaseStorage` from the import since it's no longer exported from the storage module. The code checks `storage instanceof DatabaseStorage` but we can remove this check since the storage layer has been refactored.

```typescript
// Change from:
import { storage, DatabaseStorage } from "./storage";

// Change to:
import { storage } from "./storage";
```

Also update lines 43-47 to remove the `instanceof DatabaseStorage` check:
```typescript
// Change from:
if (storage instanceof DatabaseStorage) {
  log('Database connected - automatic seeding disabled');
}

// Change to:
log('Database connected - automatic seeding disabled');
```

---

### 2. server/middleware/auth.ts (lines 96, 121)
**Error:** `'avatarUrl: string | null' not assignable to 'string | undefined'`

**Fix:** The database returns `null` for nullable fields, but the Express.User type expects `undefined`. Need to transform the user before passing to done().

Create a helper function to convert null to undefined for optional fields:

```typescript
// Add helper function after the imports
function dbUserToExpressUser(dbUser: any): Express.User {
  return {
    ...dbUser,
    avatarUrl: dbUser.avatarUrl ?? undefined,
    department: dbUser.department ?? undefined,
    email: dbUser.email ?? undefined,
    bio: dbUser.bio ?? undefined,
    badges: dbUser.badges ?? undefined,
    stripeCustomerId: dbUser.stripeCustomerId ?? undefined,
    stripeSubscriptionId: dbUser.stripeSubscriptionId ?? undefined,
    subscriptionPlan: dbUser.subscriptionPlan ?? undefined,
    subscriptionStatus: dbUser.subscriptionStatus ?? undefined,
    subscriptionPeriodEnd: dbUser.subscriptionPeriodEnd ?? undefined,
    points: dbUser.points ?? 0,
    createdAt: dbUser.createdAt ?? new Date(),
  };
}

// Line 96: Change from:
return done(null, user);
// Change to:
return done(null, dbUserToExpressUser(user));

// Line 121: Change from:
return done(null, user);
// Change to:
return done(null, dbUserToExpressUser(user));
```

---

### 3. server/openai.ts (line 157)
**Error:** `Property 'choices' does not exist on type 'Response'`

**Fix:** The `responses.create` API doesn't have a `choices` property. The response structure is different. Cast the response to `any` to handle this experimental API, or use proper typing.

```typescript
// Line 157: Change from:
const content = response.choices[0].output.content[0].text;

// Change to:
const content = (response as any).output_text || (response as any).choices?.[0]?.message?.content;
```

Actually, since this is using an experimental OpenAI API (`responses.create`), we should cast to any:
```typescript
const content = (response as any).output_text;
```

---

### 4. server/routes.ts - Multiple issues

#### Lines 138, 164, 248: User type compatibility
Same issue as auth.ts - need to transform db user to Express user. Add the same helper function and use it.

```typescript
// Add after line 98:
function dbUserToExpressUser(dbUser: any): Express.User {
  return {
    ...dbUser,
    avatarUrl: dbUser.avatarUrl ?? undefined,
    department: dbUser.department ?? undefined,
    email: dbUser.email ?? undefined,
    bio: dbUser.bio ?? undefined,
    badges: dbUser.badges ?? undefined,
    stripeCustomerId: dbUser.stripeCustomerId ?? undefined,
    stripeSubscriptionId: dbUser.stripeSubscriptionId ?? undefined,
    subscriptionPlan: dbUser.subscriptionPlan ?? undefined,
    subscriptionStatus: dbUser.subscriptionStatus ?? undefined,
    subscriptionPeriodEnd: dbUser.subscriptionPeriodEnd ?? undefined,
    points: dbUser.points ?? 0,
    createdAt: dbUser.createdAt ?? new Date(),
  };
}

// Line 138: Change from:
return done(null, user);
// Change to:
return done(null, dbUserToExpressUser(user));

// Line 164: Change from:
return done(null, user);
// Change to:
return done(null, dbUserToExpressUser(user));

// Line 248: Change from:
req.login(user, (err) => {
// Change to:
req.login(dbUserToExpressUser(user), (err) => {
```

#### Lines 489-515: preferences type issues
**Error:** `Property 'notifications/privacy/profile' does not exist on type '{}'`

**Fix:** The `currentPreferences` is typed as `{}`. Need to type it properly with a type assertion or use a proper interface.

```typescript
// Around line 483-486, change from:
const currentPreferences = user.preferences || defaultPreferences;

// Change to:
const currentPreferences = (user.preferences || defaultPreferences) as typeof defaultPreferences;
```

#### Line 2592: Stripe API version
**Error:** `Type '"2023-10-16"' is not assignable to type '"2025-03-31.basil"'`

**Fix:** Update to the latest Stripe API version that matches the installed package.

```typescript
// Line 2592: Change from:
? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })

// Change to:
? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-03-31.basil' as const })
```

#### Lines 2656, 2696: Stripe Invoice type
**Error:** `Property 'payment_intent' does not exist on type 'string | Invoice'`

**Fix:** Need to check if `latest_invoice` is an Invoice object before accessing its properties.

```typescript
// Line 2656: Change from:
clientSecret: subscription.latest_invoice?.payment_intent?.client_secret || null,

// Change to:
clientSecret: (typeof subscription.latest_invoice === 'object' && subscription.latest_invoice?.payment_intent && typeof subscription.latest_invoice.payment_intent === 'object')
  ? subscription.latest_invoice.payment_intent.client_secret
  : null,

// Line 2696: Same fix
```

#### Line 2750: Stripe subscription type
**Error:** `Property 'current_period_end' does not exist on type 'Response<Subscription>'`

**Fix:** The variable `subscription` is already retrieved properly. The issue is it's typed as Response<Subscription>. Need to access `.data` or the variable is already the subscription object.

Looking at line 2740, the subscription is retrieved with `stripe.subscriptions.retrieve()` which returns the Subscription directly, not wrapped in Response. The error is probably because `invoice.subscription` could be a string. Need to check the code context.

```typescript
// Line 2740 returns Subscription directly, so line 2750 should work
// The issue is that on line 2740, invoice.subscription could be string
// Change line 2740 to ensure we have a string subscription ID:
const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
```

#### Line 3468, 3490: templates implicit any[]
**Error:** Variable 'templates' implicitly has type 'any[]'

**Fix:** Add explicit type annotation.

```typescript
// Line 3468: Change from:
let templates;

// Change to:
let templates: any[] = [];
```

#### Lines 3738, 3779, 3802, 3827, 3857, 3881, 3954: userId should be createdBy
**Error:** `Property 'userId' does not exist on type Agent`

**Fix:** The agents table uses `createdBy`, not `userId`. Update all references.

```typescript
// Line 3738: Change from:
if (agent.userId !== req.user!.id && (req.user as any).role !== 'admin') {

// Change to:
if (agent.createdBy !== req.user!.id && (req.user as any).role !== 'admin') {
```

Apply same fix to lines: 3779, 3802, 3827, 3857, 3881, 3954

#### Line 3888: userId on agent run insert
**Error:** `'userId' does not exist in type InsertAgentRun`

**Fix:** The agentRuns table doesn't have a userId field. Remove it.

```typescript
// Lines 3886-3891: Change from:
const newRun = await storage.createAgentRun({
  agentId,
  userId,
  status: 'running',
  input: req.body.input || {}
});

// Change to:
const newRun = await storage.createAgentRun({
  agentId,
  status: 'running',
  input: req.body.input || {}
});
```

#### Line 3907: endTime should be completedAt
**Error:** `'endTime' does not exist in type AgentRun`

**Fix:** Use the correct field name.

```typescript
// Line 3907: Change from:
endTime: new Date()

// Change to:
completedAt: new Date()
```

#### Line 3912: lastRun should be lastRunAt
**Error:** `'lastRun' does not exist in type Agent`

**Fix:** Use the correct field name.

```typescript
// Line 3912: Change from:
lastRun: new Date()

// Change to:
lastRunAt: new Date()
```

#### Line 3961: approvedBy doesn't exist
**Error:** `'approvedBy' does not exist in type AgentRun`

**Fix:** The agentRuns table doesn't have approvedBy or approvedAt fields. Remove these.

```typescript
// Lines 3959-3963: Change from:
const updatedRun = await storage.updateAgentRun(runId, {
  status: approved ? 'approved' : 'rejected',
  approvedBy: req.user!.id,
  approvedAt: new Date()
});

// Change to:
const updatedRun = await storage.updateAgentRun(runId, {
  status: approved ? 'approved' : 'rejected'
});
```

---

### 5. server/vite.ts (line 39)
**Error:** `Type 'boolean' is not assignable to type 'true | string[] | undefined'`

**Fix:** Change `allowedHosts: true` to use the literal `true` instead of a boolean value that could be `false`.

```typescript
// Lines 23-27: Change from:
const serverOptions = {
  middlewareMode: true,
  hmr: { server },
  allowedHosts: true,
};

// Change to:
const serverOptions = {
  middlewareMode: true as const,
  hmr: { server },
  allowedHosts: true as const,
};
```

---

### 6. shared/schema.ts (lines 294, 301)
**Error:** `'stickyNoteComments' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer`

**Fix:** Add explicit type annotation for the self-referencing table. The table definition has a circular reference because `parentId` references `stickyNoteComments.id`.

```typescript
// Lines 293-304: Change from:
export const stickyNoteComments = pgTable("sticky_note_comments", {
  id: serial("id").primaryKey(),
  noteId: integer("note_id").notNull().references(() => stickyNotes.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  upvotes: integer("upvotes").default(0).notNull(),
  downvotes: integer("downvotes").default(0).notNull(),
  parentId: integer("parent_id").references(() => stickyNoteComments.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Change to:
import type { AnyPgColumn } from "drizzle-orm/pg-core";

export const stickyNoteComments = pgTable("sticky_note_comments", {
  id: serial("id").primaryKey(),
  noteId: integer("note_id").notNull().references(() => stickyNotes.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  upvotes: integer("upvotes").default(0).notNull(),
  downvotes: integer("downvotes").default(0).notNull(),
  parentId: integer("parent_id").references((): AnyPgColumn => stickyNoteComments.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

---

## Verification
After making all fixes, run:
```bash
npm run check
```

This should complete with no errors.
