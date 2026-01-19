# Spending Analysis Feature Implementation Plan

## Overview

Add a new "Spending Analysis" page to the tax app that analyzes transaction data to identify savings opportunities. The feature will cover:
- **Subscriptions**: Identify recurring charges and potential cancellations
- **Dining & Delivery**: Restaurant spending, food delivery patterns
- **Discretionary Spending**: Non-essential purchases, impulse buys
- **Full Category Breakdown**: All spending categories with actionable insights

## Data Summary

Source file: `/data/Travel Rewards Visa Signature Transactions.csv`
- **2,173 transactions** covering full year 2025
- Pre-categorized with categories: Restaurants/Dining, General Merchandise, Groceries, Entertainment, Gasoline/Fuel, Home Improvement, Online Services, etc.
- Amounts are negative (expenses) or positive (credits/refunds)

---

## File Structure

```
src/
├── app/
│   └── analysis/
│       └── spending/
│           └── page.tsx              # Main spending analysis page
├── components/
│   └── spending/
│       ├── category-breakdown.tsx    # Bar chart by category
│       ├── subscriptions-list.tsx    # Recurring charges table
│       ├── dining-analysis.tsx       # Food/delivery spending card
│       ├── spending-trends.tsx       # Monthly trend line chart
│       └── savings-tips.tsx          # Actionable recommendations
├── hooks/
│   └── use-spending-analysis.ts      # Analysis computations hook
└── lib/
    └── spending/
        ├── recurring-detector.ts     # Subscription detection logic
        ├── category-analytics.ts     # Category grouping utilities
        └── savings-rules.ts          # Rules for recommendations
```

---

## Implementation Steps

### 1. Create Analysis Utilities (`src/lib/spending/`)

**`recurring-detector.ts`** - Detect subscriptions by:
- Same merchant appearing monthly (within 3-day variance)
- Common subscription keywords (Netflix, Spotify, YouTube TV, etc.)
- Return list of detected subscriptions with monthly cost

**`category-analytics.ts`** - Aggregate transactions:
- Group by original CSV category
- Calculate totals, averages, transaction counts
- Identify top merchants per category

**`savings-rules.ts`** - Generate recommendations based on:
- Multiple streaming services (consolidation opportunity)
- High delivery app usage vs grocery spending ratio
- Duplicate/overlapping subscriptions (e.g., multiple AI tools)
- Frequent small purchases at same merchant

### 2. Create Custom Hook (`src/hooks/use-spending-analysis.ts`)

```typescript
interface SpendingAnalysis {
  categoryBreakdown: CategoryTotal[];
  subscriptions: Subscription[];
  diningDelivery: DiningStats;
  monthlyTrends: MonthlySpending[];
  savingsTips: SavingsTip[];
  totalSpending: number;
  isLoading: boolean;
}

export function useSpendingAnalysis(
  transactions: Transaction[],
  dateRange?: { start: Date; end: Date }
): SpendingAnalysis
```

### 3. Create UI Components (`src/components/spending/`)

**`category-breakdown.tsx`**
- Horizontal bar chart showing expenses by category
- Click category to see transactions
- Highlight top 3 spending categories

**`subscriptions-list.tsx`**
- Table: Name, Monthly Cost, Annual Cost, Status
- Checkbox to mark for cancellation review
- Calculate potential savings if cancelled

**`dining-analysis.tsx`**
- Split: Restaurant vs Delivery apps
- Delivery apps: DoorDash, Grubhub, Uber Eats totals
- Average order size, frequency metrics
- Compare to grocery spending

**`spending-trends.tsx`**
- Line chart: Monthly total spending over 12 months
- Overlay lines for key categories
- Identify spending spikes

**`savings-tips.tsx`**
- Actionable cards with specific recommendations
- e.g., "You spent $X on 3 AI subscriptions. Consider consolidating."
- Priority-ranked by potential savings amount

### 4. Create Main Page (`src/app/analysis/spending/page.tsx`)

Layout:
```
┌─────────────────────────────────────────────────────────────┐
│ Spending Analysis                          [Date Range ▼]   │
├──────────────┬──────────────┬──────────────┬───────────────┤
│ Total Spent  │ Subscriptions│ Dining Out   │ Potential     │
│ $XX,XXX      │ $XXX/mo      │ $X,XXX       │ Savings: $XXX │
├──────────────┴──────────────┴──────────────┴───────────────┤
│                     Spending by Category                    │
│              [========= Horizontal Bar Chart =========]     │
├────────────────────────────┬────────────────────────────────┤
│    Monthly Trends          │    Top Savings Opportunities   │
│   [Line Chart]             │    • Tip 1 - Save $XX/mo       │
│                            │    • Tip 2 - Save $XX/mo       │
│                            │    • Tip 3 - Save $XX/mo       │
├────────────────────────────┴────────────────────────────────┤
│                   Subscriptions Detected                    │
│   [Table: Service | Monthly | Annual | Action]              │
├─────────────────────────────────────────────────────────────┤
│                   Dining & Delivery Breakdown               │
│   [Restaurants: $X,XXX] [Delivery Apps: $X,XXX] [Ratio]     │
└─────────────────────────────────────────────────────────────┘
```

### 5. Add Navigation

Update `src/components/app-sidebar.tsx`:
- Add "Spending Analysis" link under new "Analysis" section or existing Reports section
- Icon: `TrendingDown` or `PiggyBank` from lucide-react

---

## Key Analysis Logic

### Subscription Detection
```typescript
// Identify recurring by merchant + ~30 day intervals
const isRecurring = (transactions: Transaction[], merchantName: string) => {
  const merchantTxns = transactions
    .filter(t => t.name === merchantName && t.amount < 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (merchantTxns.length < 2) return false;

  // Check if intervals are approximately monthly (25-35 days)
  const intervals = [];
  for (let i = 1; i < merchantTxns.length; i++) {
    const days = differenceInDays(merchantTxns[i].date, merchantTxns[i-1].date);
    intervals.push(days);
  }

  return intervals.every(d => d >= 25 && d <= 35);
};
```

### Known Subscriptions (from CSV data)
- Netflix: $17.99/mo
- YouTube TV: $82.99/mo
- Spotify: $11.99/mo
- Disney Plus: $18.99/mo
- Roblox: Various (~$4.99-$19.99)
- Claude AI: $100/mo
- ChatGPT: $20/mo
- Midjourney: $96 (annual?)
- Comcast: $117/mo
- Cooper's Hawk membership: ~$44.99/mo

### Dining/Delivery Categories
- Restaurants/Dining category
- Known delivery: DoorDash, Grubhub, Uber Eats
- Fast food: McDonald's, Wendy's, Dunkin', Culver's

---

## Critical Files to Modify

1. `src/components/app-sidebar.tsx` - Add navigation link
2. `src/types/index.ts` - Add spending analysis types

## Critical Files to Create

1. `src/app/analysis/spending/page.tsx` - Main page
2. `src/hooks/use-spending-analysis.ts` - Analysis hook
3. `src/lib/spending/recurring-detector.ts` - Subscription detection
4. `src/lib/spending/category-analytics.ts` - Category grouping
5. `src/lib/spending/savings-rules.ts` - Recommendations engine
6. `src/components/spending/category-breakdown.tsx` - Bar chart
7. `src/components/spending/subscriptions-list.tsx` - Subscriptions table
8. `src/components/spending/dining-analysis.tsx` - Dining card
9. `src/components/spending/spending-trends.tsx` - Trend chart
10. `src/components/spending/savings-tips.tsx` - Tips component

---

## Verification Plan

1. **Import test data**: Import the CSV via the existing CSV import wizard
2. **Navigate to page**: Verify `/analysis/spending` loads without errors
3. **Check summary cards**: Confirm totals match expected values
4. **Verify charts render**: Category breakdown and trends display correctly
5. **Test subscription detection**: Verify known subscriptions are detected
6. **Review recommendations**: Check savings tips are relevant and accurate
7. **Test date filtering**: Change date range and verify data updates
8. **Mobile responsiveness**: Test layout on smaller screens

---

## Dependencies

All required packages are already installed:
- Recharts (via chart.tsx)
- date-fns (for date manipulation)
- TanStack React Table (for subscriptions list)
- ShadCN UI components (Card, Table, Badge, etc.)
