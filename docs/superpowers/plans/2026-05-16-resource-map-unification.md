# Resource–Map Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a submitted Resource appear on the Support Map (when it has coordinates) without duplicating it as a Post, and remove the `[RESOURCE]` message-prefix string hack entirely.

**Architecture:** Add optional `city/country/lat/lng` to the `Resource` type, introduce a `MapItem = { kind: 'post'; data: Post } | { kind: 'resource'; data: Resource }` discriminated union, and update `MapView` to fetch both Posts and Resources in parallel, merge them into unified `CityGroup.items: MapItem[]`, and render each kind correctly.

**Tech Stack:** React 18 + TypeScript, Framer Motion, Tailwind CSS, Vitest, Google Apps Script backend (no code changes — only sheet column additions required).

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `types.ts` | Modify | Add `city/country/lat/lng` to `Resource`; add `MapItem` union |
| `services/api.ts` | Modify | Export `normalizeResource`; update it + `submitResource` for coordinates |
| `tests/api.test.ts` | Modify | Add tests for coordinate normalisation |
| `components/ResourceMapCard.tsx` | Create | Card component for map sidebar resource items |
| `views/AddResourceView.tsx` | Modify | Add optional city-picker location field |
| `views/MapView.tsx` | Modify | Parallel fetch; unified `CityGroup`; remove `[RESOURCE]` hack |

---

## Task 1: Extend `Resource` type and add `MapItem` union

**Files:**
- Modify: `types.ts`

- [ ] **Step 1.1: Add optional location fields to `Resource`**

Open `types.ts`. The current `Resource` interface ends at line 74. Add four optional fields inside the interface, after the existing `exploring_count` line:

```ts
export interface Resource {
  id: string;
  timestamp: string;
  status: PostStatus;
  type: ResourceType;
  title: string;
  url: string;
  description?: string;
  alias?: string;
  submitterEmail?: string;
  qualifications?: string;
  isVerifiedPartner?: boolean;
  category?: 'general' | 'community' | 'partner';
  location?: string;
  imageUrl?: string;
  helpful_count?: number;
  supportive_count?: number;
  exploring_count?: number;
  // Optional map placement fields — only set when a resource is location-specific
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
}
```

- [ ] **Step 1.2: Add `MapItem` discriminated union after the `QAItem` interface**

At the bottom of `types.ts`, after the closing brace of `QAItem`, add:

```ts
/**
 * Discriminated union for items rendered on the Support Map.
 * Posts come from Live_Stories; Resources come from Live_Resources
 * (only those with lat/lng are included).
 */
export type MapItem =
  | { kind: 'post'; data: Post }
  | { kind: 'resource'; data: Resource };
```

- [ ] **Step 1.3: Verify TypeScript compiles cleanly**

```bash
cd /home/mrotiz14/github-projects/Starlings && npx tsc --noEmit
```

Expected: zero errors (other files haven't changed yet so no downstream breakage).

- [ ] **Step 1.4: Commit**

```bash
git add types.ts
git commit -m "feat(types): add optional location fields to Resource and MapItem union"
```

---

## Task 2: Update API service — coordinate normalisation and submission

**Files:**
- Modify: `services/api.ts`
- Modify: `tests/api.test.ts`

- [ ] **Step 2.1: Write failing tests for `normalizeResource`**

Open `tests/api.test.ts`. Add the new import at the **top of the file** alongside the existing imports (line 2, after `import { describe, it, expect } from 'vitest';`):

```ts
import { normalizeResource } from '../services/api.ts';
```

Then append the new describe block **after the last `});`** (after the "Combined Safety Check" describe):

```ts
describe('normalizeResource — location fields', () => {
  it('converts string lat/lng (as returned by Google Sheets) to numbers', () => {
    const raw = {
      id: 'r1', status: 'APPROVED', timestamp: '2026-01-01T00:00:00Z',
      title: 'Test Resource', url: 'https://example.com', type: 'website',
      city: 'Calgary', country: 'Canada', lat: '51.0447', lng: '-114.0719',
    };
    const result = normalizeResource(raw);
    expect(result.lat).toBe(51.0447);
    expect(result.lng).toBe(-114.0719);
    expect(result.city).toBe('Calgary');
    expect(result.country).toBe('Canada');
  });

  it('returns undefined for missing coordinates', () => {
    const raw = {
      id: 'r2', status: 'APPROVED', timestamp: '2026-01-01T00:00:00Z',
      title: 'Global Resource', url: 'https://example.com', type: 'video',
    };
    const result = normalizeResource(raw);
    expect(result.lat).toBeUndefined();
    expect(result.lng).toBeUndefined();
    expect(result.city).toBeUndefined();
    expect(result.country).toBeUndefined();
  });

  it('returns undefined for empty-string lat/lng (old submitResource default)', () => {
    const raw = {
      id: 'r3', status: 'APPROVED', timestamp: '2026-01-01T00:00:00Z',
      title: 'Old Resource', url: 'https://example.com', type: 'website',
      lat: '', lng: '', city: '', country: '',
    };
    const result = normalizeResource(raw);
    expect(result.lat).toBeUndefined();
    expect(result.lng).toBeUndefined();
    expect(result.city).toBeUndefined();
  });

  it('returns undefined for city === "Unknown" (legacy hardcoded default)', () => {
    const raw = {
      id: 'r4', status: 'APPROVED', timestamp: '2026-01-01T00:00:00Z',
      title: 'Legacy Resource', url: 'https://example.com', type: 'website',
      city: 'Unknown', lat: '0', lng: '0',
    };
    const result = normalizeResource(raw);
    expect(result.city).toBeUndefined();
    // lat: '0' → Number('0') === 0 → falsy → undefined
    expect(result.lat).toBeUndefined();
  });
});
```

- [ ] **Step 2.2: Run tests to confirm they fail**

```bash
cd /home/mrotiz14/github-projects/Starlings && npm test -- --reporter=verbose 2>&1 | tail -30
```

Expected: Tests fail with `normalizeResource is not exported` or similar import error.

- [ ] **Step 2.3: Export `normalizeResource` and add location fields**

In `services/api.ts`, find the line:

```ts
const normalizeResource = (resource: any): Resource => {
```

Change `const` to `export const`:

```ts
export const normalizeResource = (resource: any): Resource => {
```

Then inside the function body, find the `return { ...resource, ... }` block and add coordinate fields. The full updated `normalizeResource` function should be:

```ts
export const normalizeResource = (resource: any): Resource => {
  const rawCategory = (resource.category || '').toLowerCase().trim();
  const category = rawCategory === 'general' || rawCategory === 'partner' ? rawCategory : 'community';

  // Parse lat/lng from strings (Google Sheets stores numbers as strings).
  // Treat falsy values (empty string, '0', 0) as absent — 0,0 is the
  // ocean off the coast of Africa, not a valid location for this app.
  const lat = resource.lat ? Number(resource.lat) : undefined;
  const lng = resource.lng ? Number(resource.lng) : undefined;

  // Treat 'Unknown' as absent (legacy hardcoded default from old submitResource).
  const city =
    resource.city && resource.city !== 'Unknown'
      ? String(resource.city)
      : undefined;
  const country = resource.country ? String(resource.country) : undefined;

  return {
    ...resource,
    type: resource.resource_type || resource.type || ResourceType.WEBSITE,
    imageUrl: resource.image_url || resource.imageUrl,
    submitterEmail: resource.submitter_email || resource.submitterEmail,
    category,
    helpful_count: Number(resource.helpful_count || 0),
    supportive_count: Number(resource.supportive_count || 0),
    exploring_count: Number(resource.exploring_count || 0),
    lat,
    lng,
    city,
    country,
  };
};
```

- [ ] **Step 2.4: Update `submitResource` to forward location fields**

In `services/api.ts`, find the `submitResource` method. Replace the payload construction. Change:

```ts
location: resourceData.location || '',
image_url: resourceData.imageUrl || '',
city: 'Unknown'
```

to:

```ts
location: resourceData.location || '',
image_url: resourceData.imageUrl || '',
city: resourceData.city || '',
country: resourceData.country || '',
lat: resourceData.lat ?? '',
lng: resourceData.lng ?? '',
```

The full updated payload block inside `submitResource` should look like:

```ts
const payload = {
  action: "addResource",
  id: Math.random().toString(36).substring(7),
  timestamp: new Date().toISOString(),
  status: PostStatus.PENDING,
  resource_type: resourceData.type || ResourceType.WEBSITE,
  title: resourceData.title || '',
  url: resourceData.url || '',
  description: resourceData.description || '',
  alias: resourceData.alias || '',
  submitterEmail: resourceData.submitterEmail || '',
  qualifications: resourceData.qualifications || '',
  category: resourceData.category || 'community',
  location: resourceData.location || '',
  image_url: resourceData.imageUrl || '',
  city: resourceData.city || '',
  country: resourceData.country || '',
  lat: resourceData.lat ?? '',
  lng: resourceData.lng ?? '',
};
```

- [ ] **Step 2.5: Run tests to confirm they pass**

```bash
cd /home/mrotiz14/github-projects/Starlings && npm test -- --reporter=verbose 2>&1 | tail -30
```

Expected: All tests pass including the four new `normalizeResource` tests.

- [ ] **Step 2.6: Commit**

```bash
git add services/api.ts tests/api.test.ts
git commit -m "feat(api): export normalizeResource with location fields; update submitResource to forward coordinates"
```

---

## Task 3: Create `ResourceMapCard` component

**Files:**
- Create: `components/ResourceMapCard.tsx`

This card renders a `Resource` in the map sidebar — visually consistent with `PostCard` but no `what_helped` tags.

- [ ] **Step 3.1: Create the file**

Create `/home/mrotiz14/github-projects/Starlings/components/ResourceMapCard.tsx` with:

```tsx
import React, { useState } from 'react';
import { Resource } from '../types.ts';

interface ResourceMapCardProps {
  resource: Resource;
  selected?: boolean;
  onClick?: () => void;
}

const ResourceMapCard: React.FC<ResourceMapCardProps> = ({ resource, selected, onClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const desc = resource.description || '';
  const isLong = desc.length > 120;

  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-[32px] transition-all duration-300 cursor-pointer border-2 group ${
        selected
          ? 'border-[#448a7d] bg-[#448a7d]/5 shadow-xl -translate-y-1'
          : 'border-transparent bg-white hover:border-[#448a7d]/20 hover:shadow-lg hover:-translate-y-1'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-[#1e3a34]">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              selected
                ? 'bg-[#448a7d] text-white'
                : 'bg-[#e8f3f1] text-[#448a7d] group-hover:bg-[#448a7d]/20'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </div>
          <div>
            <span className="font-black text-sm block tracking-tight truncate max-w-[180px] sm:max-w-xs">
              {resource.title}
            </span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              {resource.type}
            </span>
          </div>
        </div>
        <span className="text-[10px] text-[#1e3a34]/46 font-bold uppercase tracking-widest">
          {new Date(resource.timestamp).toLocaleDateString()}
        </span>
      </div>

      {desc && (
        <p
          className={`text-gray-600 text-sm leading-relaxed font-medium ${
            isExpanded ? 'mb-4' : isLong ? 'mb-2 line-clamp-3' : 'mb-4'
          }`}
        >
          {desc}
        </p>
      )}

      {isLong && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded((prev) => !prev);
          }}
          className="text-[#448a7d] text-xs font-bold uppercase tracking-widest hover:underline mb-4 block"
        >
          {isExpanded ? 'Show less' : 'Read more'}
        </button>
      )}

      <div className="flex justify-between items-center mt-2 pt-4 border-t border-gray-100">
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="px-4 py-2 bg-[#1e3a34] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#2d5a52] transition-colors shadow-sm inline-flex flex-shrink-0"
        >
          Visit Resource
        </a>
      </div>
    </div>
  );
};

export default React.memo(ResourceMapCard, (prev, next) =>
  prev.resource.id === next.resource.id && prev.selected === next.selected
);
```

- [ ] **Step 3.2: Verify TypeScript compiles**

```bash
cd /home/mrotiz14/github-projects/Starlings && npx tsc --noEmit
```

Expected: Zero errors.

- [ ] **Step 3.3: Commit**

```bash
git add components/ResourceMapCard.tsx
git commit -m "feat(components): add ResourceMapCard for map sidebar resource rendering"
```

---

## Task 4: Add optional city picker to `AddResourceView`

**Files:**
- Modify: `views/AddResourceView.tsx`

The city picker follows the identical pattern used in `views/ShareView.tsx` (`apiService.searchLocation` + `apiService.deepSearchLocation` debounced, results dropdown, `selectedLocation` in form state).

- [ ] **Step 4.1: Add imports**

At the top of `views/AddResourceView.tsx`, the current import block is:

```ts
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api.ts';
import { ResourceType } from '../types.ts';
import { ICONS } from '../constants.tsx';
```

Add `LocationSearchResult` to the types import and `useRef` to React:

```ts
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api.ts';
import { ResourceType, LocationSearchResult } from '../types.ts';
import { ICONS } from '../constants.tsx';
```

- [ ] **Step 4.2: Add location state fields to `formData`**

Find the `useState` for `formData` (starts around line 20). Add two new fields at the end of the initial state object:

```ts
const [formData, setFormData] = useState({
    title: '',
    url: '',
    type: defaultType,
    description: '',
    alias: '',
    anonymous: false,
    submitterEmail: '',
    qualifications: '',
    agreeToTerms: false,
    citySearch: '',
    selectedLocation: null as LocationSearchResult | null,
});
```

- [ ] **Step 4.3: Add location search state and debounce effect**

After the `wordCount` constant and before `isFormValid`, add:

```ts
const [locationResults, setLocationResults] = useState<LocationSearchResult[]>([]);
const locationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
    const query = formData.citySearch.trim();
    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);

    if (!query || formData.selectedLocation) {
        setLocationResults([]);
        return;
    }

    // Instant Canadian hub lookup
    apiService.searchLocation(query).then((localResults) => {
        if (localResults.length > 0) setLocationResults(localResults);
    });

    // Debounced Nominatim fallback (600ms)
    locationDebounceRef.current = setTimeout(async () => {
        const deep = await apiService.deepSearchLocation(query);
        if (deep.length > 0) setLocationResults(deep);
    }, 600);

    return () => {
        if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
    };
}, [formData.citySearch, formData.selectedLocation]);
```

- [ ] **Step 4.4: Update `handleSubmit` to pass coordinates**

Find the `apiService.submitResource(...)` call inside `handleSubmit`. Currently:

```ts
const result = await apiService.submitResource({
    title: formData.title,
    url: formData.url,
    type: formData.type,
    description: combinedDesc,
    alias: aliasValue,
    submitterEmail: mode === 'apply' ? formData.submitterEmail : undefined,
    qualifications: mode === 'apply' ? formData.qualifications : undefined,
    category: mode === 'apply' ? 'partner' : 'community',
});
```

Replace with:

```ts
const loc = formData.selectedLocation;
const result = await apiService.submitResource({
    title: formData.title,
    url: formData.url,
    type: formData.type,
    description: combinedDesc,
    alias: aliasValue,
    submitterEmail: mode === 'apply' ? formData.submitterEmail : undefined,
    qualifications: mode === 'apply' ? formData.qualifications : undefined,
    category: mode === 'apply' ? 'partner' : 'community',
    city: loc
        ? loc.address.city || loc.address.town || loc.address.village || ''
        : undefined,
    country: loc?.address.country || undefined,
    lat: loc ? parseFloat(loc.lat) : undefined,
    lng: loc ? parseFloat(loc.lon) : undefined,
});
```

- [ ] **Step 4.5: Add the location picker field to the form JSX**

Find the Resource Type `<div className="space-y-4">` block (the one with the `<select>` for resource type, around line 154). Add the following **after** that closing `</div>` and **before** the description textarea block:

```tsx
{/* Optional location field */}
<div className="space-y-4">
    <div className="flex justify-between items-baseline">
        <label htmlFor="citySearch" className="block text-[#1e3a34] font-black text-xl italic">
            Where is this resource based?
        </label>
        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Optional</span>
    </div>
    <p className="text-sm text-gray-500 -mt-2">
        Only needed for local resources like a support group or clinic. Leave blank for global resources.
    </p>
    <div className="relative">
        <input
            id="citySearch"
            type="text"
            placeholder="Search for a city..."
            autoComplete="off"
            className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-[#448a7d]/30 rounded-[1.5rem] text-lg font-medium text-[#1e3a34] focus:outline-none focus:bg-white transition-all shadow-inner shadow-gray-200/50"
            value={formData.citySearch}
            onChange={(e) =>
                setFormData((prev) => ({
                    ...prev,
                    citySearch: e.target.value,
                    selectedLocation: null,
                }))
            }
        />
        {formData.selectedLocation && (
            <button
                type="button"
                onClick={() =>
                    setFormData((prev) => ({
                        ...prev,
                        citySearch: '',
                        selectedLocation: null,
                    }))
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#448a7d] text-xs font-black uppercase tracking-widest hover:underline"
            >
                Clear
            </button>
        )}
        {locationResults.length > 0 && !formData.selectedLocation && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl overflow-hidden z-40 border border-gray-100">
                {locationResults.map((loc, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => {
                            setFormData((prev) => ({
                                ...prev,
                                citySearch: loc.display_name,
                                selectedLocation: loc,
                            }));
                            setLocationResults([]);
                        }}
                        className="w-full text-left px-6 py-4 text-sm font-medium text-[#1e3a34] hover:bg-[#e8f3f1] transition-colors border-b border-gray-50 last:border-0"
                    >
                        {loc.display_name}
                    </button>
                ))}
            </div>
        )}
    </div>
</div>
```

- [ ] **Step 4.6: Verify the form compiles**

```bash
cd /home/mrotiz14/github-projects/Starlings && npx tsc --noEmit
```

Expected: Zero errors.

- [ ] **Step 4.7: Commit**

```bash
git add views/AddResourceView.tsx
git commit -m "feat(AddResourceView): add optional city picker for location-specific resources"
```

---

## Task 5: Refactor `MapView` — unified `CityGroup`, parallel fetch, remove `[RESOURCE]` hack

**Files:**
- Modify: `views/MapView.tsx`

This is the largest change. Work through it in sub-steps.

### 5a — Imports and type definitions

- [ ] **Step 5a.1: Update imports**

Find the import block at the top of `views/MapView.tsx`:

```ts
import { Post } from '../types.ts';
```

Change to:

```ts
import { Post, Resource, MapItem } from '../types.ts';
```

- [ ] **Step 5a.2: Update the `CityGroup` local interface**

Find the `CityGroup` interface (around line 41):

```ts
interface CityGroup {
  id: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  count: number;
  posts: Post[];
  topTags: string[];
}
```

Replace with:

```ts
interface CityGroup {
  id: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  count: number;
  items: MapItem[];
  topTags: string[];
}
```

### 5b — State and data fetching

- [ ] **Step 5b.1: Add `mappableResources` state**

Find the existing state declarations near line 88:

```ts
const [posts, setPosts] = useState<Post[]>([]);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
```

Add one new line after `posts`:

```ts
const [posts, setPosts] = useState<Post[]>([]);
const [mappableResources, setMappableResources] = useState<Resource[]>([]);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
```

- [ ] **Step 5b.2: Update the initial fetch `useEffect` to fetch in parallel**

Find the `useEffect` that calls `apiService.getApprovedPosts()` (around line 106). Replace the entire useEffect with:

```ts
useEffect(() => {
  const fetchData = async () => {
    setPosts([]);
    setMappableResources([]);
    setLoading(false);

    setRefreshing(true);
    try {
      const [realPosts, realResources] = await Promise.all([
        apiService.getApprovedPosts(),
        apiService.getApprovedResources(),
      ]);
      setPosts(realPosts);
      setMappableResources(realResources.filter((r) => !!r.lat && !!r.lng));
    } catch (error) {
      console.error('Fetch failed:', error);
    } finally {
      setRefreshing(false);
    }
  };
  fetchData();
}, []);
```

- [ ] **Step 5b.3: Update `handleRefresh` to fetch in parallel**

Find `handleRefresh` (around line 146). Replace with:

```ts
const handleRefresh = async () => {
  setRefreshing(true);
  try {
    const [freshPosts, freshResources] = await Promise.all([
      apiService.getApprovedPosts(true),
      apiService.getApprovedResources(true),
    ]);
    setPosts(freshPosts);
    setMappableResources(freshResources.filter((r) => !!r.lat && !!r.lng));
  } catch (error) {
    console.error('Refresh failed:', error);
  } finally {
    setRefreshing(false);
  }
};
```

### 5c — Delete `getPostPreview`, add `getItemPreview`

- [ ] **Step 5c.1: Delete `getPostPreview` function**

Find and delete the entire `getPostPreview` function (lines 61–85 approximately). It starts with:

```ts
const getPostPreview = (post: Post) => {
```

and ends with its closing `};`.

- [ ] **Step 5c.2: Add `getItemPreview` in its place**

In the same location (above the `MapView` component function), add:

```ts
const getItemPreview = (item: MapItem) => {
  if (item.kind === 'resource') {
    return {
      type: item.data.type,
      title: item.data.title,
      body: item.data.description || 'Community resource',
    };
  }
  // Post: show alias as title, message as body
  return {
    type: 'Story',
    title: item.data.alias || 'Anonymous',
    body: item.data.message,
  };
};
```

### 5d — Replace `groupedPosts` with `groupedItems`

- [ ] **Step 5d.1: Replace `groupedPosts` useMemo**

Find the `const groupedPosts = useMemo<CityGroup[]>(() => {` block (around line 158). Replace the **entire** useMemo with:

```ts
const groupedItems = useMemo<CityGroup[]>(() => {
  const groups = new globalThis.Map<string, CityGroup>();

  // Wrap posts as MapItems and group by city
  posts.forEach((post) => {
    const key = `${post.city}||${post.country}`;
    const existing = groups.get(key);
    const mapItem: MapItem = { kind: 'post', data: post };
    if (!existing) {
      const coords = getCityCoordinates(post.city, post.lat, post.lng);
      groups.set(key, {
        id: key,
        city: post.city,
        country: post.country,
        lat: coords.lat,
        lng: coords.lng,
        count: 1,
        items: [mapItem],
        topTags: [],
      });
    } else {
      existing.count += 1;
      existing.items.push(mapItem);
    }
  });

  // Wrap mappable resources as MapItems and merge into groups
  mappableResources.forEach((resource) => {
    const city = resource.city || 'Unknown';
    const country = resource.country || 'Unknown';
    const key = `${city}||${country}`;
    const existing = groups.get(key);
    const mapItem: MapItem = { kind: 'resource', data: resource };
    if (!existing) {
      groups.set(key, {
        id: key,
        city,
        country,
        lat: resource.lat!,
        lng: resource.lng!,
        count: 1,
        items: [mapItem],
        topTags: [],
      });
    } else {
      existing.count += 1;
      existing.items.push(mapItem);
    }
  });

  // Compute topTags from post items only (resources have no what_helped tags)
  groups.forEach((group) => {
    const tagCounts = new globalThis.Map<string, number>();
    group.items.forEach((item) => {
      if (item.kind === 'post') {
        const tags = Array.isArray(item.data.what_helped) ? item.data.what_helped : [];
        tags.forEach((tag) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      }
    });
    group.topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);
  });

  return Array.from(groups.values());
}, [posts, mappableResources]);
```

### 5e — Update `filteredGroups` useMemo

- [ ] **Step 5e.1: Replace `filteredGroups` useMemo**

Find `const filteredGroups = useMemo(() => {` (around line 198). Replace the **entire** useMemo with:

```ts
const filteredGroups = useMemo(() => {
  let result = groupedItems
    .map((group) => {
      let filteredItems = group.items;
      if (filterMode === 'stories') {
        filteredItems = group.items.filter((i) => i.kind === 'post');
      } else if (filterMode === 'resources') {
        filteredItems = group.items.filter((i) => i.kind === 'resource');
      }
      return { ...group, items: filteredItems, count: filteredItems.length };
    })
    .filter((group) => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        group.city.toLowerCase().includes(normalizedSearch) ||
        group.country.toLowerCase().includes(normalizedSearch) ||
        group.items.some((item) => {
          if (item.kind === 'post') {
            return (
              (item.data.alias && item.data.alias.toLowerCase().includes(normalizedSearch)) ||
              (Array.isArray(item.data.what_helped) &&
                item.data.what_helped.some((tag) => tag.toLowerCase().includes(normalizedSearch)))
            );
          }
          // resource: search title
          return item.data.title.toLowerCase().includes(normalizedSearch);
        });
      return matchesSearch && group.count > 0;
    });

  if (userLocation) {
    result = [...result].sort((a, b) => {
      const distA = calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
      const distB = calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
      return distA - distB;
    });
  } else {
    result = [...result].sort((a, b) => b.count - a.count);
  }

  return result;
}, [groupedItems, searchTerm, userLocation, filterMode]);
```

### 5f — Update selected item state and derived values

- [ ] **Step 5f.1: Rename `selectedPostId` to `selectedItemId`**

Find:
```ts
const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
```

Replace with:
```ts
const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
```

- [ ] **Step 5f.2: Update `selectGroup` function**

Find:
```ts
const selectGroup = (groupId: string) => {
  setSelectedGroupId(groupId);
  setSelectedPostId(null);
  setIsDesktopPreviewVisible(false);
};
```

Replace with:
```ts
const selectGroup = (groupId: string) => {
  setSelectedGroupId(groupId);
  setSelectedItemId(null);
  setIsDesktopPreviewVisible(false);
};
```

- [ ] **Step 5f.3: Update `visiblePostCount` → `visibleItemCount` and derived constants**

Find:
```ts
const hasActiveSearch = searchTerm.trim().length > 0;
const visiblePostCount = filteredGroups.reduce((sum, group) => sum + group.count, 0);
```

Replace with:
```ts
const hasActiveSearch = searchTerm.trim().length > 0;
const visibleItemCount = filteredGroups.reduce((sum, group) => sum + group.count, 0);
```

Find the `emptyStateDescription` that references `'No resource posts match this view yet.'`:
```ts
: filterMode === 'resources'
  ? 'No resource posts match this view yet.'
```

Replace with:
```ts
: filterMode === 'resources'
  ? 'No resources with a location have been approved yet.'
```

- [ ] **Step 5f.4: Update `selectedGroup` useMemo**

Find:
```ts
const selectedGroup = useMemo(() => {
  if (!selectedGroupId) return null;
  return filteredGroups.find(group => group.id === selectedGroupId) || null;
}, [filteredGroups, selectedGroupId]);
```

This is unchanged — keep it.

- [ ] **Step 5f.5: Update the `useEffect` that watches `selectedGroup` and `selectedPostId`**

Find the useEffect that references `selectedPostId` (around line 259):

```ts
useEffect(() => {
  if (!selectedGroup) {
    setSelectedPostId(null);
    setIsDesktopPreviewVisible(false);
    return;
  }

  const hasSelectedPost = selectedGroup.posts.some((post) => post.id === selectedPostId);
  if (!hasSelectedPost) {
    setSelectedPostId(null);
    setIsDesktopPreviewVisible(false);
  }
}, [selectedGroup, selectedPostId]);
```

Replace with:

```ts
useEffect(() => {
  if (!selectedGroup) {
    setSelectedItemId(null);
    setIsDesktopPreviewVisible(false);
    return;
  }

  const hasSelectedItem = selectedGroup.items.some((i) => i.data.id === selectedItemId);
  if (!hasSelectedItem) {
    setSelectedItemId(null);
    setIsDesktopPreviewVisible(false);
  }
}, [selectedGroup, selectedItemId]);
```

- [ ] **Step 5f.6: Update `selectedPost` → `selectedItem` useMemo**

Find:
```ts
const selectedPost = useMemo(() => {
  if (!selectedGroup || !selectedPostId) return null;
  return selectedGroup.posts.find((post) => post.id === selectedPostId) || null;
}, [selectedGroup, selectedPostId]);
```

Replace with:
```ts
const selectedItem = useMemo((): MapItem | null => {
  if (!selectedGroup || !selectedItemId) return null;
  return selectedGroup.items.find((i) => i.data.id === selectedItemId) || null;
}, [selectedGroup, selectedItemId]);
```

- [ ] **Step 5f.7: Update `selectedPostIndex` → `selectedItemIndex`**

Find:
```ts
const selectedPostIndex = selectedGroup && selectedPost
  ? selectedGroup.posts.findIndex((post) => post.id === selectedPost.id)
  : -1;
```

Replace with:
```ts
const selectedItemIndex = selectedGroup && selectedItem
  ? selectedGroup.items.findIndex((i) => i.data.id === selectedItem.data.id)
  : -1;
```

- [ ] **Step 5f.8: Update `selectAdjacentPost` → `selectAdjacentItem`**

Find:
```ts
const selectAdjacentPost = (direction: 1 | -1) => {
  if (!selectedGroup || selectedPostIndex < 0) return;
  const nextIndex = (selectedPostIndex + direction + selectedGroup.posts.length) % selectedGroup.posts.length;
  setSelectedPostId(selectedGroup.posts[nextIndex]?.id || null);
  setIsDesktopPreviewVisible(true);
};
```

Replace with:
```ts
const selectAdjacentItem = (direction: 1 | -1) => {
  if (!selectedGroup || selectedItemIndex < 0) return;
  const nextIndex =
    (selectedItemIndex + direction + selectedGroup.items.length) % selectedGroup.items.length;
  setSelectedItemId(selectedGroup.items[nextIndex]?.data.id || null);
  setIsDesktopPreviewVisible(true);
};
```

- [ ] **Step 5f.9: Update `mapFocus`**

Find:
```ts
const mapFocus = selectedGroup
  ? { lat: selectedGroup.lat, lng: selectedGroup.lng }
  : userLocation || undefined;
```

This is unchanged — keep it.

### 5g — Update JSX: stat chips, sidebar lists, desktop preview panel

- [ ] **Step 5g.1: Update sidebar stat chip to use `groupedItems` and total count**

Find (inside the desktop aside, in the header area):
```tsx
<span>{groupedPosts.length} Cities</span>
<span className="text-[#1e3a34]/20">•</span>
<span>{posts.length} Stories & Resources</span>
```

Replace with:
```tsx
<span>{groupedItems.length} Cities</span>
<span className="text-[#1e3a34]/20">•</span>
<span>{posts.length + mappableResources.length} Stories & Resources</span>
```

- [ ] **Step 5g.2: Update the filter result count label**

Find:
```tsx
<span>{visiblePostCount} posts in {filteredGroups.length} cities</span>
```

Replace with:
```tsx
<span>{visibleItemCount} items in {filteredGroups.length} cities</span>
```

- [ ] **Step 5g.3: Update the desktop sidebar city list to use `items`**

Find the desktop list of city groups — the section where each group's posts are rendered in the right panel (`selectedGroup.posts.map`). This is in the RIGHT PANEL section (around line 554):

```tsx
{selectedGroup.posts.map((post, idx) => (
  <motion.div ... key={`${post.id}`}>
    <PostCard
      post={post}
      selected={selectedPostId === post.id}
      onClick={() => {
        setSelectedPostId(post.id);
        setIsDesktopPreviewVisible(true);
      }}
    />
  </motion.div>
))}
```

Replace with:

```tsx
{selectedGroup.items.map((item, idx) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.3, delay: idx * 0.05 }}
    key={item.data.id}
  >
    {item.kind === 'post' ? (
      <PostCard
        post={item.data}
        selected={selectedItemId === item.data.id}
        onClick={() => {
          setSelectedItemId(item.data.id);
          setIsDesktopPreviewVisible(true);
        }}
      />
    ) : (
      <ResourceMapCard
        resource={item.data}
        selected={selectedItemId === item.data.id}
        onClick={() => {
          setSelectedItemId(item.data.id);
          setIsDesktopPreviewVisible(true);
        }}
      />
    )}
  </motion.div>
))}
```

Add `ResourceMapCard` to the import at the top of `MapView.tsx`:
```ts
import ResourceMapCard from '../components/ResourceMapCard.tsx';
```

- [ ] **Step 5g.4: Update the item count badge in the right panel header**

Find (inside the right panel header, around line 551):
```tsx
<span className="rounded-full bg-[#e8f3f1] px-2.5 py-1 text-[10px] font-black text-[#448a7d]">{selectedGroup.posts.length}</span>
```

Replace with:
```tsx
<span className="rounded-full bg-[#e8f3f1] px-2.5 py-1 text-[10px] font-black text-[#448a7d]">{selectedGroup.items.length}</span>
```

- [ ] **Step 5g.5: Update the desktop preview panel (`AnimatePresence` block after `<SupportMap>`)**

Find the `AnimatePresence` block containing the desktop preview float panel. It starts with:
```tsx
<AnimatePresence>
  {selectedGroup && selectedPost && isDesktopPreviewVisible && (
    <motion.div
      key={selectedPost.id}
```

And contains references to `selectedPost`, `getPostPreview`, `selectAdjacentPost`, `selectedPostIndex`, `isResource = selectedPost.message.startsWith('[RESOURCE')`, and `selectedPost.what_helped`.

Replace the **entire** AnimatePresence block (from `<AnimatePresence>` to its closing `</AnimatePresence>`) with:

```tsx
<AnimatePresence>
  {selectedGroup && selectedItem && isDesktopPreviewVisible && (
    <motion.div
      key={selectedItem.data.id}
      className="pointer-events-none absolute right-5 top-5 z-[1500] hidden md:flex justify-end"
      initial={{ opacity: 0, y: -18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 360, damping: 32 }}
    >
      {(() => {
        const preview = getItemPreview(selectedItem);
        const isResource = selectedItem.kind === 'resource';
        const tags =
          selectedItem.kind === 'post'
            ? (selectedItem.data.what_helped || []).slice(0, 3)
            : [];

        return (
          <div className="pointer-events-auto w-[min(38rem,calc(100vw-2.5rem))] overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/92 shadow-[0_24px_70px_-34px_rgba(30,58,52,0.62)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#1e3a34]/8 px-5 py-4">
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                    isResource ? 'bg-[#e57c6e]/12 text-[#a85240]' : 'bg-[#e8f3f1] text-[#448a7d]'
                  }`}
                >
                  {isResource ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.8 10.2a4 4 0 0 0-5.6 0l-4 4a4 4 0 0 0 5.6 5.6l1.1-1.1" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.2 13.8a4 4 0 0 0 5.6 0l4-4a4 4 0 0 0-5.6-5.6l-1.1 1.1" />
                    </svg>
                  ) : (
                    ICONS.Users
                  )}
                </div>
                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#448a7d]/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.16em] text-[#448a7d]">
                      {selectedGroup.city}
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-[0.16em] text-[#1e3a34]/38">
                      {selectedItemIndex + 1} of {selectedGroup.items.length}
                    </span>
                  </div>
                  <h3 className="text-base font-black leading-snug tracking-tight text-[#1e3a34]">
                    {preview.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm font-medium leading-relaxed text-[#1e3a34]/68">
                    {preview.body}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => selectAdjacentItem(-1)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f1e8] text-[#1e3a34] transition-colors hover:bg-[#e8f3f1]"
                  aria-label="Previous item"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  onClick={() => selectAdjacentItem(1)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1e3a34] text-white transition-colors hover:bg-[#2d5a52]"
                  aria-label="Next item"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsDesktopPreviewVisible(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1e3a34] text-white ring-1 ring-[#1e3a34]/10 transition-colors hover:bg-[#2d5a52]"
                  aria-label="Hide preview"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="flex min-w-0 flex-wrap gap-1.5">
                {tags.map((tag, idx) => (
                  <span
                    key={`${tag}-${idx}`}
                    className="rounded-full border border-[#448a7d]/10 bg-[#f9fbfa] px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-[#448a7d]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <span className="shrink-0 text-[8px] font-black uppercase tracking-[0.16em] text-[#1e3a34]/52">
                {new Date(selectedItem.data.timestamp).toLocaleDateString()}
              </span>
            </div>
          </div>
        );
      })()}
    </motion.div>
  )}
</AnimatePresence>
```

- [ ] **Step 5g.6: Update the mobile city overlay to use `items`**

Find the mobile full-page city overlay (around line 797). It contains:
```tsx
{selectedGroup.posts.map((post, idx) => (
  <motion.div ... key={`${post.id}`}>
    <PostCard post={post} />
  </motion.div>
))}
```

Replace with:
```tsx
{selectedGroup.items.map((item, idx) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.3, delay: idx * 0.05 }}
    key={item.data.id}
  >
    {item.kind === 'post' ? (
      <PostCard post={item.data} />
    ) : (
      <ResourceMapCard resource={item.data} />
    )}
  </motion.div>
))}
```

- [ ] **Step 5g.7: Update mobile drawer total count**

Find in the mobile Drawer header:
```tsx
<span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{posts.length} Total</span>
```

Replace with:
```tsx
<span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
  {posts.length + mappableResources.length} Total
</span>
```

### 5h — Final compile check and commit

- [ ] **Step 5h.1: Compile check**

```bash
cd /home/mrotiz14/github-projects/Starlings && npx tsc --noEmit
```

Expected: Zero errors. If TypeScript reports errors for `selectedPost`, `selectedPostId`, `selectedPostIndex`, `selectAdjacentPost`, `groupedPosts`, `visiblePostCount` — search for any remaining references to these old names and update them to their new equivalents (`selectedItem`, `selectedItemId`, `selectedItemIndex`, `selectAdjacentItem`, `groupedItems`, `visibleItemCount`).

- [ ] **Step 5h.2: Run all tests**

```bash
cd /home/mrotiz14/github-projects/Starlings && npm test
```

Expected: All tests pass.

- [ ] **Step 5h.3: Commit**

```bash
git add views/MapView.tsx
git commit -m "feat(MapView): unified MapItem grouping; parallel resource+post fetch; remove [RESOURCE] prefix hack"
```

---

## Task 6: Manual sheet update (documented step — no code)

- [ ] **Step 6.1: Add location columns to Google Sheets**

In the Google Sheets spreadsheet (ID: `18Vzy15shBjz0u3ei0n_eLSmMONplb66rC5XvDLyExXM`):

1. Open `Pending_Resources` tab → add four columns at the end of row 1: `city`, `country`, `lat`, `lng`
2. Open `Live_Resources` tab → add the same four columns: `city`, `country`, `lat`, `lng`

The GAS backend reads headers dynamically — no script changes needed. New submissions that include coordinates will now have them stored. Existing rows will have empty cells for these columns (safe: `normalizeResource` handles empty strings as `undefined`).

- [ ] **Step 6.2: Commit the note to staff guide**

Open `docs/staff-guide.md`. Add to the Resources section (or create one):

> **Location-tagged resources (added 2026-05-16):** Resources submitted with a city now appear on the Support Map as well as the Resources page. No database duplication — one row in `Live_Resources` covers both. Resources without coordinates appear only on the Resources page. The `Pending_Resources` and `Live_Resources` sheets now have `city`, `country`, `lat`, `lng` columns.

```bash
git add docs/staff-guide.md
git commit -m "docs: note location-tagged resources and sheet column additions in staff guide"
```

---

## Task 7: Dev smoke test

- [ ] **Step 7.1: Start the dev server**

```bash
cd /home/mrotiz14/github-projects/Starlings && npm run dev
```

- [ ] **Step 7.2: Verify Resources page**

Open `http://localhost:5173/#/resources`. Confirm existing resources still display correctly. No layout changes expected.

- [ ] **Step 7.3: Verify Map page — posts still appear**

Open `http://localhost:5173/#/map`. Confirm existing story posts still appear in city groups. Filter tabs (All / Stories / Resources) work. "Resources" tab shows empty (no resources have coordinates yet — expected).

- [ ] **Step 7.4: Verify Add Resource form**

Open `http://localhost:5173/#/add-resource`. Confirm the "Where is this resource based?" field appears with the city-picker dropdown. Selecting a city and submitting should not break form validation.

- [ ] **Step 7.5: TypeScript compile final check**

```bash
cd /home/mrotiz14/github-projects/Starlings && npx tsc --noEmit && npm test
```

Expected: Zero TS errors, all tests pass.

- [ ] **Step 7.6: Build check**

```bash
cd /home/mrotiz14/github-projects/Starlings && npm run build 2>&1 | tail -20
```

Expected: Build completes with no errors.
