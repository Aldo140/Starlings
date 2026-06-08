# Starlings Map Part 2 Edits — Design Spec
**Date:** 2026-06-08  
**Status:** Approved  
**Scope:** 6 targeted edits to Layout, ShareView, Landing, Guidelines, and a new About the Map page

---

## Overview

Six concrete changes to the Starlings Support Map application, approved on 2026-06-08. The overarching themes are: (1) reducing alarm signals at the top of the site, (2) removing age barriers, (3) decluttering the landing page for users who are stressed or seeking support, (4) surfacing the Quick Reference section on the landing page, (5) creating a dedicated "About the Map" page for deeper context, and (6) making the submission success experience warmer.

---

## Edit 1 — Crisis Banner: Coral → Mint Green

**File:** `components/Layout.tsx` lines 218–223  
**Rationale:** The coral/pink band at the top of every page unintentionally signals danger. Mint green creates a calmer, safer feeling while still drawing the eye.

**Changes:**
- `bg-[#fbd6d1]` → `bg-[#e8f3f1]` (mint)
- `border-[#e57c6e]/20` → `border-[#448a7d]/20` (teal border)
- Text stays `text-[#1e3a34]` — high contrast on mint
- Crisis link hover stays `hover:text-[#e57c6e]` — coral accent still reads on mint

**No other layout changes.**

---

## Edit 2 — Remove 18+ Age Requirement

**File:** `views/ShareView.tsx`  
**Rationale:** An 18+ age gate is a significant barrier for the target audience (young people impacted by family substance use). Age is left open-ended.

**Changes:**
1. Remove `confirmAge: false` from initial `formData` state (line ~60)
2. Remove `formData.confirmAge &&` from `isFormValid()` (line ~123)
3. Remove the entire "I am 18 or older" `CustomCheckbox` JSX block (lines ~548–554)

The form moves from 3 confirmations → 2:
- "No identifying details"
- "Submissions are reviewed"

The fieldset heading "Community Guidelines" is retained.

---

## Edit 3 — Create `/about` "About the Map" Page

**New file:** `views/AboutMap.tsx`  
**Update:** `App.tsx` (new route), `components/Layout.tsx` (new nav link)

### 3a. New Page Structure (top → bottom)

#### Section 1: Mission Statement Hero
- Background: `bg-[#1e3a34]` (dark teal) — consistent with footer and Q&A section aesthetic
- Cabinet Grotesk heading: *"About Starlings."* (italic, font-black, tracking-tight)
- Eyebrow label: "Our Mission" in teal500 uppercase tracking-widest style
- Body text (Inter font-light, white/70): the nonprofit mission statement verbatim:
  > *"Starlings Community is a not for profit whose mission is to strengthen the community of support around the 1 in 4 young people growing up with parental/familial substance use challenges through peer led and evidence informed strategies."*
- Ambient dot-matrix texture (reuse pattern from Q&A section)
- Entrance animation: `opacity: 0, y: 20` → `opacity: 1, y: 0`, duration 0.85, ease `[0.16, 1, 0.3, 1]`

#### Section 2: "Not a Feed Trail" (Visual Support Gallery)
- **Moved wholesale** from `views/Landing.tsx` (~lines 854–1522)
- The full pinned-scroll desktop section + mobile text overlay variant
- All state/refs transferred: `galleryRef`, `galleryInView` (useInView), `galleryProgress` (useScroll), `galleryImages`, `galleryPosts`, `galleryBgEl`
- All subcomponents declared inline in AboutMap.tsx (no separate file needed)
- The warm cream (`#f4f1e8`) background palette is preserved

#### Section 3: Care Loop / Horizontal Promise Journey
- **Moved wholesale** from `views/Landing.tsx` (~lines 1525–2050+)
  - Gradient transition dividers (`#ece8de` → `#f3f1e8`)
  - Mobile snap-scroll version (lines ~1782–1926, `lg:hidden`)
  - Desktop Framer scroll-pin version (lines ~1927–2050+, the sticky `useScroll`/`useTransform` mechanism)
- All state/refs transferred: `promiseRef`, `promiseViewportRef`, `promiseTrackRef`, `promiseProgress`, `promiseDrift`, `promiseGlow`, `promiseX`, `promiseLineScale`, `promiseTravel`, `setPromiseTravel`, `promisePanels`, `promiseSteps`
- All subcomponents transferred inline: `PromiseVisual`, `PromiseArtifact`
- The warm parchment palette (`#f3f1e8`, `#fdf6eb`, `#c8b49a`) is preserved exactly

### 3b. Landing.tsx Cleanup
Remove from `views/Landing.tsx`:
- Visual Support Gallery `<section>` and all its contents (~lines 854–1522)
- Gradient transition dividers (~lines 1522–1784)
- Mobile Promise Journey `<section>` (~lines 1782–1926)
- Desktop Horizontal Promise Journey `<section>` (~lines 1927–2050+)

Remove these now-orphaned state declarations and hooks (exact names verified in code):

**Gallery state (lines 24, 36–66):**
- `galleryPhotoStep`, `setGalleryPhotoStep` (useState)
- `galleryRef`, `galleryInView`
- `galleryScrollProgress` (from useScroll)
- `col1YRawDesk`, `col2YRawDesk`, `col1YRawMob` (useTransform)
- `col1YDesk`, `col2YDesk`, `col1YMob` (useSpring)
- `col1RotRaw`, `col2RotRaw`, `col1Rot`, `col2Rot` (useTransform + useSpring)
- `useMotionValueEvent(galleryScrollProgress, ...)` handler block

**Care Loop state (lines 23, 69–115):**
- `promiseTravel`, `setPromiseTravel` (useState)
- `promiseRef`, `promiseViewportRef`, `promiseTrackRef`
- `promiseProgress` (from useScroll)
- `promiseDrift`, `promiseGlow`, `promiseX`, `promiseLineScale` (useTransform)
- The `useEffect` ResizeObserver block (lines 78–115)
- `promisePanels`, `promiseSteps` (data arrays in component body)

**Stays in Landing.tsx (do NOT remove):**
- `heroRef`, `scrollYProgress`, `imageY` — used by hero parallax
- `mobileCommunityRef`, `mobileCommunityProgress`, `communityRow1X`, `communityRow2X` — used by mobile community ticker section
- All `useScroll`, `useTransform`, `useSpring`, `useMotionValueEvent` imports — still consumed by hero + community sections above

Remove subcomponents now living only in AboutMap.tsx:
- `PromiseVisual`, `PromiseArtifact` (defined inline in Landing.tsx currently)

### 3c. App.tsx
```tsx
const AboutMap = React.lazy(() => import('./views/AboutMap.tsx'));
// Add to Routes:
<Route path="/about" element={<AboutMap />} />
```

### 3d. Layout.tsx Nav
Add to `navLinks` array, between "Explore Map" (index 0) and "Resources" (index 1):
```tsx
{
  name: 'About the Map',
  path: '/about',
  desc: 'How Starlings works',
  icon: <svg ...info-circle...>,
  illustration: <svg ...map+info...>,
}
```
This appears in both the desktop nav bar and the mobile full-screen menu.

---

## Edit 4 — Quick Reference on Landing Page Bottom

**Files:** `views/Landing.tsx` (add), `views/Guidelines.tsx` (unchanged)

Add the Quick Reference 3-card grid to the bottom of Landing.tsx, immediately **before** the existing final CTA section. 

**Cards to replicate from Guidelines.tsx Zone F (~lines 760–876):**
1. Best Practices (amber tint, star icon)
2. Quick Checklist (gray tint, checklist icon)
3. How It Works — 3-step flow: Submit → Review → Live (mint tint, shield icon)

**Implementation:** Inline the icon components (`BestPracticesIcon`, `ChecklistIcon`) directly in Landing.tsx. Add a `quickRefRef`/`quickRefInView` pair for the scroll-reveal animation. Reuse the same card styling and animation patterns from Guidelines.

**Guidelines.tsx:** Zone F stays completely unchanged.

---

## Edit 5 — Simplify Submission Success Message

**File:** `views/ShareView.tsx` (the `isSuccess` render block, lines ~212–230)

**Before:**
> "Thank you for sharing your light. To ensure our community remains a safe space, all submissions undergo a moderation review process. You can expect it to be reviewed within the next 48 hours."

**After:**
> "Thank you for sharing your light. Your note has been received and will be treated with care. This community is stronger because you're in it."

The heading "Submission Received." is retained. The shield icon and "Return to Map" button are retained. No other changes to the success state UI.

---

## Edit 6 — Mission Statement (About Page)

**Exact copy (verbatim, from client brief):**
> "Starlings Community is a not for profit whose mission is to strengthen the community of support around the 1 in 4 young people growing up with parental/familial substance use challenges through peer led and evidence informed strategies."

Placed in the Mission Statement Hero section (Edit 3a, Section 1) of `views/AboutMap.tsx`.

---

## Files Changed

| File | Change Type |
|------|-------------|
| `components/Layout.tsx` | Edit (banner color + new nav link) |
| `views/ShareView.tsx` | Edit (remove age checkbox, simplify success) |
| `views/Landing.tsx` | Edit (remove gallery + care loop sections + orphaned state) |
| `views/AboutMap.tsx` | **New file** (mission hero + gallery + care loop) |
| `App.tsx` | Edit (new route) |
| `views/Guidelines.tsx` | No change |

---

## Invariants — Must Not Break

- Crisis banner remains visible on every non-map page (only color changes)
- Safety modal in `ShareView.tsx` (`showSafetyModal` + crisis keyword detection) is untouched
- Care Loop scroll mechanic (`useScroll`/`useTransform` + ResizeObserver) moves intact — no rewiring
- HashRouter (`/#/about`) route format preserved
- `z-index` hierarchy unchanged (nav z-[5000], modal z-[9000])
- `PromiseVisual` and `PromiseArtifact` subcomponents move with the Care Loop — not deleted

---

## Design System Compliance

- All new colors use existing palette tokens (`#1e3a34`, `#e8f3f1`, `#448a7d`)
- Cabinet Grotesk for About page heading; Inter for body and labels
- Entrance animations: `[0.16, 1, 0.3, 1]` Expo Out, duration 0.7–0.85s
- Border radii consistent with section type (hero panels: `rounded-[3rem]`, cards: `rounded-[1.5rem]`)
- Shadows: color-tinted (`rgba(30,58,52,...)` for dark teal surfaces)
