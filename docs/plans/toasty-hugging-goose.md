# Fix Marketing Platform Routing & Workflow

## Problem Summary

1. **Media Types 404 Error**: Clicking view/edit on media types leads to 404 because detail pages don't exist
2. **Missing Form Components**: MediaTypeForm component doesn't exist
3. **Content Workflow Clarification**: Content should be managed through campaigns (currently works this way)

## Intended Workflow (Per User)

```
1. Marketers build campaigns
2. Campaigns consist of campaign details (existing form)
3. Marketers assign content + templates to campaigns
4. Campaign canvas shows merged content + templates (final preview)
5. Content can be edited from the canvas
```

---

## Route Analysis

### Working Routes ✓
| Resource | List | Detail | New |
|----------|------|--------|-----|
| brands | ✓ | ✓ `[brandId]` | ✓ |
| campaigns | ✓ | ✓ `[campaignId]` | ✓ |
| templates | ✓ | ✓ `[templateId]` | ✓ |
| data-structures | ✓ | ✓ `[dataStructureId]` | ✓ |
| customer-brands | ✓ | ✓ `[customerBrandId]` | ✓ |

### Broken Routes ✗
| Resource | List | Detail | New |
|----------|------|--------|-----|
| media-types | ✓ | ✗ MISSING | ✗ MISSING |
| content | ✓ | N/A (uses campaign) | N/A |

---

## Implementation Plan

### Phase 1: Create Missing Media Types Pages

#### 1.1 Create MediaTypeForm Component
**File**: `features/marketing-platform/components/media-types/MediaTypeForm.tsx`

Form fields based on MediaType type:
- `name: string` (required)
- `description: string`
- `category: string` (e.g., "social", "print", "email", "web")
- `outputFormat: "pdf" | "pptx" | "html" | "image" | "email"`
- `renderingType: "realtime" | "async"`
- `dimensions: { width: number, height: number, unit: "px" | "in" | "mm" }`
- `supportedTemplateIds: string[]`
- `status: "active" | "archived"`

#### 1.2 Create Media Types Detail Page
**File**: `app/(dashboard)/marketing-platform/media-types/[id]/page.tsx`

Follow pattern from `templates/[templateId]/page.tsx`:
- Load media type by ID
- Show loading state
- Show not found state if missing
- Render MediaTypeForm with existing data
- Handle save with API call

#### 1.3 Create Media Types New Page
**File**: `app/(dashboard)/marketing-platform/media-types/new/page.tsx`

Follow pattern from `templates/new/page.tsx`:
- Render empty MediaTypeForm
- Handle create with API call
- Redirect to list on success

---

### Phase 2: Verify Content + Template Workflow

The content page currently redirects to campaigns - this aligns with the user's workflow:
- Content is managed WITHIN campaigns
- Campaign canvas is the editing workspace

**Verification Steps:**
1. Open campaign canvas
2. Confirm content fields are editable in ContentEditor panel
3. Confirm template preview shows in CanvasViewport
4. Confirm changes save correctly

---

## Files to Create

```
app/(dashboard)/marketing-platform/media-types/
├── [id]/
│   └── page.tsx          # NEW - Detail/Edit page
└── new/
    └── page.tsx          # NEW - Create page

features/marketing-platform/components/media-types/
├── MediaTypeCard.tsx     # EXISTS
├── MediaTypeList.tsx     # EXISTS
└── MediaTypeForm.tsx     # NEW - Form component
```

---

## Implementation Details

### MediaTypeForm.tsx (New Component)

```typescript
// Key props
interface MediaTypeFormProps {
  mediaType?: MediaType;  // For edit mode
  onSubmit: (data: MediaTypeFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// Form sections:
// 1. Basic Info: name, description, category
// 2. Output Settings: outputFormat, renderingType
// 3. Dimensions: width, height, unit
// 4. Template Association: supportedTemplateIds (multi-select)
// 5. Status: active/archived toggle
```

### media-types/[id]/page.tsx

```typescript
// Pattern:
// 1. Get ID from useParams()
// 2. Fetch media type using useMediaType(id) hook
// 3. Show loading spinner while fetching
// 4. Show "not found" if no media type
// 5. Render MediaTypeForm with data
// 6. Handle submit via updateMediaType mutation
```

### media-types/new/page.tsx

```typescript
// Pattern:
// 1. Render empty MediaTypeForm
// 2. Handle submit via createMediaType mutation
// 3. Redirect to /marketing-platform/media-types on success
```

---

## API Hooks (All Exist ✓)

All required hooks already exist in `use-media-types.ts`:
- `useMediaTypes()` - list all ✓
- `useMediaType(id)` - get single ✓
- `useCreateMediaType()` - create mutation ✓
- `useUpdateMediaType()` - update mutation ✓
- `useDeleteMediaType()` - delete mutation ✓

---

## Verification Checklist

After implementation:

- [ ] Navigate to Media Types list page
- [ ] Click "Create Media Type" → Form loads (no 404)
- [ ] Fill form and submit → Redirects to list
- [ ] Click on a media type card → Detail page loads (no 404)
- [ ] Edit and save → Returns to list with updated data
- [ ] Campaign canvas still works for content editing
- [ ] Content + template preview displays correctly

---

## Summary

| Task | Priority | Effort |
|------|----------|--------|
| Create MediaTypeForm component | High | Medium |
| Create media-types/[id]/page.tsx | High | Low |
| Create media-types/new/page.tsx | High | Low |
| Verify campaign canvas workflow | Medium | Low |

**Total: 3 files to create, following existing patterns. All API hooks already exist.**

---

## Quick Reference: MediaType Fields

```typescript
interface MediaType {
  id: string;
  name: string;
  category: MediaCategory;  // "social" | "print" | "email" | "web" | "video"
  outputFormat: OutputFormat;  // "pdf" | "pptx" | "html" | "image" | "email"
  description: string;
  defaultDimensions: DimensionalSpecs;  // { width, height, unit }
  supportedTemplateIds: string[];
  renderingType: "realtime" | "async";
  apiResponseType: ApiResponseType;
  analyticsTagsSchema?: Record<string, string>;
  status: "active" | "deprecated";
  createdAt: string;
  updatedAt: string;
}
```
