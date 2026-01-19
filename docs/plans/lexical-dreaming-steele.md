# Service Offerings - Implementation Plan

## Summary
Create SQL migration to populate the services table with 10 services across 4 categories, with placeholder pricing and process steps.

---

## Services to Create

| # | Service | Category | Pricing Type | Starting Price |
|---|---------|----------|--------------|----------------|
| 1 | Discovery & Product Planning | strategy | fixed | $1,500 |
| 2 | Wireframing & Prototyping | design | starting | $800 |
| 3 | UI/UX Design | design | starting | $2,000 |
| 4 | Frontend Development | development | starting | $3,000 |
| 5 | Backend & API Development | development | starting | $3,500 |
| 6 | Full-Stack Development | development | custom | $8,000 (featured) |
| 7 | Digital Marketing Strategy | marketing | hourly | $150/hr |
| 8 | Email Marketing | marketing | starting | $500 |
| 9 | Marketing Automation | marketing | starting | $1,500 |
| 10 | SEO Optimization | marketing | hourly | $125/hr |

---

## Files to Modify

### 1. `/src/types/index.ts`
Update `ServiceCategory` type:
```typescript
export type ServiceCategory = 'strategy' | 'design' | 'development' | 'marketing';
```

### 2. `/supabase/migrations/031_services_data.sql` (new file)
Complete SQL migration with:
- ALTER TABLE to update category CHECK constraint
- INSERT statements for all 10 services
- INSERT statements for process steps
- INSERT statements for global FAQs

---

## SQL Migration Content

```sql
-- Migration: 031_services_data.sql
-- Description: Add service categories and populate services

-- 1. Update category CHECK constraint to include new categories
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_category_check;
ALTER TABLE services ADD CONSTRAINT services_category_check
  CHECK (category IN ('web-dev', 'ui-ux', 'consulting', 'strategy', 'design', 'development', 'marketing'));

-- 2. Insert Services
INSERT INTO services (title, slug, description, short_description, category, icon, features, pricing_type, price_amount, price_currency, price_unit, is_featured, is_active, display_order) VALUES

-- Strategy Services
('Discovery & Product Planning', 'discovery-planning',
 'Transform your idea into an actionable roadmap. I''ll help define requirements, user personas, and create a clear path from concept to launch.',
 'Turn ideas into actionable roadmaps',
 'strategy', 'Lightbulb',
 ARRAY['Stakeholder interviews', 'Requirements documentation', 'User persona development', 'Feature prioritization', 'Project roadmap creation'],
 'fixed', 1500.00, 'USD', 'project', false, true, 1),

-- Design Services
('Wireframing & Prototyping', 'wireframing-prototyping',
 'Visualize your product before writing a single line of code. Low and high-fidelity wireframes with interactive prototypes to validate ideas early.',
 'Visualize before you build',
 'design', 'PenTool',
 ARRAY['Low-fidelity sketches', 'High-fidelity wireframes', 'Interactive clickable prototypes', 'User flow diagrams', 'Iteration based on feedback'],
 'starting', 800.00, 'USD', 'project', false, true, 2),

('UI/UX Design', 'ui-ux-design',
 'Beautiful, intuitive interfaces that delight users. Full visual design with a focus on usability, accessibility, and conversion optimization.',
 'Interfaces that delight and convert',
 'design', 'Palette',
 ARRAY['Visual design & branding integration', 'Design system creation', 'Responsive design (mobile-first)', 'Accessibility compliance (WCAG)', 'Handoff-ready assets'],
 'starting', 2000.00, 'USD', 'project', false, true, 3),

-- Development Services
('Frontend Development', 'frontend-development',
 'Pixel-perfect, performant frontends built with modern technologies. React, Next.js, and cutting-edge web standards for fast, responsive experiences.',
 'Modern, performant web interfaces',
 'development', 'Code',
 ARRAY['React/Next.js development', 'Responsive implementation', 'Animation & micro-interactions', 'Performance optimization', 'Cross-browser compatibility'],
 'starting', 3000.00, 'USD', 'project', false, true, 4),

('Backend & API Development', 'backend-api-development',
 'Robust, scalable backend systems that power your application. From simple REST APIs to complex distributed systems with proper security.',
 'Scalable systems that grow with you',
 'development', 'Server',
 ARRAY['RESTful & GraphQL APIs', 'Database design & optimization', 'Authentication & authorization', 'Third-party integrations', 'Serverless & cloud deployment'],
 'starting', 3500.00, 'USD', 'project', false, true, 5),

('Full-Stack Development', 'full-stack-development',
 'End-to-end application development from database to deployment. Your complete solution designed, built, and maintained under one roof.',
 'Complete solutions from start to finish',
 'development', 'Layers',
 ARRAY['Complete web application development', 'Frontend + backend integration', 'DevOps & CI/CD setup', 'Ongoing maintenance & support', 'Documentation & knowledge transfer'],
 'custom', 8000.00, 'USD', 'project', true, true, 6),

-- Marketing Services
('Digital Marketing Strategy', 'digital-marketing-strategy',
 'Data-driven marketing strategies that grow your business. Channel selection, campaign planning, and ROI tracking to maximize your marketing spend.',
 'Strategies that drive growth',
 'marketing', 'TrendingUp',
 ARRAY['Market & competitor analysis', 'Channel strategy development', 'Campaign planning & execution', 'Analytics & reporting setup', 'Performance optimization'],
 'hourly', 150.00, 'USD', 'hour', false, true, 7),

('Email Marketing', 'email-marketing',
 'Email campaigns that convert. From one-off newsletters to complex automated sequences that nurture leads and drive sales.',
 'Emails that get opened and clicked',
 'marketing', 'Mail',
 ARRAY['Campaign strategy & planning', 'Template design & development', 'List segmentation', 'A/B testing', 'Deliverability optimization'],
 'starting', 500.00, 'USD', 'project', false, true, 8),

('Marketing Automation', 'marketing-automation',
 'Put your marketing on autopilot. Automated workflows that nurture leads and drive conversions while you focus on running your business.',
 'Marketing that works while you sleep',
 'marketing', 'Zap',
 ARRAY['Automation strategy & mapping', 'Workflow implementation', 'Lead scoring setup', 'CRM integration', 'Drip campaign creation'],
 'starting', 1500.00, 'USD', 'project', false, true, 9),

('SEO Optimization', 'seo-optimization',
 'Get found. Technical SEO, content optimization, and keyword strategies that improve your search rankings and drive organic traffic.',
 'Rank higher, get found',
 'marketing', 'Search',
 ARRAY['Technical SEO audit', 'On-page optimization', 'Keyword research & strategy', 'Content optimization', 'Performance monitoring'],
 'hourly', 125.00, 'USD', 'hour', false, true, 10);

-- 3. Insert Process Steps (global, applies to all services)
INSERT INTO service_process_steps (title, description, step_number, icon, display_order) VALUES
('Discovery', 'We start with a deep dive into your goals, challenges, and vision. Understanding your needs is the foundation of every successful project.', 1, 'Search', 1),
('Strategy', 'Based on discovery insights, I develop a tailored strategy and project plan. You''ll know exactly what to expect and when.', 2, 'Target', 2),
('Execution', 'With the plan approved, I get to work. Regular check-ins keep you informed and ensure we''re aligned throughout the process.', 3, 'Hammer', 3),
('Delivery', 'The finished product is delivered with documentation and training. I ensure a smooth handoff and am available for questions.', 4, 'Package', 4),
('Support', 'My relationship with clients doesn''t end at delivery. I provide ongoing support to ensure long-term success.', 5, 'HeartHandshake', 5);

-- 4. Insert Global FAQs
INSERT INTO service_faqs (question, answer, is_global, display_order) VALUES
('How do we get started?', 'Simply reach out through the contact form or book a discovery call. We''ll discuss your project, goals, and timeline to see if we''re a good fit.', true, 1),
('What is your typical timeline?', 'Timelines vary based on project scope. A simple landing page might take 1-2 weeks, while a full web application could take 2-3 months. I''ll provide a detailed timeline during our initial consultation.', true, 2),
('Do you offer ongoing support?', 'Yes! I offer maintenance packages and ongoing support for all projects. This includes updates, bug fixes, and enhancements as your needs evolve.', true, 3),
('What if I need multiple services?', 'Many clients benefit from combining services. For example, pairing UI/UX Design with Frontend Development ensures a seamless handoff. I offer package discounts for combined services.', true, 4),
('How do you handle revisions?', 'Each project includes a set number of revision rounds (typically 2-3). Additional revisions can be added at an hourly rate. My goal is to get it right the first time.', true, 5);
```

---

## Verification

After running the migration:
1. Check Supabase Table Editor to verify services are inserted
2. Query: `SELECT title, category, price_amount FROM services ORDER BY display_order;`
3. Verify TypeScript types compile with new categories
4. Test any existing services pages render correctly

---

## Documentation Update

Update `/docs/DATABASE.md` to include the new service categories and data.
