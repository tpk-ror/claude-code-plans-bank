# Startup Product Plan: QuickBiz Invoice

## The Idea

**QuickBiz Invoice** - A simple, modern invoice generator SaaS for freelancers and small businesses.

### Why This Idea?
1. **Proven market demand** - Freelancers/contractors constantly need invoices
2. **Clear monetization** - $9/month subscription (or $79/year)
3. **Low competition barrier** - Existing tools are bloated; simplicity wins
4. **Recurring revenue** - Subscription model = predictable income
5. **Fully implementable** - I can build this completely in one session

### Revenue Math
- 112 subscribers at $9/month = $1,008/month
- This is achievable with good SEO and a solid product

---

## Features

### Core Features (MVP)
- [ ] User authentication (email/password + Google OAuth)
- [ ] Create professional invoices with customizable templates
- [ ] Add logo, business details, client info
- [ ] Line items with quantities, rates, taxes
- [ ] PDF export/download
- [ ] Email invoices directly to clients
- [ ] Dashboard showing all invoices + payment status
- [ ] Mark invoices as paid/unpaid
- [ ] Stripe subscription payment for the service itself

### Nice-to-Haves (if time permits)
- [ ] Multiple invoice templates
- [ ] Recurring invoices
- [ ] Payment reminders
- [ ] Basic analytics/reporting

---

## Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Framework | Next.js 14 (App Router) | Full-stack, easy deploy to Vercel |
| Styling | Tailwind CSS | Fast, professional UI |
| Database | SQLite + Prisma | No external DB needed, works locally |
| Auth | NextAuth.js | Simple, secure authentication |
| Payments | Stripe | Industry standard, easy setup |
| PDF | @react-pdf/renderer | Client-side PDF generation |
| Email | Resend or Nodemailer | For sending invoices |
| Hosting | Vercel | Free tier, one-click deploy |

---

## Project Structure

```
quickbiz-invoice/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── invoices/
│   │   │   ├── [id]/
│   │   │   └── new/
│   │   ├── clients/
│   │   └── settings/
│   ├── api/
│   │   ├── auth/
│   │   ├── invoices/
│   │   ├── stripe/
│   │   └── send-invoice/
│   └── layout.tsx
├── components/
│   ├── ui/
│   ├── invoice/
│   └── dashboard/
├── lib/
│   ├── prisma.ts
│   ├── stripe.ts
│   └── auth.ts
├── prisma/
│   └── schema.prisma
├── public/
├── package.json
├── setup.sh          # One-command setup script
└── README.md         # Clear instructions
```

---

## Database Schema

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String?
  name          String?
  businessName  String?
  businessLogo  String?
  address       String?
  stripeCustomerId String?
  subscriptionStatus String @default("trial")
  invoices      Invoice[]
  clients       Client[]
  createdAt     DateTime  @default(now())
}

model Client {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  name      String
  email     String
  address   String?
  invoices  Invoice[]
}

model Invoice {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  clientId    String
  client      Client   @relation(fields: [clientId], references: [id])
  invoiceNumber String
  items       Json
  subtotal    Float
  tax         Float
  total       Float
  status      String   @default("draft")
  dueDate     DateTime
  createdAt   DateTime @default(now())
}
```

---

## User Setup Requirements

The user will need to:
1. **Create a Stripe account** (free) - for accepting subscription payments
2. **Run setup script** - `./setup.sh` handles everything else
3. **Deploy to Vercel** - One-click from GitHub or CLI

Total user effort: ~15-20 minutes of account setup, zero coding.

---

## Implementation Steps

### Phase 1: Project Setup
1. Initialize Next.js project with TypeScript
2. Configure Tailwind CSS
3. Set up Prisma with SQLite
4. Create base layout and styling

### Phase 2: Authentication
5. Set up NextAuth.js with credentials + Google
6. Create login/register pages
7. Protect dashboard routes

### Phase 3: Core Features
8. Build dashboard layout
9. Create invoice form
10. Build invoice preview
11. Implement PDF generation
12. Add client management
13. Build invoice list view

### Phase 4: Payments & Billing
14. Integrate Stripe subscriptions
15. Create pricing page
16. Handle subscription webhooks
17. Gate features based on subscription

### Phase 5: Polish & Deploy
18. Add landing page
19. Create setup script
20. Write clear README
21. Test everything end-to-end

---

## Verification Plan

1. Run `npm run dev` - app should start
2. Register a new account
3. Create a test invoice
4. Download PDF
5. Test Stripe subscription flow (test mode)
6. Deploy to Vercel and verify production

---

## Questions to Clarify

1. Do you have a Stripe account, or are you willing to create one?
2. Are you okay using Vercel for free hosting?
3. Any preference on the type of business tool (invoice generator vs. something else)?
