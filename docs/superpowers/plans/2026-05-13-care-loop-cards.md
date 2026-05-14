# Care Loop Cards — Color-Blocked Editorial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Care Loop card internals in `Landing.tsx` with a color-blocked editorial layout — unique rich-color text panels per card and warm cream illustration panels with four unique inline SVG botanical illustrations.

**Architecture:** Single-file change (`views/Landing.tsx`). Remove `PromiseVisual` and `PromiseArtifact` inline components. Add `CardIllustration` inline component with four SVG variants. Update the panel data array and card article layout. The horizontal scroll mechanic is untouched.

**Tech Stack:** React 19, TypeScript, Framer Motion v12, Tailwind CSS v3, Cabinet Grotesk (Fontshare, already loaded), inline SVG

---

## File Map

| Action | File | What changes |
|--------|------|--------------|
| Modify | `views/Landing.tsx` | Remove `PromiseVisual` (lines ~130–367), remove `PromiseArtifact` (lines ~369–431), add `CardIllustration`, update panel data array and card article JSX |

No new files. No other files touched.

---

## Reference: What to preserve

The following must not change:
- `useScroll`, `useTransform`, `promiseX`, `promiseProgress`, `promiseDrift`, `promiseGlow`, `promiseLineScale` scroll mechanic
- The sticky-viewport outer structure (`<section ref={promiseRef}>`, `<div ref={promiseViewportRef}>`)
- Section header ("Our Promise / The care loop.")
- The `promiseTrackRef` scrolling flex container
- Progress bar, section footer "Hold scroll" text
- Card dimensions (`h-[clamp(400px,58dvh,520px)]`, width breakpoints)

---

## Task 1: Add `CardIllustration` component

**File:** `views/Landing.tsx` — insert the component block directly above the existing `PromiseVisual` component (around line 130)

- [ ] **Step 1.1 — Add murmuration data constants** above the `PromiseVisual` component declaration:

```tsx
// --- CardIllustration data ---
const MURMURATION_BIRDS: [number, number, number][] = [
  [52, 178, -25], [68, 167, -20], [85, 158, -15],
  [102, 150, -9], [118, 146, -3], [134, 148, 4],
  [148, 155, 11], [160, 166, 17], [168, 180, 22],
  [62, 128, -22], [79, 118, -16], [96, 110, -9],
  [114, 106, -2], [130, 108, 6], [145, 116, 13],
  [157, 128, 19], [80, 82, -18], [97, 74, -10],
  [114, 70, -1], [130, 73, 8], [145, 82, 15],
  [42, 102, -28], [178, 98, 28], [108, 50, -2],
  [38, 150, -30], [184, 162, 28], [65, 54, -20], [155, 48, 18],
];

const MURMURATION_STARS: [number, number][] = [
  [35, 45], [180, 35], [196, 80], [25, 90],
  [108, 28], [165, 58], [48, 178],
];
```

- [ ] **Step 1.2 — Add `CardIllustration` component** immediately after those constants:

```tsx
type IllustrationVariant = 'envelope' | 'hands' | 'pin' | 'murmuration';

const CardIllustration: React.FC<{ variant: IllustrationVariant }> = ({ variant }) => {
  const svgBase = {
    viewBox: '0 0 220 220' as const,
    fill: 'none' as const,
    xmlns: 'http://www.w3.org/2000/svg',
    className: 'w-full h-full max-w-[175px] max-h-[175px]',
    'aria-hidden': true as const,
  };

  return (
    <motion.div
      className="flex items-center justify-center w-full h-full p-6 md:p-8"
      animate={{ scale: [1, 1.03, 1] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    >
      {variant === 'envelope' && (
        <svg {...svgBase}>
          {/* Envelope body */}
          <rect x="28" y="88" width="164" height="105" rx="5" stroke="#448a7d" strokeWidth="1.8"/>
          {/* Inner V crease */}
          <path d="M28 88 L110 136 L192 88" stroke="#448a7d" strokeWidth="1.4" opacity="0.65"/>
          {/* Open flap */}
          <path d="M28 88 C28 52 66 36 110 47 C154 36 192 52 192 88"
            stroke="#1e3a34" strokeWidth="1.8" fill="rgba(30,58,52,0.04)"/>
          {/* Wax seal */}
          <circle cx="110" cy="168" r="12" stroke="#1e3a34" strokeWidth="1.5" fill="rgba(68,138,125,0.10)"/>
          <circle cx="110" cy="168" r="7"  stroke="#1e3a34" strokeWidth="1"   fill="rgba(68,138,125,0.14)"/>
          {/* Central stem */}
          <line x1="110" y1="135" x2="110" y2="62" stroke="#1e3a34" strokeWidth="1.2"/>
          {/* Side branch — left */}
          <path d="M110 105 C103 97 96 90 98 78" stroke="#1e3a34" strokeWidth="1" opacity="0.8"/>
          {/* Side branch — right */}
          <path d="M110 90 C117 82 124 77 122 65" stroke="#1e3a34" strokeWidth="1" opacity="0.8"/>
          {/* Leaf pair 1 */}
          <path d="M104 103 C94 92 90 78 98 68 C100 80 104 92 104 103Z"
            stroke="#448a7d" strokeWidth="1.5" fill="rgba(68,138,125,0.12)"/>
          <path d="M116 90 C126 79 130 65 122 55 C120 67 116 79 116 90Z"
            stroke="#448a7d" strokeWidth="1.5" fill="rgba(68,138,125,0.12)"/>
          {/* Leaf pair 2 */}
          <path d="M108 72 C100 62 99 50 106 42 C107 52 108 62 108 72Z"
            stroke="#448a7d" strokeWidth="1.4" fill="rgba(68,138,125,0.10)"/>
          <path d="M112 72 C120 62 121 50 114 42 C113 52 112 62 112 72Z"
            stroke="#448a7d" strokeWidth="1.4" fill="rgba(68,138,125,0.10)"/>
          {/* Top bud */}
          <path d="M110 56 C106 45 107 34 110 27 C113 34 114 45 110 56Z"
            stroke="#448a7d" strokeWidth="1.4" fill="rgba(68,138,125,0.16)"/>
        </svg>
      )}

      {variant === 'hands' && (
        <svg {...svgBase}>
          {/* Floating form */}
          <rect x="82" y="22" width="56" height="38" rx="4"
            stroke="#448a7d" strokeWidth="1.5" fill="rgba(68,138,125,0.08)"/>
          <line x1="92" y1="33" x2="128" y2="33" stroke="#448a7d" strokeWidth="1" opacity="0.45"/>
          <line x1="92" y1="41" x2="124" y2="41" stroke="#448a7d" strokeWidth="1" opacity="0.35"/>
          <line x1="92" y1="49" x2="118" y2="49" stroke="#448a7d" strokeWidth="1" opacity="0.25"/>
          {/* Float glow */}
          <ellipse cx="110" cy="66" rx="30" ry="4.5"
            stroke="#448a7d" strokeWidth="1" opacity="0.16" fill="none"/>
          {/* Left fingers */}
          <path d="M66 118 C64 106 65 96 70 90"  stroke="#1e3a34" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <path d="M80 114 C78 103 80 93 86 88"  stroke="#1e3a34" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <path d="M94 111 C93 101 96 92 102 87" stroke="#1e3a34" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          {/* Right fingers */}
          <path d="M154 118 C156 106 155 96 150 90"  stroke="#1e3a34" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <path d="M140 114 C142 103 140 93 134 88"  stroke="#1e3a34" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <path d="M126 111 C127 101 124 92 118 87"  stroke="#1e3a34" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          {/* Arms */}
          <path d="M24 188 C24 160 38 136 66 118"   stroke="#1e3a34" strokeWidth="2" strokeLinecap="round" fill="none"/>
          <path d="M196 188 C196 160 182 136 154 118" stroke="#1e3a34" strokeWidth="2" strokeLinecap="round" fill="none"/>
          {/* Palm bowl */}
          <path d="M24 188 C46 202 80 208 110 208 C140 208 174 202 196 188"
            stroke="#1e3a34" strokeWidth="2" strokeLinecap="round" fill="rgba(30,58,52,0.04)"/>
          {/* Left wrist sprig */}
          <path d="M34 174 C24 162 22 148 28 138" stroke="#448a7d" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
          <path d="M26 154 C18 146 21 136 28 132" stroke="#448a7d" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.7"/>
          <path d="M22 150 C16 144 19 136 26 133 C24 140 20 146 22 150Z"
            stroke="#448a7d" strokeWidth="1.2" fill="rgba(68,138,125,0.10)"/>
          {/* Right wrist sprig */}
          <path d="M186 174 C196 162 198 148 192 138" stroke="#448a7d" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
          <path d="M194 154 C202 146 199 136 192 132" stroke="#448a7d" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.7"/>
          <path d="M198 150 C204 144 201 136 194 133 C196 140 200 146 198 150Z"
            stroke="#448a7d" strokeWidth="1.2" fill="rgba(68,138,125,0.10)"/>
        </svg>
      )}

      {variant === 'pin' && (
        <svg {...svgBase}>
          {/* Birds (v-shapes) in sky */}
          <path d="M42 38 C47 32 53 38 58 32"   stroke="#1e3a34" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
          <path d="M162 25 C167 19 173 25 178 19" stroke="#1e3a34" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
          <path d="M174 48 C178 42 183 48 187 42" stroke="#1e3a34" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7"/>
          <path d="M32 55 C36 49 41 55 45 49"    stroke="#1e3a34" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.65"/>
          {/* Flower cluster at top */}
          <path d="M110 50 C106 40 107 30 110 24 C113 30 114 40 110 50Z"
            stroke="#448a7d" strokeWidth="1.5" fill="rgba(68,138,125,0.16)"/>
          <path d="M106 42 C97 38 93 30 99 24 C103 32 105 38 106 42Z"
            stroke="#448a7d" strokeWidth="1.3" fill="rgba(68,138,125,0.10)"/>
          <path d="M114 42 C123 38 127 30 121 24 C117 32 115 38 114 42Z"
            stroke="#448a7d" strokeWidth="1.3" fill="rgba(68,138,125,0.10)"/>
          {/* Full stem: flower base → pin top */}
          <line x1="110" y1="50" x2="110" y2="136" stroke="#1e3a34" strokeWidth="1.5"/>
          {/* Upper leaf pair */}
          <path d="M110 72 C102 63 100 52 106 44 C109 53 110 63 110 72Z"
            stroke="#448a7d" strokeWidth="1.4" fill="rgba(68,138,125,0.10)"/>
          <path d="M110 72 C118 63 120 52 114 44 C111 53 110 63 110 72Z"
            stroke="#448a7d" strokeWidth="1.4" fill="rgba(68,138,125,0.10)"/>
          {/* Lower leaf pair */}
          <path d="M110 114 C101 105 97 93 103 84 C108 94 110 105 110 114Z"
            stroke="#448a7d" strokeWidth="1.5" fill="rgba(68,138,125,0.12)"/>
          <path d="M110 114 C119 105 123 93 117 84 C112 94 110 105 110 114Z"
            stroke="#448a7d" strokeWidth="1.5" fill="rgba(68,138,125,0.12)"/>
          {/* Pin bubble */}
          <circle cx="110" cy="162" r="26" stroke="#448a7d" strokeWidth="1.8" fill="rgba(68,138,125,0.08)"/>
          {/* Pin inner hole */}
          <circle cx="110" cy="162" r="9"  stroke="#1e3a34" strokeWidth="1.5" fill="rgba(30,58,52,0.10)"/>
          {/* Pin point */}
          <path d="M84 162 L110 198 L136 162" stroke="#448a7d" strokeWidth="1.8" fill="rgba(68,138,125,0.08)"/>
        </svg>
      )}

      {variant === 'murmuration' && (
        <svg {...svgBase}>
          {MURMURATION_STARS.map(([cx, cy], i) => (
            <circle key={`s${i}`} cx={cx} cy={cy} r={1.8} fill="#448a7d" opacity={0.35}/>
          ))}
          {MURMURATION_BIRDS.map(([cx, cy, rotate], i) => (
            <ellipse
              key={`b${i}`}
              cx={cx}
              cy={cy}
              rx={7}
              ry={2.5}
              fill="#448a7d"
              opacity={0.5 + (i % 4) * 0.1}
              transform={`rotate(${rotate}, ${cx}, ${cy})`}
            />
          ))}
        </svg>
      )}
    </motion.div>
  );
};
```

- [ ] **Step 1.3 — Verify TypeScript compiles:**

```bash
npm run build 2>&1 | tail -8
```

Expected: `✓ built in` with no TypeScript errors. The component is not yet used, so no runtime change.

---

## Task 2: Update panel data array and card article layout

**File:** `views/Landing.tsx` — inside the `Landing` component, update the `.map()` call that renders the care loop cards (the array of 4 panel objects starting around line 1059).

- [ ] **Step 2.1 — Replace the inline panel array** (the `[{ eyebrow: '01 / No name', ... }, ...]` object) with this updated version that adds `color` and `illustration` fields and removes the old `visual` and `artifact` fields:

```tsx
[
  {
    eyebrow: '01 / No name',
    title: 'A note lands without a face.',
    desc: 'The first promise is restraint: no account, no email, no public identity attached to what someone needs to say.',
    illustration: 'envelope' as IllustrationVariant,
    tags: ['No login', 'No email', 'Place only'],
    color: '#1e3a34',
  },
  {
    eyebrow: '02 / Human pause',
    title: 'Review is a held breath.',
    desc: 'Before anything reaches the public space, a person checks for names, crisis details, spam, and unsafe links.',
    illustration: 'hands' as IllustrationVariant,
    tags: ['Redacted', 'Crisis aware', 'Link checked'],
    color: '#a85240',
  },
  {
    eyebrow: '03 / Public shape',
    title: 'The useful part gets a form.',
    desc: 'A story can become a map pin, a resource can join the shelf, and a question can become language someone else can use.',
    illustration: 'pin' as IllustrationVariant,
    tags: ['Map pin', 'Resource shelf', 'Answered Q'],
    color: '#448a7d',
  },
  {
    eyebrow: '04 / Recognition',
    title: 'The map becomes a flock.',
    desc: 'The goal is not a loud feed. It is a quiet signal that someone else has stood here, survived here, and left a light on.',
    illustration: 'murmuration' as IllustrationVariant,
    tags: ['Not alone', 'Youth voice', 'Lived experience'],
    color: '#2c1f42',
  },
]
```

- [ ] **Step 2.2 — Replace the entire `motion.article` block** (the card) inside the `.map()` callback. The old block starts with the `motion.article` and ends with `</motion.article>`. Replace it in full with:

```tsx
<motion.article
  key={panel.eyebrow}
  className="group relative grid shrink-0 overflow-hidden rounded-[1.15rem] border border-[#c8b49a]/30
    h-[clamp(400px,58dvh,520px)] w-[88vw] max-w-[940px]
    grid-cols-1 grid-rows-[1.1fr_1fr]
    shadow-[0_32px_80px_-40px_rgba(80,50,20,0.20)]
    md:h-[clamp(390px,56dvh,530px)] md:w-[min(72vw,940px)]
    md:grid-cols-[1fr_1fr] md:grid-rows-1
    xl:w-[min(60vw,980px)]"
  whileHover={{ y: -10 }}
  transition={{ type: 'spring', stiffness: 260, damping: 26 }}
>
  {/* Illustration panel — top on mobile, left on desktop */}
  <div className="relative flex items-center justify-center bg-[#fdf6eb] overflow-hidden">
    <CardIllustration variant={panel.illustration} />
  </div>

  {/* Text panel — bottom on mobile, right on desktop */}
  <div
    className="relative flex min-h-0 flex-col justify-between p-6 md:p-8 overflow-hidden"
    style={{ backgroundColor: panel.color }}
  >
    {/* Watermark number */}
    <motion.span
      className="absolute bottom-3 right-5 font-black font-cabinet leading-none select-none pointer-events-none
        text-[5.5rem] md:text-[7.5rem]"
      style={{ color: 'rgba(255,255,255,0.07)' }}
      animate={{ opacity: [0.05, 0.10, 0.05] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.8 }}
      aria-hidden="true"
    >
      0{idx + 1}
    </motion.span>

    {/* Content */}
    <div className="relative z-10 flex flex-col justify-between h-full gap-4">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.42em] text-white/50 mb-4">
          {panel.eyebrow}
        </p>
        <h3 className="text-[1.65rem] md:text-[2.1rem] font-black font-cabinet leading-[0.96] tracking-tight text-white">
          {panel.title}
        </h3>
        <p className="mt-3 text-[13px] md:text-[14px] text-white/60 font-medium leading-relaxed">
          {panel.desc}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {panel.tags.map((tag, tagIdx) => (
          <motion.span
            key={tag}
            className="rounded-xl border border-white/[0.14] bg-white/[0.09] px-3 py-2
              text-[8px] font-black uppercase tracking-[0.17em] text-white/55"
            animate={{ y: [0, tagIdx % 2 ? 3 : -3, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, delay: tagIdx * 0.25, ease: 'easeInOut' }}
          >
            {tag}
          </motion.span>
        ))}
      </div>
    </div>
  </div>
</motion.article>
```

- [ ] **Step 2.3 — Verify the build still passes:**

```bash
npm run build 2>&1 | tail -8
```

Expected: `✓ built in` with no errors. The cards now render with the new layout.

---

## Task 3: Remove `PromiseArtifact` and `PromiseVisual` components

**File:** `views/Landing.tsx`

- [ ] **Step 3.1 — Delete the `PromiseArtifact` component** — find the block starting with:

```tsx
const PromiseArtifact: React.FC<{ type: 'fold' | 'stamp' | 'route' | 'echo'; accent: string }> = ({ type, accent }) => {
```

Delete this entire component from its opening line through the closing `};` — it is approximately 62 lines and no longer referenced anywhere.

- [ ] **Step 3.2 — Delete the `PromiseVisual` component** — find the block starting with:

```tsx
const PromiseVisual: React.FC<{ variant: 'intake' | 'review' | 'publish' | 'community' }> = ({ variant }) => {
```

Delete this entire component from its opening line through its closing `};` — it is approximately 238 lines and no longer referenced anywhere.

- [ ] **Step 3.3 — Verify the build passes cleanly after removals:**

```bash
npm run build 2>&1 | tail -8
```

Expected: `✓ built in` with no TypeScript errors about missing identifiers. Both components were only used in the `.map()` block that has already been replaced in Task 2.

---

## Task 4: Visual verification and commit

- [ ] **Step 4.1 — Start the dev server and inspect the Care Loop section:**

```bash
npm run dev -- --port 5173 &
```

Open `http://localhost:5173` in a browser. Scroll to the "The care loop." section and verify:

- 4 cards scroll horizontally
- Each card has a cream illustration panel (left/top) and a richly colored text panel (right/bottom):
  - Card 1: forest green `#1e3a34` text panel, envelope+leaves SVG
  - Card 2: terracotta `#a85240` text panel, cupped hands SVG
  - Card 3: teal `#448a7d` text panel, bloom pin SVG
  - Card 4: deep plum `#2c1f42` text panel, murmuration SVG
- Watermark number pulses faintly in each text panel corner
- Illustration panels breathe slowly (scale 1→1.03→1)
- Tags float gently
- Cards lift on hover
- Mobile: illustration on top, text on bottom

- [ ] **Step 4.2 — Kill the dev server, commit all changes:**

```bash
git add views/Landing.tsx
git commit -m "$(cat <<'EOF'
Redesign Care Loop cards with color-blocked editorial layout and SVG botanical illustrations

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

Expected: `1 file changed` commit on the `dev` branch.

---

## Self-Review Checklist

- **Spec coverage:**
  - ✅ Color-blocked editorial layout (Task 2)
  - ✅ Illustration panel: warm cream `#fdf6eb` background, centered SVG (Task 1 + 2)
  - ✅ Text panel: unique color per card, white text, watermark number (Task 2)
  - ✅ `CardIllustration` with 4 variants: envelope, hands, pin, murmuration (Task 1)
  - ✅ Cabinet Grotesk on headings (Task 2 — `font-cabinet` class)
  - ✅ Slow breathing animation on illustrations (Task 1)
  - ✅ Watermark number pulse (Task 2)
  - ✅ Tag float stagger (Task 2 — same as current)
  - ✅ `PromiseVisual` removed (Task 3)
  - ✅ `PromiseArtifact` removed (Task 3)
  - ✅ Horizontal scroll mechanic preserved (not touched)
  - ✅ Panel order: illustration left/top, text right/bottom (Task 2 — JSX order matches grid)
  - ✅ Grid: `md:grid-cols-[1fr_1fr]`, mobile `grid-rows-[1.1fr_1fr]` (Task 2)

- **Placeholder scan:** None found. All code blocks are complete and compilable.

- **Type consistency:**
  - `IllustrationVariant` defined in Task 1 before `CardIllustration`
  - Panel array uses `as IllustrationVariant` cast — matches the type exactly
  - `panel.illustration` consumed by `CardIllustration` which accepts `IllustrationVariant` — consistent
  - `panel.color` is `string`, used in `style={{ backgroundColor: panel.color }}` — correct
  - `idx` comes from the `.map((panel, idx) =>` callback — unchanged, still available

- **No dead imports:** `PromiseVisual` and `PromiseArtifact` were inline components, not imports. No import cleanup needed.
