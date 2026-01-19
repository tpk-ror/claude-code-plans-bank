# SDS Sub-Agent Integration Plan

## Overview
Add a dedicated SDS (Safety Data Sheet) sub-agent that runs after the main product search to improve SDS PDF discovery rates. Uses a specialized prompt with manufacturer-first search strategy and structured JSON output.

## Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/011_sds_agent_schema.sql` | New migration for DB columns |
| `src/types/database.ts` | Add new SDS fields |
| `src/lib/prompts.ts` | Add `buildSDSAgentPrompt()` |
| `src/lib/parser.ts` | Add `parseSDSAgentResponse()` |
| `src/app/api/seachy/search/route.ts` | Integrate sub-agent call |
| `src/components/seachy/SDSSection.tsx` | Display source_type/confidence |

---

## Step 1: Database Migration

**File:** `supabase/migrations/011_sds_agent_schema.sql`

```sql
ALTER TABLE sds_documents
ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) CHECK (source_type IN ('manufacturer', 'secondary')),
ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
ADD COLUMN IF NOT EXISTS manufacturer_domain VARCHAR(255),
ADD COLUMN IF NOT EXISTS match_notes TEXT,
ADD COLUMN IF NOT EXISTS sds_agent_raw_response TEXT;
```

---

## Step 2: Update Types

**File:** `src/types/database.ts`

Add to `sds_documents` Row/Insert/Update:
- `source_type: 'manufacturer' | 'secondary' | null`
- `confidence: number | null`
- `manufacturer_domain: string | null`
- `match_notes: string | null`
- `sds_agent_raw_response: string | null`

---

## Step 3: SDS Agent Prompt Builder

**File:** `src/lib/prompts.ts`

Add new function `buildSDSAgentPrompt(input)` using user's proven prompt:
- Manufacturer domain search first
- Extract "Download PDF" links from landing pages
- Pick best match by product name, UPC, region, revision date
- Fallback to secondary sources (Chemtel, Chemsafety)
- Include Section 14 extraction in same call
- **Output: Strict JSON format**

```typescript
export interface SDSAgentInput {
  productName: string
  brandOrManufacturer: string
  upcSku?: string
  country?: string
  language?: string
}
```

---

## Step 4: JSON Response Parser

**File:** `src/lib/parser.ts`

Add `parseSDSAgentResponse(response)`:
- Extract JSON from response text
- Validate required fields
- Normalize UN number (UN1234 format)
- Normalize packing group (I, II, III)
- Return typed `SDSAgentResponse` or null on failure

```typescript
export interface SDSAgentResponse {
  product: string
  best_pdf_url: string | null
  source_type: 'manufacturer' | 'secondary'
  manufacturer_domain: string | null
  evidence: Array<{ title: string; url: string; note: string }>
  match_notes: string
  confidence: number
  un_number: string | null
  proper_shipping_name: string | null
  hazard_class: string | null
  packing_group: string | null
}
```

---

## Step 5: Integrate into Search Route

**File:** `src/app/api/seachy/search/route.ts`

Add after main search parsing (~line 135):

```typescript
// Always run SDS sub-agent and compare results
const sdsAgentResult = await runSDSSubAgent({
  productName: parsed.result.product_name || input.manufacturerPartNumber,
  brandOrManufacturer: input.brandName,
  upcSku: input.gtinUpc,
}, model)

// Merge: Keep sub-agent result if higher confidence, or if main search found nothing
const mainSearchSDS = parsed.sdsDocuments[0]
if (sdsAgentResult?.best_pdf_url) {
  const mainConfidence = mainSearchSDS ? 0.5 : 0 // Default confidence for main search
  if (sdsAgentResult.confidence > mainConfidence || !mainSearchSDS) {
    // Use sub-agent result
    await supabase.from('sds_documents').insert({
      result_id: result.id,
      pdf_url: sdsAgentResult.best_pdf_url,
      source_type: sdsAgentResult.source_type,
      confidence: sdsAgentResult.confidence,
      // ... all fields
    })
  } else {
    // Use main search result but still store sub-agent for comparison
    // Insert main search SDS with lower priority
  }
}
```

Add new function `runSDSSubAgent()`:
- Build prompt with `buildSDSAgentPrompt()`
- Call `executeWebSearch(prompt, model)`
- Parse with `parseSDSAgentResponse()`
- Return parsed result (don't insert yet - let caller decide)
- **Error handling:** Return null on failure, don't crash

---

## Step 6: Update UI

**File:** `src/components/seachy/SDSSection.tsx`

Display new fields:
- Source badge: "Manufacturer" (green) or "Secondary" (yellow)
- Confidence score as percentage badge
- Match notes in expandable section

---

## Design Decision: When to Run

**Always run and compare:** Sub-agent runs for every search
- Compare confidence scores
- Keep higher confidence result as primary
- May store both for transparency (main search result + sub-agent result)
- More thorough but incurs additional API cost per search

---

## Verification

1. **Test with product that has manufacturer SDS:** Verify sub-agent finds PDF and marks as "manufacturer"
2. **Test with obscure product:** Verify fallback to secondary sources works
3. **Test Section 14 extraction:** Verify UN number, hazard class, packing group are parsed
4. **Test failure handling:** Verify main search still completes if sub-agent fails
5. **Check database:** Verify all new columns populated correctly
