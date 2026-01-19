# Implementation Plan: 4 Priority Features for Seachy 10.0

This plan covers 4 features selected for detailed implementation:
1. **Auto-Categorization** - Classify products into predefined categories
2. **AI Outreach Messages** - Generate personalized sales messages
3. **Webhook Integrations** - Push data to external systems
4. **Monitoring Dashboard** - UI for watchlist, changes, and notifications

---

## Feature 1: Auto-Categorization

### Overview
Auto-classify products into predefined categories during the search process using GPT.

### Database Changes
**Migration: `013_product_categories.sql`**

```sql
-- Category reference table (hierarchical)
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_category_code VARCHAR(50) REFERENCES product_categories(code),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add to product_results
ALTER TABLE product_results
ADD COLUMN category_code VARCHAR(50) REFERENCES product_categories(code),
ADD COLUMN category_confidence DECIMAL(3,2),
ADD COLUMN category_source VARCHAR(50) DEFAULT 'auto';
```

**Initial Categories (Minimal Set - Expandable):**
- chemicals - Industrial chemicals, solvents, reagents
- adhesives - Glues, tapes, sealants
- safety - PPE, safety equipment
- cleaning - Cleaning supplies, degreasers
- tools - Hand tools, power tools
- other - Uncategorized (catch-all)

*Additional categories can be added via database insert as needed.*

### Files to Modify

| File | Change |
|------|--------|
| `src/lib/prompts.ts` | Add `## CATEGORY` section to `buildSearchPrompt()` |
| `src/lib/parser.ts` | Add `extractCategory()` function, update `ParsedProductData` interface |
| `src/types/database.ts` | Add `category_code`, `category_confidence`, `category_source` to types |
| `src/components/seachy/ResultsDisplay.tsx` | Display category badge in header |
| `src/components/seachy/ProductSearchHistory.tsx` | Add category filter dropdown |
| `src/app/api/seachy/history/route.ts` | Include category in response |

### New Components
- `src/components/seachy/CategoryBadge.tsx` - Display category with icon/color

### Prompt Addition (in prompts.ts)
```
## CATEGORY
Classify this product into ONE category:
- chemicals: Industrial chemicals, solvents, reagents
- adhesives: Glues, tapes, sealants, bonding agents
- safety: PPE, safety equipment, first aid
- cleaning: Cleaning supplies, degreasers, sanitizers
- tools: Hand tools, power tools, hardware
- other: Products that don't fit above categories

Output:
- Category Code: [one of: chemicals, adhesives, safety, cleaning, tools, other]
- Confidence: [0.0-1.0]
- Reasoning: [brief explanation]
```

---

## Feature 2: AI Outreach Message Generation

### Overview
Generate personalized email/LinkedIn/call scripts using enriched customer data.

### New Files to Create

| File | Purpose |
|------|---------|
| `src/lib/outreachPrompts.ts` | Build prompts using customer context |
| `src/lib/outreachParser.ts` | Parse generated messages |
| `src/app/api/seachy/customer/outreach/route.ts` | API endpoint |
| `src/components/seachy/customer/outreach/OutreachMessageGenerator.tsx` | Main UI |

### API Endpoint
**POST `/api/seachy/customer/outreach`**

Request:
```typescript
{
  resultId: string           // Customer result ID
  messageType: 'email' | 'linkedin' | 'cold_call_script'
  tone: 'professional' | 'casual' | 'friendly' | 'executive'
  length: 'short' | 'medium' | 'long'
  customValueProp?: string   // User's value proposition
  customHook?: string        // Custom opener
  includeNewsReference?: boolean
  includeFundingReference?: boolean
  includeCompetitorMention?: boolean
}
```

Response:
```typescript
{
  subject_line?: string      // For emails
  full_message: string
  personalization_points: string[]
  alternative_subject_lines?: string[]
}
```

### Prompt Structure
The prompt will include:
1. **Prospect Profile** - Name, title, bio, LinkedIn, decision maker status
2. **Company Intelligence** - Industry, size, revenue, competitors
3. **Trigger Events** - News, funding, growth signals
4. **Message Requirements** - Type, tone, length guidelines
5. **Personalization Requirements** - What data to reference

### UI Component Features
- Message type tabs (Email, LinkedIn, Call Script)
- Tone and length selectors
- Custom value prop/hook text areas
- Checkboxes for news/funding/competitor references
- Generated message preview with edit mode
- Copy to clipboard button
- Personalization points display

### Integration Point
Add `<OutreachMessageGenerator result={result} />` to `CustomerResultsDisplay.tsx`

---

## Feature 3: Webhook Integrations

### Overview
Send data to external systems when events occur (search complete, conflict detected, change monitored).

### Database Schema
**Migration: `014_webhooks_schema.sql`**

```sql
CREATE TABLE webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  secret_key VARCHAR(255),      -- For HMAC signature
  is_active BOOLEAN DEFAULT TRUE,

  -- Event subscriptions
  on_product_search_complete BOOLEAN DEFAULT FALSE,
  on_customer_search_complete BOOLEAN DEFAULT FALSE,
  on_conflict_detected BOOLEAN DEFAULT FALSE,
  on_change_monitored BOOLEAN DEFAULT FALSE,

  -- Configuration
  payload_template JSONB,
  http_method VARCHAR(10) DEFAULT 'POST',
  headers JSONB DEFAULT '{}',
  timeout_ms INTEGER DEFAULT 30000,
  max_retries INTEGER DEFAULT 3,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_config_id UUID REFERENCES webhook_configs(id),
  event_type VARCHAR(50) NOT NULL,
  event_id UUID NOT NULL,
  request_body JSONB NOT NULL,
  response_status INTEGER,
  status VARCHAR(20) DEFAULT 'pending',
  attempt_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### New Files

| File | Purpose |
|------|---------|
| `src/types/webhooks.ts` | Type definitions |
| `src/lib/webhooks.ts` | Dispatch and delivery service |
| `src/app/api/seachy/webhooks/route.ts` | CRUD for configs |
| `src/app/api/seachy/webhooks/[id]/route.ts` | Single webhook ops |
| `src/app/api/seachy/webhooks/[id]/test/route.ts` | Test endpoint |
| `src/app/api/seachy/webhooks/deliveries/route.ts` | Delivery logs |
| `src/app/webhooks/page.tsx` | Management UI |
| `src/components/seachy/webhooks/WebhookForm.tsx` | Create/edit form |
| `src/components/seachy/webhooks/WebhooksList.tsx` | List view |
| `src/components/seachy/webhooks/DeliveryLog.tsx` | Delivery history |

### Core Service Functions (webhooks.ts)
```typescript
// Dispatch to all matching webhooks
export async function dispatchWebhookEvent(
  eventType: WebhookEventType,
  eventId: string,
  eventData: Record<string, unknown>
): Promise<void>

// Send with retries
async function sendWebhook(delivery, config): Promise<Result>

// Generate HMAC signature for verification
export function generateWebhookSignature(payload: string, secret: string): string
```

### Integration Points
Add webhook dispatch calls to:

1. **Product search** (`src/app/api/seachy/search/route.ts` ~line 229)
   ```typescript
   await dispatchWebhookEvent('product_search_complete', searchId, { search, result })
   ```

2. **Customer search** (`src/app/api/seachy/customer/route.ts` ~line 354)
   ```typescript
   await dispatchWebhookEvent('customer_search_complete', searchId, { search, result })
   ```

3. **Conflict detection** (both routes, after conflict insert)
   ```typescript
   await dispatchWebhookEvent('conflict_detected', resultId, { conflicts })
   ```

4. **Change monitoring** (`src/lib/monitoring.ts`)
   ```typescript
   await dispatchWebhookEvent('change_monitored', changeId, { change, company })
   ```

---

## Feature 4: Monitoring Dashboard UI

### Overview
Build frontend for existing monitoring APIs (watchlist, changes, notifications).

### Page Structure
```
src/app/monitoring/
  page.tsx                    # Main dashboard
  watchlist/page.tsx          # Full watchlist view
  changes/page.tsx            # Full changes view
```

### Dashboard Layout
```
+----------------------------------------------------------+
| Monitoring Dashboard                                      |
+----------------------------------------------------------+
| [Watching: 24] [Unread Changes: 5] [New Alerts: 3]       |  <- Summary cards
+----------------------------------------------------------+
| [Tabs: Watchlist | Changes | Notifications]              |
+----------------------------------------------------------+
| Tab content with table/timeline and filters              |
+----------------------------------------------------------+
```

### Components to Create

**Core Components:**
| Component | Purpose |
|-----------|---------|
| `MonitoringDashboard.tsx` | Main dashboard wrapper with tabs |
| `MonitoringSummaryCards.tsx` | 3 stat cards at top |

**Watchlist Components:**
| Component | Purpose |
|-----------|---------|
| `WatchlistTable.tsx` | Table with company, domain, frequency, actions |
| `WatchlistFilters.tsx` | Active/inactive, watch type filters |
| `AddToWatchlistDialog.tsx` | Manual add form |

**Changes Components:**
| Component | Purpose |
|-----------|---------|
| `ChangesTimeline.tsx` | Timeline grouped by date |
| `ChangeCard.tsx` | Individual change with severity badge |
| `ChangesFilters.tsx` | Type, severity, read status, date range |
| `SeverityBadge.tsx` | Color-coded severity indicator |

**Notifications Components:**
| Component | Purpose |
|-----------|---------|
| `NotificationsList.tsx` | Full list view |
| `NotificationCard.tsx` | Individual notification |
| `NotificationsFilters.tsx` | Read/unread, type filters |

### Data Fetching
Follow existing pattern (useState + useEffect + fetch):
```typescript
const [data, setData] = useState(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
  fetchData()
  const interval = setInterval(fetchData, 60000) // Poll every minute
  return () => clearInterval(interval)
}, [filters])
```

### Bulk Actions
- Mark changes as read
- Dismiss notifications
- Pause/resume watchlist items
- Uses floating action bar when items selected

### Navigation Update
Add to `src/components/Sidebar.tsx`:
```typescript
{ label: 'Monitoring', href: '/monitoring', icon: Eye }
```

---

## Implementation Order

### Phase 1: Auto-Categorization (Estimated: 2-3 days)
1. Create database migration
2. Update prompts.ts with category section
3. Add parser function
4. Update types
5. Create CategoryBadge component
6. Update ResultsDisplay and History

### Phase 2: Monitoring Dashboard (Estimated: 3-4 days)
1. Create page structure
2. Build summary cards
3. Build watchlist table/filters
4. Build changes timeline
5. Build notifications list
6. Add navigation link

### Phase 3: Webhook Integrations (Estimated: 4-5 days)
1. Create database schema
2. Create types file
3. Build webhook service with retries
4. Create API routes
5. Add integration points to search routes
6. Build management UI

### Phase 4: AI Outreach Messages (Estimated: 3-4 days)
1. Create prompt builder
2. Create parser
3. Create API endpoint
4. Build UI component
5. Integrate into CustomerResultsDisplay

---

## Verification Plan

### Auto-Categorization
- Run product searches for various product types
- Verify category assignment in results display
- Test category filter in history view

### Monitoring Dashboard
- Add companies to watchlist
- Verify changes appear in timeline
- Test notification dismiss/mark read
- Test bulk actions

### Webhook Integrations
- Create webhook pointing to webhook.site for testing
- Run a search and verify webhook fires
- Test retry on failed delivery
- Test payload transformation

### AI Outreach Messages
- Generate messages for customer with rich data
- Test all message types and tones
- Verify personalization points are accurate
- Test copy functionality
