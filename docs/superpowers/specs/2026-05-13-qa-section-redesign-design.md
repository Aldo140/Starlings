# Q&A Section Redesign — Design Spec
**Date:** 2026-05-13  
**Status:** Approved  
**File:** `views/Landing.tsx` — `questionSection` const (lines ~466–792)

---

## Overview

Redesign the `questionSection` in `Landing.tsx` to match a provided mockup that shows a light-background layout with an editorial illustration, horizontal process steps, and a compact "Answered by community" card. All form submission logic, safety modal trigger, and answers-reveal functionality remain intact — only the visual presentation changes.

---

## Goals

1. Match the mockup's split-column layout: left = heading + steps + form, right = illustration + answered card
2. Replace dark teal `bg-[#1e3a34]` section background with warm near-white `#f8faf9`
3. Integrate `example/asset-qna.png` as the right-column hero illustration
4. Upgrade process steps from a vertical list to a horizontal 01→02→03 flow with arrow connectors
5. Redesign the "Answered by community" toggle as a card below the illustration
6. Preserve all existing functionality: question submission, safety modal intercept, answers lazy-load, QAThreadCards grid

---

## Out of Scope

- Changing question submission logic or API calls
- Changing the safety modal (`showSafetyModal` state, modal JSX)
- Changing QAThreadCard component internals
- Changing the Care Loop section above or the final CTA section below
- Adding new data sources or changing API service calls

---

## Section Shell

**Background:** `bg-[#f8faf9]` — warm near-white (imperceptibly off-white, avoids clinical feel)  
**Padding:** `py-20 md:py-32`  
**Overflow:** `overflow-hidden`

### Atmospheric background
Two soft radial blobs at very low opacity for depth — no animated orbs:
- Blob 1: bottom-left, `bg-[#e8f3f1]` (mint), `blur-3xl opacity-50`, `w-[40vw] h-[40vw]`
- Blob 2: top-right, `bg-[#e8f3f1]` (mint), `blur-3xl opacity-35`, `w-[30vw] h-[30vw]`

Dot-matrix grid overlay: `radial-gradient(circle, rgba(68,138,125,0.018) 1px, transparent 1px)` at `30px 30px`, fades in with section entrance.

No grain overlay (grain on a light bg looks dirty).

---

## Content Grid

```
grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center
```

- Left column: `lg:col-span-7` (text + form)
- Right column: `lg:col-span-5` (illustration + answered card)

---

## Left Column

### Eyebrow
```tsx
<span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-[#448a7d]">
  <span className="w-1 h-1 rounded-full bg-[#448a7d]" />
  Community Q&A
</span>
```
Entrance: `initial={{ x: -24, opacity: 0 }}` → `animate` with `duration: 0.55, ease: [0.16,1,0.3,1]`

### Headline
Same text, new colors for light background:
- "Ask what" → `text-[#1e3a34]` (was white) — blur-to-focus reveal
- "stays with you." → `text-[#e57c6e] italic` (unchanged) — spring slide-up, delay 0.22

Font: `font-cabinet font-black text-5xl md:text-6xl lg:text-7xl tracking-tight leading-tight`

### Description
`text-[#1e3a34]/60 font-light text-lg md:text-xl leading-relaxed max-w-lg`  
Entrance: `y: 16 → 0, opacity: 0→1, filter: blur(4px)→blur(0px)`, delay 0.4

### Process Steps — Horizontal 01→02→03

Uses the `React.Fragment` + SVG arrow pattern from `component_conventions.md`:

```tsx
<div className="flex items-start gap-1.5 flex-wrap">
  {steps.map((step, idx) => (
    <React.Fragment key={step.num}>
      <motion.div className="flex flex-col items-center text-center flex-1 min-w-[70px]"
        initial={{ opacity: 0, y: 10 }}
        animate={qaInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.58 + idx * 0.1, ease }}
      >
        <span className="text-[11px] font-black text-[#448a7d] tabular-nums mb-0.5">{step.num}</span>
        <span className="text-[11px] font-black text-[#1e3a34] uppercase tracking-[0.18em] leading-tight">{step.label}</span>
        <span className="text-[9px] font-medium text-[#1e3a34]/35 mt-0.5">{step.desc}</span>
      </motion.div>
      {idx < steps.length - 1 && (
        <div className="flex items-center mt-[10px] mx-1 flex-shrink-0">
          <svg width="14" height="8" viewBox="0 0 14 8" fill="none" aria-hidden="true">
            <path d="M1 4h10M8 1l3 3-3 3" stroke="rgba(68,138,125,0.45)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </React.Fragment>
  ))}
</div>
```

### Form Card

Entrance: spring `stiffness: 140, damping: 20`, delay 0.28, `y: 56→0`

Card surface:
```
bg-white rounded-[2rem] p-7 md:p-9
border border-[#e8f3f1]
shadow-[0_22px_55px_-34px_rgba(30,58,52,0.12)]
```

3D hover: `whileHover={{ rotateY: 1.5, rotateX: -1, scale: 1.01 }}` with perspective wrapper `1200px` — unchanged.

Corner decoration: same speech bubble SVG — unchanged.

Form contents: entirely unchanged (label, textarea, error state, submit button, anonymous badge, success state).

---

## Right Column

### Illustration

Asset: `public/images/asset-qna.png` (copied from `example/asset-qna.png` during implementation)

```tsx
<motion.div
  className="relative w-full max-w-[460px] mx-auto"
  initial={{ y: 40, opacity: 0 }}
  animate={qaInView ? { y: 0, opacity: 1 } : {}}
  transition={{ duration: 0.85, delay: 0.35, type: 'spring', stiffness: 140, damping: 20 }}
>
  <motion.img
    src="/images/asset-qna.png"
    alt=""  // empty alt = decorative image; screen readers skip it
    className="w-full h-auto"
    animate={{ y: [0, -10, 0] }}
    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
  />
</motion.div>
```

`aria-hidden="true"` on the wrapper — illustration is decorative.

### Answered by Community Card

Sits immediately below the illustration, `mt-6`:

```
bg-white rounded-[1.75rem] p-5
border border-[#e8f3f1]
shadow-[0_8px_24px_-8px_rgba(30,58,52,0.10)]
```

Layout: `flex items-center justify-between gap-4`

**Left group:**
- Avatar circle: `w-10 h-10 rounded-full bg-[#e8f3f1] flex items-center justify-center shrink-0` with inline person SVG (teal stroke)
- Text block: "Answered by the community" (`font-black text-sm text-[#1e3a34]`) + "Questions answered by peers who've been there" (`text-[11px] font-medium text-[#1e3a34]/50`)

**Right:** "Read answers" button:
```
px-4 py-2 rounded-full bg-[#f0f7f5] border border-[#d4eae6]
text-[#1e3a34] font-black text-xs uppercase tracking-widest
hover:bg-[#e8f3f1] transition-colors shrink-0
```
With animated chevron `rotate: 0→180` on open.

Click handler: same `showAnsweredQA ? () => setShowAnsweredQA(false) : openAnsweredQA`

Count badge: when `showAnsweredQA && approvedQA.length > 0`, show count pill inline above or next to the "Answered" label — `text-[9px] font-black px-2 py-0.5 rounded-full bg-[#448a7d]/10 text-[#448a7d]`

---

## Answers Grid — Full Width Below

```tsx
<div id="answered-questions" className="mt-10 md:mt-14">
  <AnimatePresence mode="wait">
    {showAnsweredQA && (
      <motion.div
        key="qa-content"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.45, ease }}
      >
        {/* QASkeleton or QAThreadCards grid — unchanged internals */}
      </motion.div>
    )}
  </AnimatePresence>
</div>
```

The QAThreadCard component renders dark-surface cards (`bg-[#1e3a34]/90`) — these are intentionally kept dark as a deliberate contrast. Answered posts read as distinct from the submission form.

The empty state card updates to light surface:
```
rounded-[2rem] border border-[#e8f3f1] bg-[#f8faf9] p-10 text-center
text-[#1e3a34]/50 font-medium
```

The loading skeleton `QASkeleton` updates: `bg-white/10 animate-pulse` → `bg-[#e8f3f1] animate-pulse`, and its wrapper card background changes from `bg-white/[0.07]` to `bg-white border border-[#e8f3f1]` so it reads correctly on the light section background.

---

## Mobile Behaviour

- On mobile (`< lg`), columns stack: **left column first** (eyebrow + heading + form), illustration second. Primary content (form) must be above the fold on mobile — illustration is supplementary.
- Steps wrap naturally — `flex-wrap` handles narrow screens; at ~360px they collapse to 2+1 or single-column. `min-w-[70px]` on each step block prevents text truncation.
- Illustration `max-w-[320px] mx-auto` on mobile
- Answered card renders directly below the illustration, which is below the form on mobile

---

## Animation Summary

| Element | Type | Config |
|---|---|---|
| Eyebrow | Slide-in X | `x:-24→0, opacity, dur:0.55, ease` |
| "Ask what" | Blur-to-focus | `filter:blur(18px)→0, scale:1.08→1, dur:0.9` |
| "stays with you." | Spring slide-up | `y:70→0, stiffness:200, damping:22, delay:0.22` |
| Description | Y + blur reveal | `y:16→0, filter blur, dur:0.7, delay:0.4` |
| Steps | Stagger Y | `y:10→0, dur:0.5, delay: 0.58+idx*0.1` |
| Form card | Spring drop-in | `y:56→0, stiffness:140, damping:20, delay:0.28` |
| Illustration | Spring rise + float loop | `y:40→0 spring, then loop y:[0,-10,0] 7s` |
| Answered card | Fade + Y | `y:16→0, opacity, dur:0.55, delay:0.5` |
| Answers grid | Fade + Y (AnimatePresence) | `y:16→0 in, y:-8 out, dur:0.45` |

---

## File Changes

1. **`views/Landing.tsx`** — rewrite `questionSection` const (lines ~466–792)
   - Update `QASkeleton` shimmer colors for light bg
   - No changes outside `questionSection` or `QASkeleton`

2. **`public/images/asset-qna.png`** — copy from `example/asset-qna.png`

3. **`views/Landing.tsx` QAThreadCard** — no changes (intentionally dark contrast)

---

## What Does NOT Change

- `handleQuestionSubmit` function
- `openAnsweredQA` function
- `showSafetyModal` state and modal JSX
- `qaRef`, `qaInView` ref/hook setup
- `approvedQA`, `isLoadingQA`, `showAnsweredQA` state
- `QAThreadCard` component
- Crisis banner, nav, Care Loop, hero, final CTA, footer

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Illustration PNG has white/light background — reads fine on warm-white | Verified in preview — the illustration's background is white, blends cleanly |
| QAThreadCards (dark) look odd on white section | Intentional design choice — signals "real answers" vs input form |
| Steps wrapping on narrow screens | `flex-wrap` + `min-w-[70px]` ensures graceful wrap |
| Form card loses depth against white section | `border border-[#e8f3f1]` + warm tinted shadow ensures visual separation |
