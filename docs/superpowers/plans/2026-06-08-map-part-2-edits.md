# Map Part 2 Edits — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply 8 targeted UI changes: mint green crisis banner, remove 18+ age gate, create `/about` page with mission hero + gallery + care loop, add Quick Reference to landing bottom, simplify success message, and wire the new route + nav link.

**Architecture:** Option A (clean standalone page). The Visual Support Gallery and Care Loop sections are moved wholesale from `Landing.tsx` into a new `AboutMap.tsx` file. Both files share the same data arrays (duplicated, not extracted to a separate module — YAGNI). Landing.tsx becomes shorter and more focused. All other edits are in-place changes to existing files.

**Tech Stack:** React 18, TypeScript, Framer Motion (useScroll/useTransform/useSpring/useMotionValueEvent), Tailwind CSS, Vite, Vitest

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `components/Layout.tsx` | Modify | Crisis banner colour + About nav link |
| `views/ShareView.tsx` | Modify | Remove age gate checkbox + simplify success message |
| `views/AboutMap.tsx` | **Create** | Mission hero + Visual Support Gallery + Care Loop |
| `App.tsx` | Modify | Lazy-load AboutMap + `/about` route |
| `views/Landing.tsx` | Modify | Remove gallery + care loop sections + orphaned state |

---

## Task 1: Crisis Banner — Coral → Mint Green

**Files:**
- Modify: `components/Layout.tsx:218`

- [ ] **Step 1: Change the banner background and border colour**

In `components/Layout.tsx`, find the `<div>` at line 218 that starts the crisis banner:

```tsx
// BEFORE (line 218):
<div className="bg-[#fbd6d1] border-b border-[#e57c6e]/20 py-3 px-4 flex-shrink-0 text-center z-50">

// AFTER:
<div className="bg-[#e8f3f1] border-b border-[#448a7d]/20 py-3 px-4 flex-shrink-0 text-center z-50">
```

Text and link colours are unchanged (`text-[#1e3a34]`, `hover:text-[#e57c6e]`).

- [ ] **Step 2: Verify build passes**

```bash
cd /home/mrotiz14/github-projects/Starlings && npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add components/Layout.tsx
git commit -m "style: change crisis banner to mint green for calmer tone"
```

---

## Task 2: Remove 18+ Age Gate

**Files:**
- Modify: `views/ShareView.tsx:60-64, 122-125, 548-554`

- [ ] **Step 1: Remove `confirmAge` from initial state**

In `views/ShareView.tsx`, find the `formData` useState initialiser (around line 41). Remove the `confirmAge: false` line:

```tsx
// BEFORE:
const [formData, setFormData] = useState({
  // ... other fields ...
  confirmAge: false,
  confirmNoDetails: false,
  confirmReviewed: false
});

// AFTER:
const [formData, setFormData] = useState({
  // ... other fields ...
  confirmNoDetails: false,
  confirmReviewed: false
});
```

- [ ] **Step 2: Remove `formData.confirmAge` from `isFormValid()`**

Find `isFormValid` (around line 122):

```tsx
// BEFORE:
const baseValid = formData.confirmAge && formData.confirmNoDetails && formData.confirmReviewed;

// AFTER:
const baseValid = formData.confirmNoDetails && formData.confirmReviewed;
```

- [ ] **Step 3: Remove the "I am 18 or older" CustomCheckbox JSX**

Find the `CustomCheckbox` block for `confirmAge` (around line 548) and delete it entirely:

```tsx
// DELETE this entire block:
<CustomCheckbox
  id="confirmAge"
  label="I am 18 or older"
  subtext={`You must be an adult to share a ${shareType} on the map.`}
  checked={formData.confirmAge}
  onChange={(e) => setFormData(prev => ({ ...prev, confirmAge: e.target.checked }))}
/>
```

The `<div className="space-y-3">` that wraps the checkboxes still contains the remaining two (`confirmNoDetails`, `confirmReviewed`).

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

Expected: No TypeScript errors. TypeScript will complain if `confirmAge` is still referenced anywhere — the build error will point you to any missed references.

- [ ] **Step 5: Commit**

```bash
git add views/ShareView.tsx
git commit -m "feat: remove 18+ age requirement from submission form"
```

---

## Task 3: Simplify Submission Success Message

**Files:**
- Modify: `views/ShareView.tsx` — the `isSuccess` render block (~line 212)

- [ ] **Step 1: Replace the body copy in the success state**

Find the `<p>` inside the `if (isSuccess)` return block (~line 219):

```tsx
// BEFORE:
<p className="text-gray-500 font-medium md:text-lg mb-8 max-w-md mx-auto">
  Thank you for sharing your light. To ensure our community remains a safe space, all submissions undergo a moderation review process. You can expect it to be reviewed within the next 48 hours.
</p>

// AFTER:
<p className="text-gray-500 font-medium md:text-lg mb-8 max-w-md mx-auto">
  Thank you for sharing your light. Your note has been received and will be treated with care. This community is stronger because you're in it.
</p>
```

Everything else in the success block (heading, shield icon, "Return to Map" button) stays unchanged.

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add views/ShareView.tsx
git commit -m "copy: simplify submission success message, remove review/rejection framing"
```

---

## Task 4: Create `views/AboutMap.tsx`

**Files:**
- Create: `views/AboutMap.tsx`

This is the largest task. `AboutMap.tsx` contains three sections in order:
1. Mission Statement Hero (new — written below in full)
2. Visual Support Gallery (copied from Landing.tsx lines 854–1522)
3. Care Loop — both mobile (Landing.tsx lines 1782–1925) and desktop (lines 1927–2077)

It also needs all the state, hooks, and data arrays that currently live in Landing.tsx for those sections.

- [ ] **Step 1: Create the file with imports and data arrays**

Create `/home/mrotiz14/github-projects/Starlings/views/AboutMap.tsx` with this content for the top of the file (imports + data). Do NOT close the component yet — you'll add the JSX in subsequent steps.

```tsx
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
} from 'framer-motion';
import { ICONS, EASE_OUT_EXPO } from '../constants.tsx';
import GalleryImage from '../components/GalleryImage.tsx';
import CardIllustration, { type IllustrationVariant } from '../components/CardIllustration.tsx';

// ─── Data arrays (duplicated from Landing.tsx — used in Gallery + Care Loop) ──

const mobileGalleryPhotos = [
  { src: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?auto=format&fit=crop&q=80&w=700', label: 'Hope' },
  { src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=700', label: 'Together' },
  { src: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&q=80&w=700', label: 'Resilience' },
  { src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=700', label: 'Community' },
  { src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=700', label: 'Growth' },
  { src: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=700', label: 'Support' },
];

const mapPostExamples = [
  { city: 'Calgary', type: 'Story', text: 'Leaving a note on my mirror helped me remember their choices were not my fault.', tag: 'Self-talk', pin: 'left-[57%] top-[13%] rotate-[-3deg]', revealAt: 0 },
  { city: 'Edmonton', type: 'Resource', text: 'A youth drop-in nearby helped me find a quiet place after school.', tag: 'Safe place', pin: 'left-[4%] top-[31%] rotate-[2deg]', revealAt: 2 },
  { city: 'Red Deer', type: 'Answer', text: 'I started with one trusted adult. I did not have to explain everything at once.', tag: 'Trusted adult', pin: 'left-[25%] top-[41%] rotate-[4deg]', revealAt: 4 },
  { city: 'Lethbridge', type: 'Story', text: 'Walking home a different route gave me time to breathe before going inside.', tag: 'Grounding', pin: 'left-[57%] bottom-[33%] rotate-[-2deg]', revealAt: 6 },
  { city: 'Medicine Hat', type: 'Answer', text: 'When things got loud, I texted a code word to a friend and stepped outside.', tag: 'Exit plan', pin: 'right-[2%] top-[34%] rotate-[-4deg]', revealAt: 5 },
  { city: 'Fort McMurray', type: 'Resource', text: 'The library became my after-school reset spot. Quiet, warm, and nobody asked questions.', tag: 'Quiet place', pin: 'right-[18%] bottom-[10%] rotate-[3deg]', revealAt: 7 },
];

const promisePanels: { eyebrow: string; title: string; desc: string; illustration: IllustrationVariant; tags: string[]; color: string }[] = [
  { eyebrow: '01 / No name', title: 'A note lands without a face.', desc: 'The first promise is restraint: no account, no email, no public identity attached to what someone needs to say.', illustration: 'envelope', tags: ['No login', 'No email', 'Place only'], color: '#1e3a34' },
  { eyebrow: '02 / Human pause', title: 'Review is a held breath.', desc: 'Before anything reaches the public space, a person checks for names, crisis details, spam, and unsafe links.', illustration: 'hands', tags: ['Redacted', 'Crisis aware', 'Link checked'], color: '#a85240' },
  { eyebrow: '03 / Public shape', title: 'The useful part gets a form.', desc: 'A story can become a map pin, a resource can join the shelf, and a question can become language someone else can use.', illustration: 'pin', tags: ['Map pin', 'Resource shelf', 'Answered Q'], color: '#448a7d' },
  { eyebrow: '04 / Recognition', title: 'The map becomes a flock.', desc: 'The goal is not a loud feed. It is a quiet signal that someone else has stood here, survived here, and left a light on.', illustration: 'murmuration', tags: ['Not alone', 'Youth voice', 'Lived experience'], color: '#2c1f42' },
];

const promiseSteps = ['Private', 'Review', 'Shape', 'Signal'];
```

- [ ] **Step 2: Add the component declaration with all state and hooks**

Continue the file (after the data arrays from Step 1) — add the component and all its state/hooks:

```tsx
const AboutMap: React.FC = () => {
  // ── Gallery state ─────────────────────────────────────────────────────────
  const [galleryPhotoStep, setGalleryPhotoStep] = useState(-1);
  const galleryRef = useRef<HTMLElement>(null);
  const galleryInView = useInView(galleryRef, { once: true, amount: 0.05 });
  const { scrollYProgress: galleryScrollProgress } = useScroll({ target: galleryRef, offset: ['start start', 'end end'] });

  const col1YRawDesk = useTransform(galleryScrollProgress, [0, 1], [160, -700]);
  const col2YRawDesk = useTransform(galleryScrollProgress, [0, 1], [80, -500]);
  const col1YRawMob  = useTransform(galleryScrollProgress, [0, 1], [120, -520]);
  const col1YDesk = useSpring(col1YRawDesk, { stiffness: 72, damping: 17, restDelta: 0.001 });
  const col2YDesk = useSpring(col2YRawDesk, { stiffness: 72, damping: 17, restDelta: 0.001 });
  const col1YMob  = useSpring(col1YRawMob,  { stiffness: 72, damping: 17, restDelta: 0.001 });
  const col1RotRaw = useTransform(galleryScrollProgress, [0, 1], [1.4, -1.4]);
  const col2RotRaw = useTransform(galleryScrollProgress, [0, 1], [-1.4, 1.4]);
  const col1Rot = useSpring(col1RotRaw, { stiffness: 72, damping: 17, restDelta: 0.001 });
  const col2Rot = useSpring(col2RotRaw, { stiffness: 72, damping: 17, restDelta: 0.001 });

  useMotionValueEvent(galleryScrollProgress, 'change', (latest) => {
    const revealStart = 0.08;
    const revealCadence = 0.075;
    const totalPhotos = 9;
    const nextStep = latest < revealStart
      ? -1
      : Math.min(totalPhotos - 1, Math.floor((latest - revealStart) / revealCadence));
    setGalleryPhotoStep(prev => (prev === nextStep ? prev : nextStep));
  });

  // ── Care Loop state ───────────────────────────────────────────────────────
  const [promiseTravel, setPromiseTravel] = useState(0);
  const promiseRef        = useRef<HTMLElement>(null);
  const promiseViewportRef = useRef<HTMLDivElement>(null);
  const promiseTrackRef   = useRef<HTMLDivElement>(null);
  const { scrollYProgress: promiseProgress } = useScroll({ target: promiseRef, offset: ['start start', 'end end'] });
  const promiseDrift     = useTransform(promiseProgress, [0, 1], [-70, 70]);
  const promiseGlow      = useTransform(promiseProgress, [0, 0.5, 1], [0.22, 0.58, 0.22]);
  const promiseX         = useTransform(promiseProgress, [0, 1], [0, -promiseTravel]);
  const promiseLineScale = useTransform(promiseProgress, [0, 1], [0, 1]);

  useEffect(() => {
    let frameId = 0;
    const updatePromiseTravel = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        const viewport = promiseViewportRef.current;
        const track    = promiseTrackRef.current;
        if (!viewport || !track) return;
        const nextTravel = Math.max(0, Math.ceil(track.scrollWidth - viewport.clientWidth));
        setPromiseTravel(prev => (prev === nextTravel ? prev : nextTravel));
      });
    };
    const runInitialMeasure = () => {
      const viewport = promiseViewportRef.current;
      const track    = promiseTrackRef.current;
      if (!viewport || !track) return;
      const nextTravel = Math.max(0, Math.ceil(track.scrollWidth - viewport.clientWidth));
      setPromiseTravel(prev => (prev === nextTravel ? prev : nextTravel));
    };
    runInitialMeasure();
    window.addEventListener('resize', updatePromiseTravel);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updatePromiseTravel) : null;
    if (observer) {
      if (promiseViewportRef.current) observer.observe(promiseViewportRef.current);
      if (promiseTrackRef.current)    observer.observe(promiseTrackRef.current);
    }
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', updatePromiseTravel);
      observer?.disconnect();
    };
  }, []);
```

- [ ] **Step 3: Add the JSX return — Mission Statement Hero**

Continue the file with the start of the return statement and the mission hero section:

```tsx
  return (
    <div className="min-h-screen">

      {/* ── MISSION STATEMENT HERO ─────────────────────────────────────── */}
      <section className="relative bg-[#1e3a34] py-20 md:py-32 overflow-hidden">
        {/* Dot-matrix texture */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
          aria-hidden="true"
        />
        {/* Ambient teal orb */}
        <div
          className="absolute top-0 right-1/4 w-96 h-96 bg-[#448a7d]/20 rounded-full blur-[80px] pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6 max-[400px]:px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
          >
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.35em] text-[#448a7d] mb-4 block">
              Our Mission
            </span>
            <h1 className="font-cabinet text-5xl md:text-7xl font-black text-white tracking-tight italic leading-[0.95] mb-8">
              About Starlings.
            </h1>
            <p className="text-white/70 text-lg md:text-xl font-light leading-relaxed max-w-3xl">
              Starlings Community is a not for profit whose mission is to strengthen the community of support around the 1 in 4 young people growing up with parental/familial substance use challenges through peer led and evidence informed strategies.
            </p>
          </motion.div>
        </div>
      </section>
```

- [ ] **Step 4: Add the Visual Support Gallery section**

Open `views/Landing.tsx` and copy lines **854–1522** (the entire `{/* Visual Support Gallery — pinned scroll, viewport locked while images swim */}` section block, from `<section ref={galleryRef}` through its closing `</section>`).

Paste that block immediately after the closing `</section>` of the mission hero in `AboutMap.tsx`. No changes to the copied JSX are needed — the variable names (`galleryRef`, `galleryInView`, `galleryScrollProgress`, `col1YDesk`, etc.) are all declared in this same component.

> **Tip:** Copy from the opening `{/* Visual Support Gallery */}` comment on line 854 through and including the `</section>` on line 1522.

- [ ] **Step 5: Add the gradient transition div and Mobile Care Loop section**

After the gallery `</section>`, paste the gradient transition div and the Mobile Promise Journey section from Landing.tsx lines **1780–1925**:

```tsx
      {/* Gradient transition */}
      <div className="h-16 md:h-24 bg-gradient-to-b from-[#ece8de] to-[#f3f1e8] pointer-events-none" />
```

Then copy lines **1782–1925** from Landing.tsx (the `{/* Mobile Promise Journey — native snap scrolling... */}` section block from `<section className="lg:hidden ...` through its closing `</section>`).

Paste it directly after the gradient div.

- [ ] **Step 6: Add the Desktop Horizontal Promise Journey section**

Copy lines **1927–2077** from Landing.tsx (the `{/* Horizontal Promise Journey */}` section block from `<section ref={promiseRef} ...` through its closing `</section>`).

Paste it directly after the mobile section's `</section>`.

- [ ] **Step 7: Close the component**

Add the closing JSX to complete the component:

```tsx
    </div>
  );
};

export default AboutMap;
```

- [ ] **Step 8: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds. TypeScript will catch any variable references that are missing or misnamed. If you see errors about `col1YDesk`, `galleryPhotoStep`, `promiseX` etc. not being defined, check that all state/hooks from Step 2 are present and spelled correctly.

- [ ] **Step 9: Commit**

```bash
git add views/AboutMap.tsx
git commit -m "feat: create About the Map page with mission hero, gallery, and care loop"
```

---

## Task 5: Register the `/about` Route

**Files:**
- Modify: `App.tsx:9-13, 44-48`

- [ ] **Step 1: Add lazy import for AboutMap**

In `App.tsx`, add after the existing lazy imports (around line 13):

```tsx
// BEFORE (existing imports end around line 13):
const AddResourceView = React.lazy(() => import('./views/AddResourceView.tsx'));

// AFTER — add this line:
const AddResourceView = React.lazy(() => import('./views/AddResourceView.tsx'));
const AboutMap = React.lazy(() => import('./views/AboutMap.tsx'));
```

- [ ] **Step 2: Add the `/about` route**

Inside the `<Routes>` block (around line 44), add the new route after the `/` route:

```tsx
// BEFORE:
<Route path="/" element={<Landing />} />
<Route path="/map" element={<MapView />} />

// AFTER:
<Route path="/" element={<Landing />} />
<Route path="/about" element={<AboutMap />} />
<Route path="/map" element={<MapView />} />
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add App.tsx
git commit -m "feat: add /about route for About the Map page"
```

---

## Task 6: Add "About the Map" Nav Link

**Files:**
- Modify: `components/Layout.tsx:11-77`

- [ ] **Step 1: Add the new nav entry to the `navLinks` array**

In `components/Layout.tsx`, find the `navLinks` array (line 11). Insert a new entry at **index 1** (between "Explore Map" and "Resources"):

```tsx
// Insert this object between the "Explore Map" entry and the "Resources" entry:
{
  name: 'About the Map',
  path: '/about',
  icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4M12 8h.01"/>
    </svg>
  ),
  desc: 'How Starlings works',
  illustration: (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M20 26v-8M20 15h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="32" cy="10" r="1.5" fill="currentColor" fillOpacity="0.35"/>
      <circle cx="8" cy="12" r="1" fill="currentColor" fillOpacity="0.25"/>
    </svg>
  ),
},
```

The mobile menu and desktop nav both iterate `navLinks`, so this single insertion adds the link to both.

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add components/Layout.tsx
git commit -m "feat: add About the Map nav link to desktop and mobile nav"
```

---

## Task 7: Clean Up Landing.tsx — Remove Moved Sections and Orphaned State

**Files:**
- Modify: `views/Landing.tsx`

> ⚠️ **Highest-risk task.** Work incrementally — remove the JSX sections first, then verify build, then remove orphaned state. If the build passes after JSX removal but fails after state removal, the error message will tell you exactly which variable is still used.

- [ ] **Step 1: Remove the Visual Support Gallery section from the JSX**

In `views/Landing.tsx`, find the comment `{/* Visual Support Gallery — pinned scroll, viewport locked while images swim */}` on line 854. Delete from that comment through and including the closing `</section>` on line 1522.

The Mobile Community section (`<section ref={mobileCommunityRef}` starting at line 1524) **must remain** — stop deletion before line 1524.

- [ ] **Step 2: Verify build passes after gallery removal**

```bash
npm run build
```

Expected: Build succeeds. TypeScript may warn about unused variables — that's expected and will be resolved in Step 5.

- [ ] **Step 3: Remove the gradient div and Care Loop sections from the JSX**

Find the gradient transition div and care loop sections. Delete these three blocks:

1. The `<div className="h-16 md:h-24 bg-gradient-to-b from-[#ece8de] to-[#f3f1e8] ..."` div (1 line, appears after the Mobile Community section closes around line 1780)
2. The Mobile Promise Journey `<section className="lg:hidden ..."` block (lines ~1782–1925, from its opening `<section` through its `</section>`)
3. The Desktop Horizontal Promise Journey `<section ref={promiseRef} ...` block (from its opening `{/* Horizontal Promise Journey */}` comment through its `</section>` closing around line 2077)

After deletion the file should jump directly from the Mobile Community section's `</section>` to `{questionSection}`.

- [ ] **Step 4: Verify build passes after care loop removal**

```bash
npm run build
```

- [ ] **Step 5: Remove orphaned state declarations and hooks**

Now remove the following lines from the top of the `Landing` component body (lines ~23–67 and ~69–115 of the original file). Remove **only** the items listed — do NOT remove `heroRef`, `scrollYProgress`, `imageY`, `mobileCommunityRef`, `mobileCommunityProgress`, `communityRow1X`, `communityRow2X`.

Items to delete:

```tsx
// DELETE — Gallery state (lines 24, 36–67):
const [galleryPhotoStep, setGalleryPhotoStep] = useState(-1);   // line 24

const galleryRef = useRef<HTMLElement>(null);                    // line 36
const galleryInView = useInView(galleryRef, { once: true, amount: 0.05 }); // line 37
const { scrollYProgress: galleryScrollProgress } = useScroll({ target: galleryRef, offset: ['start start', 'end end'] }); // line 38

const col1YRawDesk = useTransform(galleryScrollProgress, [0, 1], [160, -700]); // line 40
const col2YRawDesk = useTransform(galleryScrollProgress, [0, 1], [80, -500]);  // line 41
const col1YRawMob  = useTransform(galleryScrollProgress, [0, 1], [120, -520]); // line 43
const col1YDesk = useSpring(col1YRawDesk, { stiffness: 72, damping: 17, restDelta: 0.001 }); // line 44
const col2YDesk = useSpring(col2YRawDesk, { stiffness: 72, damping: 17, restDelta: 0.001 }); // line 45
const col1YMob  = useSpring(col1YRawMob,  { stiffness: 72, damping: 17, restDelta: 0.001 }); // line 46
const col1RotRaw = useTransform(galleryScrollProgress, [0, 1], [1.4, -1.4]);    // line 48
const col2RotRaw = useTransform(galleryScrollProgress, [0, 1], [-1.4, 1.4]);    // line 49
const col1Rot = useSpring(col1RotRaw, { stiffness: 72, damping: 17, restDelta: 0.001 }); // line 50
const col2Rot = useSpring(col2RotRaw, { stiffness: 72, damping: 17, restDelta: 0.001 }); // line 51

useMotionValueEvent(galleryScrollProgress, 'change', (latest) => { ... }); // lines 58–67 (entire block)

// DELETE — Care Loop state (lines 23, 69–115):
const [promiseTravel, setPromiseTravel] = useState(0);          // line 23

const promiseRef        = useRef<HTMLElement>(null);            // line 69
const promiseViewportRef = useRef<HTMLDivElement>(null);        // line 70
const promiseTrackRef   = useRef<HTMLDivElement>(null);         // line 71
const { scrollYProgress: promiseProgress } = useScroll({ ... }); // line 72
const promiseDrift     = useTransform(promiseProgress, ...);    // line 73
const promiseGlow      = useTransform(promiseProgress, ...);    // line 74
const promiseX         = useTransform(promiseProgress, ...);    // line 75
const promiseLineScale = useTransform(promiseProgress, ...);    // line 76

useEffect(() => { /* ResizeObserver block */ }, []);            // lines 78–115 (entire block)

// DELETE — Data arrays (lines 154–202):
const promisePanels = [...];    // lines 154–187
const promiseSteps = [...];     // line 188
const mobileGalleryPhotos = [...]; // lines 195–202
```

> **Note:** `mapPostExamples` (lines 204–252) **stays in Landing.tsx** — it is still used by the Mobile Community section (lines ~1580–1597).

- [ ] **Step 6: Remove unused imports from Landing.tsx**

After removing the sections, check the top of the file. Remove `GalleryImage` and `CardIllustration` imports if they are no longer referenced anywhere in Landing.tsx:

```tsx
// CHECK if these imports are still used — if not, remove them:
import GalleryImage from '../components/GalleryImage.tsx';
import CardIllustration, { type IllustrationVariant } from '../components/CardIllustration.tsx';
```

Run `npm run build` — if either import is unused, TypeScript will report an "unused import" warning (or error with `noUnusedLocals`). Remove only the ones that trigger warnings.

- [ ] **Step 7: Final build verification**

```bash
npm run build
```

Expected: Zero TypeScript errors. If you see errors, the error message will identify exactly which file and line has the problem. Common issues:
- `galleryScrollProgress is not defined` → you missed removing a `useMotionValueEvent` or `useTransform` call that still references it
- `promiseRef is not defined` → a Care Loop JSX ref was missed in Step 3

- [ ] **Step 8: Commit**

```bash
git add views/Landing.tsx
git commit -m "refactor: remove gallery and care loop from Landing — moved to AboutMap"
```

---

## Task 8: Add Quick Reference Section to Landing Bottom

**Files:**
- Modify: `views/Landing.tsx`

The Quick Reference is a 3-card grid that already exists in `views/Guidelines.tsx` (Zone F, lines 741–879). The components it uses (`BestPracticesIcon`, `ChecklistIcon`) are locally defined in Guidelines.tsx. We inline them in Landing.tsx.

- [ ] **Step 1: Add a `quickRefInView` ref**

In `views/Landing.tsx`, add a new ref+inView pair near the other `useRef`/`useInView` declarations at the top of the component:

```tsx
const quickRefRef = useRef<HTMLDivElement>(null);
const quickRefInView = useInView(quickRefRef, { once: true, margin: '-80px' });
```

- [ ] **Step 2: Insert the Quick Reference section before the Final CTA**

Find the `{/* Final CTA */}` comment in Landing.tsx (around line 2234 — now renumbered after Task 7 deletions). Insert this entire section block immediately **before** that comment:

```tsx
      {/* ── QUICK REFERENCE ────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 md:py-24 bg-white/82 backdrop-blur-[3px]">
        <div ref={quickRefRef} className="max-w-7xl mx-auto px-6 max-[400px]:px-4">

          {/* Section header */}
          <motion.div
            className="mb-10 md:mb-14"
            initial={{ opacity: 0, y: 28 }}
            animate={quickRefInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          >
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-[#448a7d]">
              Before You Post
            </span>
            <h2 className="font-cabinet text-3xl md:text-4xl font-black text-[#1e3a34] tracking-tight leading-tight mt-3">
              Quick Reference
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card 1 — Best Practices */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={quickRefInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, ease: EASE_OUT_EXPO, delay: 0 }}
              className="p-6 md:p-7 rounded-[1.75rem] bg-gradient-to-br from-[#fef8f0] to-white border border-amber-100/60
                shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_-10px_rgba(30,58,52,0.12)]
                transition-all duration-300"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-[#448a7d]">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="font-black text-[#1e3a34] text-base">Best Practices</h3>
              </div>
              <ul className="space-y-3">
                {['Be specific, not graphic', 'Focus on healing, not harm', "Respect others' experiences", 'No unsolicited advice'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-500 font-light">
                    <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-[#e8f3f1] flex items-center justify-center">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                        <path d="M1.5 4l1.8 1.8L6.5 2" stroke="#448a7d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Card 2 — Quick Checklist */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={quickRefInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, ease: EASE_OUT_EXPO, delay: 0.1 }}
              className="p-6 md:p-7 rounded-[1.75rem] bg-gradient-to-br from-[#f0f4f9] to-white border border-gray-100/70
                shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_-10px_rgba(30,58,52,0.12)]
                transition-all duration-300"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-[#e8f3f1] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-[#448a7d]">
                    <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M9 7h6M9 11h6M9 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M5 7l-2 2 1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="font-black text-[#1e3a34] text-base">Quick Checklist</h3>
              </div>
              <ul className="space-y-3.5">
                {['No personal details', 'Safe for all ages', 'Not triggering or graphic', 'Respectful tone'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-4 h-4 rounded border-2 border-[#d4ede9] bg-white" />
                    <span className="text-sm text-gray-500 font-light">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Card 3 — How It Works */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={quickRefInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, ease: EASE_OUT_EXPO, delay: 0.2 }}
              className="p-6 md:p-7 rounded-[1.75rem] bg-gradient-to-br from-[#f4faf9] to-white border border-[#e8f3f1]
                shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_-10px_rgba(30,58,52,0.12)]
                transition-all duration-300"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-[#e8f3f1] flex items-center justify-center text-[#448a7d]">
                  {ICONS.ShieldCheck}
                </div>
                <h3 className="font-black text-[#1e3a34] text-base">How It Works</h3>
              </div>
              <div className="flex flex-col gap-0">
                {[
                  { num: '01', title: 'You submit', desc: 'Your note enters the queue anonymously — no account, no trace.' },
                  { num: '02', title: 'We review', desc: 'A human moderator checks within 48–72 hours.' },
                  { num: '03', title: "It's live", desc: 'Your note appears on the map for the community.' },
                ].map((step, idx) => (
                  <React.Fragment key={step.num}>
                    <div className="flex items-start gap-3 py-3">
                      <span className="text-[11px] font-black text-[#448a7d] tabular-nums mt-0.5 flex-shrink-0 w-6">{step.num}</span>
                      <div>
                        <p className="text-sm font-black text-[#1e3a34]">{step.title}</p>
                        <p className="text-xs font-light text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                    {idx < 2 && <div className="ml-[22px] h-px bg-[#e8f3f1]" />}
                  </React.Fragment>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </section>
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add views/Landing.tsx
git commit -m "feat: add Quick Reference section to landing page bottom"
```

---

## Task 9: Final Verification

- [ ] **Step 1: Run full build one last time**

```bash
npm run build
```

Expected: Zero errors, zero unused-variable warnings related to the moved sections.

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: Existing test suite (`tests/api.test.ts`) passes. No new test failures introduced.

- [ ] **Step 3: Manual smoke-check checklist**

Start the dev server:
```bash
npm run dev
```

Verify each of the following:

| Check | URL | Expected |
|-------|-----|----------|
| Crisis banner is mint green | `/#/` | Top band is `#e8f3f1`, not pink |
| About the Map page loads | `/#/about` | Mission hero → gallery → care loop visible |
| Nav link works | Click "About the Map" | Navigates to `/#/about` |
| Care Loop scrolls | `/#/about` | Horizontal scroll-pin works on desktop; snap-scroll on mobile |
| Landing page loads without gallery/care loop | `/#/` | Page renders cleanly; no gallery or care loop section |
| Quick Reference visible | `/#/` bottom | 3-card grid appears above the final dark CTA section |
| Submit form — no 18+ checkbox | `/#/share` | Only 2 checkboxes: "No identifying details" + "Submissions are reviewed" |
| Submit form — success message | `/#/share` → submit | "Your note has been received and will be treated with care." (no 48-hour language) |
| Safety modal still works | `/#/share` → type crisis keyword | Safety modal appears as before |
| Guidelines page unchanged | `/#/guidelines` | Quick Reference still in Zone F; all sections intact |

- [ ] **Step 4: Final commit (if any last-minute fixes)**

```bash
git add -p  # stage only intentional changes
git commit -m "fix: post-verification cleanup"
```

---

## Self-Review Against Spec

| Spec requirement | Task |
|-----------------|------|
| Crisis banner coral → mint `#e8f3f1` | Task 1 |
| Remove 18+ age gate (state, validation, JSX) | Task 2 |
| Simplify success message | Task 3 |
| New `/about` page with mission statement hero | Task 4 (Step 3) |
| "Not a Feed Trail" gallery on About page | Task 4 (Step 4) |
| Care Loop on About page (mobile + desktop) | Task 4 (Steps 5–6) |
| Remove gallery + care loop from Landing.tsx | Task 7 |
| Orphaned state removed from Landing.tsx | Task 7 (Step 5) |
| `/about` route registered | Task 5 |
| "About the Map" nav link | Task 6 |
| Quick Reference on Landing bottom | Task 8 |
| Safety modal untouched | Verified in Task 9 smoke-check |
| Care Loop scroll mechanic moves intact | Task 4 (Steps 2, 5–6) |
| `mapPostExamples` kept in Landing for mobile community section | Task 7 (Step 5 note) |
