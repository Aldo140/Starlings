---
name: "Design System Tokens"
description: "All color tokens, typography, spacing, border-radius, easing, and animation constants actually in use across the Starlings codebase"
type: "project"
---

All tokens are sourced directly from `constants.tsx` (COLORS export), `index.html` `:root` block, and `tailwind.config.js`. No separate token file exists — tokens live in these three places.

## Color Palette

Defined as CSS custom properties in `index.html` `<style>` and mirrored in `constants.tsx` `COLORS`:

```
--brand-teal-900: #1e3a34   → COLORS.teal900   — primary text, dark backgrounds, footer bg
--brand-teal-50:  #e8f3f1   → COLORS.mint      — surface tint, chip backgrounds, badge bg
--brand-teal-500: #448a7d   → COLORS.teal500   — active states, links, accents, progress bars
                  #2d5a52   → COLORS.teal700   — hover states for dark buttons
--coral-400:      #e57c6e   → COLORS.coral400  — primary CTA buttons, emotional accent color
                  #fbd6d1   → COLORS.coral200  — soft coral surface, banner background
                  #d46a5c             — coral hover/darken
                  #9f453d             — coral dark text (on light coral bg)
                  #0f172a   → COLORS.ink900    — deep overlay bg (community partners card)
                  #f3f1e8             — warm parchment bg (Care Loop section)
                  #fdf6eb             — warm card bg (Care Loop cards)
                  #c8b49a             — warm border (Care Loop cards)
                  #5a4030             — warm brown text (Care Loop descriptions)
                  #7a5535             — warm brown muted text
                  #f5ead4             — warm skew panel tint
```

**NOT in use**: Purple, blue, indigo — these appear only in `ResourcesView.tsx` for community partner buckets and are intentional accent hues for category distinction, not part of the core brand.

## Typography

Two fonts loaded via CDN in `index.html`:
- **Cabinet Grotesk** (Fontshare) — weights 400, 500, 700, 800. Used for hero section headings, Care Loop section headings. Applied via `font-cabinet` Tailwind class (defined in `tailwind.config.js`).
- **Inter** (Google Fonts) — weights 300–900. Default body font, applied via `font-family: 'Inter'` on `body`. Used for all UI text, labels, descriptions, nav.

### Type Scale in Practice
- Hero H1: `hero-title` class — `clamp(2.4rem, 8.5vh, 7rem)`, `letter-spacing: -0.05em`, `line-height: 0.95`
- Section H2: `text-4xl` to `text-7xl font-black italic tracking-tight leading-tight`
- Card H3: `text-2xl` to `text-4xl font-black font-cabinet tracking-tight leading-[0.98]`
- Body: `text-base` to `text-xl font-light` or `font-medium leading-relaxed`
- Labels/Eyebrows: `text-[9px]` to `text-[10px] font-black uppercase tracking-[0.28em]` to `tracking-[0.5em]`
- Nav links: `text-sm font-bold uppercase tracking-widest`

### Font Weight Convention
- `font-black` (900) — headings, CTAs, labels, uppercase tags
- `font-bold` (700) — nav links, sub-headings
- `font-medium` (500) — body descriptions
- `font-light` (300) — hero sub-copy, relaxed body text

## Border Radius System

A deliberately large-radius "rounded card" aesthetic:
- `rounded-full` — pills, badges, circular buttons
- `rounded-[3rem]` — large hero panels, resource cards (desktop)
- `rounded-[2rem]` to `rounded-[2.75rem]` — modal, Q&A form
- `rounded-[1.75rem]` — Q&A thread cards, large interactive cards
- `rounded-[1.5rem]` — standard resource cards, accordion items
- `rounded-[1.35rem]` — PromiseVisual containers
- `rounded-[1.15rem]` — Care Loop panel cards
- `rounded-2xl` / `rounded-xl` / `rounded-lg` — inner elements, tags, small chips

## Shadow System

Layered, directional shadows with color-tinted values:
- Hero cards: `shadow-[0_28px_80px_-48px_rgba(30,58,52,0.72)]`
- Floating panels: `shadow-[0_22px_55px_-34px_rgba(30,58,52,0.75)]`
- CTA buttons: `shadow-[0_15px_30px_-10px_rgba(229,124,110,0.4)]`
- Care Loop cards: `shadow-[0_32px_80px_-40px_rgba(80,50,20,0.18)]`
- Community partners active: `shadow-[0_30px_60px_-15px_rgba(99,102,241,0.5)]`
- Standard elevations: `shadow-xl`, `shadow-2xl`

## Easing & Animation

### Primary Easing Curve
```js
const ease = [0.16, 1, 0.3, 1]  // Expo Out — defined at top of Landing.tsx, used throughout
```
This is the project's signature curve. Use it for all reveal animations, page transitions, and element entrances.

### Secondary Curves
- `cubic-bezier(0.25, 1, 0.5, 1)` — used in ResourcesView accordion transitions
- `[0.16, 1, 0.3, 1]` — page transition in Layout.tsx AnimatePresence

### Spring Configs
- Default interactive spring: `{ type: 'spring', stiffness: 380, damping: 28 }`
- Card hover lift: `{ type: 'spring', stiffness: 260, damping: 26 }`
- Entrance spring: `{ type: 'spring', stiffness: 140–200, damping: 20–22 }`
- Snappy spring (rail indicator): `{ type: 'spring', stiffness: 500, damping: 40 }`

### Duration Scale
- Page transition: 340ms
- Section reveals: 650–850ms
- Micro-interactions: 150–300ms
- Ambient loops: 4–20s (never use `linear` for UI — only for slow ambient rotations)

### CSS Animations (Tailwind + index.html)
- `animate-reveal` — `reveal` keyframe, 0.8s `cubic-bezier(0.16, 1, 0.3, 1)` forwards
- `animate-pulse` — Tailwind default (skeleton loaders only)
- `animate-spin` — loading spinners only
- `animation-zoom`, `animation-float`, `animation-floatSlow` — defined in `tailwind.config.js`

## Stagger Patterns
- Card grids: `delay: index * 0.13` (QAThreadCard)
- Resource lists: `delay: i * 0.06` to `i * 0.07`
- Sequential reveals: 0.12s, 0.22s, 0.32s, 0.4s, 0.52s

## Glassmorphism Utility
`.glass-panel` (defined in `index.html`):
```css
background: rgba(255,255,255,0.85);
backdrop-filter: blur(20px);
border: 1px solid rgba(255,255,255,0.4);
```
Used contextually with inline Tailwind `bg-white/[0.86]`, `backdrop-blur-md`, `border border-white/[0.14]`.

## Background Textures
Inline SVG fractal noise used for grain overlays:
```
url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200'...feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'...")
opacity-[0.03] to opacity-[0.032]
```

Dot-matrix radial gradient:
```css
backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.028) 1px, transparent 1px)'
backgroundSize: '30px 30px'
```

Line grid:
```css
backgroundImage: 'linear-gradient(rgba(68,138,125,0.08) 1px, transparent 1px), linear-gradient(90deg, ...)'
backgroundSize: '54px 54px'
```

**Why:** All tokens documented here to prevent inconsistency when adding new sections — every value was derived from actual code, not guessed.
**How to apply:** Match these exact values when writing new components. Avoid introducing new grays, blues, or generic Tailwind colors not listed above. The warm brown range (#5a4030, #7a5535) is Care Loop section-specific; do not bleed into other sections.
