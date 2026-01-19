# Implementation Plan: Portfolio Feature Additions

## Features to Implement
1. **Case Study Template Enhancement** - Add process documentation to projects
2. **Services/Packages Page** - New `/services` page with offerings and pricing
3. **Newsletter Signup** - Email capture form in footer with admin management

---

## Phase 1: Database & Types

### Database Migrations

**1. Services tables (`024_services.sql`)**
```sql
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  short_description text,
  category text NOT NULL, -- 'web-dev', 'ui-ux', 'consulting'
  icon text,
  features text[] DEFAULT '{}',
  pricing_type text DEFAULT 'starting', -- 'fixed', 'starting', 'custom', 'hourly'
  price_amount numeric,
  price_currency text DEFAULT 'USD',
  price_unit text,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE service_process_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  step_number integer NOT NULL,
  icon text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE service_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  question text NOT NULL,
  answer text NOT NULL,
  is_global boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

**2. Newsletter subscribers (`025_newsletter.sql`)**
```sql
CREATE TABLE newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  status text DEFAULT 'active', -- 'active', 'unsubscribed', 'bounced'
  source text DEFAULT 'website',
  ip_hash text,
  subscribed_at timestamptz DEFAULT now(),
  unsubscribed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

### TypeScript Types (add to `/src/types/index.ts`)
- `Service`, `ServiceCategory`, `PricingType`
- `ServiceProcessStep`, `ServiceFAQ`
- `NewsletterSubscriber`, `SubscriberStatus`, `SubscriptionSource`
- Extend `CaseStudy` with `research`, `lessons`, `timeline` fields

---

## Phase 2: Newsletter Feature

### Files to Create
| File | Purpose |
|------|---------|
| `/src/app/api/newsletter/subscribe/route.ts` | Handle subscriptions |
| `/src/app/api/newsletter/unsubscribe/route.ts` | Handle unsubscriptions |
| `/src/components/newsletter/NewsletterSignup.tsx` | Reusable signup form |
| `/src/app/unsubscribe/page.tsx` | Public unsubscribe page |
| `/src/app/admin/newsletter/page.tsx` | Admin subscriber management |

### Files to Modify
| File | Changes |
|------|---------|
| `/src/components/layout/Footer.tsx` | Add NewsletterSignup component |
| `/src/app/admin/layout.tsx` | Add "Newsletter" to admin nav |

---

## Phase 3: Case Study Enhancements

### Files to Create
| File | Purpose |
|------|---------|
| `/src/components/projects/TimelineDisplay.tsx` | Visual timeline with milestones |
| `/src/components/projects/ResearchSection.tsx` | Research & discovery display |
| `/src/components/projects/LessonsSection.tsx` | Lessons learned display |

### Files to Modify
| File | Changes |
|------|---------|
| `/src/types/index.ts` | Extend CaseStudy interface |
| `/src/app/admin/projects/[id]/case-study/page.tsx` | Add tabs for Research, Lessons, Timeline |
| `/src/app/(public)/projects/[slug]/page.tsx` | Render new sections |

---

## Phase 4: Services Page

### Files to Create
| File | Purpose |
|------|---------|
| `/src/app/api/services/route.ts` | CRUD for services |
| `/src/components/services/ServiceCard.tsx` | Service card with pricing |
| `/src/components/services/ProcessTimeline.tsx` | Visual process steps |
| `/src/components/services/PricingDisplay.tsx` | Price formatting |
| `/src/components/services/FAQAccordion.tsx` | Expandable FAQ |
| `/src/components/services/ServicesCTA.tsx` | CTA section |
| `/src/app/(public)/services/page.tsx` | Services listing |
| `/src/app/(public)/services/[slug]/page.tsx` | Service detail |
| `/src/app/admin/services/page.tsx` | Admin services management |

### Files to Modify
| File | Changes |
|------|---------|
| `/src/components/layout/Navbar.tsx` | Add "Services" nav item |
| `/src/components/layout/MobileNav.tsx` | Add "Services" nav item |
| `/src/components/layout/Footer.tsx` | Add Services link |
| `/src/app/admin/layout.tsx` | Add "Services" to admin nav |

---

## Phase 5: Documentation
- Update `/docs/DATABASE.md` with new tables
- Update `/docs/FEATURES.md` with new features
- Update `/docs/API.md` with new endpoints
- Update `/docs/COMPONENTS.md` with new components

---

## Verification Checklist

### Newsletter
- [ ] Footer shows newsletter form
- [ ] Subscription saves to database
- [ ] Duplicate emails handled gracefully
- [ ] Success/error toasts display
- [ ] Admin can view subscribers
- [ ] Unsubscribe link works

### Case Study Enhancement
- [ ] New sections render on project detail page
- [ ] Timeline displays with milestone markers
- [ ] Admin can edit research/lessons/timeline
- [ ] Existing case studies still work

### Services Page
- [ ] Services page loads at `/services`
- [ ] Individual service pages work
- [ ] Process timeline renders correctly
- [ ] FAQ accordion expands/collapses
- [ ] Admin can CRUD services
- [ ] Pricing displays correctly
- [ ] Navigation updated

---

## Implementation Order

1. Database migrations (both files)
2. TypeScript types
3. Newsletter API + component + footer integration
4. Case study type extensions + components + admin updates
5. Services API + components + pages + admin
6. Navigation updates
7. Documentation updates
