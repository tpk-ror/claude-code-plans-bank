# Consistent Product Information Crawling - Implementation Plan

## Problem Summary

Running the same product search multiple times returns different results:
- Search 1: Complete dimensions (11.625" x 10.75" x 10.75", 19.63 lb)
- Search 2: Same dimensions, different sources
- Search 3: **Almost all dimensions empty**, different source entirely

Root causes:
1. **Non-deterministic web search** - OpenAI's `web_search_preview` returns different results each time
2. **Regex parsing variability** - Freeform text parsing is fragile
3. **No source hierarchy** - AI chooses sources randomly

## Solution Overview

Replace single-pass freeform search with a **deterministic multi-agent pipeline**:

```
User Input (Brand + MPN)
    ↓
Phase 1: SerpAPI Deterministic Search (cached)
    ↓
Phase 2: Specialized Extraction Agents (parallel, JSON output)
    ├── Dimensions Agent
    ├── SDS Agent
    ├── Images Agent
    └── Specifications Agent
    ↓
Phase 3: Consensus Voting (confidence scoring)
    ↓
Phase 4: Quality Gate + Retry with Fallbacks
    ↓
Store Results → Human Review Queue
```

## Key Changes

### 1. Add SerpAPI for Deterministic Search

**New file: `/src/lib/serpapi.ts`**

- Use SerpAPI instead of `web_search_preview` for consistent search results
- Site-specific searches: `site:grainger.com "brand" "mpn"`
- Source priority hierarchy:
  - Manufacturer sites: 100
  - Major distributors (Grainger, McMaster-Carr, Uline): 90
  - Specialty distributors: 80
  - General retailers: 70
- Cache results in Supabase (24-hour TTL)

### 2. Specialized Extraction Agents with JSON Schema

Replace freeform prompts with strict JSON schema output:

**New files:**
- `/src/lib/agents/dimensionsAgent.ts`
- `/src/lib/agents/imagesAgent.ts`
- `/src/lib/agents/specificationsAgent.ts`
- Update existing SDS agent to match pattern

**Key settings for determinism:**
```typescript
{
  temperature: 0.0,    // No randomness
  seed: 42,            // Fixed seed
  response_format: { type: 'json_schema', schema: ... }
}
```

**Dimensions schema example:**
```typescript
{
  width: { value: number, unit: string, confidence: number, source_url: string },
  height: { ... },
  depth: { ... },
  weight: { ... },
  reasoning: string,           // Chain-of-thought
  alternative_values: [...]    // Track conflicting data
}
```

### 3. Multi-Pass Consensus Algorithm

**New file: `/src/lib/consensus.ts`**

- Run each agent 3 times with different source pages
- Vote on final values with source priority weighting
- Calculate confidence score (0-1) based on:
  - Agreement ratio (how many sources agree)
  - Source quality (manufacturer > distributor)
  - Agent confidence
- Flag conflicts for human review

### 4. Quality Gate with Retry

**New file: `/src/lib/productPipeline.ts`**

Quality thresholds:
- Required fields: product_name, width, height, depth, weight
- Min confidence: 70%
- Min source count: 2

Fallback chain:
1. Manufacturer + major distributors
2. Specialty distributors
3. General web search
4. Alternative search terms

### 5. Database Schema Extensions

**New migration: `/supabase/migrations/012_consistent_crawling.sql`**

```sql
-- Cache SerpAPI results
CREATE TABLE search_result_cache (
  id UUID PRIMARY KEY,
  query_hash VARCHAR(64) UNIQUE,
  results JSONB,
  expires_at TIMESTAMPTZ
);

-- Track extraction passes for audit
CREATE TABLE extraction_passes (
  id UUID PRIMARY KEY,
  search_id UUID REFERENCES product_searches(id),
  agent_type VARCHAR(50),
  pass_number INTEGER,
  raw_response JSONB,
  confidence_score DECIMAL(3,2)
);

-- Store consensus results
CREATE TABLE consensus_results (
  id UUID PRIMARY KEY,
  result_id UUID REFERENCES product_results(id),
  field_name VARCHAR(100),
  consensus_value TEXT,
  confidence_score DECIMAL(3,2),
  vote_count INTEGER,
  conflicts JSONB
);

-- Add quality tracking to product_results
ALTER TABLE product_results ADD COLUMN
  quality_score DECIMAL(3,2),
  needs_human_review BOOLEAN DEFAULT TRUE;
```

## Files to Modify

| File | Change |
|------|--------|
| `/src/app/api/seachy/search/route.ts` | Replace single GPT call with pipeline orchestration |
| `/src/lib/openai.ts` | Add JSON schema response support, temperature=0 |
| `/src/lib/prompts.ts` | Refactor into agent-specific prompts with few-shot examples |
| `/src/lib/parser.ts` | Replace regex with JSON schema validation |
| `/src/types/database.ts` | Add new table types |

## New Files to Create

| File | Purpose |
|------|---------|
| `/src/lib/serpapi.ts` | SerpAPI client with caching |
| `/src/lib/agents/dimensionsAgent.ts` | Dimensions extraction |
| `/src/lib/agents/imagesAgent.ts` | Image extraction |
| `/src/lib/agents/specificationsAgent.ts` | Specs extraction |
| `/src/lib/consensus.ts` | Voting algorithm |
| `/src/lib/productPipeline.ts` | Pipeline orchestration |
| `/supabase/migrations/012_consistent_crawling.sql` | Schema changes |

## Cost & Performance

| Metric | Current | Proposed |
|--------|---------|----------|
| Time per search | ~15-30s | ~2-3 min |
| Cost per search | ~$0.15 | ~$0.86 |
| Consistency | ~60% | ~95% |
| Completeness | Variable | 90%+ |

Caching reduces repeat search cost to ~$0.02.

## Verification Plan

1. **Unit tests**: Test each agent with known products
2. **Consistency test**: Run same product 10 times, verify identical results
3. **Accuracy test**: Compare against manually verified product data
4. **Performance test**: Measure latency and cost across product categories

## Implementation Order

1. SerpAPI integration + caching
2. Dimensions agent (start simple, one data type)
3. Consensus algorithm
4. Pipeline orchestration
5. Remaining agents (SDS, images, specs)
6. Quality gate + retry logic
7. Database migration
8. API updates
