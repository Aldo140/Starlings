# Q&A Section Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dark-teal Q&A section in `Landing.tsx` with a light warm-white layout matching the provided mockup — split column with editorial illustration, horizontal process steps, and a compact "Answered" card — while preserving all form submission, safety-modal, and answers-reveal logic.

**Architecture:** Single-file change to `views/Landing.tsx` (rewrite `QASkeleton` component + `questionSection` const) plus copying one image asset. No new dependencies, no API changes, no routing changes, no other files touched.

**Tech Stack:** React 18 + TypeScript, Framer Motion (already installed), Tailwind CSS, Vite build

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `public/images/asset-qna.png` | Create (copy) | Serves the Q&A section illustration via Vite static assets |
| `views/Landing.tsx` lines 20–44 | Modify | `QASkeleton` — update shimmer colors for light background |
| `views/Landing.tsx` lines 466–792 | Modify | `questionSection` const — full visual redesign |

**Nothing else changes.** All state variables, handlers, refs, and hooks remain on their current lines.

---

## Task 1: Copy the illustration asset

**Files:**
- Create: `public/images/asset-qna.png` (copied from `example/asset-qna.png`)

- [ ] **Step 1: Copy the file**

```bash
cp /home/mrotiz14/github-projects/Starlings/example/asset-qna.png \
   /home/mrotiz14/github-projects/Starlings/public/images/asset-qna.png
```

- [ ] **Step 2: Verify it exists**

```bash
ls -lh /home/mrotiz14/github-projects/Starlings/public/images/asset-qna.png
```

Expected: file listed, non-zero size (roughly 80–200 KB for a PNG illustration).

- [ ] **Step 3: Commit**

```bash
cd /home/mrotiz14/github-projects/Starlings
git add public/images/asset-qna.png
git commit -m "$(cat <<'EOF'
Add Q&A section illustration asset

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Update QASkeleton for light background

**Files:**
- Modify: `views/Landing.tsx:20-44`

The current `QASkeleton` uses `bg-white/10` shimmer — invisible on a light section background. Replace with mint-tinted shimmer so skeletons are visible.

- [ ] **Step 1: Run existing tests to establish a baseline**

```bash
cd /home/mrotiz14/github-projects/Starlings
npm run test -- --run
```

Expected: all tests in `tests/api.test.ts` pass. If they fail before your change, note it — don't proceed until baseline is green.

- [ ] **Step 2: Replace QASkeleton (lines 20–44)**

In `views/Landing.tsx`, find the `QASkeleton` component (starts at line 20) and replace the entire component with:

```tsx
const QASkeleton: React.FC = () => (
  <div className="bg-white border border-[#e8f3f1] rounded-[1.75rem] p-5 md:p-7 animate-pulse">
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-[#e8f3f1] flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <div className="h-2 bg-[#e8f3f1] rounded-full w-16" />
          <div className="h-2 bg-[#e8f3f1]/60 rounded-full w-20" />
        </div>
        <div className="h-3 bg-[#e8f3f1] rounded-full w-4/5" />
        <div className="h-3 bg-[#e8f3f1] rounded-full w-3/5" />
      </div>
    </div>
    <div className="ml-4 mt-3 mb-3 w-px h-4 bg-[#e8f3f1]/60" />
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-[#e8f3f1]/70 flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-2 bg-[#e8f3f1]/70 rounded-full w-24" />
        <div className="h-2.5 bg-[#e8f3f1]/60 rounded-full w-full" />
        <div className="h-2.5 bg-[#e8f3f1]/60 rounded-full w-4/5" />
        <div className="h-2.5 bg-[#e8f3f1]/60 rounded-full w-3/5" />
      </div>
    </div>
  </div>
);
```

The exact text to replace (old):

```tsx
const QASkeleton: React.FC = () => (
  <div className="bg-white/[0.04] border border-white/[0.05] rounded-[1.75rem] p-5 md:p-7 animate-pulse">
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <div className="h-2 bg-white/10 rounded-full w-16" />
          <div className="h-2 bg-white/[0.06] rounded-full w-20" />
        </div>
        <div className="h-3 bg-white/10 rounded-full w-4/5" />
        <div className="h-3 bg-white/10 rounded-full w-3/5" />
      </div>
    </div>
    <div className="ml-4 mt-3 mb-3 w-px h-4 bg-white/[0.06]" />
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-white/[0.07] flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-2 bg-white/[0.07] rounded-full w-24" />
        <div className="h-2.5 bg-white/[0.06] rounded-full w-full" />
        <div className="h-2.5 bg-white/[0.06] rounded-full w-4/5" />
        <div className="h-2.5 bg-white/[0.06] rounded-full w-3/5" />
      </div>
    </div>
  </div>
);
```

- [ ] **Step 3: Run tests again — must still pass**

```bash
npm run test -- --run
```

Expected: same pass count as Step 1. `QASkeleton` is pure JSX with no logic — tests should be unaffected.

- [ ] **Step 4: Commit**

```bash
git add views/Landing.tsx
git commit -m "$(cat <<'EOF'
Update QASkeleton shimmer colors for light-background Q&A section

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Replace questionSection

**Files:**
- Modify: `views/Landing.tsx:466-792`

This is the main visual change. Replace the entire `questionSection` const with the new light-background layout. All referenced state variables, handlers, and refs are unchanged — only the JSX structure and styles change.

**State/handlers/refs used (verify these exist before editing):**
- `qaRef` — `useRef<HTMLElement>(null)` at line 376
- `qaInView` — `useInView(qaRef, { once: true, margin: '-60px' })` at line 377
- `ease` — `[0.16, 1, 0.3, 1] as const` at line 8
- `question`, `setQuestion` — `useState('')` at line 359
- `isSubmittingQ`, `setIsSubmittingQ` — `useState(false)` at line 360
- `qSuccess`, `setQSuccess` — `useState(false)` at line 361
- `qError`, `setQError` — `useState('')` at line 362
- `approvedQA`, `setApprovedQA` — `useState<QAItem[]>([])` at line 363
- `isLoadingQA`, `setIsLoadingQA` — `useState(false)` at line 364
- `showAnsweredQA`, `setShowAnsweredQA` — `useState(false)` at line 365
- `openAnsweredQA` — async function at line 435
- `handleQuestionSubmit` — async function at line 445
- `ICONS.Heart`, `ICONS.AlertCircle`, `ICONS.ArrowRight` — imported from `constants.tsx`
- `QAThreadCard` — component defined at line 46

- [ ] **Step 1: Locate the exact range to replace**

Open `views/Landing.tsx`. Find line 466 which reads:
```tsx
  const questionSection = (
```

And line 792 which reads:
```tsx
  );
```
(the closing paren+semicolon of the `questionSection` const, immediately before the `return (` statement that begins the main render)

- [ ] **Step 2: Replace the entire questionSection const (lines 466–792)**

Delete lines 466–792 inclusive and insert the following in their place:

```tsx
  const questionSection = (
    <section ref={qaRef} id="ask-question" className="relative bg-[#f8faf9] py-20 md:py-32 overflow-hidden">

      {/* ── Atmospheric Background ─────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Soft mint blobs */}
        <div className="absolute bottom-[-10%] left-[-8%] w-[40vw] h-[40vw] max-w-[480px] bg-[#e8f3f1] rounded-full blur-3xl opacity-50" />
        <div className="absolute top-[-8%] right-[-5%] w-[30vw] h-[30vw] max-w-[360px] bg-[#e8f3f1] rounded-full blur-3xl opacity-35" />
        {/* Dot-matrix grid — fades in on scroll */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={qaInView ? { opacity: 1 } : {}}
          transition={{ duration: 2, ease }}
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(68,138,125,0.018) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="container mx-auto px-6 max-[400px]:px-4 max-w-7xl relative z-10">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* Left — heading + steps + form */}
          <div className="lg:col-span-7 space-y-7">

            {/* Eyebrow */}
            <motion.div
              initial={{ x: -24, opacity: 0 }}
              animate={qaInView ? { x: 0, opacity: 1 } : {}}
              transition={{ duration: 0.55, ease }}
            >
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-[#448a7d]">
                <span className="w-1 h-1 rounded-full bg-[#448a7d]" />
                Community Q&A
              </span>
            </motion.div>

            {/* Heading */}
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black font-cabinet text-[#1e3a34] tracking-tight leading-tight">
              <motion.span
                className="inline-block"
                initial={{ filter: 'blur(18px)', opacity: 0.2, scale: 1.08 }}
                animate={qaInView ? { filter: 'blur(0px)', opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.9, ease }}
              >
                Ask what
              </motion.span>
              <br />
              <motion.span
                className="text-[#e57c6e] italic inline-block"
                initial={{ y: 70, opacity: 0 }}
                animate={qaInView ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 0.75, delay: 0.22, type: 'spring', stiffness: 200, damping: 22 }}
              >
                stays with you.
              </motion.span>
            </h2>

            {/* Description */}
            <motion.p
              className="text-lg md:text-xl text-[#1e3a34]/60 font-light leading-relaxed max-w-lg"
              initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
              animate={qaInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
              transition={{ duration: 0.7, delay: 0.4, ease }}
            >
              Some questions need a place to land before they become words. Write anonymously, and open answered community questions only when you want to see them.
            </motion.p>

            {/* Steps — horizontal 01 → 02 → 03 */}
            <motion.div
              className="flex items-start gap-1.5 flex-wrap"
              initial={{ opacity: 0, y: 16 }}
              animate={qaInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.52, ease }}
            >
              {[
                { num: '01', label: 'Ask anonymously', desc: 'No account needed' },
                { num: '02', label: 'We review it', desc: "Safe before it's seen" },
                { num: '03', label: 'Community answers', desc: 'Real perspectives shared' },
              ].map((step, idx) => (
                <React.Fragment key={step.num}>
                  <motion.div
                    className="flex flex-col items-center text-center flex-1 min-w-[70px]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={qaInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.58 + idx * 0.1, ease }}
                  >
                    <span className="text-[11px] font-black text-[#448a7d] tabular-nums mb-0.5">{step.num}</span>
                    <span className="text-[11px] font-black text-[#1e3a34] uppercase tracking-[0.18em] leading-tight">{step.label}</span>
                    <span className="text-[9px] font-medium text-[#1e3a34]/35 mt-0.5">{step.desc}</span>
                  </motion.div>
                  {idx < 2 && (
                    <div className="flex items-center mt-[10px] mx-1 flex-shrink-0">
                      <svg width="14" height="8" viewBox="0 0 14 8" fill="none" aria-hidden="true">
                        <path d="M1 4h10M8 1l3 3-3 3" stroke="rgba(68,138,125,0.45)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </motion.div>

            {/* Form card */}
            <motion.div
              initial={{ y: 56, opacity: 0 }}
              animate={qaInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.85, delay: 0.28, type: 'spring', stiffness: 140, damping: 20 }}
            >
              <div style={{ perspective: '1200px' }}>
                <motion.div
                  whileHover={{ rotateY: 1.5, rotateX: -1, scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="bg-white rounded-[2rem] p-7 md:p-9 shadow-[0_22px_55px_-34px_rgba(30,58,52,0.12)] border border-[#e8f3f1] relative overflow-hidden"
                >
                  {/* Corner decoration */}
                  <div className="absolute top-0 right-0 w-44 h-44 pointer-events-none overflow-hidden rounded-[2rem]">
                    <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-[#e8f3f1]/60 via-[#d4eae6]/30 to-transparent rounded-bl-[110%]" />
                    <svg
                      className="absolute top-4 right-4 opacity-[0.22]"
                      width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true"
                    >
                      <rect x="2" y="2" width="40" height="32" rx="10" stroke="#448a7d" strokeWidth="2"/>
                      <path d="M10 42 L16 34 H28" stroke="#448a7d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="11" y1="14" x2="31" y2="14" stroke="#448a7d" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="11" y1="22" x2="25" y2="22" stroke="#448a7d" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>

                  {qSuccess ? (
                    <div className="text-center py-12 animate-reveal">
                      <div className="w-24 h-24 bg-gradient-to-br from-[#448a7d] to-[#2d5a52] text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl transform hover:scale-110 transition-transform rotate-3">
                        <div className="scale-[2.5]">{ICONS.Heart}</div>
                      </div>
                      <h3 className="text-3xl font-black text-[#1e3a34] mb-4">Question Submitted</h3>
                      <p className="text-gray-500 font-medium text-lg mb-10 max-w-sm mx-auto">We'll review your question and it may be answered to help others.</p>
                      <button onClick={() => setQSuccess(false)} className="px-10 py-4 bg-gray-50 text-[#1e3a34] font-black rounded-full hover:bg-gray-100 border border-gray-200 transition-colors uppercase tracking-widest text-sm shadow-sm active:scale-95">Ask Another</button>
                    </div>
                  ) : (
                    <form onSubmit={handleQuestionSubmit} className="space-y-6 relative z-10">
                      <div className="space-y-4">
                        <label htmlFor="question" className="block text-[#1e3a34] font-black text-2xl md:text-3xl tracking-tight mb-2">What's on your mind?</label>
                        <textarea
                          id="question"
                          required
                          value={question}
                          onChange={e => setQuestion(e.target.value)}
                          placeholder="Share your question anonymously..."
                          className="w-full p-6 md:p-8 bg-[#f8faf9] border border-[#e8f3f1] focus:border-[#448a7d]/40 rounded-[1.5rem] min-h-[140px] md:min-h-[180px] text-lg md:text-xl font-medium text-[#1e3a34] transition-all shadow-[inset_0_2px_8px_rgba(30,58,52,0.04)] focus:outline-none focus:bg-white focus:shadow-[inset_0_2px_8px_rgba(30,58,52,0.03),0_0_0_3px_rgba(68,138,125,0.10)] placeholder-gray-400/70 resize-none selection:bg-[#448a7d] selection:text-white"
                        />
                      </div>
                      {qError && (
                        <div className="p-4 bg-red-50/80 border border-red-100 text-red-600 rounded-2xl font-bold text-sm animate-reveal flex items-center gap-3">
                          {ICONS.AlertCircle} {qError}
                        </div>
                      )}
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isSubmittingQ || !question.trim()}
                          className="w-full relative group overflow-hidden px-8 py-5 bg-[#e57c6e] text-white rounded-[2rem] font-black text-lg md:text-xl uppercase tracking-widest shadow-[0_15px_30px_-10px_rgba(229,124,110,0.4)] hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                          <span className="relative flex items-center justify-center gap-3">
                            {isSubmittingQ ? 'Submitting...' : 'Send Question'}
                            {!isSubmittingQ && <span className="group-hover:translate-x-1 transition-transform">{ICONS.ArrowRight}</span>}
                          </span>
                        </button>
                      </div>
                      <div className="flex justify-center mt-6 pt-4 border-t border-gray-100">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f0f7f5] border border-[#d4eae6]">
                          <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden="true">
                            <rect x="1" y="5" width="8" height="7" rx="2" stroke="#448a7d" strokeWidth="1.4"/>
                            <path d="M3 5V3.5a2 2 0 0 1 4 0V5" stroke="#448a7d" strokeWidth="1.4" strokeLinecap="round"/>
                          </svg>
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#448a7d]/70">Anonymous and reviewed before use</span>
                        </span>
                      </div>
                    </form>
                  )}
                </motion.div>
              </div>
            </motion.div>

          </div>

          {/* Right — illustration + answered card */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* Illustration */}
            <motion.div
              className="relative w-full max-w-[460px] mx-auto lg:mx-0"
              aria-hidden="true"
              initial={{ y: 40, opacity: 0 }}
              animate={qaInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.85, delay: 0.35, type: 'spring', stiffness: 140, damping: 20 }}
            >
              <motion.img
                src="/images/asset-qna.png"
                alt=""
                className="w-full h-auto"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>

            {/* Answered by community card */}
            <motion.div
              className="bg-white rounded-[1.75rem] p-5 border border-[#e8f3f1] shadow-[0_8px_24px_-8px_rgba(30,58,52,0.10)] w-full max-w-[460px] mx-auto lg:mx-0"
              initial={{ opacity: 0, y: 16 }}
              animate={qaInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.5, ease }}
            >
              <div className="flex items-center justify-between gap-4">
                {/* Left: avatar + text */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#e8f3f1] flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                      <circle cx="9" cy="6" r="3" stroke="#448a7d" strokeWidth="1.5"/>
                      <path d="M3 15c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#448a7d" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm text-[#1e3a34] leading-tight">
                      Answered by the community
                      {showAnsweredQA && approvedQA.length > 0 && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-[#448a7d]/10 text-[#448a7d] text-[9px] font-black">
                          {approvedQA.length}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] font-medium text-[#1e3a34]/50 mt-0.5 leading-tight">Questions answered by peers who've been there</p>
                  </div>
                </div>
                {/* Right: toggle button */}
                <motion.button
                  type="button"
                  onClick={showAnsweredQA ? () => setShowAnsweredQA(false) : openAnsweredQA}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#f0f7f5] border border-[#d4eae6] text-[#1e3a34] font-black text-xs uppercase tracking-widest hover:bg-[#e8f3f1] transition-colors shrink-0"
                >
                  {showAnsweredQA ? 'Hide' : 'Read answers'}
                  <motion.svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"
                    animate={{ rotate: showAnsweredQA ? 180 : 0 }}
                    transition={{ duration: 0.35, ease }}
                  >
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </motion.svg>
                </motion.button>
              </div>
            </motion.div>

          </div>
        </div>

        {/* ── Answers Grid — full width below ──────────────────────── */}
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
                {isLoadingQA ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                    {[0, 1].map(i => <QASkeleton key={i} />)}
                  </div>
                ) : approvedQA.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                    {approvedQA.slice(0, 4).map((item, i) => (
                      <QAThreadCard key={item.id} item={item} index={i} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[2rem] border border-[#e8f3f1] bg-[#f8faf9] p-10 text-center">
                    <p className="text-[#1e3a34]/50 font-medium">No answered questions yet — yours could be the first.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
```

- [ ] **Step 3: Verify TypeScript compiles — run the build**

```bash
cd /home/mrotiz14/github-projects/Starlings
npm run build 2>&1 | tail -20
```

Expected: `✓ built in X.XXs` with no TypeScript errors. If you see errors like "Cannot find name 'X'", check that all state variables listed in the task header are present — you may have introduced a typo.

- [ ] **Step 4: Run tests — must still pass**

```bash
npm run test -- --run
```

Expected: same pass count as Task 2 Step 1. The `Landing.tsx` change is JSX-only — no logic changes.

- [ ] **Step 5: Start dev server and visually verify**

```bash
npm run dev
```

Open `http://localhost:5173` and navigate to the landing page. Scroll to the Q&A section. Verify:

- [ ] Section background is warm near-white (not dark teal)
- [ ] Heading "Ask what" is dark teal `#1e3a34`; "stays with you." is coral italic
- [ ] Process steps appear horizontally: `01 → 02 → 03` with SVG arrows between
- [ ] Form card is white with mint border, coral submit button
- [ ] `asset-qna.png` illustration displays in the right column, floats gently
- [ ] "Answered by the community" card appears below the illustration
- [ ] Clicking "Read answers" loads answers (or shows empty state) — grid expands below
- [ ] Clicking "Hide" collapses the answers grid with a smooth transition
- [ ] Typing a question and submitting shows the success state
- [ ] Crisis keywords still trigger the safety modal
- [ ] On mobile (resize to 375px): left column renders first, illustration below, steps wrap gracefully
- [ ] No console errors in browser DevTools

- [ ] **Step 6: Commit**

```bash
git add views/Landing.tsx
git commit -m "$(cat <<'EOF'
Redesign Q&A section: light background, illustration, horizontal steps

- Switch section bg from dark teal to warm near-white (#f8faf9)
- Add asset-qna.png illustration in right column with float animation
- Convert process steps from vertical list to horizontal 01→02→03 flow
- Redesign "Answered by community" as a compact card below illustration
- Answers grid still expands full-width below with AnimatePresence
- All form logic, safety modal, and API calls unchanged

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Light bg `#f8faf9` — Task 3 section shell
- [x] Soft mint blobs + dot-matrix grid — Task 3 atmospheric bg
- [x] Left col-span-7 / Right col-span-5 grid — Task 3 content grid
- [x] Eyebrow chip with teal dot — Task 3 left column
- [x] Heading `text-[#1e3a34]` + coral italic — Task 3 heading
- [x] Description `text-[#1e3a34]/60` — Task 3 description
- [x] Horizontal steps with SVG arrow connectors — Task 3 steps
- [x] Form card `bg-white border-[#e8f3f1] shadow-[0_22px_...]` — Task 3 form card
- [x] 3D hover tilt preserved — Task 3 form card
- [x] Illustration with spring entrance + float loop — Task 3 right column
- [x] Answered card `bg-white rounded-[1.75rem]` with toggle — Task 3 right column
- [x] Answers grid full-width with AnimatePresence — Task 3 answers grid
- [x] QASkeleton light colors — Task 2
- [x] Copy image asset — Task 1
- [x] Mobile: form-first, `max-w-[460px]` on illustration — Task 3 (flex-col on mobile, lg:mx-0)
- [x] Empty state updated to light surface — Task 3 answers grid
- [x] All functionality preserved — Task 3 (no handler changes)

**No placeholders found.**

**Type consistency:** All state variables and handlers use the exact names from the original file. No renames.
