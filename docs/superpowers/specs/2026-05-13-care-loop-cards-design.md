# Care Loop Cards — Color-Blocked Editorial Redesign

**Date:** 2026-05-13  
**Scope:** `PromiseVisual` component + card layout inside the horizontal-scroll Care Loop section of `views/Landing.tsx`  
**Constraint:** The horizontal scroll mechanic (`useScroll` + `useTransform` + sticky viewport) is preserved exactly. Only card internals change.

---

## Problem

The existing cards use the `PromiseVisual` component, which renders animated UI mock-ups (fake forms, fake dashboards). These feel like product demos rather than the emotional, community-forward quality Starlings deserves. The text and visual halves share no visual language.

---

## Design: Approach A — Color-Blocked Editorial

### Card structure

Each `motion.article` splits into two equal panels via a `50/50` CSS grid:

| Axis | Desktop | Mobile |
|------|---------|--------|
| Grid | `md:grid-cols-[1fr_1fr]` | `grid-rows-[1.1fr_1fr]` |
| Panel order | Illustration left, text right | Illustration top, text bottom |

> Panel order is swapped from current (was text-left/visual-right) so the illustration lands first visually — left-to-right on desktop, top-to-bottom on mobile.

### Text panel

Background: unique rich color per card (see identities below). All text is white.

From top to bottom:
1. **Eyebrow** — `9px`, uppercase, `tracking-[0.4em]`, `white/50`
2. **Watermark number** — `0n` at `~8rem`, `font-black`, `white/[0.07]`, absolute-positioned bottom-right, pulses `opacity [0.05, 0.10, 0.05]` on a `6s` loop
3. **Heading** — Cabinet Grotesk `font-black`, `clamp(2rem, 3.5vw, 3rem)`, white, `leading-[0.96]`
4. **Description** — `13–14px`, `white/65`, regular weight, `leading-relaxed`
5. **Tag pills** — `white/12` bg, `white/55` text, same float-stagger animation as current implementation

### Illustration panel

Background: `#fdf6eb` warm cream (uniform across all 4 cards).

Content: one centered SVG botanical illustration, `220×220` viewBox, scaled to fit panel with padding. Slow breathing animation: `scale [1, 1.03, 1]` over `8s` loop with `ease: 'easeInOut'`.

---

## 4 Card Identities

### 01 / No name — "A note lands without a face."
- **Text panel:** `#1e3a34` deep forest
- **Illustration:** Open envelope rotated ~8°, botanical leaves curling out of the opening (3 leaves on organic stems), small circular wax seal at the envelope base. No address, no name visible. Strokes `#448a7d` + `#1e3a34`, `strokeWidth 1.8`, minimal fills at `opacity 0.12`.

### 02 / Human pause — "Review is a held breath."
- **Text panel:** `#a85240` terracotta
- **Illustration:** Two open cupped hands viewed from a 3/4 angle, palms facing up. A small rectangular form floats above the palms. Delicate leaf sprigs emerge at the wrists. Strokes `#1e3a34` + `#448a7d`, same weight/opacity treatment.

### 03 / Public shape — "The useful part gets a form."
- **Text panel:** `#448a7d` teal
- **Illustration:** Classic teardrop map-pin at lower center. A plant stem grows upward from the pin tip with two pairs of oval leaves. Three small `v`-shaped bird silhouettes are scattered above the plant at varying scales. Strokes `#1e3a34` + `#448a7d`.

### 04 / Recognition — "The map becomes a flock."
- **Text panel:** `#2c1f42` deep plum
- **Illustration:** Murmuration — ~28 small elongated bird shapes arranged in a flowing S-curve flock formation, with 6–8 small dot stars scattered in the negative space. Strokes `#448a7d`, `strokeWidth 1.5`.

---

## Component Changes

### Remove
- `PromiseVisual` component (entire component, all 4 variants)
- `PromiseArtifact` component (decorative floating elements outside cards — removed for cleaner editorial look)

### Add
- `CardIllustration` component: accepts `variant: 'envelope' | 'hands' | 'pin' | 'murmuration'`, renders the corresponding inline SVG with breathing animation

### Modify — `motion.article` in the `.map()` call
- Grid: `md:grid-cols-[1fr_1fr]` replacing `md:grid-cols-[0.76fr_1.24fr]`
- Mobile grid: `grid-rows-[1.1fr_1fr]` replacing `grid-rows-[0.86fr_1.14fr]`
- Background: remove `bg-[#fdf6eb]` from article (panels handle their own bg)
- Border: keep `border-[#c8b49a]/30`
- Shadow: `shadow-[0_32px_80px_-40px_rgba(80,50,20,0.18)]` (current, keep)
- `whileHover`: `{ y: -10 }` (bumped from current `-9`)
- Remove grain texture overlay (panels have solid colors, no need)

### Modify — text panel div
- Add `style={{ backgroundColor: panel.color }}` (color from panel data)
- Restructure interior: watermark number (absolute), then flex-col content (eyebrow → heading → desc → tags)
- Padding: `p-6 md:p-8`

### Modify — panel data array
Add `color` field to each panel object:
```ts
{ color: '#1e3a34', illustration: 'envelope', ... }
{ color: '#a85240', illustration: 'hands', ... }
{ color: '#448a7d', illustration: 'pin', ... }
{ color: '#2c1f42', illustration: 'murmuration', ... }
```

---

## Animations

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| `CardIllustration` wrapper | `scale [1, 1.03, 1]` | `8s` loop | `easeInOut` |
| Watermark number | `opacity [0.05, 0.10, 0.05]` | `6s` loop | `easeInOut` |
| Tag pills | float stagger `y [0, ±3, 0]` | `4.2s` loop | `easeInOut` (existing) |
| Card hover | `y: -10` spring | `stiffness 260 damping 26` | spring |

---

## What Is Not Changing

- The horizontal scroll mechanic (`useScroll`, `useTransform`, `promiseX`, sticky viewport)
- Section header ("Our Promise / The care loop.")
- Section background (`bg-[#f3f1e8]`)
- Progress bar at the bottom of the section
- "Hold scroll / Care moves sideways" footer text
- Card dimensions (`h-[clamp(400px,58dvh,520px)]`, width breakpoints)
- Cabinet Grotesk font (already added)
- Warm grain on section bg (section-level, not card-level)

---

## Files Touched

- `views/Landing.tsx` — remove `PromiseVisual`, remove `PromiseArtifact`, add `CardIllustration`, update card layout and panel data
