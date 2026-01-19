# Tax Preparation Application - Implementation Plan

## Overview

A local-first Next.js tax preparation application for the 2025 tax year (filing in 2026) with ShadCN UI and Tailwind CSS. All data stored locally using IndexedDB (via Dexie.js).

## User Profile

- **Primary:** Web developer (W-2 employee at Bunzl + 1099 contractor work)
- **Spouse:** Teacher at School District 158 (W-2, separate accounts for educator expenses)
- **Property:** Vacation home used as short-term rental (professionally managed, receives 1099-MISC)
- **Home Office:** Dedicated room for web development (qualifies for home office deduction)

## Core Features

### 1. Multi-Source Data Import
- CSV import wizard with bank format auto-detection
- Support for multiple credit cards and bank accounts
- PDF parsing for W-2s and 1099s (1099-NEC, 1099-INT, 1099-MISC)
- Duplicate transaction detection

### 2. AI-Assisted Categorization
- Generate prompts for Claude Code (user has Max subscription)
- Copy/paste workflow - no API integration needed
- Parse Claude's JSON response and apply categorizations
- Confidence indicators and review workflow

### 3. Tax Form Summaries
- **Schedule C:** Self-employment income/expenses from 1099 contractor work
- **Schedule E:** Vacation rental income with day allocation (personal vs rental use)
- **Educator Expenses:** $300 limit tracking for spouse
- **Home Office:** Square footage method calculator

### 4. Additional Deductions
- Business mileage tracker with 2025 IRS rate ($0.70/mile)
- Estimated quarterly tax payment calculator
- Transaction split support (partial business use)

### 5. Reports & Export
- Schedule C summary report
- Schedule E summary with day allocation
- Full categorized transaction CSV export
- PDF report generation

---

## Project Structure

```
taes-2025/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Dashboard
│   │   ├── layout.tsx                # Root layout
│   │   ├── import/
│   │   │   ├── csv/page.tsx          # CSV import wizard
│   │   │   └── pdf/page.tsx          # PDF document parsing
│   │   ├── transactions/
│   │   │   ├── page.tsx              # Transaction list
│   │   │   └── categorize/page.tsx   # AI categorization
│   │   ├── income/
│   │   │   ├── w2/page.tsx           # W-2 entry
│   │   │   ├── contractor/page.tsx   # 1099-NEC
│   │   │   └── rental/page.tsx       # Rental income
│   │   ├── deductions/
│   │   │   ├── home-office/page.tsx  # Home office calculator
│   │   │   ├── mileage/page.tsx      # Business mileage
│   │   │   ├── educator/page.tsx     # Educator expenses
│   │   │   └── rental/page.tsx       # Rental property expenses
│   │   ├── reports/
│   │   │   ├── schedule-c/page.tsx   # Schedule C summary
│   │   │   ├── schedule-e/page.tsx   # Schedule E summary
│   │   │   ├── quarterly/page.tsx    # Estimated tax
│   │   │   └── export/page.tsx       # Export options
│   │   └── settings/page.tsx         # App settings
│   ├── components/
│   │   ├── ui/                       # ShadCN components
│   │   ├── import/                   # CSV/PDF import components
│   │   ├── transactions/             # Transaction table/filters
│   │   ├── deductions/               # Deduction calculators
│   │   ├── reports/                  # Report views/charts
│   │   └── ai/                       # Prompt generator
│   ├── lib/
│   │   ├── db/                       # Dexie database setup
│   │   ├── parsers/                  # CSV/PDF parsers
│   │   ├── tax/                      # Tax calculations
│   │   ├── categories/               # Tax category mappings
│   │   └── export/                   # CSV/PDF export
│   ├── hooks/                        # React hooks for data
│   ├── types/                        # TypeScript types
│   └── providers/                    # Context providers
├── data/                             # User's data folder
└── package.json
```

---

## Key Data Models

### Transaction
```typescript
interface Transaction {
  id: string;
  sourceAccountId: string;
  date: Date;
  name: string;
  description: string;
  amount: number;
  taxCategory: TaxCategory;        // IRS-aligned category
  isBusinessExpense: boolean;
  businessUsePercentage: number;   // For split transactions
  owner: 'joint' | 'primary' | 'spouse';
  deductionType: 'schedule-c' | 'schedule-e' | 'educator' | 'itemized';
  isReviewed: boolean;
}
```

### Tax Categories
- **Schedule C:** office-expense, supplies, travel, meals-business, car-truck-expenses, legal-professional, advertising, contract-labor, etc.
- **Schedule E:** rental-management-fees, rental-repairs, rental-utilities, rental-insurance, rental-mortgage-interest, rental-depreciation, etc.
- **Other:** educator-expense, personal, transfer, uncategorized

---

## AI Categorization Workflow

1. User imports transactions via CSV
2. App generates optimized prompt with:
   - Business context (web developer, teacher, vacation rental)
   - Batch of uncategorized transactions (50-100 at a time)
   - IRS-aligned category options
3. User copies prompt to Claude Code, gets JSON response
4. User pastes response back into app
5. App parses and applies categorizations with confidence indicators
6. User reviews and confirms

---

## Critical Files to Create

1. **`src/lib/db/index.ts`** - Dexie database with all table schemas
2. **`src/lib/parsers/csv-parser.ts`** - CSV parsing with bank detection (Baxter CU format known)
3. **`src/lib/tax/schedule-c.ts`** - Schedule C calculations
4. **`src/lib/tax/schedule-e.ts`** - Schedule E with vacation home day allocation
5. **`src/lib/tax/constants.ts`** - 2025 IRS rates and limits
6. **`src/components/ai/prompt-generator.tsx`** - Claude prompt generation
7. **`src/hooks/use-transactions.ts`** - Transaction CRUD with Dexie liveQuery

---

## Dependencies

```json
{
  "dependencies": {
    "next": "^15.x",
    "react": "^19.x",
    "dexie": "^4.x",
    "dexie-react-hooks": "^1.x",
    "@tanstack/react-table": "^8.x",
    "date-fns": "^3.x",
    "papaparse": "^5.x",
    "pdf.js-extract": "^0.2.x",
    "recharts": "^2.x",
    "class-variance-authority": "^0.7.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x"
  }
}
```

### ShadCN Components to Install
```bash
npx shadcn@latest add form input select textarea checkbox switch
npx shadcn@latest add card tabs sidebar sheet navigation-menu
npx shadcn@latest add table badge progress separator alert
npx shadcn@latest add button dropdown-menu dialog alert-dialog
npx shadcn@latest add calendar popover toast chart
```

---

## Implementation Phases

### Phase 1: Project Setup
- Initialize Next.js with App Router
- Configure ShadCN, Tailwind
- Set up Dexie database schema
- Create layout with sidebar navigation

### Phase 2: CSV Import
- Build drag-drop CSV upload
- Implement Baxter CU format detection
- Transaction preview and import
- Duplicate detection

### Phase 3: Transaction Management
- Transaction list with TanStack Table
- Filtering by date, category, owner
- Inline category editing
- Bulk category assignment

### Phase 4: AI Categorization
- Prompt generator component
- Response parser
- Batch categorization workflow
- Review interface

### Phase 5: Deduction Calculators
- Home office (simplified method: $5/sq ft, max 300 sq ft)
- Mileage tracker ($0.70/mile for 2025)
- Educator expenses ($300 limit)
- Rental property day tracker

### Phase 6: Income & Documents
- W-2 entry form + PDF parsing
- 1099-NEC, 1099-INT, 1099-MISC entry
- Link income to transactions

### Phase 7: Reports
- Schedule C summary
- Schedule E with rental day allocation
- Quarterly estimated tax calculator
- CSV/PDF export

### Phase 8: Dashboard & Polish
- Year-at-a-glance dashboard
- Data backup/restore
- Error handling

---

## Vacation Rental (Schedule E) Considerations

Since the property is a vacation home:
- Must track **rental days** vs **personal use days**
- Personal use > 14 days OR > 10% of rental days = "personal residence"
- If personal residence, rental losses are limited to rental income (no loss deduction)
- Expenses must be allocated by rental percentage: `rental_days / (rental_days + personal_days)`

---

## 2025 Tax Constants

| Item | Value |
|------|-------|
| Business mileage rate | $0.70/mile |
| Home office simplified rate | $5/sq ft (max 300 sq ft = $1,500) |
| Educator expense limit | $300 per educator |
| Business meals deduction | 50% |
| Residential rental depreciation | 27.5 years straight-line |
| Self-employment tax rate | 15.3% (12.4% SS + 2.9% Medicare) |
| Social Security wage base | $176,100 |

---

## Verification Plan

1. **CSV Import:** Import sample transaction CSV, verify all fields parsed correctly
2. **Categorization:** Generate prompt, run through Claude Code, verify response parsing
3. **Schedule C:** Add test 1099-NEC income and expenses, verify totals match expectations
4. **Schedule E:** Enter rental days and expenses, verify allocation calculation
5. **Home Office:** Enter square footage, verify deduction calculation
6. **Export:** Export categorized transactions to CSV, verify format

---

## Files Already Present

- `/mnt/c/Users/tomka/Desktop/taes-2025/Travel Rewards Visa Signature Transactions.csv` - Credit card transactions
- `/mnt/c/Users/tomka/Desktop/taes-2025/POWERPLUS CHECKING Transactions.csv` - Checking account
- `/mnt/c/Users/tomka/Desktop/taes-2025/banks/capitalone-2025-1099-INT.pdf` - Interest income 1099
