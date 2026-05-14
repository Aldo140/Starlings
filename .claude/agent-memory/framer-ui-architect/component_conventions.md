---
name: "Component Conventions"
description: "Naming, file structure, icon usage, animation patterns, and recurring UI patterns established across the Starlings codebase"
type: "project"
---

## File & Directory Structure

```
/components/
  Layout.tsx          — Shell: nav bar, crisis banner, footer, page transition wrapper
  Map.tsx             — Leaflet map component
  PostCard.tsx        — Map pin popup / note card
  StarlingFlock.tsx   — Ambient background flock animation (shown on all non-map pages)

/views/
  Landing.tsx         — Full landing page (hero, Q&A, Care Loop, gallery, final CTA)
  ResourcesView.tsx   — Three-panel resources layout (partners, community buckets, aligned)
  MapView.tsx         — Map page wrapper
  ShareView.tsx       — Note/resource submission form
  Guidelines.tsx      — Guidelines page
  AddResourceView.tsx — Add resource form
```

All views export a single default React FC. No index barrel files. Import paths use relative `../constants.tsx`, `../services/api.ts` etc.

## Icon Convention

Icons live in `constants.tsx` as the `ICONS` export — pre-sized JSX elements:
```tsx
export const ICONS = {
  Heart: <Heart className="w-5 h-5" />,
  // ...
}
```
Use `ICONS.Heart`, `ICONS.MapPin` etc. in components. **Never use emoji as icons** in the main UI chrome. Exception: the `✦` sparkle character is used as a decorative glyph in Q&A thread cards — this is intentional.

For icons NOT in the ICONS map (e.g., Book, Headphones, Music used in ResourcesView), import directly from `lucide-react` and size inline. When adding new icons to be reused, add to `ICONS` in `constants.tsx`.

## Animation Patterns

### Entrance Reveals (standard pattern)
```tsx
const ease = [0.16, 1, 0.3, 1] as const;

<motion.div
  initial={{ opacity: 0, y: 28 }}
  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
  transition={{ duration: 0.7, ease }}
/>
```
Pair with `useInView(ref, { once: true, margin: '-80px' })`. Use `once: true` for scroll reveals so they don't replay on scroll-up.

### Page Transition (in Layout.tsx)
```tsx
<motion.div
  key={location.pathname}
  initial={{ opacity: 0, scale: 0.993 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 1.004 }}
  transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
>
```
Do not change this — it applies globally to all pages.

### Card Hover Lift (standard pattern)
```tsx
whileHover={{ y: -5 to -9, transition: { type: 'spring', stiffness: 380, damping: 28 } }}
```
QAThreadCard uses y: -5. Care Loop cards use y: -9. Adjust magnitude to card size.

### 3D Card Tilt on Form
```tsx
style={{ perspective: '1200px' }}
<motion.div
  whileHover={{ rotateY: 1.5, rotateX: -1, scale: 1.01 }}
  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
  style={{ transformStyle: 'preserve-3d' }}
>
```
Used on the Q&A question form. Use perspective wrapper pattern.

### Ambient Loop Animations
```tsx
animate={{ y: [0, -8, 0], rotate: [-3, -1.2, -3] }}
transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
```
All ambient loops use `ease: 'easeInOut'` and `repeat: Infinity`. Durations 4–20s. Never use `linear` except for full 360 rotations (`animate={{ rotate: 360 }}`).

### Skeleton Loaders
Use `animate-pulse` Tailwind class on `bg-white/10` placeholder shapes. See `QASkeleton` in `Landing.tsx`.

## Tailwind Usage Patterns

### Color Usage
- Never use raw Tailwind color classes like `text-blue-500`, `bg-green-100` for primary brand surfaces
- Use inline hex or COLORS constants for brand colors: `text-[#1e3a34]`, `bg-[#448a7d]`, `text-[#e57c6e]`
- Exception: ResourcesView community bucket colors use Tailwind colors (`bg-amber-500`, `bg-purple-500`) intentionally for category variety

### Spacing
- Section vertical padding: `py-16 md:py-32` (tight mobile, generous desktop)
- Container: `max-w-7xl mx-auto px-4` or `px-6 max-[400px]:px-4`
- Card internal padding: `p-5 md:p-7` (small), `p-8 md:p-12` (form), `p-7 md:p-16` (hero)

### Typography Classes Seen Together
```
font-black text-[#1e3a34] tracking-tight   — headings
font-bold uppercase tracking-widest text-xs — labels, nav, badges
font-medium leading-relaxed                 — body copy
font-light leading-relaxed                  — hero sub-copy
text-[9px] font-black uppercase tracking-[0.28em] — eyebrow labels
```

## Component Borders
- Default card: `border-2 border-gray-100` (ResourceCard)
- Dark surface card: `border border-white/[0.09]` (QAThreadCard on dark bg)
- Warm card: `border border-[#c8b49a]/30` (Care Loop card)
- Active state: `border-2 border-indigo-100` (community partner active)
- Glass panel: `border border-white/40` or `border border-white/[0.14]`

## Selection Highlight
Applied globally in Layout.tsx: `selection:bg-[#448a7d] selection:text-white`
Also on textarea: `selection:bg-[#448a7d] selection:text-white`

## Scrollbar Utilities
- `.no-scrollbar` — hides scrollbar (defined in `index.html`)
- `style={{ scrollbarWidth: 'thin', scrollbarColor: '#e8f3f1 transparent' }}` — thin styled scrollbar in ResourcesView rail

## Z-Index Hierarchy
- Crisis banner: `z-50`
- Navigation header: `z-[5000]`
- Mobile menu: `z-50`
- Map overlay UI: `z-[2000]` (`ui-overlay` class in `index.html`)
- Safety modal: `z-[9000]`
- Resources expanded overlay: `z-[40]` background, `z-[45]` card

## Accessibility Conventions
- Safety modal uses `role="dialog" aria-modal="true" aria-labelledby`
- Accordion buttons use `aria-expanded` and `aria-controls`
- Decorative SVGs use `aria-hidden="true"`
- Hero images use `alt=""` (intentionally empty — decorative)

## Guidelines Page Patterns (added 2026-05-13)

### CSS-only hero backgrounds
When replacing Unsplash photos with on-brand visuals (no new packages), use this layered approach:
1. `bg-gradient-to-br` base in brand teal range
2. Dot matrix via `radial-gradient(circle, rgba(68,138,125,0.18) 1px, transparent 1px)` at `28px 28px`
3. Radial blob glows with `filter: blur(64px)` and low opacity (0.15–0.25)
4. SVG `<ellipse>` concentric rings at `opacity-[0.07]` for depth
5. Diagonal line SVGs at `opacity-[0.06]` for texture
6. Bottom fade with `bg-gradient-to-t from-white to-transparent`

### Smooth expand/collapse without animating height
Use the CSS `grid-rows` trick — it is GPU-friendly (no layout thrash):
```tsx
<div className="grid transition-all duration-300 overflow-hidden"
  style={{ gridTemplateRows: open ? '1fr' : '0fr', transitionTimingFunction: EASE_OUT_EXPO }}>
  <div className="min-h-0">
    {/* content */}
  </div>
</div>
```
This is the approved pattern for accordions in this project (replaces `max-height` hacks).

### Tone-keyed color config pattern
For components that vary color by severity/category, extract a `TONE_CONFIG` record keyed by tone string. Each entry provides `border`, `iconBg`, `iconText`, `badgeBg`, `badgeText`, `accentBar` values — all in brand-safe hex. Avoids scattered conditional classes.

### Eyebrow label component
```tsx
const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-[#448a7d]">
    {children}
  </span>
);
```
Used above section H2s. Consistent with the `text-[9px] font-black uppercase tracking-[0.28em]` pattern in the token doc.

### StatCounter variant (sidebar)
Pill background version: `px-2 py-3 rounded-2xl bg-[#f0f9f8]` wrapper with `text-2xl font-black text-[#448a7d]` value and `text-[10px] font-bold uppercase tracking-widest text-gray-500` label.

### CrisisIcon (replaces 🚨)
Inline SVG warning triangle with `rgba(255,255,255,...)` stroke — works on dark (`#1e3a34`) sidebar CTA backgrounds. See Guidelines.tsx `CrisisIcon` component.

### ICONS available in constants.tsx
Heart, MapPin, ShieldCheck, Users, MessageCircle, Info, AlertCircle (red-500), Menu, X, Plus, ArrowRight, Filter, Search, Navigation.
`AlertCircle` is pre-coloured red-500 — use it for error/warning contexts.
For icons NOT in ICONS (e.g., star, checklist, warning triangle), write local inline SVG components rather than importing from lucide directly.

### Q&A Section Inline SVG Patterns (refined 2026-05-13)

Inline SVGs are preferred over lucide imports for small one-off glyphs in this section.
- Question avatar `Q` initial: `<text dominantBaseline="central" textAnchor="middle" fontSize="7" fontWeight="900">` inside a `10x10` SVG — no external font needed.
- Shield lock icon: `14x16` SVG with `rect` body + `path` shackle + `circle` keyhole, all at `stroke="rgba(229,124,110,0.7)"`.
- Speech bubble corner decoration: `52x52` SVG with rounded-rect body + tail path + two horizontal lines — replaces the old flat gradient corner wash.
- Arrow connector between flow steps: `14x8` SVG chevron-arrow at `stroke="rgba(68,138,125,0.45)"`.

### Step-flow visualization pattern
Three-step numbered flows (e.g. 01 / 02 / 03) should use `React.Fragment` keyed by step number, alternating between a `flex-col` step block and a small SVG arrow divider:
```tsx
{steps.map((step, idx) => (
  <React.Fragment key={step.num}>
    <div className="flex flex-col items-center text-center flex-1"> ... </div>
    {idx < steps.length - 1 && <div className="flex items-center mt-[10px] mx-1 flex-shrink-0"><svg ...arrow/></div>}
  </React.Fragment>
))}
```
The number is `text-[11px] font-black text-[#448a7d] tabular-nums`. Label is `text-[11px] font-black text-white uppercase tracking-[0.18em]`. Descriptor is `text-[9px] font-medium text-white/35`.

### Anonymous pill badge
Footer trust indicators use a pill badge pattern instead of plain text:
```tsx
<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f0f7f5] border border-[#d4eae6]">
  <svg ...shield-lock/> <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#448a7d]/70">...</span>
</span>
```

### Textarea refined style (form card)
Premium feel: `bg-[#f8faf9] border border-[#e8f3f1]` with `focus:border-[#448a7d]/40 rounded-[1.5rem]` and box-shadow `inset 0 2px 8px rgba(30,58,52,0.04)`. Focus ring: `0 0 0 3px rgba(68,138,125,0.10)`.

**Why:** Knowing these patterns prevents inconsistency and avoids introducing styles or z-index values that conflict with existing layers.
**How to apply:** When adding a new component, follow the card border/shadow/padding conventions above. When adding new icons, update `constants.tsx` ICONS export. When writing animations, start from the `ease = [0.16, 1, 0.3, 1]` constant and spring configs documented here.
