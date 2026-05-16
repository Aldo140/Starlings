# Design Spec: Resource–Map Unification

**Date:** 2026-05-16  
**Status:** Approved  
**Approach:** Option A — Unified `MapItem` discriminated union

---

## Problem

The map currently shows two conceptually different things through the same broken abstraction:

1. **Real Posts** (stories submitted via ShareView) — stored in `Live_Stories`, fetched by `getApprovedPosts()`.
2. **Fake "resource posts"** — resources submitted via `AddResourceView` that were also submitted as Posts with a `[RESOURCE - Type]\nTitle | Link: url` prefix injected into the message field, then stored in `Live_Stories`. The map detected these by string-matching `post.message.startsWith('[RESOURCE')`.

This meant a resource submission required two database rows to appear in both places: one in `Live_Resources` (for the Resources page) and one in `Live_Stories` (for the map). That is the duplication the user wants eliminated.

Additionally, `Resource` had no coordinate fields — only a vague `location?: string`. `submitResource` hardcoded `city: 'Unknown'` and sent no lat/lng.

---

## Goal

- One resource submission → one database row → appears in Resources page **and** on the map (if coordinates are provided).
- Remove the `[RESOURCE]` prefix string hack entirely from the codebase.
- `Resource` gains optional `city`, `country`, `lat`, `lng` fields.
- The map merges approved resources-with-coordinates into the same city clusters as posts.
- Filter tabs (All / Stories / Resources) work correctly for both item kinds.

---

## Architecture Decision

Use a **discriminated union** `MapItem` on the frontend. `CityGroup.items: MapItem[]` replaces `CityGroup.posts: Post[]`. All map-side filtering and rendering operates on `MapItem`. No server-side changes are needed beyond adding columns to the Google Sheet.

---

## Section 1 — Data Model (`types.ts`)

### Changes to `Resource` interface

Add four optional fields:

```ts
city?: string;
country?: string;
lat?: number;
lng?: number;
```

The existing `location?: string` field is kept (used as a free-text display string for partner resources, e.g. "Calgary, AB"). The new structured fields are separate and used for map placement.

### New `MapItem` discriminated union

```ts
export type MapItem =
  | { kind: 'post'; data: Post }
  | { kind: 'resource'; data: Resource };
```

Add this to `types.ts` alongside the existing interfaces.

### `CityGroup` interface (in `MapView.tsx` — local type, not in `types.ts`)

```ts
interface CityGroup {
  id: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  count: number;
  items: MapItem[];      // replaces: posts: Post[]
  topTags: string[];
}
```

---

## Section 2 — API Layer (`services/api.ts`)

### `normalizeResource` — add coordinate passthrough

```ts
const normalizeResource = (resource: any): Resource => {
  // ... existing fields ...
  lat: resource.lat ? Number(resource.lat) : undefined,
  lng: resource.lng ? Number(resource.lng) : undefined,
  city: resource.city && resource.city !== 'Unknown' ? String(resource.city) : undefined,
  country: resource.country || undefined,
};
```

Guard against `'Unknown'` strings (the old hardcoded value) — treat them as absent.

### `submitResource` — forward location fields

Replace `city: 'Unknown'` with:

```ts
city: resourceData.city || '',
country: resourceData.country || '',
lat: resourceData.lat ?? '',
lng: resourceData.lng ?? '',
```

Empty strings are acceptable for the GAS backend (stored as-is; `normalizeResource` coerces them back to `undefined` on read).

### No new API methods needed

`getApprovedResources()` already exists and returns the full `Resource[]`. The map will call it in parallel with `getApprovedPosts()`.

---

## Section 3 — Resource Form (`views/AddResourceView.tsx`)

### New optional Location block

Add a location section to the form using the exact same city-picker pattern as `ShareView.tsx`:

- `apiService.searchLocation(query)` for instant Canadian hub suggestions
- `apiService.deepSearchLocation(query)` for Nominatim fallback after 600ms debounce
- A dropdown of results; selecting one stores `selectedLocation: LocationSearchResult | null` in form state

**Placement:** Below the "Resource Type" field, above the description textarea. Visible in both `recommend` and `apply` modes.

**Copy:** Label reads *"Where is this resource based? (Optional)"* with hint text: *"Only needed if this is a local resource like a support group or clinic. Leave blank for global resources."*

**Validation:** Location is never required. `isFormValid()` is unchanged.

**On submit:** If `selectedLocation` is set, pass to `apiService.submitResource`:

```ts
city: selectedLocation.address.city || selectedLocation.address.town || selectedLocation.address.village || '',
country: selectedLocation.address.country || '',
lat: parseFloat(selectedLocation.lat),
lng: parseFloat(selectedLocation.lon),
```

**New form state fields:**

```ts
citySearch: '',
selectedLocation: null as LocationSearchResult | null,
```

---

## Section 4 — Map View (`views/MapView.tsx`)

### Data fetching

Replace the single `getApprovedPosts()` call with parallel fetches:

```ts
const [realPosts, realResources] = await Promise.all([
  apiService.getApprovedPosts(),
  apiService.getApprovedResources(),
]);
```

Filter resources to only those with valid coordinates:

```ts
const mappableResources = realResources.filter(r => r.lat && r.lng);
```

Store both in separate state slices: `posts: Post[]` and `mappableResources: Resource[]`.

### Grouping — `groupedItems` (replaces `groupedPosts`)

Build `CityGroup[]` from both sources:

1. Iterate posts → wrap each as `{ kind: 'post', data: post }`, key groups by `post.city||post.country`.
2. Iterate mappable resources → wrap each as `{ kind: 'resource', data: resource }`, key groups by `resource.city||resource.country`.
3. Resources without `lat`/`lng` are excluded (filtered before grouping).
4. `topTags` computation: for `kind === 'post'` items use `data.what_helped`; for `kind === 'resource'` items there are no tags — skip.

### Filter tabs

```ts
if (filterMode === 'stories') {
  filteredItems = group.items.filter(i => i.kind === 'post');
} else if (filterMode === 'resources') {
  filteredItems = group.items.filter(i => i.kind === 'resource');
}
```

### `getItemPreview` (replaces `getPostPreview`)

```ts
const getItemPreview = (item: MapItem) => {
  if (item.kind === 'resource') {
    return {
      type: item.data.type,
      title: item.data.title,
      body: item.data.description || 'Community resource',
    };
  }
  // Post path — same logic as current getPostPreview, minus the [RESOURCE] branch
  return {
    type: 'Story',
    title: item.data.alias || 'Anonymous',
    body: item.data.message,
  };
};
```

### `PostCard` — untouched

Where the sidebar currently renders `<PostCard post={post} />`, split on item kind:

- `kind === 'post'` → `<PostCard post={item.data} />`
- `kind === 'resource'` → inline `<ResourceMapCard resource={item.data} />` (new small component defined in `MapView.tsx` or extracted to `components/`)

### `ResourceMapCard` (new, small)

Renders: resource type badge, title, optional description snippet, "Open Resource →" link. Styled to match PostCard visually (same `rounded-[1.75rem]`, same shadow, same teal accent) but simpler — no `what_helped` tags, no alias.

### Deletions

Remove entirely:
- `getPostPreview` function (and its `[RESOURCE]` regex branches)
- `filterMode === 'resources'` branch that string-matched `post.message.startsWith('[RESOURCE')`
- The `isResource` variable computed from `post.message.startsWith('[RESOURCE')`

The stat label "Stories & Resources" in the sidebar header can stay as-is (it already says both).

---

## Section 5 — Backend Sheet (manual step, no code change)

The GAS backend reads column headers dynamically — adding columns to the sheet is sufficient. No `gas-backend.js` changes required.

**Action required (manual, one-time):**

In Google Sheets → `Pending_Resources` tab, add four columns after the existing columns:
- `city`
- `country`
- `lat`
- `lng`

Copy the same four columns to `Live_Resources`.

After this, any approved resource submitted with a location will have coordinates stored and returned via `getApprovedResources()`.

**Note for staff guide:** Update `docs/staff-guide.md` to mention that resources can now be location-tagged. Resources without coordinates appear only on the Resources page; those with coordinates also appear on the Support Map.

---

## What Gets Deleted (the hack, line by line)

| File | What's removed |
|------|---------------|
| `MapView.tsx` | `getPostPreview` function |
| `MapView.tsx` | `const isResource = post.message.startsWith('[RESOURCE')` |
| `MapView.tsx` | `post.message.startsWith('[RESOURCE')` filter branches |
| `MapView.tsx` | `typeMatch`, `resourceTitle`, `resourceType` regex parsing |
| `MapView.tsx` | The entire `[RESOURCE]` arm of the desktop preview panel |

---

## Data Flow (after)

```
User submits resource via AddResourceView (with optional city)
  ↓
apiService.submitResource → GAS Pending_Resources sheet (city, country, lat, lng stored)
  ↓
Staff approves → row moves to Live_Resources
  ↓
getApprovedResources() → normalizeResource → Resource[] (with lat/lng if present)
  ↓
ResourcesView: shows all approved resources (unchanged)
MapView: filters to mappable resources, wraps as MapItem { kind: 'resource' },
         merges into CityGroup alongside posts, renders via ResourceMapCard
```

---

## Out of Scope

- Different map pin colours/icons for resources vs. posts (user chose "same pins, mixed together")
- Mobile PostCard changes (PostCard is untouched)
- Moderation UI changes
- Removing the `[RESOURCE]` prefix from any *existing* Live_Stories rows (those are historical data; they will gradually age out or can be manually cleaned up)

---

## Risk & Mitigations

| Risk | Mitigation |
|------|-----------|
| Existing `[RESOURCE]` posts still in `Live_Stories` | They are now just Posts whose `message` happens to start with `[RESOURCE`. They render as story posts with that text visible. Low-frequency data, no crash risk. |
| Resource with `lat: 0, lng: 0` (default from old hardcoded submit) | `normalizeResource` converts `0` to `undefined` (falsy check `resource.lat ? Number(...) : undefined`). These resources won't appear on the map. |
| `getApprovedResources` adds network load to MapView | Parallel fetch — adds ~0ms to perceived load since posts and resources fetch simultaneously. Resources are already cached for 5 min. |
| PostCard type mismatch | PostCard is only called with `item.data` when `item.kind === 'post'`, so it always receives a `Post`. TypeScript enforces this. |
