# Starlings Support Map

**Live site:** https://aldo140.github.io/Starlings/

An anonymous support map for youth impacted by family substance use — share notes of hope, discover community resources, and ask questions without revealing your identity.

---

## Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | React 19 + Vite 7 + TypeScript |
| Styling | Tailwind CSS 3 (utility-first, no CSS Modules) |
| Animation | Framer Motion 12 |
| Routing | React Router 6 — **HashRouter** (required for GitHub Pages) |
| Mapping | Leaflet 1.9 via CDN |
| Icons | Lucide React |
| UI primitives | Vaul (bottom drawer) |
| Backend | Google Apps Script → Google Sheets |
| Geocoding | Local `CANADIAN_HUBS` index + Nominatim (OSM) fallback |
| Fonts | Cabinet Grotesk (Fontshare) · Inter (Google Fonts) |

---

## Project Structure

```
/
├── App.tsx                 — HashRouter, lazy-loaded routes, offline sync listener
├── index.tsx               — React root mount
├── index.html              — CSS variables, font CDN links, Leaflet CDN
├── index.css               — Tailwind directives
├── tailwind.config.js      — reveal animation, font-cabinet alias
├── vite.config.ts          — manualChunks (vendor-react, vendor-motion, vendor-ui)
├── constants.tsx           — COLORS, ICONS, EASE_OUT_EXPO, BANNED_PATTERNS, SEED_RESOURCES
├── types.ts                — Post, Resource, QAItem, ResourceType, PostStatus
│
├── components/
│   ├── Layout.tsx          — Nav, crisis banner, footer, page transition wrapper
│   ├── Map.tsx             — Leaflet map + custom markers
│   ├── PostCard.tsx        — Map pin popup / note card
│   ├── StarlingFlock.tsx   — Ambient SVG flock (non-map pages)
│   ├── LoadingBar.tsx      — YouTube-style thin progress bar
│   ├── QAThread.tsx        — QASkeleton + QAThreadCard (extracted from Landing)
│   ├── CardIllustration.tsx — Inline SVG illustrations for Care Loop cards
│   └── GalleryImage.tsx    — 3D-tilt gallery card with clip-path wipe entrance
│
├── views/
│   ├── Landing.tsx         — Full landing page (hero, Q&A, Care Loop, gallery, CTA)
│   ├── MapView.tsx         — Interactive map (sidebar + Leaflet pane)
│   ├── ShareView.tsx       — Note / resource submission form with city autocomplete
│   ├── ResourcesView.tsx   — Three-panel resources layout (partners, buckets, aligned)
│   ├── AddResourceView.tsx — Community resource suggestion form
│   └── Guidelines.tsx      — Community rules and safety policies
│
├── services/
│   └── api.ts              — Fetching, offline queue, geocoding, rate limiter
│
└── docs/
    ├── backend/
    │   ├── Code.gs.js               — mirrors the live "Code.gs" (doGet/doPost API surface)
    │   └── ApprovalWorkflow.gs.js   — mirrors the live "ApprovalWorkflow.gs" (checkbox-driven
    │                                  approve → move-to-Live automation; deliberately partial,
    │                                  see the file's header comment before trusting it)
    └── staff-guide.md      — Staff guide: spreadsheet workflow, moderation, flagged words
```

---

## Key Architectural Decisions

### 1. HashRouter (Never Change This)
GitHub Pages serves static files with no server-side routing. `HashRouter` uses `/#/path` URLs that work without a server rewrite rule. All `<Link>` components and programmatic navigation must use hash-relative paths.

### 2. Code Splitting
`vite.config.ts` defines three manual chunks so the initial page load doesn't pull in all dependencies:

| Chunk | Contents | Gzip |
|-------|----------|------|
| `vendor-react` | react, react-dom, react-router-dom | ~12 kB |
| `vendor-motion` | framer-motion | ~45 kB |
| `vendor-ui` | lucide-react, vaul | ~21 kB |

Non-landing routes are `React.lazy`-loaded in `App.tsx` so framer-motion and Leaflet are deferred until the user navigates to them.

### 3. Hybrid Geocoding
`services/api.ts` uses a two-tier geocoding system:
- **Stage 1 (instant):** `CANADIAN_HUBS` — top 40+ Canadian cities, zero-latency
- **Stage 2 (deep search):** Nominatim (OSM) debounced at ≥500 ms, filtered to `countrycodes=ca`

### 4. Google Apps Script Backend
The backend is **two** Apps Script files deployed together as one Web App: `Code.gs` (routes `doGet`/`doPost` requests to Google Sheets tabs) and `ApprovalWorkflow.gs` (moderation menu + approval automation). Mirrors live in `docs/backend/Code.gs.js` and `docs/backend/ApprovalWorkflow.gs.js` — read the header comments in those files before trusting them, they're not guaranteed 100% complete copies of the live script. All reads are from `Live_*` tabs; all writes go to `Pending_*` tabs awaiting moderator approval.

An installable `approvalOnEdit` trigger (in `ApprovalWorkflow.gs`) auto-promotes rows: ticking the "Approve" checkbox on a `Pending_*` tab (or setting the `status` column to `"APPROVED"` directly) moves the row to the matching `Live_*` tab. `Code.gs` must NOT also define its own `onEdit` — that caused duplicate rows in `Live_Resources` (fixed 2026-07-14) because both handlers fired on the same edit.

### 5. Offline Queue
If submission fails (no network), `apiService` serialises the payload to `localStorage` under `offlineQueue`. On app mount and on the `online` browser event, `syncOfflinePosts()` drains the queue.

### 6. Rate Limiting
`checkRateLimit()` in `api.ts` caps submissions at **5 per 10-second window** to prevent abuse without requiring authentication.

---

## Moderation Workflow

### Google Sheets Tabs

| Tab | Purpose |
|-----|---------|
| `Pending_Stories` | Incoming map notes awaiting review |
| `Live_Stories` | Approved notes shown on the map |
| `Pending_Resources` | Incoming resource recommendations |
| `Live_Resources` | Approved resources shown in Resources view |
| `Pending_QA` | Incoming questions (answer column is blank) |
| `Live_QA` | Approved Q&A pairs (both question + answer filled) |
| `Pending_Reflections` | Short user reflections on resources |
| `Live_Reflections` | Approved reflections |
| `Flagged_Words` | ⚠️ Exists in the sheet but **not yet wired to the frontend** — see below |

### Approval Flow

1. Submission arrives in the matching `Pending_*` tab
2. Moderator reviews row, edits content if needed
3. Moderator changes the `status` column (column C) to `APPROVED`
4. The Apps Script `onEdit` trigger fires and moves the row to the `Live_*` tab
5. Frontend fetches from `Live_*` tabs (5-minute localStorage cache)

### Flagged Words — Two-Layer System

Every submission is checked against two layers:

**Layer 1 — Static regex (`BANNED_PATTERNS` in `constants.tsx`):** Always-on. Catches URLs, emails, phone numbers, and hardcoded crisis keywords regardless of network state.

**Layer 2 — Dynamic sheet list (`Flagged_Words` tab):** On app boot, `apiService.getFlaggedWords()` fetches the sheet and stores the word list in memory + localStorage (30-minute cache). Every checked submission then does a case-insensitive substring scan against the live list. If the sheet is unreachable, Layer 1 handles it alone — nothing breaks.

To update the word list, edit the `Term` column of the `Flagged_Words` sheet. The tab has headers, so terms start on row 2. Users pick up changes within 30 minutes when their cache expires. No code deploy required.

---

## Safety Features

- **Crisis banner**: Fixed at the top of every page (`z-50`). Never remove or cover it.
- **Safety modal** (`z-[9000]`): In `Landing.tsx`, the Q&A form intercepts submissions that match crisis keywords and shows a resources modal before allowing submission.
- **Server-side backstop**: `Code.gs`'s `doPost` has its own hardcoded crisis keyword check that marks submitted rows as `flagged` even if frontend checks are bypassed.
- **ShareView consent gates**: Users must tick three safety checkboxes (age, anonymity, moderation) before the submit button activates.

---

## Design System

All design tokens live in two places — use these, not arbitrary Tailwind palette names:

- **`constants.tsx`** — `COLORS`, `ICONS`, `EASE_OUT_EXPO`, `EASE_OUT_EXPO_CSS`
- **`index.html` `<style>`** — CSS custom properties (`--brand-teal-900`, etc.)

Primary easing: `EASE_OUT_EXPO = [0.16, 1, 0.3, 1]` (Expo Out) — used on all entrance reveals.

Fonts: `font-cabinet` (Cabinet Grotesk) for display headings; Inter for all body, labels, UI.

---

## Local Development

```bash
npm install
npm run dev        # Vite dev server at http://localhost:5173
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
npm test           # Vitest unit tests
```

## Deployment (GitHub Pages)

```bash
npm run deploy     # Builds and pushes dist/ to gh-pages branch
```

The `GITHUB_PAGES_BASE` environment variable sets the Vite `base` path. If deploying to a project page (`username.github.io/repo-name/`), set it to `/repo-name/`. For a root custom domain, leave unset (defaults to `./`).

> **HashRouter note:** Every push to the `gh-pages` branch is live immediately. No server-side routing config is needed.

---

## Important Notes for Developers

- **Leaflet CSS/JS**: Loaded via CDN in `index.html`. If migrating away from CDN, ensure Leaflet icon assets are bundled correctly (the default icon path resolution breaks with Vite).
- **Geocoding rate limits**: Nominatim's usage policy requires a User-Agent header and requests throttled ≥1 per second. The debounce in `ShareView` must stay ≥500 ms.
- **Care Loop scroll mechanic**: The horizontal scrolling "Care Loop" section in `Landing.tsx` uses a scroll-pin + `useScroll`/`useTransform` pattern from Framer Motion. Do not change the `promiseRef`, `promiseViewportRef`, `promiseTrackRef` refs or their wiring without understanding this section fully.
- **Z-index hierarchy**: Crisis banner `z-50`, nav `z-[5000]`, map UI `z-[2000]`, safety modal `z-[9000]`. Respect this — especially when adding overlays.
