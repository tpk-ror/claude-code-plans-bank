# Plan: Tag Business & AI Expenses in Credit Card CSV

## Overview
Add "Business" and/or "AI" tags to the existing Tags column in the Travel Rewards Visa Signature Transactions CSV file.

## Identified AI-Related Expenses
These will be tagged with both **AI** and **Business**:

| Vendor | Monthly Cost | Description |
|--------|-------------|-------------|
| Claude.AI (Anthropic) | ~$100 | AI coding assistant subscription |
| ChatGPT (OpenAI) | ~$20-195 | AI assistant (some months have higher usage) |
| Cursor AI | ~$20 | AI-powered code editor |
| Lovable (lovable.dev) | ~$25-100 | AI code generation platform |
| Abacus.AI | ~$20-100 | AI/ML platform |
| Replicate | ~$0.77-14 | AI model hosting |
| Hailuoai.video | ~$10 | AI video generation |
| Genspark.AI | ~$25 | AI search/assistant |
| Fal.AI | ~$20 | AI model hosting |
| A0.dev | ~$20 | AI development tool |
| Tempolabs.AI | ~$30 | AI development |
| Replit | ~$7 | AI coding platform |
| Windsurf | ~$15 | AI code editor |
| Bolt (Stackblitz) | ~$20 | AI code editor |
| Rork/RorkAI | ~$20 | AI development |
| DhiWise (Rocket.new) | ~$25 | AI code generation |
| Kiro (AWS) | various | AI development tool |
| Vercel-Supabase | ~$25 | AI app hosting |
| Supabase | ~$41-50 | Backend (used for AI apps) |

## Other Business Expenses (Non-AI)
These will be tagged with **Business** only:

| Category | Vendors |
|----------|---------|
| Web Hosting/Dev | WPMU Dev, Hostinger, Bluehost, Vercel, Google Cloud |
| Website Platforms | Squarespace, Canva |
| Domains | BuyDomains |
| Cloud Storage | Google One, Google Cloud Storage |
| E-commerce | Printful, Etsy fees |
| Equipment/Supplies | B&H Photo Video, Johnson Plastics Plus, Elegoo, Bambulab |

## Implementation

1. **Parse the CSV file** and identify each transaction by merchant name
2. **Match merchants** against the AI and Business vendor lists
3. **Update the Tags column** (column 7, currently empty) with appropriate tags:
   - AI expenses: "AI, Business"
   - Non-AI business expenses: "Business"
4. **Write the updated CSV** back to the same location (or create a new file)

## Files to Modify
- `/mnt/c/Users/tomka/Desktop/taes-2025/data/Travel Rewards Visa Signature Transactions.csv`

## Estimated Expense Totals (for reference)
Based on my scan:
- **AI Expenses**: ~$600-800/month recurring
- **Total Business Expenses**: ~$1,000-1,500/month recurring

## Verification
After implementation:
1. Open the CSV in Excel/spreadsheet
2. Filter by Tags column to verify Business and AI tags are applied
3. Spot-check a few known AI vendors (Claude, ChatGPT, Cursor) to confirm tagging
