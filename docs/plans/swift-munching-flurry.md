# PRD: CoLab Supabase Local Migration

## Executive Summary

Migrate CoLab from Neon PostgreSQL + Passport.js to Supabase Local with:
- **Supabase Auth** (JWT-based, replacing Passport.js sessions)
- **Supabase Realtime** (live updates for tasks, notifications, activities)
- **Docker-based Supabase Local** development environment

---

## Current vs Target Architecture

| Component | Current | Target |
|-----------|---------|--------|
| Database | Neon PostgreSQL | Supabase Local PostgreSQL |
| Auth | Passport.js + Sessions | Supabase Auth (JWT) |
| Session Store | PostgreSQL (connect-pg-simple) | JWT tokens (stateless) |
| Realtime | None | Supabase Realtime |
| ORM | Drizzle ORM | Drizzle ORM (kept) |
| User IDs | Integer (serial) | UUID |

---

## Phase 1: Environment Setup

### 1.1 Install Supabase CLI & Initialize

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize in project
supabase init

# Start local Supabase (requires Docker)
supabase start
```

### 1.2 Create Environment File

**Create:** `.env.local`
```env
# Supabase Local
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<from supabase start output>
SUPABASE_SERVICE_ROLE_KEY=<from supabase start output>
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Client-side (Vite)
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<from supabase start output>
```

### 1.3 Update Dependencies

**Remove from package.json:**
- `@neondatabase/serverless`
- `connect-pg-simple`
- `passport`
- `passport-local`
- `express-session`

**Add to package.json:**
- `@supabase/supabase-js`
- `postgres` (postgres.js driver)

---

## Phase 2: Database Connection Migration

### 2.1 Update Database Connection

**File:** `server/db.ts`

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });
```

### 2.2 Create Supabase Client

**New File:** `server/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export function createUserClient(accessToken: string) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );
}
```

---

## Phase 3: Schema Migration

### 3.1 User ID Type Change

The most significant change: `users.id` from `serial` (integer) to `uuid`.

**File:** `shared/schema.ts`

**Before:**
```typescript
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  password: text("password").notNull(),
  // ...
});
```

**After:**
```typescript
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Remove password field - handled by Supabase Auth
  // ...
});
```

### 3.2 Update All Foreign Key References

All tables referencing `users.id` need UUID type:

| Table | Field | Change |
|-------|-------|--------|
| tasks | ownerId | integer → uuid |
| comments | userId | integer → uuid |
| activities | userId | integer → uuid |
| notifications | userId | integer → uuid |
| agents | createdBy | integer → uuid |
| stickyNotes | userId | integer → uuid |
| All templates | createdBy | integer → uuid |
| All junction tables | userId | integer → uuid |

### 3.3 Create Migration SQL

**New File:** `supabase/migrations/001_initial_schema.sql`

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (profiles linked to auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'contributor',
  email TEXT,
  avatar_url TEXT,
  department TEXT,
  bio TEXT,
  preferences JSONB,
  points INTEGER DEFAULT 0,
  badges TEXT[],
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_subscription_status TEXT,
  stripe_price_id TEXT,
  trial_ends_at TIMESTAMP,
  team_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rest of tables with UUID foreign keys...
```

---

## Phase 4: Authentication Migration

### 4.1 New Auth Middleware

**File:** `server/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../supabase';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email?: string };
      accessToken?: string;
    }
  }
}

export async function isAuthenticated(
  req: Request, res: Response, next: NextFunction
) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = { id: user.id, email: user.email };
    req.accessToken = token;
    next();
  } catch {
    return res.status(401).json({ message: 'Authentication failed' });
  }
}

export async function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  const { getUser } = await import('../storage');
  const profile = await getUser(req.user.id);

  if (profile?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}
```

### 4.2 New Auth Routes

**File:** `server/routes/auth.ts`

```typescript
import { Router } from 'express';
import { supabaseAdmin } from '../supabase';
import { storage } from '../storage';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email, password
  });

  if (error) return res.status(401).json({ message: error.message });

  const profile = await storage.getUser(data.user.id);
  res.json({ user: profile, session: data.session });
});

// Register
router.post('/register', async (req, res) => {
  const { email, password, username, name } = req.body;

  // Check username
  const existing = await storage.getUserByUsername(username);
  if (existing) return res.status(400).json({ message: 'Username taken' });

  // Create auth user
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true
  });

  if (error) return res.status(400).json({ message: error.message });

  // Create profile
  const profile = await storage.createUser({
    id: data.user.id, username, name, email
  });

  // Sign in
  const { data: session } = await supabaseAdmin.auth.signInWithPassword({
    email, password
  });

  res.status(201).json({ user: profile, session: session.session });
});

// Get current user
router.get('/user', isAuthenticated, async (req, res) => {
  const profile = await storage.getUser(req.user!.id);
  res.json(profile);
});

// Logout (client-side handles token removal)
router.post('/logout', (req, res) => res.json({ success: true }));

// Password reset
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.CLIENT_URL}/reset-password`
  });
  res.json({ message: 'Check your email' });
});

export default router;
```

### 4.3 Update Server Entry Point

**File:** `server/index.ts`

Remove all session/passport middleware:
- Remove `express-session`
- Remove `passport.initialize()`
- Remove `passport.session()`
- Remove `PostgresSessionStore`

---

## Phase 5: Client-Side Migration

### 5.1 Create Supabase Client

**New File:** `client/src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: true, persistSession: true } }
);
```

### 5.2 Update Auth Hook

**File:** `client/src/hooks/useAuth.tsx`

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.access_token);
      else setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session) await fetchProfile(session.access_token);
        else setUser(null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (token: string) => {
    try {
      const res = await fetch('/api/auth/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setUser(await res.json());
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const register = async (data: RegisterData) => {
    // Use API to create profile alongside auth user
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).message);
  };

  return (
    <AuthContext.Provider value={{
      user, session, isLoading, login, logout, register,
      isAuthenticated: !!session
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
```

### 5.3 Update API Client

**File:** `client/src/api/client.ts`

```typescript
import { supabase } from '@/lib/supabase';

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session && { Authorization: `Bearer ${session.access_token}` }),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}
```

### 5.4 Update User Type

**File:** `client/src/lib/types.ts`

```typescript
export interface User {
  id: string;  // Changed from number to string (UUID)
  username: string;
  name: string;
  role: 'admin' | 'contributor';
  email?: string;
  avatarUrl?: string;
  department?: string;
  bio?: string;
  points: number;
  badges: string[];
}
```

---

## Phase 6: Realtime Integration

### 6.1 Create Realtime Hook

**New File:** `client/src/hooks/useRealtime.ts`

```typescript
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export function useRealtimeSubscription(
  table: string,
  queryKey: readonly unknown[],
  filter?: { column: string; value: string }
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...(filter && { filter: `${filter.column}=eq.${filter.value}` })
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [table, JSON.stringify(queryKey), filter?.value]);
}
```

### 6.2 Enable Realtime on Tables

**File:** `supabase/migrations/002_enable_realtime.sql`

```sql
-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE sticky_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE sticky_note_votes;
```

### 6.3 Use Realtime in Components

```typescript
// In Tasks page
import { useRealtimeSubscription } from '@/hooks/useRealtime';
import { queryKeys } from '@/lib/queryKeys';

function TasksPage() {
  useRealtimeSubscription('tasks', queryKeys.tasks.all);
  // ... rest of component
}

// In Notifications
function NotificationsDropdown() {
  const { user } = useAuth();
  useRealtimeSubscription('notifications', queryKeys.notifications.all, {
    column: 'user_id',
    value: user?.id || ''
  });
  // ...
}
```

---

## Phase 7: Storage Layer Updates

### 7.1 Update User Storage

**File:** `server/storage/userStorage.ts`

Change all `id: number` to `id: string`:

```typescript
export class UserStorage {
  async getUser(id: string) {  // Changed from number
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async createUser(data: InsertUser & { id: string }) {
    const [user] = await db
      .insert(users)
      .values(data)
      .returning();
    return user;
  }
  // ... update all methods
}
```

### 7.2 Update All Route Files

All routes accessing `req.user.id` need to handle string UUID:

```typescript
// Before
const userId = req.user!.id; // number

// After
const userId = req.user!.id; // string (UUID)
```

---

## Implementation Checklist

### Phase 1: Environment Setup
- [ ] Install Supabase CLI globally
- [ ] Run `supabase init` in project root
- [ ] Run `supabase start` to spin up Docker containers
- [ ] Create `.env.local` with Supabase credentials
- [ ] Update `package.json` dependencies

### Phase 2: Database Connection
- [ ] Update `server/db.ts` to use postgres.js driver
- [ ] Create `server/supabase.ts` admin client
- [ ] Update `drizzle.config.ts` if needed
- [ ] Test database connection

### Phase 3: Schema Migration
- [ ] Update `shared/schema.ts` - change user ID to UUID
- [ ] Update all foreign key references
- [ ] Remove password field from users table
- [ ] Create Supabase migration files
- [ ] Run `supabase db push` or migrations

### Phase 4: Server Auth
- [ ] Rewrite `server/middleware/auth.ts`
- [ ] Rewrite `server/routes/auth.ts`
- [ ] Update `server/index.ts` - remove session middleware
- [ ] Update all protected route files
- [ ] Update all storage modules for UUID user IDs

### Phase 5: Client Auth
- [ ] Create `client/src/lib/supabase.ts`
- [ ] Rewrite `client/src/hooks/useAuth.tsx`
- [ ] Update `client/src/api/client.ts`
- [ ] Update `client/src/lib/types.ts`
- [ ] Update Login, Signup, ForgotPassword, ResetPassword pages

### Phase 6: Realtime
- [ ] Create `client/src/hooks/useRealtime.ts`
- [ ] Enable realtime on key tables
- [ ] Add realtime subscriptions to Tasks, Notifications, Feed
- [ ] Test realtime updates

### Phase 7: Testing & Cleanup
- [ ] Run `npm run check` - fix TypeScript errors
- [ ] Test all auth flows (login, register, logout, password reset)
- [ ] Test all CRUD operations
- [ ] Test realtime updates
- [ ] Remove unused packages

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/config.toml` | Supabase local configuration |
| `server/supabase.ts` | Supabase admin client |
| `client/src/lib/supabase.ts` | Supabase client-side client |
| `client/src/hooks/useRealtime.ts` | Realtime subscription hook |
| `supabase/migrations/*.sql` | Database migrations |
| `.env.local` | Environment variables |

## Files to Modify

| File | Changes |
|------|---------|
| `server/db.ts` | Switch from Neon to postgres.js |
| `server/middleware/auth.ts` | Replace Passport with JWT validation |
| `server/routes/auth.ts` | Use Supabase Auth APIs |
| `server/index.ts` | Remove session middleware |
| `shared/schema.ts` | UUID user IDs, remove password |
| `client/src/hooks/useAuth.tsx` | Supabase Auth integration |
| `client/src/api/client.ts` | Add JWT to requests |
| `client/src/lib/types.ts` | UUID user ID type |
| `package.json` | Update dependencies |
| All `server/routes/*.ts` | UUID user ID handling |
| All `server/storage/*.ts` | UUID user ID handling |

---

## Risk Mitigation

1. **UUID Migration**: Create backup before migrating user IDs
2. **Auth Token Handling**: Ensure all API calls include Bearer token
3. **Realtime Performance**: Monitor WebSocket connections
4. **Docker Requirements**: Ensure Docker Desktop is running for Supabase Local

---

## Commands Reference

```bash
# Start Supabase Local
supabase start

# Stop Supabase Local
supabase stop

# View Supabase status
supabase status

# Reset database
supabase db reset

# Generate migration
supabase migration new <name>

# Push schema changes
supabase db push
```
