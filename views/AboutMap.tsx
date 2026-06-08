import React, { useState, useRef, useEffect } from 'react';
import { motion, useInView, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion';
import { ICONS, EASE_OUT_EXPO } from '../constants.tsx';
import CardIllustration, { type IllustrationVariant } from '../components/CardIllustration.tsx';
import GalleryImage from '../components/GalleryImage.tsx';

/* ── About the Map Page ─────────────────────────────────────────────────── */

// Suppress unused-variable lint for ICONS (kept for parity with Landing imports)
void ICONS;

const AboutMap: React.FC = () => {
  // State
  const [promiseTravel, setPromiseTravel] = useState(0);
  const [galleryPhotoStep, setGalleryPhotoStep] = useState(-1);

  // Refs
  const gridRef = useRef<HTMLDivElement>(null);
  const gridInView = useInView(gridRef, { once: true, margin: '-80px' });
  const galleryRef = useRef<HTMLElement>(null);
  const galleryInView = useInView(galleryRef, { once: true, amount: 0.05 });
  const promiseRef = useRef<HTMLElement>(null);
  const promiseViewportRef = useRef<HTMLDivElement>(null);
  const promiseTrackRef = useRef<HTMLDivElement>(null);

  // Gallery scroll hooks
  const { scrollYProgress: galleryScrollProgress } = useScroll({ target: galleryRef, offset: ['start start', 'end end'] });
  const col1YRawDesk = useTransform(galleryScrollProgress, [0, 1], [160, -700]);
  const col2YRawDesk = useTransform(galleryScrollProgress, [0, 1], [80, -500]);
  const col1YRawMob = useTransform(galleryScrollProgress, [0, 1], [120, -520]);
  const col1YDesk = useSpring(col1YRawDesk, { stiffness: 72, damping: 17, restDelta: 0.001 });
  const col2YDesk = useSpring(col2YRawDesk, { stiffness: 72, damping: 17, restDelta: 0.001 });
  const col1YMob = useSpring(col1YRawMob, { stiffness: 72, damping: 17, restDelta: 0.001 });
  const col1RotRaw = useTransform(galleryScrollProgress, [0, 1], [1.4, -1.4]);
  const col2RotRaw = useTransform(galleryScrollProgress, [0, 1], [-1.4, 1.4]);
  const col1Rot = useSpring(col1RotRaw, { stiffness: 72, damping: 17, restDelta: 0.001 });
  const col2Rot = useSpring(col2RotRaw, { stiffness: 72, damping: 17, restDelta: 0.001 });

  // Suppress unused variable warnings — these motion values are part of the
  // gallery scroll system and are retained for completeness / future use.
  void col1YDesk; void col2YDesk; void col1Rot; void col2Rot;

  // Care loop scroll hooks
  const { scrollYProgress: promiseProgress } = useScroll({ target: promiseRef, offset: ['start start', 'end end'] });
  const promiseDrift = useTransform(promiseProgress, [0, 1], [-70, 70]);
  const promiseGlow = useTransform(promiseProgress, [0, 0.5, 1], [0.22, 0.58, 0.22]);
  const promiseX = useTransform(promiseProgress, [0, 1], [0, -promiseTravel]);
  const promiseLineScale = useTransform(promiseProgress, [0, 1], [0, 1]);

  // Gallery photo step event
  useMotionValueEvent(galleryScrollProgress, 'change', (latest) => {
    const revealStart = 0.08;
    const revealCadence = 0.075;
    const totalPhotos = 9;
    const nextStep = latest < revealStart
      ? -1
      : Math.min(totalPhotos - 1, Math.floor((latest - revealStart) / revealCadence));
    setGalleryPhotoStep(prev => (prev === nextStep ? prev : nextStep));
  });

  // ResizeObserver for care loop
  useEffect(() => {
    let frameId = 0;

    const updatePromiseTravel = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        const viewport = promiseViewportRef.current;
        const track = promiseTrackRef.current;
        if (!viewport || !track) return;
        const nextTravel = Math.max(0, Math.ceil(track.scrollWidth - viewport.clientWidth));
        setPromiseTravel(prev => (prev === nextTravel ? prev : nextTravel));
      });
    };

    const runInitialMeasure = () => {
      const viewport = promiseViewportRef.current;
      const track = promiseTrackRef.current;
      if (!viewport || !track) return;
      const nextTravel = Math.max(0, Math.ceil(track.scrollWidth - viewport.clientWidth));
      setPromiseTravel(prev => (prev === nextTravel ? prev : nextTravel));
    };

    runInitialMeasure();
    window.addEventListener('resize', updatePromiseTravel);

    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updatePromiseTravel) : null;
    if (observer) {
      if (promiseViewportRef.current) observer.observe(promiseViewportRef.current);
      if (promiseTrackRef.current) observer.observe(promiseTrackRef.current);
    }

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', updatePromiseTravel);
      observer?.disconnect();
    };
  }, []);

  // Data arrays
  const promisePanels = [
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
  ];

  const promiseSteps = ['Private', 'Review', 'Shape', 'Signal'];

  const mobileGalleryPhotos = [
    { src: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?auto=format&fit=crop&q=80&w=700', label: 'Hope' },
    { src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=700', label: 'Together' },
    { src: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&q=80&w=700', label: 'Resilience' },
    { src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=700', label: 'Community' },
    { src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=700', label: 'Growth' },
    { src: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=700', label: 'Support' },
  ];

  // Suppress unused variable warning — retained for parity with Landing.tsx data shape
  void mobileGalleryPhotos;

  const mapPostExamples = [
    {
      city: 'Calgary',
      type: 'Story',
      text: 'Leaving a note on my mirror helped me remember their choices were not my fault.',
      tag: 'Self-talk',
      pin: 'left-[57%] top-[13%] rotate-[-3deg]',
      revealAt: 0,
    },
    {
      city: 'Edmonton',
      type: 'Resource',
      text: 'A youth drop-in nearby helped me find a quiet place after school.',
      tag: 'Safe place',
      pin: 'left-[4%] top-[31%] rotate-[2deg]',
      revealAt: 2,
    },
    {
      city: 'Red Deer',
      type: 'Answer',
      text: 'I started with one trusted adult. I did not have to explain everything at once.',
      tag: 'Trusted adult',
      pin: 'left-[25%] top-[41%] rotate-[4deg]',
      revealAt: 4,
    },
    {
      city: 'Lethbridge',
      type: 'Story',
      text: 'Walking home a different route gave me time to breathe before going inside.',
      tag: 'Grounding',
      pin: 'left-[57%] bottom-[33%] rotate-[-2deg]',
      revealAt: 6,
    },
    {
      city: 'Medicine Hat',
      type: 'Answer',
      text: 'When things got loud, I texted a code word to a friend and stepped outside.',
      tag: 'Exit plan',
      pin: 'right-[2%] top-[34%] rotate-[-4deg]',
      revealAt: 5,
    },
    {
      city: 'Fort McMurray',
      type: 'Resource',
      text: 'The library became my after-school reset spot. Quiet, warm, and nobody asked questions.',
      tag: 'Quiet place',
      pin: 'right-[18%] bottom-[10%] rotate-[3deg]',
      revealAt: 7,
    },
  ];

  return (
    <div>

      {/* ── Section 1: Mission Statement Hero ─────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#1e3a34] py-24 md:py-36">
        {/* Ambient dot-matrix texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(68,138,125,0.065) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <motion.div
          className="relative z-10 max-w-4xl mx-auto px-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
        >
          <p className="text-[#448a7d] font-black text-[9px] uppercase tracking-[0.5em] mb-4">Our Mission</p>
          <h1
            className="font-cabinet font-black italic tracking-tight leading-[0.95] text-white mb-8"
            style={{ fontSize: 'clamp(2.8rem, 7vw, 5rem)' }}
          >
            About Starlings.
          </h1>
          <p
            className="text-white/70 font-light leading-relaxed max-w-2xl"
            style={{ fontSize: 'clamp(1rem, 2.2vw, 1.2rem)' }}
          >
            Starlings Community is a not for profit whose mission is to strengthen the community of support around the 1 in 4 young people growing up with parental/familial substance use challenges through peer led and evidence informed strategies.
          </p>
        </motion.div>
      </section>

      {/* ── Section 2: Visual Support Gallery — pinned scroll, viewport locked while images swim ── */}
      <section
        ref={galleryRef}
        className="relative z-10 hidden lg:block"
        style={{ height: 'calc(100vh + 900px)' }}
      >
        <div className="sticky top-0 h-screen overflow-hidden" style={{ background: '#f4f1e8' }}>

          {/* Static soft glow — teal; no animation to avoid continuous compositing */}
          <div className="absolute top-1/2 left-1/4 w-[50vw] h-[50vw] max-w-[420px] rounded-full pointer-events-none -translate-y-1/2"
            style={{ background: 'radial-gradient(circle, rgba(68,138,125,0.08) 0%, transparent 70%)' }} />

          {/* ── DESKTOP: left text panel + right image pool ── */}
          <div className="hidden lg:flex h-full relative z-10">

            {/* LEFT: editorial anchor — headline dominant, illustration as environment */}
            <div
              className="w-[44%] h-full flex-shrink-0 relative flex flex-col overflow-hidden"
            >

              {/* ─── Environment ──────────────────────────────────────────── */}

              {/* Warm cream base */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: '#f4f1e8' }} />

              {/* Very faint dot grid — tactile depth */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #2d5a52 1px, transparent 1px)', backgroundSize: '30px 30px', opacity: 0.018 }}
              />

              {/* Teal atmosphere — top left, slow breath animation */}
              <motion.div className="absolute pointer-events-none"
                animate={{ opacity: [0.11, 0.17, 0.11], scale: [1, 1.08, 1] }}
                transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
                style={{ top: '-12rem', left: '-12rem', width: '560px', height: '560px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(68,138,125,0.35) 0%, transparent 65%)' }}
              />

              {/* Right-edge column softener — bridges into the image column */}
              <div className="absolute right-0 top-0 bottom-0 w-28 pointer-events-none z-20"
                style={{ background: 'linear-gradient(to right, transparent 0%, rgba(244,241,232,0.80) 100%)' }}
              />

              {/* ─── Diagonal tropical leaf — drawn in final position, no CSS rotation ── */}
              {/* Broad leaf (not narrow blade). Tip at upper-right, base lower-left.    */}
              {/* SVG is landscape so the leaf shape fills the element naturally at its   */}
              {/* diagonal axis. Positioned so the tip bleeds past the right edge (seam)  */}
              {/* and the base dissolves into the lower-center of the left panel.          */}
              <motion.div
                className="absolute pointer-events-none z-[1]"
                animate={{ y: [0, -7, 0], x: [0, 3, 0], rotateZ: [0, 0.5, 0] }}
                transition={{
                  y:       { duration: 20, repeat: Infinity, ease: 'easeInOut' },
                  x:       { duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 3 },
                  rotateZ: { duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1 },
                }}
                style={{
                  top: '0.75rem',
                  right: '-10rem',
                  width: '35rem',
                  height: '25rem',
                  opacity: 0.052,
                  filter: 'blur(0.15px)',
                  mixBlendMode: 'multiply',
                }}
              >
                <svg viewBox="0 0 420 310" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                  {/* ── Leaf body — broad tropical, tip upper-right, base lower-left ── */}
                  <path d="
                    M 388 14
                    C 368 48, 344 75, 345 102
                    C 346 132, 295 170, 264 198
                    C 238 226, 185 248, 160 258
                    C 128 270, 80 282, 48 287
                    C 28 272, 26 254, 38 230
                    C 58 196, 102 164, 103 146
                    C 104 122, 148 106, 192 88
                    C 232 70, 290 38, 340 15
                    C 362 8, 380 8, 388 14 Z
                  " fill="#2d5a52"/>
                  {/* ── Midrib — curves from tip to base ── */}
                  <path d="M 388 14 C 355 52, 270 122, 188 178 C 118 226, 74 260, 48 287"
                    stroke="#f4f1e8" strokeWidth="2.0" opacity="0.30" strokeLinecap="round" fill="none"/>
                  {/* ── Vein pairs, alternating, opacity fades toward base ── */}
                  {/* ~20% along midrib: roughly (330, 62) */}
                  <path d="M 330 62 Q 342 46, 356 38" stroke="#f4f1e8" strokeWidth="1.1" opacity="0.22" strokeLinecap="round" fill="none"/>
                  <path d="M 330 62 Q 316 76, 302 82" stroke="#f4f1e8" strokeWidth="1.1" opacity="0.22" strokeLinecap="round" fill="none"/>
                  {/* ~35% along midrib: roughly (278, 104) */}
                  <path d="M 278 104 Q 292 92, 308 86" stroke="#f4f1e8" strokeWidth="1.0" opacity="0.19" strokeLinecap="round" fill="none"/>
                  <path d="M 278 104 Q 264 116, 248 120" stroke="#f4f1e8" strokeWidth="1.0" opacity="0.19" strokeLinecap="round" fill="none"/>
                  {/* ~50% along midrib: roughly (228, 146) */}
                  <path d="M 228 146 Q 244 136, 260 132" stroke="#f4f1e8" strokeWidth="0.9" opacity="0.16" strokeLinecap="round" fill="none"/>
                  <path d="M 228 146 Q 212 156, 196 160" stroke="#f4f1e8" strokeWidth="0.9" opacity="0.16" strokeLinecap="round" fill="none"/>
                  {/* ~65% along midrib: roughly (168, 192) */}
                  <path d="M 168 192 Q 182 182, 196 178" stroke="#f4f1e8" strokeWidth="0.8" opacity="0.13" strokeLinecap="round" fill="none"/>
                  <path d="M 168 192 Q 154 202, 138 206" stroke="#f4f1e8" strokeWidth="0.8" opacity="0.13" strokeLinecap="round" fill="none"/>
                  {/* ~80% along midrib: roughly (108, 234) */}
                  <path d="M 108 234 Q 120 226, 132 222" stroke="#f4f1e8" strokeWidth="0.7" opacity="0.10" strokeLinecap="round" fill="none"/>
                  <path d="M 108 234 Q 96 242, 82 246"  stroke="#f4f1e8" strokeWidth="0.7" opacity="0.10" strokeLinecap="round" fill="none"/>
                </svg>
              </motion.div>

              <div
                className="absolute left-0 top-0 z-[2] pointer-events-none"
                style={{
                  width: '72%',
                  height: '58%',
                  background: 'linear-gradient(125deg, rgba(244,241,232,0.96) 0%, rgba(244,241,232,0.78) 48%, transparent 100%)',
                }}
              />

              {/* Ambient shimmer pulse on the right edge — suggests light from the image column */}
              <motion.div
                className="absolute right-0 top-0 bottom-0 w-20 pointer-events-none z-[2]"
                animate={{ opacity: [0.4, 0.72, 0.4] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                style={{ background: 'linear-gradient(to right, transparent 0%, rgba(244,241,232,0.55) 100%)' }}
              />

              {/* ─── Content — field-note layout; bottom illustration remains anchored ── */}
              <div
                className="relative z-20 flex-1 min-h-0 overflow-hidden"
                style={{
                  paddingLeft: 'clamp(2rem, 4.8vw, 4.25rem)',
                  paddingRight: 'clamp(1.4rem, 3.6vw, 3rem)',
                  paddingTop: 'clamp(2.8rem, 6.8vh, 5.25rem)',
                  paddingBottom: 'clamp(10rem, 25vh, 16rem)',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  className="absolute pointer-events-none font-cabinet font-black italic leading-none text-[#448a7d]/[0.055]"
                  style={{
                    top: 'clamp(3.2rem, 8vh, 5.8rem)',
                    right: 'clamp(0.8rem, 2.4vw, 2rem)',
                    fontSize: 'clamp(6.5rem, 13vw, 12rem)',
                  }}
                  aria-hidden="true"
                >
                  01
                </div>

                <motion.div
                  className="absolute left-5 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex"
                  initial={{ opacity: 0, y: -10 }}
                  animate={galleryInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
                  aria-hidden="true"
                >
                  <span className="h-10 w-px bg-[#448a7d]/24" />
                  <span
                    className="font-black uppercase text-[#448a7d]/55"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', fontSize: '8px', letterSpacing: '0.28em' }}
                  >
                    About Starlings
                  </span>
                  <span className="h-10 w-px bg-[#448a7d]/24" />
                </motion.div>

                <div
                  className="relative ml-[clamp(1rem,3vw,2.35rem)] max-w-[25rem]"
                >
                  <motion.div
                    className="mb-4 flex items-center gap-3"
                    initial={{ opacity: 0, x: -12 }}
                    animate={galleryInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.46, delay: 0.04, ease: EASE_OUT_EXPO }}
                  >
                    <span className="rounded-full bg-[#e57c6e] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.22em] text-white shadow-[0_10px_24px_-14px_rgba(229,124,110,0.55)]">
                      Field note
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-r from-[#448a7d]/40 to-transparent" />
                    <span className="text-[8px] font-black uppercase tracking-[0.24em] text-[#448a7d]/65">No. 01</span>
                  </motion.div>

                  <h2
                    className="font-cabinet font-black tracking-tight text-[#1a3530]"
                    style={{ marginBottom: 'clamp(0.9rem, 2.2vh, 1.35rem)' }}
                  >
                    <span className="block overflow-hidden" style={{ lineHeight: 0.94 }}>
                      <motion.span
                        className="block italic"
                        style={{ fontSize: 'clamp(2.25rem, min(3.55vw, 6.8vh), 4.65rem)' }}
                        initial={{ y: '112%' }}
                        animate={galleryInView ? { y: '0%' } : {}}
                        transition={{ duration: 0.7, delay: 0.14, ease: EASE_OUT_EXPO }}
                      >Not a feed.</motion.span>
                    </span>
                    <span className="block overflow-hidden" style={{ lineHeight: 0.94 }}>
                      <motion.span
                        className="block italic"
                        style={{ fontSize: 'clamp(2.25rem, min(3.55vw, 6.8vh), 4.65rem)' }}
                        initial={{ y: '112%' }}
                        animate={galleryInView ? { y: '0%' } : {}}
                        transition={{ duration: 0.72, delay: 0.22, ease: EASE_OUT_EXPO }}
                      >A trail.</motion.span>
                    </span>
                    <span className="mt-2 block overflow-hidden" style={{ lineHeight: 1.2 }}>
                      <motion.span
                        className="block"
                        style={{ fontSize: 'clamp(0.95rem, min(1.15vw, 2.15vh), 1.2rem)', fontWeight: 700, color: 'rgba(26,53,48,0.58)' }}
                        initial={{ y: '110%' }}
                        animate={galleryInView ? { y: '0%' } : {}}
                        transition={{ duration: 0.56, delay: 0.34, ease: EASE_OUT_EXPO }}
                      >Left by people who made it through a hard room.</motion.span>
                    </span>
                  </h2>

                  <motion.div
                    className="relative max-w-[22rem] border-l border-[#448a7d]/28 pl-4"
                    initial={{ opacity: 0, x: -10 }}
                    animate={galleryInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.56, delay: 0.46, ease: EASE_OUT_EXPO }}
                  >
                    <p className="text-[clamp(0.78rem,min(0.9vw,1.9vh),0.88rem)] font-medium leading-[1.68] text-[#587068]">
                      A private story can become a map pin, a resource, or an answer that waits quietly for someone else.
                    </p>
                  </motion.div>

                  <motion.div
                    className="mt-4 grid max-w-[23rem] grid-cols-2 gap-2.5"
                    initial={{ opacity: 0, y: 12 }}
                    animate={galleryInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.52, delay: 0.56, ease: EASE_OUT_EXPO }}
                  >
                    {[
                      ['No sign-up wall', 'write without an account'],
                      ['Read by a person', 'before it reaches the map'],
                      ['Answered by peers', 'not a loud public feed'],
                      ['Care stays free', 'resources remain open'],
                    ].map(([label, desc], idx) => (
                      <div
                        key={label}
                        className="rounded-[0.95rem] border px-3 py-2.5"
                        style={{
                          borderColor: idx === 0 ? 'rgba(229,124,110,0.28)' : 'rgba(68,138,125,0.18)',
                          color: idx === 0 ? '#a85240' : '#448a7d',
                          background: idx === 0 ? 'rgba(229,124,110,0.08)' : 'rgba(255,250,240,0.58)',
                        }}
                      >
                        <span className="block text-[8px] font-black uppercase tracking-[0.16em] leading-tight">{label}</span>
                        <span className="mt-1 block text-[9px] font-semibold normal-case tracking-normal text-[#1e3a34]/48 leading-tight">{desc}</span>
                      </div>
                    ))}
                  </motion.div>

                  <motion.div
                    className="mt-3 max-w-[23rem] rounded-[1.15rem] border border-[#e57c6e]/18 bg-[#fffaf0]/72 p-3 shadow-[0_16px_34px_-28px_rgba(30,58,52,0.34)]"
                    initial={{ opacity: 0, y: 12 }}
                    animate={galleryInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.52, delay: 0.64, ease: EASE_OUT_EXPO }}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-[7.5px] font-black uppercase tracking-[0.22em] text-[#e57c6e]">Example map note</span>
                      <span className="h-px flex-1 bg-[#e57c6e]/18" />
                      <span className="text-[7px] font-black uppercase tracking-[0.18em] text-[#448a7d]/55">Calgary</span>
                    </div>
                    <p className="text-[0.78rem] font-semibold leading-relaxed text-[#1e3a34]/70">
                      &ldquo;I kept one steady routine after school. It gave me a little piece of the day that was mine.&rdquo;
                    </p>
                  </motion.div>
                </div>

              </div>

              {/* ─── ILLUSTRATION — atmospheric bottom anchor, blends into panel edge ── */}
              <motion.div
                className="absolute inset-x-0 bottom-0 z-10 overflow-hidden pointer-events-none"
                style={{ bottom: 'clamp(-8rem, -12vh, -3.5rem)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={galleryInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 1.2, delay: 0.48, ease: EASE_OUT_EXPO }}
              >
                <div className="absolute inset-x-0 top-0 z-10 h-40 pointer-events-none"
                  style={{ background: 'linear-gradient(to bottom, #f4f1e8 0%, rgba(244,241,232,0.92) 28%, rgba(244,241,232,0.38) 70%, transparent 100%)' }}
                />
                <div className="absolute inset-x-0 bottom-0 z-10 h-24 pointer-events-none"
                  style={{ background: 'linear-gradient(to top, rgba(244,241,232,0.64) 0%, transparent 100%)' }}
                />
                {/* Ken Burns — natural ratio, a touch oversized so the white image top can fade out */}
                <motion.img
                  src={`${import.meta.env.BASE_URL}images/asset3.png`}
                  alt="A diverse group of young people sitting together in a community circle"
                  className="relative left-1/2 h-auto max-w-none block"
                  style={{
                    width: 'clamp(102%, 45vw, 116%)',
                    x: '-50%',
                    mixBlendMode: 'multiply',
                    opacity: 0.86,
                    transformOrigin: 'bottom center',
                    borderBottomRightRadius: '2rem',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0) 7%, rgba(0,0,0,0.45) 18%, #000 34%, #000 100%)',
                    maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0) 7%, rgba(0,0,0,0.45) 18%, #000 34%, #000 100%)',
                  }}
                  animate={galleryInView ? { scale: [1.04, 1.065, 1.04] } : {}}
                  transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
                />
              </motion.div>

            </div>


            {/* Seam glow — thin teal column at the 44% divide, pulses slowly */}
            {/* Lives on the flex container so it straddles both panels freely */}
            <motion.div
              className="absolute top-0 bottom-0 pointer-events-none z-20"
              style={{ left: 'calc(44% - 3px)', width: '6px', background: 'linear-gradient(to bottom, transparent 0%, rgba(68,138,125,0.22) 25%, rgba(68,138,125,0.22) 75%, transparent 100%)' }}
              animate={{ opacity: [0.3, 0.9, 0.3] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
            />

            {/* RIGHT: image swimming pool — atmospheric, secondary to headline */}
            <div className="flex-1 relative overflow-hidden">
              <div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                  background: [
                    'radial-gradient(circle at 74% 24%, rgba(68,138,125,0.12) 0%, rgba(68,138,125,0.05) 24%, transparent 48%)',
                    'radial-gradient(circle at 30% 70%, rgba(229,124,110,0.08) 0%, rgba(229,124,110,0.03) 28%, transparent 52%)',
                    'linear-gradient(110deg, rgba(255,255,255,0.28) 0%, transparent 36%, rgba(68,138,125,0.035) 100%)',
                  ].join(', '),
                }}
              />
              <svg
                className="absolute inset-0 z-0 w-full h-full pointer-events-none"
                viewBox="0 0 900 900"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <pattern id="about-field-dots" width="32" height="32" patternUnits="userSpaceOnUse">
                    <circle cx="1.5" cy="1.5" r="1.1" fill="#448a7d" opacity="0.13" />
                  </pattern>
                </defs>
                <rect width="900" height="900" fill="url(#about-field-dots)" opacity="0.28" />
                <path d="M720 -60 C610 90 612 226 744 350 C842 442 826 594 682 732 C596 814 556 884 566 968" fill="none" stroke="#448a7d" strokeWidth="1.4" opacity="0.16" />
                <path d="M796 -22 C692 112 696 218 806 330 C910 436 890 622 724 790 C672 842 646 894 648 954" fill="none" stroke="#448a7d" strokeWidth="1" opacity="0.11" />
                <path d="M112 812 C212 704 326 690 438 732 C524 764 620 744 714 660" fill="none" stroke="#e57c6e" strokeWidth="1.2" opacity="0.12" />
                <path d="M72 236 C156 156 258 128 374 152 C456 168 526 150 588 94" fill="none" stroke="#1e3a34" strokeWidth="1" opacity="0.1" strokeDasharray="8 13" />
              </svg>
              {[
                { left: '62%', top: '16%', size: 4, delay: 0 },
                { left: '70%', top: '22%', size: 7, delay: 0.7 },
                { left: '80%', top: '31%', size: 5, delay: 1.3 },
                { left: '58%', top: '55%', size: 6, delay: 2.1 },
                { left: '72%', top: '66%', size: 4, delay: 2.8 },
                { left: '87%', top: '72%', size: 7, delay: 3.4 },
              ].map((mark) => (
                <motion.span
                  key={`${mark.left}-${mark.top}`}
                  className="absolute z-[1] rounded-full bg-[#448a7d] pointer-events-none"
                  style={{
                    left: mark.left,
                    top: mark.top,
                    width: mark.size,
                    height: mark.size,
                    opacity: 0.22,
                    boxShadow: '0 0 22px rgba(68,138,125,0.18)',
                  }}
                  animate={{ opacity: [0.12, 0.3, 0.12], y: [0, -6, 0] }}
                  transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut', delay: mark.delay }}
                />
              ))}

              {/* Pre-reveal map scaffold — keeps the right side intentional before photos open */}
              <motion.div
                className="absolute inset-0 z-[2] pointer-events-none"
                initial={false}
                animate={{
                  opacity: galleryPhotoStep < 0 ? 1 : 0,
                  filter: galleryPhotoStep < 0 ? 'blur(0px)' : 'blur(5px)',
                }}
                transition={{ duration: 0.32, ease: 'easeOut' }}
              >
                <div
                  className="absolute left-[12%] right-[9%] top-[14%] bottom-[12%] rounded-[2rem] border border-[#448a7d]/12"
                  style={{
                    background: [
                      'linear-gradient(rgba(68,138,125,0.06) 1px, transparent 1px)',
                      'linear-gradient(90deg, rgba(68,138,125,0.06) 1px, transparent 1px)',
                      'radial-gradient(circle at 58% 34%, rgba(229,124,110,0.12), transparent 34%)',
                    ].join(', '),
                    backgroundSize: '46px 46px, 46px 46px, 100% 100%',
                    boxShadow: 'inset 0 0 90px rgba(244,241,232,0.62)',
                  }}
                />
                {[
                  { left: '23%', top: '27%', label: 'Story' },
                  { left: '64%', top: '31%', label: 'Resource' },
                  { left: '76%', top: '58%', label: 'Answer' },
                  { left: '38%', top: '67%', label: 'Story' },
                ].map((pin, idx) => (
                  <motion.div
                    key={`${pin.left}-${pin.top}`}
                    className="absolute flex items-center gap-2 rounded-full border border-white/70 bg-[#fffaf0]/88 px-3 py-2 shadow-[0_14px_34px_-24px_rgba(30,58,52,0.36)]"
                    style={{ left: pin.left, top: pin.top }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={galleryInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.45, delay: 0.14 + idx * 0.08, ease: EASE_OUT_EXPO }}
                  >
                    <span className="h-2 w-2 rounded-full bg-[#e57c6e]" />
                    <span className="text-[7px] font-black uppercase tracking-[0.18em] text-[#448a7d]">{pin.label}</span>
                  </motion.div>
                ))}
                <motion.div
                  className="absolute bottom-[18%] right-[12%] w-[210px] rounded-2xl border border-white/70 bg-[#fffaf0]/92 p-4 text-[#1e3a34] shadow-[0_22px_60px_-34px_rgba(30,58,52,0.5)]"
                  initial={{ opacity: 0, y: 14 }}
                  animate={galleryInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.48, ease: EASE_OUT_EXPO }}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-[7px] font-black uppercase tracking-[0.2em] text-[#e57c6e]">Map preview</span>
                    <span className="text-[7px] font-black uppercase tracking-[0.16em] text-[#448a7d]/60">Scroll</span>
                  </div>
                  <p className="text-[11px] font-semibold leading-snug text-[#1e3a34]/72">
                    Pins, photos, and notes open as you move through the community field.
                  </p>
                </motion.div>
              </motion.div>

              {/* Faint scattered leaves in the negative space, echoing the left-panel botanical texture */}
              {[
                { left: '2%', top: '10%', w: '14rem', rot: -18, opacity: 0.055, delay: 0, drift: -7 },
                { left: '16%', top: '23%', w: '9rem', rot: 19, opacity: 0.04, delay: 2.5, drift: 6 },
                { left: '5%', top: '49%', w: '11rem', rot: 8, opacity: 0.035, delay: 1.4, drift: 9 },
                { left: '24%', top: '7%', w: '7.5rem', rot: -34, opacity: 0.032, delay: 4, drift: -5 },
              ].map((leaf) => (
                <motion.div
                  key={`${leaf.left}-${leaf.top}`}
                  className="absolute z-[1] pointer-events-none"
                  animate={{ y: [0, leaf.drift, 0], x: [0, leaf.drift > 0 ? -3 : 3, 0], rotateZ: [leaf.rot, leaf.rot + 2, leaf.rot] }}
                  transition={{ duration: 20 + Math.abs(leaf.drift), repeat: Infinity, ease: 'easeInOut', delay: leaf.delay }}
                  style={{
                    left: leaf.left,
                    top: leaf.top,
                    width: leaf.w,
                    height: `calc(${leaf.w} * 0.72)`,
                    opacity: leaf.opacity,
                    mixBlendMode: 'multiply',
                  }}
                >
                  <svg viewBox="0 0 420 310" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                    <path d="M388 14 C368 48 344 75 345 102 C346 132 295 170 264 198 C238 226 185 248 160 258 C128 270 80 282 48 287 C28 272 26 254 38 230 C58 196 102 164 103 146 C104 122 148 106 192 88 C232 70 290 38 340 15 C362 8 380 8 388 14 Z" fill="#2d5a52" />
                    <path d="M388 14 C355 52 270 122 188 178 C118 226 74 260 48 287" stroke="#f4f1e8" strokeWidth="2" opacity="0.28" strokeLinecap="round" />
                    <path d="M330 62 Q342 46 356 38 M330 62 Q316 76 302 82 M278 104 Q292 92 308 86 M278 104 Q264 116 248 120 M228 146 Q244 136 260 132 M228 146 Q212 156 196 160" stroke="#f4f1e8" strokeWidth="1" opacity="0.18" strokeLinecap="round" />
                  </svg>
                </motion.div>
              ))}
              {/* Top vignette */}
              <div className="absolute top-0 inset-x-0 z-20 pointer-events-none"
                style={{ height: '10rem', background: 'linear-gradient(to bottom, #f4f1e8 0%, rgba(244,241,232,0.82) 40%, transparent 100%)' }} />
              {/* Bottom vignette */}
              <div className="absolute bottom-0 inset-x-0 z-20 pointer-events-none"
                style={{ height: '11rem', background: 'linear-gradient(to top, #f4f1e8 0%, rgba(244,241,232,0.72) 42%, transparent 100%)' }} />
              <div className="absolute inset-0 z-[2]">
                {[
                  { src: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?auto=format&fit=crop&q=80&w=700', label: 'Hope', h: 'h-[18rem]', cls: 'left-[6%] top-[8%] w-[27%] rotate-[4deg] z-[5]', fromX: -74, fromY: 18 },
                  { src: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=700', label: 'Self Care', h: 'h-[13rem]', cls: 'left-[33%] top-[3%] w-[22%] -rotate-[3deg] z-[3]', fromX: -18, fromY: -54 },
                  { src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=700', label: 'Together', h: 'h-[17rem]', cls: 'right-[7%] top-[10%] w-[28%] rotate-[2deg] z-[4]', fromX: 68, fromY: -14 },
                  { src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=520', label: 'Calm', h: 'h-[15rem]', cls: 'left-[18%] top-[36%] w-[24%] -rotate-[6deg] z-[6]', fromX: -58, fromY: 34 },
                  { src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=700', label: 'Community', h: 'h-[21rem]', cls: 'left-[44%] top-[30%] w-[30%] rotate-[5deg] z-[5]', fromX: 22, fromY: 68 },
                  { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=700', label: 'Peace', h: 'h-[12rem]', cls: 'right-[4%] top-[45%] w-[22%] -rotate-[4deg] z-[7]', fromX: 76, fromY: 20 },
                  { src: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&q=80&w=520', label: 'Kinship', h: 'h-[14rem]', cls: 'left-[2%] bottom-[9%] w-[24%] rotate-[8deg] z-[4]', fromX: -70, fromY: 54 },
                  { src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=520', label: 'Shelter', h: 'h-[16rem]', cls: 'left-[30%] bottom-[5%] w-[26%] -rotate-[2deg] z-[3]', fromX: -12, fromY: 76 },
                  { src: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=700', label: 'Reflection', h: 'h-[14rem]', cls: 'right-[13%] bottom-[7%] w-[25%] rotate-[3deg] z-[5]', fromX: 64, fromY: 58 },
                ].map((img, i) => {
                  const visible = galleryPhotoStep >= i;

                  return (
                    <motion.div
                      key={img.label}
                      className={`absolute ${img.cls}`}
                      initial={false}
                      animate={{
                        opacity: visible ? 1 : 0,
                        x: visible ? 0 : img.fromX,
                        y: visible ? 0 : img.fromY,
                        scale: visible ? 1 : 0.88,
                        filter: visible ? 'blur(0px)' : 'blur(6px)',
                      }}
                      transition={{
                        opacity: { duration: 0.28, ease: 'easeOut' },
                        filter: { duration: 0.34, ease: 'easeOut' },
                        x: { type: 'spring', stiffness: 150, damping: 20, mass: 0.72 },
                        y: { type: 'spring', stiffness: 150, damping: 20, mass: 0.72 },
                        scale: { type: 'spring', stiffness: 180, damping: 18, mass: 0.78 },
                      }}
                      style={{ willChange: 'transform, opacity, filter' }}
                    >
                      <GalleryImage src={img.src} label={img.label} h={img.h} delay={0} inView={visible} />
                    </motion.div>
                  );
                })}
              </div>
              <div className="absolute inset-0 z-30 pointer-events-none">
                {mapPostExamples.map((post) => {
                  const visible = galleryPhotoStep >= post.revealAt;

                  return (
                    <motion.div
                      key={`${post.city}-${post.type}`}
                      className={`absolute w-[min(15vw,174px)] min-w-[142px] rounded-2xl border border-white/75 bg-[#fffaf0]/95 p-3 text-[#1e3a34] shadow-[0_18px_44px_-18px_rgba(30,58,52,0.46)] backdrop-blur-md ${post.pin}`}
                      initial={false}
                      animate={{
                        opacity: visible ? 1 : 0,
                        y: visible ? 0 : 12,
                        scale: visible ? 1 : 0.94,
                      }}
                      transition={{ duration: 0.28, ease: 'easeOut', delay: visible ? 0.08 : 0 }}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[7px] font-black uppercase tracking-[0.2em] text-[#448a7d]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#e57c6e]" />
                          {post.city}
                        </span>
                        <span className="rounded-full bg-[#448a7d]/10 px-2 py-0.5 text-[6.5px] font-black uppercase tracking-[0.14em] text-[#448a7d]">
                          {post.type}
                        </span>
                      </div>
                      <p className="text-[10px] font-semibold leading-snug text-[#1e3a34]/78">
                        {post.text}
                      </p>
                      <div className="mt-2 inline-flex rounded-full bg-[#e57c6e]/10 px-2 py-1 text-[7px] font-black uppercase tracking-[0.15em] text-[#a85240]">
                        {post.tag}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <motion.div
                className="absolute right-6 bottom-8 z-30 flex items-center gap-1.5 pointer-events-none"
                initial={{ opacity: 0, y: 10 }}
                animate={galleryInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.48, ease: EASE_OUT_EXPO, delay: 0.18 }}
                aria-hidden="true"
              >
                {Array.from({ length: 9 }).map((_, i) => {
                  const active = galleryPhotoStep >= i;

                  return (
                    <motion.span
                      key={i}
                      className="block rounded-full bg-[#448a7d]"
                      animate={{
                        width: active ? 18 : 5,
                        opacity: active ? 0.78 : 0.2,
                      }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      style={{ height: 5 }}
                    />
                  );
                })}
              </motion.div>
            </div>
          </div>

          {/* ── MOBILE / TABLET: full-width image pool + text overlay ── */}
          <div className="flex lg:hidden h-full relative z-10">
            <div className="flex-1 relative overflow-hidden">
              {/* Top vignette */}
              <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-[#f4f1e8]/90 to-transparent z-20 pointer-events-none" />
              {/* Bottom vignette */}
              <div className="absolute bottom-0 inset-x-0 z-20 pointer-events-none"
                style={{ height: 'min(75%, 360px)', background: 'linear-gradient(to top, #f4f1e8 0%, #f4f1e8 28%, rgba(244,241,232,0.88) 48%, rgba(244,241,232,0.52) 68%, transparent 100%)' }}
              />

              {/* Single full-width filmstrip */}
              <div className="absolute inset-0 px-2">
                <motion.div
                  style={{ y: col1YMob, willChange: 'transform' }}
                  className="flex flex-col gap-2"
                >
                  {[
                    { src: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?auto=format&fit=crop&q=80&w=700', label: 'Hope',       h: 'h-72' },
                    { src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=700', label: 'Together',    h: 'h-52' },
                    { src: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&q=80&w=700', label: 'Resilience',  h: 'h-80' },
                    { src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=700', label: 'Community',   h: 'h-56' },
                    { src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=700', label: 'Growth',      h: 'h-72' },
                    { src: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=700', label: 'Support',     h: 'h-60' },
                  ].map((img, i) => <GalleryImage key={img.label} {...img} delay={i * 0.08} inView={galleryInView} />)}
                </motion.div>
              </div>

              {/* Mobile text overlay — editorial panel over the vignette */}
              <div className="absolute bottom-0 inset-x-0 z-30 px-5 pb-7">

                {/* Eyebrow */}
                <motion.div className="flex items-center gap-2 mb-3"
                  initial={{ opacity: 0, x: -12 }}
                  animate={galleryInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                >
                  <div className="h-px w-6 bg-[#448a7d]" />
                  <span className="w-1 h-1 rounded-full bg-[#448a7d]" />
                  <span className="text-[9px] font-black uppercase tracking-[0.28em] text-[#448a7d]">About Starlings</span>
                </motion.div>

                {/* Heading — stagger reveal */}
                <h2 className="font-cabinet text-[2.75rem] font-black text-[#1e3a34] tracking-tight leading-[1.02] mb-3">
                  {[
                    { text: 'Every note here', italic: false, delay: 0.1 },
                    { text: 'was left for you.', italic: true, delay: 0.22 },
                  ].map((line) => (
                    <span key={line.text} className="block overflow-hidden py-1 leading-[1.12]">
                      <motion.span className={`block ${line.italic ? 'italic' : ''}`}
                        initial={{ y: '110%' }}
                        animate={galleryInView ? { y: '0%' } : {}}
                        transition={{ duration: 0.68, delay: line.delay, ease: EASE_OUT_EXPO }}
                      >{line.text}</motion.span>
                    </span>
                  ))}
                </h2>

                {/* Tagline */}
                <motion.p
                  className="text-[11px] font-medium text-[#1e3a34]/65 leading-relaxed mb-3.5 max-w-[290px]"
                  initial={{ opacity: 0, y: 6 }}
                  animate={galleryInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.55, delay: 0.38, ease: EASE_OUT_EXPO }}
                >
                  No sign-in. No judgement. Just a community shaped by youth who&apos;ve lived this — and chose to leave a light on.
                </motion.p>

                {/* Scroll hint — enhanced */}
                <motion.div className="flex items-center gap-2.5"
                  initial={{ opacity: 0 }}
                  animate={galleryInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  {/* Animated mouse */}
                  <motion.div
                    className="w-[13px] h-[19px] rounded-full border-[1.5px] border-[#448a7d]/50 flex items-start justify-center pt-[3px] flex-shrink-0"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <motion.div className="w-[2px] h-[4px] rounded-full bg-[#448a7d]"
                      animate={{ y: [0, 5, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </motion.div>
                  <div className="flex flex-col gap-px">
                    <span className="text-[8px] font-black uppercase tracking-[0.22em] text-[#448a7d]/60">Scroll to explore</span>
                    <div className="flex items-center gap-1">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <motion.div key={i}
                          className="h-px rounded-full bg-[#448a7d]/30"
                          style={{ width: i === 0 ? 12 : 4 }}
                          animate={{ opacity: [0.3, 0.8, 0.3], scaleX: [1, 1.2, 1] }}
                          transition={{ duration: 1.6, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Scroll progress — fixed at base of viewport */}
          <div className="absolute bottom-3 inset-x-0 z-40 px-8 max-[400px]:px-4">
            <div className="h-px bg-[#1e3a34]/10 relative overflow-hidden rounded-full">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#448a7d] to-[#e57c6e] rounded-full"
                style={{ scaleX: galleryScrollProgress, transformOrigin: 'left' }}
              />
            </div>
          </div>

        </div>
      </section>

      {/* ── Section 3: Gradient + Mobile Care Loop + Desktop Care Loop ─────── */}

      <div className="h-16 md:h-24 bg-gradient-to-b from-[#ece8de] to-[#f3f1e8] pointer-events-none" />

      {/* Mobile Promise Journey — native snap scrolling for low-cost, snappy motion */}
      <section
        className="lg:hidden relative z-10 overflow-hidden py-10 text-[#1e3a34]"
        style={{ background: 'linear-gradient(180deg, #f3f1e8 0%, #f8f4ec 42%, #efe8da 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-[0.28]"
          style={{
            backgroundImage: 'radial-gradient(circle at 18% 12%, rgba(68,138,125,0.12), transparent 32%), radial-gradient(circle at 88% 36%, rgba(229,124,110,0.12), transparent 30%)',
          }}
        />
        <div className="absolute left-5 right-5 top-[9.75rem] h-px bg-gradient-to-r from-transparent via-[#448a7d]/28 to-transparent pointer-events-none" />
        <motion.div
          className="relative z-10 px-5"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.52, ease: EASE_OUT_EXPO }}
        >
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-[#448a7d] font-black text-[9px] uppercase tracking-[0.34em]">Our Promise</p>
              <h2 className="mt-2 text-[clamp(2.1rem,10vw,2.75rem)] font-black font-cabinet tracking-tight leading-[0.95]">
                The care loop.
              </h2>
            </div>
            <span className="mb-1 hidden rounded-full border border-[#448a7d]/15 bg-white/55 px-3 py-2 text-[8px] font-black uppercase tracking-[0.18em] text-[#448a7d] min-[390px]:inline-flex">
              4 steps
            </span>
          </div>
          <p className="mt-3 max-w-[22rem] text-[12px] font-medium leading-relaxed text-[#5a4030]/68">
            A private note moves through human review, then becomes a useful signal for someone else.
          </p>
          <div className="mt-5 grid grid-cols-4 gap-1.5">
            {promiseSteps.map((step, idx) => (
              <div
                key={step}
                className="rounded-full border border-[#448a7d]/15 bg-white/60 px-1.5 py-2 text-center text-[7px] font-black uppercase tracking-[0.07em] text-[#448a7d] shadow-[0_8px_18px_-16px_rgba(30,58,52,0.45)]"
              >
                <span className="mr-1 text-[#e57c6e]">0{idx + 1}</span>{step}
              </div>
            ))}
          </div>
        </motion.div>

        <div
          className="relative z-10 mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-5 [perspective:900px] [&::-webkit-scrollbar]:hidden"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorX: 'contain',
            scrollbarWidth: 'none',
            scrollPaddingInline: '1.25rem',
          }}
        >
          {promisePanels.map((panel, idx) => (
            <motion.article
              key={panel.eyebrow}
              className="snap-center shrink-0 overflow-hidden rounded-[1.15rem] border border-[#c8b49a]/35 bg-[#fffaf0] w-[84vw] max-w-[380px] shadow-[0_24px_54px_-32px_rgba(80,50,20,0.34)]"
              style={{ scrollSnapStop: 'always' }}
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.58 }}
              transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
            >
              <div className="relative flex h-[clamp(156px,43vw,200px)] items-center justify-center overflow-hidden bg-[#fff7e8]">
                <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: panel.color }} />
                <div className="absolute left-5 right-5 top-5 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#e57c6e]" />
                  <span className="h-px flex-1 bg-[#448a7d]/18" />
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#448a7d]/65">Step 0{idx + 1}</span>
                </div>
                <div className="absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_50%_25%,rgba(68,138,125,0.14),transparent_45%)]" />
                <CardIllustration variant={panel.illustration} animated={false} />
              </div>
              <div
                className="relative min-h-[264px] p-4"
                style={{ background: `linear-gradient(160deg, ${panel.color} 0%, ${panel.color} 72%, rgba(30,58,52,0.92) 100%)` }}
              >
                <span
                  className="absolute bottom-1 right-4 font-black font-cabinet text-[5.25rem] leading-none text-white/[0.075] select-none pointer-events-none"
                  aria-hidden="true"
                >
                  0{idx + 1}
                </span>
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />
                <div className="relative z-10 flex h-full min-h-[230px] flex-col justify-between gap-4 rounded-[0.95rem] border border-white/[0.24] bg-[#fff8ec] p-4 shadow-[0_16px_34px_-24px_rgba(0,0,0,0.55)]">
                  <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#448a7d]/16 to-transparent" />
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#e57c6e]/14 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-[#a85240]">
                        0{idx + 1}
                      </span>
                      <span className="rounded-full border border-[#448a7d]/18 bg-white px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-[#448a7d]">
                        {panel.eyebrow.split('/')[1]?.trim() ?? panel.eyebrow}
                      </span>
                    </div>
                    <h3 className="text-[clamp(1.28rem,6.4vw,1.68rem)] font-black font-cabinet leading-[1.02] tracking-tight text-[#1e3a34]">
                      {panel.title}
                    </h3>
                    <div className="mt-3 h-px w-12" style={{ backgroundColor: panel.color, opacity: 0.42 }} />
                    <p className="mt-3 text-[12px] text-[#314f48] font-medium leading-[1.55]">
                      {panel.desc}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {panel.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-xl border border-[#448a7d]/16 bg-[#eef7f3] px-2 py-2.5 text-center text-[7.2px] font-black uppercase tracking-[0.1em] text-[#2d5a52]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="relative z-10 -mt-1 flex items-center justify-center gap-3 px-5 text-[#448a7d]">
          <div className="h-px w-10 bg-[#448a7d]/35" />
          <div
            className="flex items-center gap-2 rounded-full border border-[#448a7d]/16 bg-white/50 px-3 py-2 text-[8px] font-black uppercase tracking-[0.18em]"
          >
            <span>Swipe</span>
            <span aria-hidden="true">→</span>
          </div>
          <div className="h-px w-10 bg-[#448a7d]/35" />
        </div>
        <div className="relative z-10 mt-4 flex justify-center gap-1.5">
          {promisePanels.map((panel, idx) => (
            <span
              key={panel.eyebrow}
              className="h-1.5 rounded-full"
              style={{ width: idx === 0 ? '1.25rem' : '0.375rem', backgroundColor: idx === 0 ? panel.color : 'rgba(68,138,125,0.22)' }}
              aria-hidden="true"
            />
          ))}
        </div>
        <div className="relative z-10 mt-3 flex flex-col items-center gap-1 text-[#5a4030]/45">
          <span className="text-[8px] font-black uppercase tracking-[0.22em]">Then scroll</span>
          <span className="text-sm leading-none" aria-hidden="true">↓</span>
        </div>
      </section>

      {/* Horizontal Promise Journey */}
      <section
        ref={promiseRef}
        className="relative z-10 hidden text-[#1e3a34] lg:block"
        style={{ position: 'relative', height: promiseTravel ? `calc(100vh + ${promiseTravel}px)` : '100vh', backgroundImage: 'linear-gradient(to bottom, transparent 100vh, #f3f1e8 100vh)' }}
      >
        <div ref={promiseViewportRef} className="sticky top-0 h-screen overflow-hidden">
          <div className="absolute inset-0 bg-[#f3f1e8]/82 backdrop-blur-[3px] pointer-events-none" />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-[12vw] top-[-8vh] h-[112vh] w-[34vw] -skew-x-12 bg-[#f5ead4]/[0.36]" />
            <motion.div
              className="absolute right-[6vw] top-[16vh] h-[68vh] w-px bg-gradient-to-b from-transparent via-[#e57c6e]/[0.28] to-transparent"
              style={{ opacity: promiseGlow, x: promiseDrift }}
            />
            <div
              className="absolute inset-0 opacity-[0.38]"
              style={{
                backgroundImage: 'linear-gradient(rgba(68,138,125,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(68,138,125,0.08) 1px, transparent 1px)',
                backgroundSize: '54px 54px',
              }}
            />
            <motion.div
              className="absolute bottom-12 left-[8vw] right-[8vw] h-[3px] origin-left rounded-full bg-gradient-to-r from-[#e57c6e] via-[#448a7d] to-[#1e3a34]"
              style={{ scaleX: promiseLineScale }}
            />
          </div>

          <div ref={gridRef} className="relative z-10 flex h-full flex-col pt-14 pb-3 md:pt-24 md:pb-7">
            <div className="flex-shrink-0 px-6 md:px-[8vw]">
              <motion.div
                className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
                initial={{ opacity: 0, y: 28 }}
                animate={gridInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
                transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
              >
                <div>
                  <p className="text-[#448a7d] font-black text-[9px] md:text-[10px] uppercase tracking-[0.5em]">Our Promise</p>
                  <h2 className="mt-2 text-3xl md:text-5xl font-black font-cabinet tracking-tight leading-[0.95]">
                    The care loop.
                  </h2>
                </div>
                <p className="hidden md:block max-w-md text-sm font-medium leading-relaxed text-[#5a4030]/[0.60]">
                  A private note moves through human review, then becomes a useful signal for someone else.
                </p>
              </motion.div>
              <div className="mt-6 hidden lg:grid grid-cols-4 gap-2 max-w-3xl">
                {promiseSteps.map((step, idx) => (
                  <div
                    key={step}
                    className="rounded-full border border-[#448a7d]/15 bg-white/45 px-3 py-2 text-[8px] font-black uppercase tracking-[0.16em] text-[#448a7d] shadow-[0_10px_24px_-20px_rgba(30,58,52,0.38)]"
                  >
                    <span className="mr-2 text-[#e57c6e]">0{idx + 1}</span>{step}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex min-h-0 flex-1 items-center">
              <motion.div
                ref={promiseTrackRef}
                className="flex w-max gap-4 px-6 will-change-transform md:gap-7 md:px-[8vw]"
                style={{ x: promiseX }}
              >
                {promisePanels.map((panel, idx) => (
                  <motion.article
                    key={panel.eyebrow}
                    className="group relative grid shrink-0 overflow-hidden rounded-[1.15rem] border border-[#c8b49a]/30
                      h-[clamp(350px,50dvh,500px)] w-[88vw] max-w-[900px]
                      grid-cols-1 grid-rows-[5fr_7fr]
                      shadow-[0_30px_78px_-44px_rgba(80,50,20,0.26)]
                      md:h-[clamp(370px,54dvh,510px)] md:w-[min(68vw,900px)]
                      md:grid-cols-[1fr_1fr] md:grid-rows-1
                      xl:w-[min(56vw,920px)]"
                    whileHover={{ y: -6 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                  >
                    {/* Illustration panel — top on mobile, left on desktop */}
                    <div className="relative flex items-center justify-center bg-[#fdf6eb] overflow-hidden h-full">
                      <div className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: panel.color }} />
                      <div className="absolute left-6 top-6 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#e57c6e]" />
                        <span className="text-[8px] font-black uppercase tracking-[0.22em] text-[#448a7d]/65">Step 0{idx + 1}</span>
                      </div>
                      <CardIllustration variant={panel.illustration} />
                    </div>

                    {/* Text panel — bottom on mobile, right on desktop */}
                    <div
                      className="relative flex min-h-0 flex-col justify-between p-4 md:p-8 overflow-hidden"
                      style={{ backgroundColor: panel.color }}
                    >
                      {/* Watermark number */}
                      <span
                        className="absolute bottom-2 right-4 font-black font-cabinet leading-none select-none pointer-events-none
                          text-[4rem] md:text-[7.5rem]"
                        style={{ color: 'rgba(255,255,255,0.08)' }}
                        aria-hidden="true"
                      >
                        0{idx + 1}
                      </span>

                      {/* Content */}
                      <div className="relative z-10 flex h-full flex-col justify-between gap-4 rounded-[1rem] border border-white/[0.2] bg-[#fff8ec] p-5 md:p-6 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.55)]">
                        <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[#448a7d]/16 to-transparent" />
                        <div>
                          <div className="mb-3 md:mb-5 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#e57c6e]/14 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-[#a85240]">
                              0{idx + 1}
                            </span>
                            <span className="rounded-full border border-[#448a7d]/18 bg-white px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-[#448a7d]">
                              {panel.eyebrow.split('/')[1]?.trim() ?? panel.eyebrow}
                            </span>
                          </div>
                          <h3 className="text-[1.35rem] md:text-[2.1rem] font-black font-cabinet leading-[0.96] tracking-tight text-[#1e3a34]">
                            {panel.title}
                          </h3>
                          <div className="mt-4 h-px w-14" style={{ backgroundColor: panel.color, opacity: 0.42 }} />
                          <p className="mt-2 text-[12px] md:text-[14px] text-[#314f48] font-medium leading-relaxed line-clamp-3 md:line-clamp-none">
                            {panel.desc}
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {panel.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-xl border border-white/[0.14] bg-white/[0.09] px-3 py-2
                                text-[8px] font-black uppercase tracking-[0.17em] text-[#2d5a52]"
                              style={{ background: 'rgba(68,138,125,0.09)', borderColor: 'rgba(68,138,125,0.16)' }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            </div>

            <div className="flex-shrink-0 px-6 md:px-[8vw]">
              <div className="flex items-center justify-between gap-4 text-[9px] md:text-[10px] font-black uppercase tracking-[0.26em] text-[#7a5535]/[0.42]">
                <span className="md:hidden">Scroll down · care moves sideways</span>
                <span className="hidden md:inline">Hold scroll</span>
                <span className="hidden md:inline">Care moves sideways</span>
                <span className="hidden md:inline">Release after the last panel</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default AboutMap;
