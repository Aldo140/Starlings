import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion';
import { apiService } from '../services/api.ts';
import { ICONS, EASE_OUT_EXPO } from '../constants.tsx';
import { QAItem } from '../types.ts';
import { QASkeleton, QAThreadCard } from '../components/QAThread.tsx';
import CardIllustration, { type IllustrationVariant } from '../components/CardIllustration.tsx';
import GalleryImage from '../components/GalleryImage.tsx';

/* ── Landing Page ───────────────────────────────────────────────────────── */

const Landing: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [isSubmittingQ, setIsSubmittingQ] = useState(false);
  const [qSuccess, setQSuccess] = useState(false);
  const [qError, setQError] = useState('');
  const [approvedQA, setApprovedQA] = useState<QAItem[]>([]);
  const [isLoadingQA, setIsLoadingQA] = useState(false);
  const [showAnsweredQA, setShowAnsweredQA] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [promiseTravel, setPromiseTravel] = useState(0);
  const [galleryPhotoStep, setGalleryPhotoStep] = useState(-1);

  const gridRef = useRef<HTMLDivElement>(null);
  const gridInView = useInView(gridRef, { once: true, margin: '-80px' });

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, -40]);

  const qaRef = useRef<HTMLElement>(null);
  const qaInView = useInView(qaRef, { once: true, margin: '-60px' });

  const galleryRef = useRef<HTMLElement>(null);
  const galleryInView = useInView(galleryRef, { once: true, amount: 0.05 });
  const { scrollYProgress: galleryScrollProgress } = useScroll({ target: galleryRef, offset: ['start start', 'end end'] });
  // Desktop: col A fast, col B slow. Both climb up — speed contrast = depth.
  const col1YRawDesk = useTransform(galleryScrollProgress, [0, 1], [160, -700]);
  const col2YRawDesk = useTransform(galleryScrollProgress, [0, 1], [80, -500]);
  // Mobile: single full-width filmstrip — steady parallax climb
  const col1YRawMob = useTransform(galleryScrollProgress, [0, 1], [120, -520]);
  const col1YDesk = useSpring(col1YRawDesk, { stiffness: 72, damping: 17, restDelta: 0.001 });
  const col2YDesk = useSpring(col2YRawDesk, { stiffness: 72, damping: 17, restDelta: 0.001 });
  const col1YMob = useSpring(col1YRawMob, { stiffness: 72, damping: 17, restDelta: 0.001 });
  // Subtle counter-rotation — col1 tilts CW, col2 CCW as you scroll. Max ±1.4°, spring-smoothed.
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

  const promiseRef = useRef<HTMLElement>(null);
  const promiseViewportRef = useRef<HTMLDivElement>(null);
  const promiseTrackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: promiseProgress } = useScroll({ target: promiseRef, offset: ['start start', 'end end'] });
  const promiseDrift = useTransform(promiseProgress, [0, 1], [-70, 70]);
  const promiseGlow = useTransform(promiseProgress, [0, 0.5, 1], [0.22, 0.58, 0.22]);
  const promiseX = useTransform(promiseProgress, [0, 1], [0, -promiseTravel]);
  const promiseLineScale = useTransform(promiseProgress, [0, 1], [0, 1]);

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

  const openAnsweredQA = async () => {
    setShowAnsweredQA(true);
    if (approvedQA.length > 0 || isLoadingQA) return;

    setIsLoadingQA(true);
    const items = await apiService.getApprovedQA();
    setApprovedQA(items);
    setIsLoadingQA(false);
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    if (apiService.hasBannedContent(question)) {
      setShowSafetyModal(true);
      return;
    }
    setIsSubmittingQ(true);
    setQError('');
    try {
      const result = await apiService.submitQuestion(question);
      if (result.flagged) {
        setQError('Your question contains flagged words and cannot be submitted. Please revise it.');
      } else if (result.success) {
        setQSuccess(true);
        setQuestion('');
      } else {
        setQError(result.error || 'Your question could not be saved. Please try again.');
      }
    } catch (error) {
      console.error('Question submission failed:', error);
      setQError('Your question could not be saved. Please try again.');
    } finally {
      setIsSubmittingQ(false);
    }
  };

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

  const mobileGalleryPhotos = [
    { src: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?auto=format&fit=crop&q=80&w=700', label: 'Hope' },
    { src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=700', label: 'Together' },
    { src: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&q=80&w=700', label: 'Resilience' },
    { src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=700', label: 'Community' },
    { src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=700', label: 'Growth' },
    { src: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=700', label: 'Support' },
  ];

  const questionSection = (
    <section ref={qaRef} id="ask-question" className="relative py-20 md:py-32 overflow-hidden" style={{ background: 'linear-gradient(150deg, #eaf6f1 0%, #f0f9f5 45%, #e6f4ef 100%)' }}>

      {/* ── Atmospheric Background ─────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Animated sage-green blobs */}
        <motion.div
          className="absolute bottom-[-12%] left-[-10%] hidden w-[55vw] h-[55vw] max-w-[640px] rounded-full blur-3xl md:block"
          style={{ background: 'radial-gradient(circle, #b8ddd5 0%, #c8e8e0 55%, transparent 100%)' }}
          animate={{ opacity: [0.5, 0.7, 0.5], scale: [1, 1.07, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[-10%] right-[-8%] hidden w-[40vw] h-[40vw] max-w-[460px] rounded-full blur-3xl md:block"
          style={{ background: 'radial-gradient(circle, #9ecfc3 0%, #b8e0d8 60%, transparent 100%)' }}
          animate={{ opacity: [0.35, 0.55, 0.35], scale: [1, 1.06, 1] }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
        />
        <motion.div
          className="absolute top-[38%] right-[10%] hidden w-[18vw] h-[18vw] max-w-[220px] rounded-full blur-3xl md:block"
          style={{ background: 'radial-gradient(circle, rgba(229,124,110,0.22) 0%, transparent 70%)' }}
          animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.12, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />

        {/* Dot-matrix grid */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={qaInView ? { opacity: 1 } : {}}
          transition={{ duration: 2.5, ease: EASE_OUT_EXPO }}
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(68,138,125,0.065) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* ── Starling silhouettes drifting across the section ── */}
        {([
          { x: '9%',  y: '12%', w: 20, delay: 0,    dur: 14, dy: -24, dx: 18  },
          { x: '20%', y: '8%',  w: 13, delay: 0.9,  dur: 18, dy: -14, dx: 8   },
          { x: '33%', y: '6%',  w: 24, delay: 1.7,  dur: 11, dy: -30, dx: 22  },
          { x: '62%', y: '4%',  w: 16, delay: 0.4,  dur: 16, dy: -20, dx: -10 },
          { x: '76%', y: '8%',  w: 22, delay: 1.3,  dur: 12, dy: -26, dx: -16 },
          { x: '87%', y: '17%', w: 12, delay: 2.2,  dur: 20, dy: -13, dx: -8  },
          { x: '52%', y: '82%', w: 14, delay: 0.7,  dur: 15, dy: 18,  dx: 12  },
          { x: '7%',  y: '75%', w: 18, delay: 2.0,  dur: 13, dy: 22,  dx: -14 },
        ] as { x: string; y: string; w: number; delay: number; dur: number; dy: number; dx: number }[]).map((b, i) => (
          <motion.div
            key={i}
            className="absolute hidden md:block"
            style={{ left: b.x, top: b.y }}
            initial={{ opacity: 0 }}
            animate={qaInView ? {
              opacity: [0, 0.2, 0.16, 0.2, 0],
              y: [0, b.dy * 0.6, b.dy],
              x: [0, b.dx * 0.5, b.dx],
            } : {}}
            transition={{ duration: b.dur, delay: b.delay, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }}
          >
            {/* Starling in-flight M-wing silhouette */}
            <svg width={b.w} height={Math.round(b.w * 0.55)} viewBox="0 0 28 15" fill="none" aria-hidden="true">
              <path
                d="M14 7.5 C11.5 5 8.5 3 5.5 3.5 C7.5 4.2 9.5 5.8 11 7.5 C9 7 7 6.6 5 7.2 C7.2 6.8 9.5 8 11.5 7.8 L14 8.5 L16.5 7.8 C18.5 8 20.8 6.8 23 7.2 C21 6.6 19 7 17 7.5 C18.5 5.8 20.5 4.2 22.5 3.5 C19.5 3 16.5 5 14 7.5Z"
                fill="#1e3a34"
              />
            </svg>
          </motion.div>
        ))}

        {/* Large decorative ? — desktop only */}
        <motion.div
          className="absolute font-cabinet font-black select-none leading-none hidden lg:block"
          style={{
            right: '2%', top: '6%',
            fontSize: 'clamp(160px, 21vw, 290px)',
            color: 'rgba(68,138,125,0.06)',
            letterSpacing: '-0.05em',
          }}
          initial={{ opacity: 0, scale: 0.72, rotate: -10 }}
          animate={qaInView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
          transition={{ duration: 1.5, delay: 0.15, ease: EASE_OUT_EXPO }}
        >
          ?
        </motion.div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="container mx-auto px-6 max-[400px]:px-4 max-w-7xl relative z-10">

        {/* ── ROW 1: Editorial header — heading left, desc+steps right ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-end mb-10 lg:mb-14">

          {/* Giant heading — col 1–7 */}
          <div className="lg:col-span-7 space-y-5">
            {/* Eyebrow with mini starling glyph */}
            <motion.div
              initial={{ x: -24, opacity: 0 }}
              animate={qaInView ? { x: 0, opacity: 1 } : {}}
              transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
            >
              <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.32em] text-[#448a7d]">
                <svg width="22" height="9" viewBox="0 0 28 15" fill="none" aria-hidden="true">
                  <path d="M14 7.5 C11.5 5 8.5 3 5.5 3.5 C7.5 4.2 9.5 5.8 11 7.5 C9 7 7 6.6 5 7.2 C7.2 6.8 9.5 8 11.5 7.8 L14 8.5 L16.5 7.8 C18.5 8 20.8 6.8 23 7.2 C21 6.6 19 7 17 7.5 C18.5 5.8 20.5 4.2 22.5 3.5 C19.5 3 16.5 5 14 7.5Z" fill="#448a7d"/>
                </svg>
                Community Q&amp;A
              </span>
            </motion.div>

            <h2 className="font-black font-cabinet text-[#1e3a34] tracking-tight leading-[0.9]" style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)' }}>
              <motion.span
                className="block"
                initial={{ opacity: 0.12, scale: 1.04 }}
                animate={qaInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.95, ease: EASE_OUT_EXPO }}
              >
                Ask what
              </motion.span>
              <motion.span
                className="block text-[#e57c6e] italic relative"
                initial={{ y: 80, opacity: 0 }}
                animate={qaInView ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 0.78, delay: 0.22, type: 'spring', stiffness: 200, damping: 22 }}
              >
                stays with you.
                {/* Animated wavy underline */}
                <svg
                  className="absolute left-0 w-full pointer-events-none"
                  style={{ bottom: '-5px' }}
                  height="11"
                  viewBox="0 0 400 11"
                  preserveAspectRatio="none"
                  fill="none"
                  aria-hidden="true"
                >
                  <motion.path
                    d="M0 7 Q50 2 100 7 Q150 12 200 7 Q250 2 300 7 Q350 12 400 7"
                    stroke="#e57c6e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={qaInView ? { pathLength: 1, opacity: 0.5 } : {}}
                    transition={{ duration: 1.0, delay: 1.0, ease: EASE_OUT_EXPO }}
                  />
                </svg>
              </motion.span>
            </h2>
          </div>

          {/* Description + steps — col 8–12, bottom-aligned */}
          <div className="lg:col-span-5 space-y-6 lg:pb-2">
            <motion.p
              className="text-base md:text-lg text-[#1e3a34]/55 font-light leading-relaxed"
              initial={{ opacity: 0, y: 18 }}
              animate={qaInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.42, ease: EASE_OUT_EXPO }}
            >
              Some questions need a place to land before they become words. Write anonymously — answers come from people who've been there.
            </motion.p>

            {/* Steps — 01 → 02 → 03 */}
            <div className="flex items-start gap-2">
              {[
                { num: '01', label: 'Ask anonymously', desc: 'No account needed' },
                { num: '02', label: 'We review it', desc: "Safe before it's seen" },
                { num: '03', label: 'Community answers', desc: 'Real perspectives' },
              ].map((step, idx) => (
                <React.Fragment key={step.num}>
                  <motion.div
                    className="flex flex-col items-center text-center flex-1 min-w-[62px]"
                    initial={{ opacity: 0, y: 14 }}
                    animate={qaInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.58 + idx * 0.1, ease: EASE_OUT_EXPO }}
                  >
                    <span className="text-[11px] font-black text-[#448a7d] tabular-nums mb-0.5">{step.num}</span>
                    <span className="text-[10px] font-black text-[#1e3a34] uppercase tracking-[0.12em] leading-tight">{step.label}</span>
                    <span className="text-[9px] font-medium text-[#1e3a34]/35 mt-0.5 leading-tight">{step.desc}</span>
                  </motion.div>
                  {idx < 2 && (
                    <motion.div
                      className="flex items-center mt-[10px] flex-shrink-0"
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={qaInView ? { opacity: 1, scaleX: 1 } : {}}
                      transition={{ duration: 0.4, delay: 0.7 + idx * 0.1, ease: EASE_OUT_EXPO }}
                      style={{ originX: 0 }}
                    >
                      <svg width="14" height="8" viewBox="0 0 14 8" fill="none" aria-hidden="true">
                        <path d="M1 4h10M8 1l3 3-3 3" stroke="rgba(68,138,125,0.4)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* ── Divider with perched starling ── */}
        <motion.div
          className="relative mb-10 lg:mb-12 hidden lg:block"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={qaInView ? { scaleX: 1, opacity: 1 } : {}}
          transition={{ duration: 1.1, delay: 0.62, ease: EASE_OUT_EXPO }}
          style={{ originX: 0 }}
        >
          <div className="h-px bg-gradient-to-r from-[#c8e0da]/80 via-[#448a7d]/20 to-transparent" />
          {/* Starling perched at 58% of the line */}
          <motion.div
            className="absolute -top-3 left-[58%]"
            initial={{ opacity: 0, y: 8, scale: 0.5 }}
            animate={qaInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.55, delay: 1.45, type: 'spring', stiffness: 280, damping: 22 }}
          >
            <motion.svg
              width="26" height="22" viewBox="0 0 28 24" fill="none" aria-hidden="true"
              animate={{ rotate: [-2, 2, -2] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Perched starling: body ellipse + head circle + tail + feet */}
              <ellipse cx="13" cy="13" rx="6" ry="4.5" fill="#1e3a34" opacity="0.2"/>
              <circle cx="11" cy="9.5" r="2.8" fill="#1e3a34" opacity="0.2"/>
              {/* tail */}
              <path d="M18 15 L21 17.5" stroke="#1e3a34" strokeWidth="1.5" strokeLinecap="round" opacity="0.18"/>
              {/* feet */}
              <path d="M10 17.5 L9 20 M13 18 L13 21 M13 21 L11 22 M13 21 L15 22" stroke="#1e3a34" strokeWidth="1.2" strokeLinecap="round" opacity="0.18"/>
              {/* beak */}
              <path d="M8.5 9 L6 8" stroke="#1e3a34" strokeWidth="1.2" strokeLinecap="round" opacity="0.18"/>
            </motion.svg>
          </motion.div>
        </motion.div>

        {/* ── ROW 2: Form left, Illustration right ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">

          {/* Form card — col 1–7 */}
          <motion.div
            className="lg:col-span-7"
            initial={{ y: 60, opacity: 0 }}
            animate={qaInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.9, delay: 0.3, type: 'spring', stiffness: 130, damping: 20 }}
          >
            <div style={{ perspective: '1400px' }}>
              <motion.div
                whileHover={{ rotateY: 1.2, rotateX: -0.8, scale: 1.008 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                style={{ transformStyle: 'preserve-3d' }}
                className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_36px_90px_-36px_rgba(30,58,52,0.24)] border border-[#c8e0da] relative overflow-hidden"
              >
                {/* Corner decoration */}
                <div className="absolute top-0 right-0 w-56 h-56 pointer-events-none overflow-hidden rounded-[2.5rem]">
                  <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-bl from-[#d4eae6]/55 via-[#e2f2ee]/30 to-transparent rounded-bl-[130%]" />
                  <svg className="absolute top-5 right-5 opacity-[0.17]" width="58" height="58" viewBox="0 0 58 58" fill="none" aria-hidden="true">
                    <rect x="2" y="2" width="46" height="36" rx="12" stroke="#448a7d" strokeWidth="2.2"/>
                    <path d="M11 48 L19 38 H34" stroke="#448a7d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="17" x2="36" y2="17" stroke="#448a7d" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="12" y1="25" x2="28" y2="25" stroke="#448a7d" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>

                {qSuccess ? (
                  <div className="text-center py-14 animate-reveal">
                    <div className="w-24 h-24 bg-gradient-to-br from-[#448a7d] to-[#2d5a52] text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl transform hover:scale-110 transition-transform rotate-3">
                      <div className="scale-[2.5]">{ICONS.Heart}</div>
                    </div>
                    <h3 className="text-3xl font-black text-[#1e3a34] mb-4">Question Submitted</h3>
                    <p className="text-gray-500 font-medium text-lg mb-10 max-w-sm mx-auto">We'll review your question and it may be answered to help others.</p>
                    <button onClick={() => setQSuccess(false)} className="px-10 py-4 bg-gray-50 text-[#1e3a34] font-black rounded-full hover:bg-gray-100 border border-gray-200 transition-colors uppercase tracking-widest text-sm shadow-sm active:scale-95">Ask Another</button>
                  </div>
                ) : (
                  <form onSubmit={handleQuestionSubmit} className="space-y-6 relative z-10">
                    <div className="space-y-3">
                      <label htmlFor="question" className="block text-[#1e3a34] font-black text-xl tracking-tight">What's on your mind?</label>
                      <textarea
                        id="question"
                        required
                        value={question}
                        onChange={e => setQuestion(e.target.value)}
                        placeholder="Share your question anonymously..."
                        className="w-full p-5 bg-[#f4faf7] border border-[#c8e0da] focus:border-[#448a7d]/50 rounded-2xl min-h-[130px] md:min-h-[150px] text-base font-medium text-[#1e3a34] transition-all shadow-[inset_0_2px_8px_rgba(30,58,52,0.05)] focus:outline-none focus:bg-white focus:shadow-[inset_0_2px_8px_rgba(30,58,52,0.03),0_0_0_3px_rgba(68,138,125,0.15)] placeholder-[#1e3a34]/30 resize-none selection:bg-[#448a7d] selection:text-white"
                      />
                    </div>
                    {qError && (
                      <div className="p-4 bg-red-50/80 border border-red-100 text-red-600 rounded-2xl font-bold text-sm animate-reveal flex items-center gap-3">
                        {ICONS.AlertCircle} {qError}
                      </div>
                    )}
                    {/* Footer: anonymous LEFT + coral CTA RIGHT */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-5 border-t border-[#c8e0da]">
                      <span className="inline-flex items-start sm:items-center gap-2 min-w-0">
                        <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden="true">
                          <rect x="1" y="5" width="8" height="7" rx="2" stroke="#448a7d" strokeWidth="1.4"/>
                          <path d="M3 5V3.5a2 2 0 0 1 4 0V5" stroke="#448a7d" strokeWidth="1.4" strokeLinecap="round"/>
                        </svg>
                        <span className="text-[9px] font-black uppercase tracking-[0.16em] sm:tracking-[0.22em] text-[#448a7d]/65 leading-relaxed">Anonymous · reviewed before posting</span>
                      </span>
                      <button
                        type="submit"
                        disabled={isSubmittingQ || !question.trim()}
                        className="relative group overflow-hidden w-full sm:w-auto flex-shrink-0 px-7 py-3.5 bg-[#e57c6e] text-white rounded-full font-black text-xs uppercase tracking-widest shadow-[0_10px_28px_-8px_rgba(229,124,110,0.52)] hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                        <span className="relative flex items-center gap-2">
                          {isSubmittingQ ? 'Sending...' : 'Send Question'}
                          {!isSubmittingQ && <span className="group-hover:translate-x-0.5 transition-transform">{ICONS.ArrowRight}</span>}
                        </span>
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          </motion.div>

          {/* Illustration + answered card — col 8–12 */}
          <div className="lg:col-span-5 flex flex-col gap-5 max-w-sm mx-auto w-full sm:max-w-none lg:max-w-none lg:mx-0">

            {/* Illustration with floating decorations */}
            <motion.div
              className="relative w-full"
              aria-hidden="true"
              initial={{ y: 52, opacity: 0, rotate: 5, scale: 0.94 }}
              animate={qaInView ? { y: 0, opacity: 1, rotate: 0, scale: 1 } : {}}
              transition={{ duration: 0.95, delay: 0.38, type: 'spring', stiffness: 125, damping: 18 }}
            >
              {/* Floating teal speech bubble — top-left */}
              <motion.div
                className="absolute -top-4 left-[6%] z-10 w-10 h-10 rounded-2xl bg-[#d4eae6] border border-[#b8d9d1] shadow-[0_6px_18px_-6px_rgba(30,58,52,0.18)] hidden sm:flex items-center justify-center"
                initial={{ opacity: 0, scale: 0, y: 10 }}
                animate={qaInView ? { opacity: 1, scale: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 1.0, type: 'spring', stiffness: 280, damping: 20 }}
              >
                <motion.div
                  animate={{ y: [0, -5, 0], rotate: [-3, 3, -3] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <rect x="1.5" y="1.5" width="10" height="8" rx="3" stroke="#448a7d" strokeWidth="1.3"/>
                    <path d="M4 9.5l1.5 3" stroke="#448a7d" strokeWidth="1.3" strokeLinecap="round"/>
                    <line x1="4" y1="4.5" x2="8.5" y2="4.5" stroke="#448a7d" strokeWidth="1.2" strokeLinecap="round"/>
                    <line x1="4" y1="6.5" x2="7" y2="6.5" stroke="#448a7d" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </motion.div>
              </motion.div>

              {/* Floating coral chat bubble — right */}
              <motion.div
                className="absolute top-[30%] -right-5 z-10 w-9 h-9 rounded-xl bg-[#fbd6d1]/90 border border-[#fbd6d1] shadow-[0_6px_18px_-6px_rgba(229,124,110,0.28)] hidden sm:flex items-center justify-center"
                initial={{ opacity: 0, scale: 0, x: 10 }}
                animate={qaInView ? { opacity: 1, scale: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 1.15, type: 'spring', stiffness: 280, damping: 20 }}
              >
                <motion.div
                  animate={{ y: [0, 8, 0], rotate: [4, -4, 4] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M7 1.5C4.015 1.5 1.5 4.015 1.5 7s2.515 5.5 5.5 5.5a5.47 5.47 0 0 0 2.9-.832l2.6.832-.832-2.6A5.47 5.47 0 0 0 12.5 7c0-2.985-2.515-5.5-5.5-5.5z" stroke="#e57c6e" strokeWidth="1.2"/>
                  </svg>
                </motion.div>
              </motion.div>

              {/* Floating dot grid — bottom-left */}
              <motion.div
                className="absolute bottom-[15%] -left-4 z-10 hidden sm:block"
                initial={{ opacity: 0, scale: 0 }}
                animate={qaInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 1.25, type: 'spring', stiffness: 300, damping: 22 }}
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }}
                  className="flex flex-col gap-1.5"
                >
                  {[0,1,2].map(i => (
                    <div key={i} className="flex gap-1.5">
                      {[0,1,2].map(j => (
                        <div key={j} className="w-1 h-1 rounded-full bg-[#448a7d]" style={{ opacity: 0.15 + (i + j) * 0.04 }} />
                      ))}
                    </div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Glowing radial behind illustration */}
              <motion.div
                className="absolute inset-0 rounded-3xl -z-[1]"
                style={{ background: 'radial-gradient(ellipse 80% 70% at 52% 50%, rgba(68,138,125,0.14) 0%, transparent 70%)' }}
                animate={{ opacity: [0.65, 1, 0.65], scale: [0.94, 1.06, 0.94] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Illustration */}
              <motion.img
                src={`${import.meta.env.BASE_URL}images/asset-qna.png`}
                alt=""
                className="w-full h-auto relative z-[1]"
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>

            {/* Answered by community card */}
            <motion.div
              className="bg-white rounded-[1.75rem] p-5 border border-[#c8e0da] shadow-[0_14px_42px_-14px_rgba(30,58,52,0.2)] w-full"
              initial={{ opacity: 0, y: 22 }}
              animate={qaInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.6, type: 'spring', stiffness: 155, damping: 22 }}
              whileHover={{ y: -4, transition: { type: 'spring', stiffness: 380, damping: 28 } }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#d4eae6] flex items-center justify-center shrink-0">
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
                <motion.button
                  type="button"
                  onClick={showAnsweredQA ? () => setShowAnsweredQA(false) : openAnsweredQA}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#e8f4ef] border border-[#b8d9d1] text-[#1e3a34] font-black text-xs uppercase tracking-widest hover:bg-[#d4eae6] transition-colors shrink-0"
                >
                  {showAnsweredQA ? 'Hide' : 'Read answers'}
                  <motion.svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"
                    animate={{ rotate: showAnsweredQA ? 180 : 0 }}
                    transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
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
                transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
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
                  <div className="rounded-[2rem] border border-[#c8e0da] bg-white/60 backdrop-blur-sm p-10 text-center">
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

  return (
    <div className="relative bg-transparent min-h-screen flex flex-col">
      {showSafetyModal && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-[#1e3a34]/70 backdrop-blur-sm px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="landing-safety-modal-title"
            className="w-full max-w-lg bg-white rounded-[2rem] p-8 md:p-10 shadow-2xl border border-white"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#fbd6d1] text-[#e57c6e] flex items-center justify-center mb-6">
              {ICONS.Heart}
            </div>
            <h2 id="landing-safety-modal-title" className="text-2xl md:text-3xl font-black text-[#1e3a34] italic tracking-tight mb-4">
              You deserve support right now.
            </h2>
            <p className="text-gray-600 font-medium leading-relaxed mb-4">
              Thank you for trusting this space. What you wrote sounds like it may need more immediate support than this Q&A can offer.
            </p>
            <p className="text-gray-600 font-medium leading-relaxed mb-8">
              Starlings is not crisis support, but care is available. Please connect with a crisis or mental health support service, or revise your question so it does not include crisis details, contact information, or identifying details.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://www.starlings.ca/community-crisis-lines"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-6 py-4 rounded-2xl bg-[#1e3a34] text-white text-center font-black uppercase tracking-widest text-xs hover:bg-[#2d5a52] transition-colors"
              >
                Find Care Options
              </a>
              <button
                type="button"
                onClick={() => setShowSafetyModal(false)}
                className="flex-1 px-6 py-4 rounded-2xl bg-gray-100 text-[#1e3a34] font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors"
              >
                Revise Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section ref={heroRef} style={{ position: 'relative' }} className="relative w-full flex-grow flex flex-col items-center justify-center px-4 max-[400px]:px-3 overflow-hidden min-h-[calc(100vh-90px)] lg:min-h-screen py-4">
        <div className="absolute inset-0 pointer-events-none -z-10 bg-gradient-to-b from-white via-white/80 to-transparent" />

        <div className="container mx-auto max-w-5xl relative z-10 text-center flex flex-col items-center justify-center lg:justify-between space-y-3 md:space-y-4 lg:space-y-0 py-2 lg:pt-8 lg:pb-12 lg:h-screen">

          <div className="flex flex-col items-center justify-start space-y-2 md:space-y-3 flex-shrink-0">
            <div className="space-y-0 md:space-y-1 overflow-hidden">
              <motion.h1
                className="hero-title font-black text-[#1e3a34]"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
              >
                Find your
              </motion.h1>
              <motion.h1
                className="hero-title font-black hero-gradient italic pr-1"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.85, delay: 0.12, ease: EASE_OUT_EXPO }}
              >
                Community.
              </motion.h1>
            </div>

            <div className="max-w-xl mx-auto flex flex-col items-center gap-2 md:gap-3">
              <motion.p
                className="text-[11px] md:text-xl lg:text-2xl max-[400px]:text-[10px] text-gray-500 leading-relaxed font-light px-2"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.32, ease: EASE_OUT_EXPO }}
              >
                An anonymous space for individuals to share what helps them navigate a parent's or other family member's substance use challenges.
              </motion.p>

              {/* Compact single-line tagline */}
              <div className="flex items-center justify-center gap-1.5 md:gap-2.5">
                <motion.span
                  className="text-[10px] md:text-xs font-bold italic text-[#448a7d] whitespace-nowrap"
                  initial={{ x: -14, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5, ease: EASE_OUT_EXPO }}
                >
                  Shared wisdom.
                </motion.span>
                <motion.span
                  className="text-[#1e3a34]/20 text-[7px] md:text-[8px] flex-shrink-0 select-none"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.65, type: 'spring', stiffness: 400, damping: 20 }}
                >
                  ✦
                </motion.span>
                <motion.span
                  className="text-[10px] md:text-xs font-bold italic text-[#e57c6e] whitespace-nowrap"
                  initial={{ x: 14, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.72, duration: 0.5, ease: EASE_OUT_EXPO }}
                >
                  Collective strength.
                </motion.span>
              </div>
            </div>
          </div>

          {/* Hero image */}
          <motion.div
            className="w-full flex-grow flex items-center justify-center overflow-hidden max-h-[25vh] md:max-h-[35vh] min-h-[80px] md:min-h-[120px] relative"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, delay: 0.22, ease: EASE_OUT_EXPO }}
            style={{ y: imageY }}
          >
            <img
              src={`${import.meta.env.BASE_URL}landing-people.jpg`}
              className="w-full h-full object-contain mix-blend-multiply opacity-95"
              alt=""
            />
          </motion.div>

          {/* CTA Buttons — visible on all screens; on lg+ they sit below the fold */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 md:gap-4 w-full px-4 flex-shrink-0">
            {[
              <Link key="map" to="/map" className="group w-full sm:w-auto px-8 md:px-10 py-3 md:py-5 max-[400px]:px-6 max-[400px]:py-3 bg-[#1e3a34] text-white rounded-[2rem] font-bold text-sm md:text-xl max-[400px]:text-sm hover:bg-[#2d5a52] transition-all flex items-center justify-center gap-2 md:gap-3 shadow-[0_20px_40px_-10px_rgba(30,58,52,0.3)] hover:scale-[1.05] active:scale-95">
                Explore the Map <span className="group-hover:translate-x-1 transition-transform">{ICONS.ArrowRight}</span>
              </Link>,
              <button key="qa" type="button" onClick={() => document.getElementById('ask-question')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 md:px-10 py-3 md:py-5 max-[400px]:px-6 max-[400px]:py-3 bg-[#e57c6e] text-white rounded-[2rem] font-bold text-sm md:text-xl max-[400px]:text-sm hover:bg-[#d46a5c] transition-all flex items-center justify-center gap-2 md:gap-3 active:scale-95">
                Ask a Question {ICONS.MessageCircle}
              </button>,
              <Link key="share" to="/share" className="w-full sm:w-auto px-8 md:px-10 py-3 md:py-5 max-[400px]:px-6 max-[400px]:py-3 bg-white text-[#1e3a34] border-2 border-[#1e3a34]/10 rounded-[2rem] font-bold text-sm md:text-xl max-[400px]:text-sm hover:border-[#1e3a34]/40 transition-all flex items-center justify-center gap-2 md:gap-3 hover:bg-gray-50 active:scale-95">
                Share a Note or Resource {ICONS.Plus}
              </Link>
            ].map((btn, i) => (
              <motion.div key={i} className="w-full sm:w-auto" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.68 + i * 0.1, ease: EASE_OUT_EXPO }}>
                {btn}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Support Gallery — pinned scroll, viewport locked while images swim */}
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

              {/* ─── Content — z-20, flex-shrink-0 so illustration can fill remaining height ── */}
              <div
                className="relative z-20 flex-shrink-0 flex flex-col justify-start"
                style={{
                  paddingLeft: 'clamp(2.5rem, 4.2vw, 5.5rem)',
                  paddingRight: 'clamp(1.5rem, 2.4vw, 3rem)',
                  paddingTop: 'clamp(1.35rem, 4.6vh, 3.5rem)',
                  paddingBottom: 'clamp(0.35rem, 1.4vh, 1rem)',
                  maxHeight: '100%',
                  boxSizing: 'border-box',
                }}
              >

                {/* Eyebrow */}
                <motion.div
                  className="flex items-center gap-2.5"
                  style={{ marginBottom: 'clamp(0.55rem, 1.8vh, 1rem)' }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={galleryInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
                >
                  <motion.div className="h-px bg-[#448a7d]/70"
                    initial={{ width: 0 }} animate={galleryInView ? { width: 34 } : {}}
                    transition={{ duration: 0.6, delay: 0.1, ease: EASE_OUT_EXPO }}
                  />
                  <span className="w-1 h-1 rounded-full bg-[#448a7d]/80 flex-shrink-0" />
                  <span className="text-[9px] font-black uppercase tracking-[0.24em] text-[#448a7d]">About Starlings</span>
                </motion.div>

                {/* ── HEADLINE — editorial three-tier cascade ── */}
                {/* "A canvas for" whispers; "collective" builds; "healing." lands */}
                <h2
                  className="font-cabinet font-black tracking-tight max-w-[24rem]"
                  style={{ marginBottom: 'clamp(0.6rem, 1.9vh, 1rem)' }}
                >

                  {/* Lead-in: small, pulled back — creates anticipation */}
                  <span className="block overflow-hidden pt-4 pb-1" style={{ lineHeight: 1.45, minHeight: '1.75rem' }}>
                    <motion.span
                      className="block"
                      style={{ fontSize: 'clamp(1rem, min(1.35vw, 2.8vh), 1.55rem)', fontWeight: 700, color: 'rgba(26,53,48,0.58)' }}
                      initial={{ y: '110%' }}
                      animate={galleryInView ? { y: '0%' } : {}}
                      transition={{ duration: 0.62, delay: 0.08, ease: EASE_OUT_EXPO }}
                    >A canvas for</motion.span>
                  </span>

                  {/* Hero line 1: "collective" */}
                  <span className="block overflow-hidden py-1" style={{ lineHeight: 1.02 }}>
                    <motion.span
                      className="block italic"
                      style={{ fontSize: 'clamp(2.25rem, min(3.65vw, 7.2vh), 4.85rem)', color: '#1a3530' }}
                      initial={{ y: '112%' }}
                      animate={galleryInView ? { y: '0%' } : {}}
                      transition={{ duration: 0.75, delay: 0.15, ease: EASE_OUT_EXPO }}
                    >collective</motion.span>
                  </span>

                  {/* Hero line 2: "healing." — staggered, biggest weight */}
                  <span className="block overflow-hidden py-1" style={{ lineHeight: 1.02 }}>
                    <motion.span
                      className="block italic"
                      style={{ fontSize: 'clamp(2.25rem, min(3.65vw, 7.2vh), 4.85rem)', color: '#1a3530' }}
                      initial={{ y: '112%' }}
                      animate={galleryInView ? { y: '0%' } : {}}
                      transition={{ duration: 0.80, delay: 0.24, ease: EASE_OUT_EXPO }}
                    >healing.</motion.span>
                  </span>

                </h2>

                {/* Body copy — narrow, editorial */}
                <motion.p
                  className="leading-[1.68]"
                  style={{
                    fontSize: 'clamp(0.78rem, min(0.9vw, 2vh), 0.875rem)',
                    color: '#587068',
                    fontWeight: 360,
                    maxWidth: '320px',
                    marginBottom: 'clamp(0.7rem, 2.1vh, 1.25rem)',
                  }}
                  initial={{ opacity: 0, y: 12, filter: 'blur(3px)' }}
                  animate={galleryInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
                  transition={{ duration: 0.75, delay: 0.36, ease: EASE_OUT_EXPO }}
                >
                  You are not defined by what happens in your home. This space holds the strategies, stories, and quiet signals left behind by people who found a way through.
                </motion.p>

                {/* Stat cards — subordinate to headline, refined presence */}
                <div
                  className="flex gap-2.5"
                  style={{ maxWidth: '310px', marginBottom: 'clamp(0.65rem, 2vh, 1.25rem)' }}
                >

                  {/* Card 1 — 100% Anonymous */}
                  <motion.div
                    className="flex-1 rounded-[1.75rem] overflow-hidden relative flex flex-col justify-between"
                    style={{
                      padding: 'clamp(0.72rem, min(1.3vw, 2.1vh), 1.2rem)',
                      background: 'linear-gradient(148deg, rgba(31,59,53,0.86) 0%, rgba(37,68,64,0.82) 62%, rgba(27,52,46,0.84) 100%)',
                      boxShadow: '0 12px 30px -16px rgba(30,58,52,0.34)',
                      backdropFilter: 'blur(5px)',
                    }}
                    initial={{ opacity: 0, y: 18, scale: 0.95 }}
                    animate={galleryInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                    transition={{ duration: 0.58, delay: 0.5, ease: EASE_OUT_EXPO }}
                    whileHover={{ y: -3, transition: { type: 'spring', stiffness: 300, damping: 22 } }}
                  >
                    <div className="absolute pointer-events-none rounded-full border"
                      style={{ right: '-1.5rem', top: '-1.5rem', width: '6.5rem', height: '6.5rem', borderColor: 'rgba(255,255,255,0.055)' }} />
                    <div className="absolute inset-0 opacity-[0.038] pointer-events-none"
                      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
                    <div className="relative z-10">
                      <motion.p
                        className="font-black text-white tabular-nums tracking-tight leading-none mb-1"
                        style={{ fontSize: 'clamp(1.45rem, min(2.3vw, 4.8vh), 2.5rem)' }}
                        initial={{ opacity: 0, scale: 0.68 }}
                        animate={galleryInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ duration: 0.46, delay: 0.62, type: 'spring', stiffness: 240, damping: 16 }}
                      >100%</motion.p>
                      <p style={{ fontSize: '7.5px', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.34)', textTransform: 'uppercase', fontWeight: 700 }}>Anonymous</p>
                    </div>
                  </motion.div>

                  {/* Card 2 — Peer-Led */}
                  <motion.div
                    className="flex-1 rounded-[1.75rem] overflow-hidden relative flex flex-col justify-between"
                    style={{
                      padding: 'clamp(0.72rem, min(1.3vw, 2.1vh), 1.2rem)',
                      background: 'linear-gradient(148deg, rgba(224,120,98,0.84) 0%, rgba(234,136,112,0.80) 62%, rgba(217,114,92,0.82) 100%)',
                      boxShadow: '0 12px 30px -16px rgba(220,118,98,0.28)',
                      backdropFilter: 'blur(5px)',
                    }}
                    initial={{ opacity: 0, y: 18, scale: 0.95 }}
                    animate={galleryInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                    transition={{ duration: 0.58, delay: 0.62, ease: EASE_OUT_EXPO }}
                    whileHover={{ y: -3, transition: { type: 'spring', stiffness: 300, damping: 22 } }}
                  >
                    <div className="absolute pointer-events-none rounded-full"
                      style={{ left: '-1rem', bottom: '-1rem', width: '5rem', height: '5rem', background: 'rgba(255,255,255,0.07)' }} />
                    <div className="absolute inset-0 opacity-[0.038] pointer-events-none"
                      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
                    <div className="relative z-10">
                      <motion.p
                        className="font-black text-white tracking-tight leading-none mb-1"
                        style={{ fontSize: 'clamp(1.15rem, min(1.85vw, 3.7vh), 1.9rem)' }}
                        initial={{ opacity: 0, scale: 0.68 }}
                        animate={galleryInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ duration: 0.46, delay: 0.76, type: 'spring', stiffness: 240, damping: 16 }}
                      >Peer-Led</motion.p>
                      <p style={{ fontSize: '7.5px', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', fontWeight: 700 }}>By Experience</p>
                    </div>
                  </motion.div>

                </div>

                {/* Scroll hint — very quiet */}
                <motion.div className="flex items-center gap-2.5"
                  initial={{ opacity: 0 }} animate={galleryInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.92 }}
                >
                  <motion.div
                    className="rounded-full flex items-start justify-center flex-shrink-0"
                    style={{ width: '12px', height: '18px', paddingTop: '2.5px', border: '1.5px solid rgba(68,138,125,0.30)' }}
                    animate={{ opacity: [0.28, 0.85, 0.28] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <motion.div className="rounded-full bg-[#448a7d]" style={{ width: '1.5px', height: '3.5px' }}
                      animate={{ y: [0, 5, 0] }}
                      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </motion.div>
                  <span style={{ fontSize: '7.5px', letterSpacing: '0.26em', color: 'rgba(68,138,125,0.42)', fontWeight: 800, textTransform: 'uppercase' }}>Scroll to explore</span>
                </motion.div>

              </div>

              {/* ─── ILLUSTRATION — oversized bottom plate, naturally blended at the top ── */}
              <motion.div
                className="absolute inset-x-0 bottom-0 z-10 overflow-hidden pointer-events-none"
                style={{ bottom: 'clamp(-14.34375rem, -20.25vh, -5.90625rem)' }}
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
                    width: 'clamp(106%, 47vw, 122%)',
                    x: '-50%',
                    mixBlendMode: 'multiply',
                    opacity: 0.96,
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
                    { text: 'A canvas for', italic: false, delay: 0.1 },
                    { text: 'collective healing.', italic: true, delay: 0.22 },
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

      {/* ── IMMERSIVE EDITORIAL COMMUNITY SECTION (mobile only) ── */}
      <section
        className="lg:hidden relative overflow-hidden"
        style={{ background: 'linear-gradient(175deg, #f5f2eb 0%, #f0ede6 55%, #ece8de 100%)' }}
      >
        <div className="w-full h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(68,138,125,0.18), transparent)' }} />

        {/* ── Editorial text header ── */}
        <div className="px-5 pt-10 pb-7">
          <motion.div
            className="flex items-center gap-2 mb-4"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          >
            <div className="h-px w-5 bg-[#448a7d]" />
            <span className="w-[3px] h-[3px] rounded-full bg-[#448a7d]" />
            <span className="text-[9px] font-black uppercase tracking-[0.28em] text-[#448a7d]">Our Community</span>
          </motion.div>

          <motion.h2
            className="font-cabinet font-black text-[#1e3a34] tracking-tight leading-[0.9]"
            style={{ fontSize: 'clamp(2.8rem, 12.5vw, 3.6rem)' }}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.8, delay: 0.06, ease: EASE_OUT_EXPO }}
          >
            Built by those<br />
            <em>who&apos;ve been</em><br />
            <em>exactly here.</em>
          </motion.h2>
        </div>

        {/* Lightweight mobile photo rail — keeps the original moving-gallery feeling without the pinned scene */}
        <div
          className="relative -mt-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-7 [&::-webkit-scrollbar]:hidden"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorX: 'contain',
            scrollbarWidth: 'none',
            scrollPaddingInline: '1rem',
          }}
        >
          {mobileGalleryPhotos.map((photo, idx) => (
            <motion.figure
              key={photo.label}
              className="relative h-[clamp(210px,62vw,310px)] w-[74vw] max-w-[330px] shrink-0 snap-center overflow-hidden rounded-[1.35rem] bg-[#e7ded2] shadow-[0_22px_50px_-30px_rgba(30,58,52,0.42)]"
              style={{ scrollSnapStop: 'always' }}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.48, delay: idx * 0.04, ease: EASE_OUT_EXPO }}
            >
              <img
                src={photo.src}
                alt={photo.label}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1e3a34]/55 via-transparent to-transparent" />
              <figcaption className="absolute bottom-3 left-3 rounded-full bg-[#f4f1e8]/90 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-[#1e3a34] shadow-sm">
                {photo.label}
              </figcaption>
            </motion.figure>
          ))}
        </div>

        {/* ── Illustration card — rounded panel, fills width with small margin ── */}
        <motion.div
          className="relative mx-4 overflow-hidden"
          style={{
            height: 'clamp(300px, 86vw, 400px)',
            borderRadius: '2rem',
            background: '#f0ede6',
          }}
          initial={{ opacity: 0, y: 20, scale: 0.975 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.85, delay: 0.1, ease: EASE_OUT_EXPO }}
        >
          {/* Illustration — blends white bg into card */}
          <img
            src={`${import.meta.env.BASE_URL}images/asset3.png`}
            alt="A diverse community of young people sitting together outdoors in Calgary"
            className="absolute inset-0 w-full h-full object-contain object-bottom"
            style={{ mixBlendMode: 'multiply' }}
          />

          {/* Subtle vignette ring */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ boxShadow: 'inset 0 0 60px rgba(236,232,222,0.45)' }}
          />

          {/* Bottom gradient — blends image into next zone */}
          <div
            className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{
              height: '50%',
              background: 'linear-gradient(to top, #ece8de 0%, rgba(240,237,230,0.55) 55%, transparent 100%)',
            }}
          />

          {/* ── Stat chips — glassmorphism, float at bottom of card ── */}
          <div className="absolute bottom-4 inset-x-4 flex gap-2.5">
            <motion.div
              className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-[0.9rem]"
              style={{
                background: 'rgba(22,50,44,0.82)',
                border: '1px solid rgba(255,255,255,0.09)',
                boxShadow: '0 10px 28px -8px rgba(22,50,44,0.55)',
              }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.45, delay: 0.38, ease: EASE_OUT_EXPO }}
            >
              <span className="text-[#7ec5b8] flex-shrink-0 scale-[0.85]">{ICONS.ShieldCheck}</span>
              <div className="min-w-0">
                <div className="text-[14px] font-black font-cabinet text-white leading-none">100%</div>
                <div className="text-[7.5px] font-black uppercase tracking-[0.2em] text-white/45 mt-[2px]">Anonymous</div>
              </div>
            </motion.div>

            <motion.div
              className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-[0.9rem]"
              style={{
                background: 'rgba(200,106,90,0.88)',
                border: '1px solid rgba(255,255,255,0.13)',
                boxShadow: '0 10px 28px -8px rgba(200,100,85,0.5)',
              }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.45, delay: 0.48, ease: EASE_OUT_EXPO }}
            >
              <span className="text-white/75 flex-shrink-0 scale-[0.85]">{ICONS.Users}</span>
              <div className="min-w-0">
                <div className="text-[13px] font-black font-cabinet text-white leading-tight">Peer-Led</div>
                <div className="text-[7.5px] font-black uppercase tracking-[0.2em] text-white/50 mt-[2px]">By Experience</div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* ── Body copy + full-width CTA ── */}
        <div className="px-5 pt-6 pb-10">
          <motion.p
            className="text-[12px] font-medium leading-relaxed mb-6"
            style={{ color: 'rgba(30,58,52,0.55)' }}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.55, delay: 0.08, ease: EASE_OUT_EXPO }}
          >
            Every pin is proof. You&apos;re not the first to stand here — and you won&apos;t be the last to find a way through.
          </motion.p>

          {/* Primary CTA — full-width coral button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.5, delay: 0.18, ease: EASE_OUT_EXPO }}
          >
            <Link
              to="/map"
              className="flex items-center justify-center gap-2.5 w-full py-[14px] rounded-full font-black text-[11px] uppercase tracking-[0.22em] text-white active:scale-[0.97] transition-transform duration-150"
              style={{
                background: 'linear-gradient(135deg, #e57c6e 0%, #d46a5c 100%)',
                boxShadow: '0 16px 36px -12px rgba(229,124,110,0.5)',
              }}
            >
              Explore the Map
              <span aria-hidden="true">{ICONS.ArrowRight}</span>
            </Link>
          </motion.div>
        </div>
      </section>

      <div className="h-16 md:h-24 bg-gradient-to-b from-[#ece8de] to-[#f3f1e8] pointer-events-none" />

      {/* Mobile Promise Journey — native snap scrolling for low-cost, snappy motion */}
      <section
        className="lg:hidden relative z-10 overflow-hidden py-12 text-[#1e3a34]"
        style={{ background: 'linear-gradient(180deg, #f3f1e8 0%, #f8f4ec 42%, #efe8da 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-[0.28]"
          style={{
            backgroundImage: 'radial-gradient(circle at 18% 12%, rgba(68,138,125,0.12), transparent 32%), radial-gradient(circle at 88% 36%, rgba(229,124,110,0.12), transparent 30%)',
          }}
        />
        <div className="absolute left-5 right-5 top-[10.5rem] h-px bg-gradient-to-r from-transparent via-[#448a7d]/30 to-transparent pointer-events-none" />
        <motion.div
          className="relative z-10 px-5"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.52, ease: EASE_OUT_EXPO }}
        >
          <p className="text-[#448a7d] font-black text-[9px] uppercase tracking-[0.34em]">Our Promise</p>
          <h2 className="mt-2 text-[clamp(2.1rem,10vw,2.75rem)] font-black font-cabinet tracking-tight leading-[0.95] max-w-[14rem]">
            The care loop.
          </h2>
          <p className="mt-3 max-w-[21rem] text-[12px] font-medium leading-relaxed text-[#5a4030]/68">
            A private note moves through a careful human pause before becoming something useful for someone else.
          </p>
          <div className="mt-5 grid grid-cols-4 gap-1.5">
            {['Private', 'Review', 'Shape', 'Signal'].map((step, idx) => (
              <div
                key={step}
                className="rounded-full border border-[#448a7d]/15 bg-white/60 px-2 py-2 text-center text-[7px] font-black uppercase tracking-[0.08em] text-[#448a7d] shadow-[0_8px_18px_-16px_rgba(30,58,52,0.45)]"
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
              className="snap-center shrink-0 overflow-hidden rounded-[1.15rem] border border-[#c8b49a]/35 bg-[#fffaf0] w-[84vw] max-w-[390px] shadow-[0_28px_60px_-32px_rgba(80,50,20,0.34)]"
              style={{ scrollSnapStop: 'always' }}
              initial={{ opacity: 0, y: 22, rotateX: 5, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.58 }}
              transition={{ duration: 0.34, ease: EASE_OUT_EXPO }}
            >
              <div className="relative flex h-[clamp(180px,48vw,220px)] items-center justify-center overflow-hidden bg-[#fff7e8]">
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
                className="relative min-h-[286px] p-4"
                style={{ background: `linear-gradient(160deg, ${panel.color} 0%, ${panel.color} 72%, rgba(30,58,52,0.92) 100%)` }}
              >
                <span
                  className="absolute bottom-1 right-4 font-black font-cabinet text-[5.25rem] leading-none text-white/[0.075] select-none pointer-events-none"
                  aria-hidden="true"
                >
                  0{idx + 1}
                </span>
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />
                <div className="relative z-10 flex h-full min-h-[252px] flex-col justify-between gap-5 rounded-[0.95rem] border border-white/[0.24] bg-[#fff8ec] p-4 shadow-[0_16px_34px_-24px_rgba(0,0,0,0.55)]">
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
                    <p className="mt-3 text-[12.5px] text-[#314f48] font-medium leading-[1.58]">
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
          <motion.div
            className="h-px w-10 bg-[#448a7d]/35"
            animate={{ scaleX: [0.55, 1, 0.55], opacity: [0.45, 0.9, 0.45] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="flex items-center gap-2 rounded-full border border-[#448a7d]/16 bg-white/50 px-3 py-2 text-[8px] font-black uppercase tracking-[0.18em]"
            animate={{ x: [-4, 5, -4] }}
            transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span>Swipe</span>
            <span aria-hidden="true">→</span>
          </motion.div>
          <motion.div
            className="h-px w-10 bg-[#448a7d]/35"
            animate={{ scaleX: [1, 0.55, 1], opacity: [0.9, 0.45, 0.9] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
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
        <motion.div
          className="relative z-10 mt-3 flex flex-col items-center gap-1 text-[#5a4030]/45"
          animate={{ y: [0, 5, 0], opacity: [0.55, 0.9, 0.55] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-[8px] font-black uppercase tracking-[0.22em]">Then scroll</span>
          <span className="text-sm leading-none" aria-hidden="true">↓</span>
        </motion.div>
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
            <motion.div
              className="absolute left-[12vw] top-[-8vh] h-[112vh] w-[34vw] -skew-x-12 bg-[#f5ead4]/[0.46]"
              style={{ opacity: promiseGlow, x: promiseDrift }}
            />
            <motion.div
              className="absolute right-[6vw] top-[16vh] h-[68vh] w-px bg-gradient-to-b from-transparent via-[#e57c6e]/[0.32] to-transparent"
              style={{ x: promiseDrift }}
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

          <div ref={gridRef} className="relative z-10 flex h-full flex-col pt-14 pb-3 md:pt-28 md:pb-7">
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
                  A private note moves through a careful human pause before becoming something useful for someone else.
                </p>
              </motion.div>
              <div className="mt-6 hidden lg:grid grid-cols-4 gap-2 max-w-3xl">
                {['Private', 'Review', 'Shape', 'Signal'].map((step, idx) => (
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
                      h-[clamp(360px,52dvh,520px)] w-[88vw] max-w-[940px]
                      grid-cols-1 grid-rows-[5fr_7fr]
                      shadow-[0_34px_90px_-44px_rgba(80,50,20,0.26)]
                      md:h-[clamp(390px,56dvh,530px)] md:w-[min(72vw,940px)]
                      md:grid-cols-[1fr_1fr] md:grid-rows-1
                      xl:w-[min(60vw,980px)]"
                    whileHover={{ y: -10 }}
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
                      <motion.span
                        className="absolute bottom-2 right-4 font-black font-cabinet leading-none select-none pointer-events-none
                          text-[4rem] md:text-[7.5rem]"
                        style={{ color: '#fff' }}
                        animate={{ opacity: [0.05, 0.10, 0.05] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.8 }}
                        aria-hidden="true"
                      >
                        0{idx + 1}
                      </motion.span>

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
                          {panel.tags.map((tag, tagIdx) => (
                            <motion.span
                              key={tag}
                              className="rounded-xl border border-white/[0.14] bg-white/[0.09] px-3 py-2
                                text-[8px] font-black uppercase tracking-[0.17em] text-[#2d5a52]"
                              style={{ background: 'rgba(68,138,125,0.09)', borderColor: 'rgba(68,138,125,0.16)' }}
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

      {questionSection}

      {/* Final CTA */}
      <section className="bg-[#1e3a34] py-16 md:py-40 max-[400px]:py-12 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover mix-blend-overlay" alt="Nature" />
        </div>
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#1e3a34] to-transparent pointer-events-none z-[1]" />
        <div className="max-w-4xl mx-auto px-6 max-[400px]:px-4 relative z-10 space-y-6 md:space-y-10">
          <div className="text-[#e57c6e] inline-block scale-[1.5] md:scale-[2.5] animate-pulse">{ICONS.Heart}</div>
          <h2 className="text-3xl md:text-7xl font-black tracking-tight leading-[1]">
            Healing is possible. <br className="hidden md:block" />
            <span className="text-[#448a7d]">You are not alone.</span>
          </h2>
          <div className="pt-4 md:pt-6">
            <Link to="/map" className="inline-flex px-8 md:px-14 py-4 md:py-6 bg-[#e57c6e] text-white rounded-full font-bold text-lg md:text-2xl hover:bg-[#d46a5c] transition-all shadow-2xl active:scale-95">
              Explore the Map
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
