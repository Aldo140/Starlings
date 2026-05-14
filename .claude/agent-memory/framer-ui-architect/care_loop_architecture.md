---
name: "Care Loop Architecture"
description: "How the horizontal scroll section (Promise Journey / Care Loop) is built in Landing.tsx — what to preserve vs improve"
type: "project"
---

The Care Loop section is called "Horizontal Promise Journey" in the code. It is fully implemented and polished. Located in `views/Landing.tsx` starting around line 1001.

## Scroll Mechanism

Pure Framer Motion `useScroll` + `useTransform` — no GSAP, no custom scroll listeners for the pan itself.

```tsx
const promiseRef = useRef<HTMLElement>(null);
const promiseViewportRef = useRef<HTMLDivElement>(null);
const promiseTrackRef = useRef<HTMLDivElement>(null);

const { scrollYProgress: promiseProgress } = useScroll({
  target: promiseRef,
  offset: ['start start', 'end end']
});

const promiseX = useTransform(promiseProgress, [0, 1], [0, -promiseTravel]);
```

`promiseTravel` is computed dynamically via ResizeObserver:
```tsx
setPromiseTravel(Math.max(0, Math.ceil(track.scrollWidth - viewport.clientWidth)));
```

Section height is set dynamically: `height: promiseTravel ? \`calc(100vh + ${promiseTravel}px)\` : '100vh'`

The inner viewport is `position: sticky; top: 0; height: 100vh; overflow: hidden`. The track `div` uses `style={{ x: promiseX }}` with `will-change-transform`.

## What to PRESERVE
- The entire scroll-pin + horizontal translate mechanism — it works correctly on all screen sizes
- The 4-panel structure (No name / Human pause / Public shape / Recognition)
- `PromiseVisual` and `PromiseArtifact` subcomponents — they are animated micro-scenes that took significant work
- The warm parchment color scheme (`#f3f1e8`, `#fdf6eb`, `#c8b49a`) of the Care Loop section — it's intentionally distinct from the rest of the page
- The ambient decorative elements (skew panel, progress line, grid texture)
- The `font-cabinet` usage on card headings within this section
- The 3D card tilt via `animate={{ rotateY, rotateX }}` on the visual panel

## What Could Be Improved (if user requests)
- Progress indicator: currently a `scaleX` gradient bar at the bottom. Could add card index dots or a more visual indicator
- Mobile: currently the same scroll mechanism applies, but cards are very wide on small screens. Could add swipe momentum hint
- Card hover: `whileHover={{ y: -9 }}` spring works well but could get a subtle shadow elevation boost alongside

## Panel Data (hardcoded in Landing.tsx)
4 panels, each with: `eyebrow`, `title`, `desc`, `visual`, `artifact`, `tags[]`, `accent`

| Panel | Eyebrow | Visual | Artifact | Accent |
|-------|---------|--------|----------|--------|
| 1 | 01 / No name | intake | fold | #448a7d |
| 2 | 02 / Human pause | review | stamp | #e57c6e |
| 3 | 03 / Public shape | publish | route | #1e3a34 |
| 4 | 04 / Recognition | community | echo | #448a7d |

## Card Sizing
```
h-[clamp(400px,58dvh,500px)]
w-[86vw] max-w-[940px]
md: h-[clamp(390px,56dvh,520px)] w-[min(72vw,940px)]
xl: w-[min(58vw,980px)]
```

Grid: `grid-cols-1 grid-rows-[0.86fr_1.14fr]` on mobile, `md:grid-cols-[0.76fr_1.24fr] md:grid-rows-1` on desktop. Left column = text+tags, right column = PromiseVisual.

**Why:** The horizontal scroll approach is the centrepiece UX interaction of the landing page. Understanding the exact mechanism prevents accidentally breaking it during unrelated edits.
**How to apply:** Never change `promiseRef`, `promiseViewportRef`, `promiseTrackRef` or the `useScroll`/`useTransform` wiring. If adding panels, add to the array literal; the layout is data-driven. If touching the section's visual container, test at multiple scroll positions.
