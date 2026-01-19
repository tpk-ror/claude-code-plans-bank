# Free Flux Image Generation API - Implementation Plan

## Overview
Build a Cloudflare Workers AI image generation API using FLUX.2 [klein] model. The API will support both base64 JSON and raw image stream responses, include API key authentication, and track usage via KV storage.

## Model Selection
**FLUX.2 [klein] 4B** (`@cf/black-forest-labs/flux-2-klein-4b`)
- Ultra-fast generation (fixed 4-step inference)
- Cheapest option: ~$0.0003 per 1024x1024 image
- Released Jan 15, 2026 - latest available model

## API Design

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/generate` | Generate image from prompt |
| GET | `/health` | Health check endpoint |
| OPTIONS | `*` | CORS preflight |

### POST /generate

**Request Headers:**
```
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

**Request Body:**
```json
{
  "prompt": "a sunset with a golden retriever",
  "width": 1024,
  "height": 1024
}
```

**Query Parameters:**
- `format=json` (default) - Returns `{"image": "base64...", "prompt": "...", "dimensions": {...}}`
- `format=raw` - Returns binary PNG with `Content-Type: image/png`

**Parameter Validation:**
- `prompt`: Required, 1-2000 characters
- `width`: Optional, 256-1920, default 1024
- `height`: Optional, 256-1920, default 768

### Response Formats

**JSON format (default):**
```json
{
  "image": "base64-encoded-png...",
  "prompt": "the prompt used",
  "width": 1024,
  "height": 1024,
  "model": "flux-2-klein-4b"
}
```

**Raw format:**
Binary PNG with headers:
- `Content-Type: image/png`
- `Access-Control-Allow-Origin: *`

## Files to Modify

### 1. `wrangler.jsonc`
Add AI binding and KV namespace for usage tracking:
```jsonc
{
  "name": "image-api",
  "main": "src/index.ts",
  "compatibility_date": "2025-09-27",
  "observability": { "enabled": true },
  "ai": { "binding": "AI" },
  "kv_namespaces": [
    { "binding": "USAGE", "id": "<to-be-created>" }
  ]
}
```

### 2. `src/index.ts`
Complete rewrite with:
- Type-safe Env interface
- Request routing (generate, health, CORS)
- Bearer token authentication
- Input validation
- Flux model integration with FormData
- Dual response format support (JSON/raw)
- Usage tracking to KV
- Proper error handling with JSON responses

### 3. `worker-configuration.d.ts`
Regenerate types after adding bindings using `npm run cf-typegen`

## Implementation Steps

### Step 1: Update wrangler.jsonc
- Add `"ai": { "binding": "AI" }` for Workers AI access
- Add KV namespace binding for usage tracking

### Step 2: Create KV namespace
```bash
wrangler kv:namespace create USAGE
```
Copy the ID to wrangler.jsonc

### Step 3: Set API key secret
```bash
wrangler secret put API_KEY
```

### Step 4: Regenerate types
```bash
npm run cf-typegen
```

### Step 5: Implement src/index.ts
The main worker with full implementation

### Step 6: Test locally
```bash
npm run dev
```
Test with curl:
```bash
# JSON response
curl -X POST "http://localhost:8787/generate" \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a cat astronaut"}' | jq .

# Raw image
curl -X POST "http://localhost:8787/generate?format=raw" \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a cat astronaut"}' -o test.png
```

### Step 7: Deploy
```bash
npm run deploy
```

## Usage Tracking Design

Store daily usage counts in KV:
- Key format: `usage:<YYYY-MM-DD>`
- Value: `{ "count": 123, "lastUpdated": "ISO timestamp" }`

On each generation:
1. Get current date key
2. Increment count atomically
3. Store back to KV

This allows monitoring usage without a database.

## Security Considerations

1. **API Key Authentication**: Bearer token required on all /generate requests
2. **Input Validation**: Strict prompt length and dimension limits
3. **CORS**: Configurable allowed origins (default `*` for development)
4. **No Secrets in Code**: API_KEY stored as Worker secret

## Cost Analysis (FLUX.2 klein)

Per image at 1024x1024 (4 tiles):
- Input: $0.000059 x 4 = $0.000236
- Output: $0.000287 x 4 = $0.001148
- **Total: ~$0.0014 per image**

Cloudflare Workers AI free tier includes 10,000 neurons/day. For klein model, this translates to roughly **~100+ free images/day** before charges apply.

## Verification Plan

1. **Local Testing**
   - Run `npm run dev`
   - Test `/health` returns 200
   - Test `/generate` without auth returns 401
   - Test `/generate` with auth returns image (both formats)
   - Test invalid prompts return 400 errors

2. **Deployment Testing**
   - Run `npm run deploy`
   - Verify deployed URL responds
   - Generate test image from your other application

3. **Unit Tests** (optional enhancement)
   - Update `test/index.spec.ts` with proper test cases
   - Run `npm test`

## Notes

- The ChatGPT plan used SDXL (`@cf/stabilityai/stable-diffusion-xl-base-1.0`) which is an older model
- FLUX.2 [klein] is newer (Jan 2026), faster, and cheaper
- FLUX returns base64 by default (not a stream like SDXL), so we decode it for raw format responses
