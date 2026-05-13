import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion';
import { apiService } from '../services/api.ts';
import { ICONS } from '../constants.tsx';
import { QAItem } from '../types.ts';

const ease = [0.16, 1, 0.3, 1] as const;

const formatDate = (timestamp: string): string => {
  try {
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
};

/* ── Q&A Thread Components ─────────────────────────────────────────────── */

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

const QAThreadCard: React.FC<{ item: QAItem; index: number }> = ({ item, index }) => {
  const cardDelay = index * 0.13;

  return (
    <motion.div
      initial={{ opacity: 0, y: 44, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.97 }}
      transition={{ duration: 0.65, delay: cardDelay, ease }}
      whileHover={{ y: -5, transition: { type: 'spring', stiffness: 380, damping: 28 } }}
      className="relative bg-white/[0.06] border border-white/[0.09] rounded-[1.75rem] overflow-hidden group"
    >
      {/* Hover glow border */}
      <motion.div
        className="absolute inset-0 rounded-[1.75rem] opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(68,138,125,0.25), 0 20px 60px -15px rgba(68,138,125,0.18)' }}
        transition={{ duration: 0.3 }}
      />

      <div className="p-5 md:p-7">
        {/* Question row */}
        <div className="flex gap-3 items-start">
          <motion.div
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#448a7d]/50 to-[#2d5a52]/70 flex-shrink-0 mt-0.5"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: cardDelay + 0.1, type: 'spring', stiffness: 400, damping: 22 }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#448a7d]/70">Anonymous</p>
              {item.timestamp && (
                <motion.span
                  className="text-[8px] font-medium text-white/20 tracking-wide flex-shrink-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: cardDelay + 0.45, duration: 0.5 }}
                >
                  {formatDate(item.timestamp)}
                </motion.span>
              )}
            </div>
            <p className="text-white/90 font-bold italic text-sm md:text-[15px] leading-snug">{item.question}</p>
          </div>
        </div>

        {/* Thread connector — draws itself down */}
        <div className="ml-4 my-2.5 overflow-hidden w-px">
          <motion.div
            className="w-full bg-gradient-to-b from-white/[0.18] to-white/[0.05]"
            initial={{ height: 0 }}
            animate={{ height: 20 }}
            transition={{ delay: cardDelay + 0.3, duration: 0.4, ease }}
          />
        </div>

        {/* Answer row */}
        <div className="flex gap-3 items-start">
          <motion.div
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e8f3f1]/10 to-[#448a7d]/20 flex-shrink-0 flex items-center justify-center text-[9px] font-black text-[#448a7d]/70"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: cardDelay + 0.35, type: 'spring', stiffness: 400, damping: 22 }}
          >
            ✦
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-1.5">Community Response</p>
            <p className="text-white/[0.58] text-xs md:text-[13px] leading-relaxed">{item.answer}</p>
          </div>
        </div>
      </div>

      {/* Animated bottom accent */}
      <motion.div
        className="h-[1px] bg-gradient-to-r from-transparent via-[#448a7d]/0 to-transparent"
        animate={{ background: 'linear-gradient(to right, transparent, rgba(68,138,125,0), transparent)' }}
        whileHover={{ background: 'linear-gradient(to right, transparent, rgba(68,138,125,0.35), transparent)' }}
        transition={{ duration: 0.4 }}
      />
    </motion.div>
  );
};

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
          {/* Lens circle */}
          <circle cx="96" cy="96" r="58" stroke="#448a7d" strokeWidth="1.8" fill="rgba(68,138,125,0.06)"/>
          {/* Inner lens ring */}
          <circle cx="96" cy="96" r="51" stroke="#448a7d" strokeWidth="0.7" opacity="0.3"/>
          {/* Handle */}
          <line x1="140" y1="140" x2="178" y2="178" stroke="#1e3a34" strokeWidth="4" strokeLinecap="round"/>
          <line x1="140" y1="140" x2="178" y2="178" stroke="#448a7d" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
          {/* Stem inside lens */}
          <line x1="96" y1="146" x2="96" y2="56" stroke="#1e3a34" strokeWidth="1.4"/>
          {/* Lower leaf pair */}
          <path d="M96 120 C86 108 83 94 90 83 C93 95 96 108 96 120Z"
            stroke="#448a7d" strokeWidth="1.5" fill="rgba(68,138,125,0.14)"/>
          <path d="M96 120 C106 108 109 94 102 83 C99 95 96 108 96 120Z"
            stroke="#448a7d" strokeWidth="1.5" fill="rgba(68,138,125,0.14)"/>
          {/* Upper leaf pair */}
          <path d="M96 90 C89 81 88 70 94 63 C95 71 96 81 96 90Z"
            stroke="#448a7d" strokeWidth="1.3" fill="rgba(68,138,125,0.10)"/>
          <path d="M96 90 C103 81 104 70 98 63 C97 71 96 81 96 90Z"
            stroke="#448a7d" strokeWidth="1.3" fill="rgba(68,138,125,0.10)"/>
        </svg>
      )}

      {variant === 'pin' && (
        <svg {...svgBase}>
          {/* Pin body — large teardrop */}
          <path d="M56 92 C56 44 164 44 164 92 C164 126 136 154 110 184 C84 154 56 126 56 92 Z"
            stroke="#448a7d" strokeWidth="1.8" fill="rgba(68,138,125,0.08)"/>
          {/* Inner marker circle */}
          <circle cx="110" cy="90" r="22" stroke="#1e3a34" strokeWidth="1.5" fill="rgba(30,58,52,0.10)"/>
          {/* Inner marker dot */}
          <circle cx="110" cy="90" r="7" stroke="#448a7d" strokeWidth="1" fill="rgba(68,138,125,0.20)"/>
          {/* Small sprout at pin crown */}
          <line x1="110" y1="44" x2="110" y2="22" stroke="#1e3a34" strokeWidth="1.3"/>
          <path d="M110 36 C103 28 103 18 110 14 C110 22 110 30 110 36Z"
            stroke="#448a7d" strokeWidth="1.3" fill="rgba(68,138,125,0.14)"/>
          <path d="M110 36 C117 28 117 18 110 14 C110 22 110 30 110 36Z"
            stroke="#448a7d" strokeWidth="1.3" fill="rgba(68,138,125,0.14)"/>
        </svg>
      )}

      {variant === 'murmuration' && (
        <svg {...svgBase}>
          {MURMURATION_STARS.map(([cx, cy], i) => (
            <circle key={`s${i}`} cx={cx} cy={cy} r={1.8} fill="#448a7d" opacity={0.35}/>
          ))}
          {MURMURATION_BIRDS.map(([cx, cy, rotate], i) => (
            <path
              key={`b${i}`}
              d="M-7,0 Q-3.5,-5 0,-1.5 Q3.5,-5 7,0"
              stroke="#448a7d"
              strokeWidth="1.4"
              strokeLinecap="round"
              fill="none"
              opacity={0.45 + (i % 4) * 0.14}
              transform={`translate(${cx},${cy}) rotate(${rotate})`}
            />
          ))}
        </svg>
      )}
    </motion.div>
  );
};

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

  const gridRef = useRef<HTMLDivElement>(null);
  const gridInView = useInView(gridRef, { once: true, margin: '-80px' });

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, -40]);

  const qaRef = useRef<HTMLElement>(null);
  const qaInView = useInView(qaRef, { once: true, margin: '-60px' });

  const promiseRef = useRef<HTMLElement>(null);
  const promiseViewportRef = useRef<HTMLDivElement>(null);
  const promiseTrackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: promiseProgress } = useScroll({ target: promiseRef, offset: ['start start', 'end end'] });
  const promiseDrift = useTransform(promiseProgress, [0, 1], [-70, 70]);
  const promiseGlow = useTransform(promiseProgress, [0, 0.5, 1], [0.22, 0.58, 0.22]);
  const promiseX = useTransform(promiseProgress, [0, 1], [0, -promiseTravel]);
  const promiseLineScale = useTransform(promiseProgress, [0, 1], [0, 1]);

  useEffect(() => {
    const updatePromiseTravel = () => {
      const viewport = promiseViewportRef.current;
      const track = promiseTrackRef.current;
      if (!viewport || !track) return;
      setPromiseTravel(Math.max(0, Math.ceil(track.scrollWidth - viewport.clientWidth)));
    };

    updatePromiseTravel();
    window.addEventListener('resize', updatePromiseTravel);

    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updatePromiseTravel) : null;
    if (observer) {
      if (promiseViewportRef.current) observer.observe(promiseViewportRef.current);
      if (promiseTrackRef.current) observer.observe(promiseTrackRef.current);
    }

    return () => {
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
    const result = await apiService.submitQuestion(question);
    if (result.flagged) {
      setQError('Your question contains flagged words and cannot be submitted. Please revise it.');
    } else if (result.success) {
      setQSuccess(true);
      setQuestion('');
    } else {
      setQError('Something went wrong. Please try again.');
    }
    setIsSubmittingQ(false);
  };

  const questionSection = (
    <section ref={qaRef} id="ask-question" className="relative bg-[#1e3a34] pt-0 pb-20 md:pb-32 overflow-hidden">
      {/* Gradient bridge from warm cream care loop section */}
      <div className="h-24 md:h-36 bg-gradient-to-b from-[#f3f1e8] to-[#1e3a34] pointer-events-none" />

      {/* ── Atmospheric Background ─────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Animated orbs */}
        <motion.div
          className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] bg-[#2d5a52] rounded-full blur-3xl opacity-40"
          animate={{ scale: [1, 1.14, 0.94, 1], x: [0, 28, -12, 0], y: [0, -18, 12, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] max-w-[700px] bg-[#448a7d] rounded-full blur-2xl opacity-20"
          animate={{ scale: [1, 0.91, 1.09, 1], x: [0, -22, 14, 0], y: [0, 22, -12, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        />

        {/* Dot-matrix grid overlay — fades in on scroll */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={qaInView ? { opacity: 1 } : {}}
          transition={{ duration: 2, ease }}
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.028) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        {/* Aurora shimmer sweep */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(108deg, transparent 35%, rgba(68,138,125,0.055) 50%, transparent 65%)',
            width: '200%',
            left: '-100%',
          }}
          animate={{ x: ['0%', '100%'] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear', repeatDelay: 6 }}
        />

        {/* Floating particles */}
        {[
          { left: '12%', top: '28%', dur: 7, delay: 0 },
          { left: '55%', top: '15%', dur: 9, delay: 1.5 },
          { left: '78%', top: '60%', dur: 6, delay: 0.8 },
          { left: '30%', top: '70%', dur: 11, delay: 2.2 },
          { left: '88%', top: '35%', dur: 8, delay: 3.1 },
        ].map((p, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/[0.12]"
            style={{ left: p.left, top: p.top }}
            animate={{ y: [0, -18, 0], opacity: [0.12, 0.32, 0.12] }}
            transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
          />
        ))}

        {/* Noise grain */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")' }}
        />
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="container mx-auto px-6 max-[400px]:px-4 max-w-7xl relative z-10">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">

          {/* Left — heading + description */}
          <div className="lg:col-span-6 space-y-7 md:pr-10">

            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full backdrop-blur-md shadow-lg"
              initial={{ x: -32, opacity: 0 }}
              animate={qaInView ? { x: 0, opacity: 1 } : {}}
              transition={{ duration: 0.6, ease }}
            >
              <span className="text-[#e57c6e] flex items-center">{ICONS.MessageCircle}</span>
              <span className="text-white font-bold text-xs uppercase tracking-widest">Community Q&A</span>
            </motion.div>

            {/* Heading — blur-to-focus reveal */}
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black font-cabinet text-white tracking-tight italic leading-tight drop-shadow-sm">
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
                className="text-[#e57c6e] inline-block"
                initial={{ y: 70, opacity: 0 }}
                animate={qaInView ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 0.75, delay: 0.22, type: 'spring', stiffness: 200, damping: 22 }}
              >
                stays with you.
              </motion.span>
            </h2>

            {/* Description */}
            <motion.p
              className="text-lg md:text-xl text-teal-50/[0.85] font-light leading-relaxed max-w-lg"
              initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
              animate={qaInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
              transition={{ duration: 0.7, delay: 0.4, ease }}
            >
              Some questions need a place to land before they become words. Write anonymously, and open answered community questions only when you want to see them.
            </motion.p>

            <motion.div
              className="grid grid-cols-3 gap-2 max-w-sm"
              initial={{ opacity: 0, y: 16 }}
              animate={qaInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.52, ease }}
            >
              {['Ask', 'Review', 'Answer'].map((label, idx) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.055] px-3 py-3 text-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/35">{label}</p>
                  <motion.div
                    className="mx-auto mt-2 h-1.5 w-1.5 rounded-full bg-[#e57c6e]"
                    animate={{ scale: [1, 1.8, 1], opacity: [0.45, 1, 0.45] }}
                    transition={{ duration: 2.6, repeat: Infinity, delay: idx * 0.35, ease: 'easeInOut' }}
                  />
                </div>
              ))}
            </motion.div>

            <AnimatePresence mode="wait">
              {showAnsweredQA && !isLoadingQA && approvedQA.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-px bg-white/20" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">
                    {approvedQA.length} answered by the community
                  </span>
                  <div className="w-8 h-px bg-white/20" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right — form with 3D hover */}
          <div className="lg:col-span-6">
            <motion.div
              initial={{ y: 72, opacity: 0 }}
              animate={qaInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.85, delay: 0.28, type: 'spring', stiffness: 140, damping: 20 }}
            >
              <div style={{ perspective: '1200px' }}>
                <motion.div
                  whileHover={{ rotateY: 1.5, rotateX: -1, scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="bg-white rounded-[3rem] p-8 md:p-12 shadow-[0_30px_80px_-15px_rgba(0,0,0,0.4)] relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#fbd6d1] to-[#e8f3f1] opacity-50 rounded-bl-[100%] pointer-events-none" />

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
                          className="w-full p-6 md:p-8 bg-gray-50 border-2 border-gray-100 focus:border-[#448a7d]/50 rounded-[2rem] min-h-[160px] md:min-h-[200px] text-lg md:text-xl font-medium text-[#1e3a34] transition-all shadow-inner focus:outline-none focus:bg-white placeholder-gray-400 resize-none selection:bg-[#448a7d] selection:text-white"
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
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                          <span className="relative flex items-center justify-center gap-3">
                            {isSubmittingQ ? 'Submitting...' : 'Send Question'}
                            {!isSubmittingQ && <span className="group-hover:translate-x-1 transition-transform">{ICONS.ArrowRight}</span>}
                          </span>
                        </button>
                      </div>
                      <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mt-6 pt-4 border-t border-gray-100">
                        Anonymous and reviewed before use
                      </p>
                    </form>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        <div id="answered-questions" className="mt-10 md:mt-16 overflow-hidden">
          <AnimatePresence mode="wait">
            {!showAnsweredQA && (
              <motion.div
                key="closed"
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={qaInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.65, ease }}
                className="relative rounded-[2rem] md:rounded-[2.75rem] border border-white/[0.10] bg-white/[0.045] p-5 md:p-8 overflow-hidden"
              >
                <div className="absolute inset-0 pointer-events-none">
                  <motion.div
                    className="absolute -left-12 top-1/2 h-24 w-24 rounded-full bg-[#e57c6e]/20 blur-2xl"
                    animate={{ x: [0, 24, 0], opacity: [0.25, 0.5, 0.25] }}
                    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="absolute right-8 top-8 h-16 w-16 rounded-full border border-white/10"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                  />
                  <svg className="absolute inset-0 h-full w-full opacity-25" aria-hidden="true">
                    <motion.path
                      d="M 54 122 C 220 10, 360 220, 540 92 S 840 22, 1040 168"
                      fill="none"
                      stroke="rgba(232,243,241,0.55)"
                      strokeWidth="1"
                      strokeDasharray="5 10"
                      initial={{ pathLength: 0 }}
                      animate={qaInView ? { pathLength: 1 } : { pathLength: 0 }}
                      transition={{ duration: 1.8, delay: 0.2, ease }}
                    />
                  </svg>
                </div>
                <div className="relative grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-7 md:gap-10 items-center">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#e57c6e]">Sealed questions</p>
                    <h3 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
                      Let the room stay quiet until you touch a thread.
                    </h3>
                    <p className="text-sm md:text-base text-white/[0.55] font-medium leading-relaxed max-w-2xl">
                      The answers are here, but they do not rush you. Tap a sealed thread to invite reviewed community perspective into the space.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { title: 'Finding free support', meta: 'money, access, care' },
                      { title: 'Protecting privacy', meta: 'anonymous, reviewed' },
                      { title: 'Setting boundaries', meta: 'family, safety, space' },
                    ].map((signal, idx) => (
                      <motion.button
                        key={signal.title}
                        type="button"
                        onClick={openAnsweredQA}
                        className="group relative min-h-[150px] rounded-[1.5rem] border border-white/10 bg-[#e8f3f1]/[0.07] p-5 text-left overflow-hidden active:scale-[0.98] transition-transform"
                        whileHover={{ y: -6, rotate: idx === 1 ? 0 : idx === 0 ? -1.5 : 1.5 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                        aria-expanded={showAnsweredQA}
                        aria-controls="answered-questions"
                      >
                        <motion.span
                          className="absolute right-4 top-4 h-8 w-8 rounded-full border border-white/15 bg-white/[0.06]"
                          animate={{ scale: [1, 1.12, 1], opacity: [0.65, 1, 0.65] }}
                          transition={{ duration: 3.2, repeat: Infinity, delay: idx * 0.35, ease: 'easeInOut' }}
                        />
                        <span className="relative block text-[9px] font-black uppercase tracking-[0.28em] text-[#e57c6e] mb-6">Thread {idx + 1}</span>
                        <span className="relative block text-lg md:text-xl font-black text-white leading-tight mb-3">{signal.title}</span>
                        <span className="relative block text-xs font-bold text-white/40">{signal.meta}</span>
                        <span className="absolute bottom-4 left-5 right-5 h-px bg-gradient-to-r from-[#e57c6e]/70 to-transparent scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {showAnsweredQA && (isLoadingQA || approvedQA.length > 0) && (
              <motion.div
                key={isLoadingQA ? 'skeleton' : 'cards'}
                initial={{ opacity: 0, y: 34, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.55, ease }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5"
              >
                {isLoadingQA
                  ? [0, 1].map(i => <QASkeleton key={i} />)
                  : approvedQA.slice(0, 4).map((item, i) => (
                      <QAThreadCard key={item.id} item={item} index={i} />
                    ))
                }
              </motion.div>
            )}

            {showAnsweredQA && !isLoadingQA && approvedQA.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.45, ease }}
                className="rounded-[2rem] border border-white/[0.10] bg-white/[0.055] p-8 md:p-10 text-center"
              >
                <h3 className="text-2xl md:text-3xl font-black text-white mb-3">The drawer is quiet right now.</h3>
                <p className="text-white/[0.55] font-medium max-w-xl mx-auto">
                  Your question can be the one that helps shape the next answered thread.
                </p>
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
      <section ref={heroRef} style={{ position: 'relative' }} className="relative w-full flex-grow flex flex-col items-center justify-center px-4 max-[400px]:px-3 overflow-hidden min-h-[calc(100vh-90px)] py-4">
        <div className="absolute inset-0 pointer-events-none -z-10 bg-gradient-to-b from-white via-white/80 to-transparent" />

        <div className="container mx-auto max-w-5xl relative z-10 text-center flex flex-col items-center justify-center space-y-3 md:space-y-4 py-2">

          <div className="flex flex-col items-center justify-start space-y-2 md:space-y-3 flex-shrink-0">
            <div className="space-y-0 md:space-y-1 overflow-hidden">
              <motion.h1
                className="hero-title font-black text-[#1e3a34]"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.85, ease }}
              >
                Find your
              </motion.h1>
              <motion.h1
                className="hero-title font-black hero-gradient italic pr-1"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.85, delay: 0.12, ease }}
              >
                Community.
              </motion.h1>
            </div>

            <div className="max-w-xl mx-auto flex flex-col items-center gap-2 md:gap-3">
              <motion.p
                className="text-[11px] md:text-xl lg:text-2xl max-[400px]:text-[10px] text-gray-500 leading-relaxed font-light px-2"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.32, ease }}
              >
                An anonymous space for individuals to share what helps them navigate a parent's or other family member's substance use challenges.
              </motion.p>

              {/* Compact single-line tagline */}
              <div className="flex items-center justify-center gap-1.5 md:gap-2.5">
                <motion.span
                  className="text-[10px] md:text-xs font-bold italic text-[#448a7d] whitespace-nowrap"
                  initial={{ x: -14, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5, ease }}
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
                  transition={{ delay: 0.72, duration: 0.5, ease }}
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
            transition={{ duration: 1.1, delay: 0.22, ease }}
            style={{ y: imageY }}
          >
            <img
              src={`${import.meta.env.BASE_URL}landing-people.jpg`}
              className="w-full h-full object-contain mix-blend-multiply opacity-95"
              alt=""
            />
          </motion.div>

          {/* CTA Buttons */}
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
              <motion.div key={i} className="w-full sm:w-auto" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.68 + i * 0.1, ease }}>
                {btn}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Support Gallery */}
      <section className="relative z-10 bg-white/40 backdrop-blur-lg border-t border-white/50 py-16 md:py-32 max-[400px]:py-12">
        <div className="container mx-auto px-6 max-[400px]:px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center">
            <div className="space-y-6 md:space-y-8 md:pr-12">
              <h2 className="text-3xl md:text-5xl font-black text-[#1e3a34] tracking-tight leading-tight italic">
                A canvas for collective healing.<br className="hidden md:block" /> A space to navigate our experiences together.
              </h2>
              <p className="text-base md:text-xl text-gray-500 font-light leading-relaxed">
                Starlings is more than a map. It's a testament to the fact that you aren't alone or defined by the struggles in your home. Here, we gather and share the small, everyday strategies that help us move forward with hope, together.
              </p>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="p-4 md:p-6 bg-gray-50 rounded-[1.5rem] md:rounded-[2rem] border border-gray-100">
                  <p className="text-2xl md:text-3xl font-black text-[#448a7d] mb-1">100%</p>
                  <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-tight">Anonymous Space</p>
                </div>
                <div className="p-4 md:p-6 bg-gray-50 rounded-[1.5rem] md:rounded-[2rem] border border-gray-100">
                  <p className="text-2xl md:text-3xl font-black text-[#e57c6e] mb-1">Peer</p>
                  <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-tight">Led By Experience</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-3 md:space-y-4 pt-6 md:pt-10">
                  <img src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=400" loading="lazy" className="w-full h-40 md:h-64 object-cover rounded-[2rem] shadow-xl" alt="Self Care" />
                  <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=400" loading="lazy" className="w-full h-56 md:h-80 object-cover rounded-[2rem] shadow-xl" alt="Community" />
                </div>
                <div className="space-y-3 md:space-y-4">
                  <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=400" loading="lazy" className="w-full h-56 md:h-80 object-cover rounded-[2rem] shadow-xl" alt="Meditation" />
                  <img src="https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=400" loading="lazy" className="w-full h-40 md:h-64 object-cover rounded-[2rem] shadow-xl" alt="Support" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Horizontal Promise Journey */}
      <section
        ref={promiseRef}
        className="relative z-10 bg-[#f3f1e8] text-[#1e3a34]"
        style={{ position: 'relative', height: promiseTravel ? `calc(100vh + ${promiseTravel}px)` : '100vh' }}
      >
        <div ref={promiseViewportRef} className="sticky top-0 h-screen overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#1e3a34] via-[#2d5a52]/[0.24] to-transparent"
            />
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

          <div ref={gridRef} className="relative z-10 flex h-full flex-col pt-[6.5rem] pb-5 md:pt-28 md:pb-7">
            <div className="flex-shrink-0 px-6 md:px-[8vw]">
              <motion.div
                className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
                initial={{ opacity: 0, y: 28 }}
                animate={gridInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
                transition={{ duration: 0.7, ease }}
              >
                <div>
                  <p className="text-[#448a7d] font-black text-[9px] md:text-[10px] uppercase tracking-[0.5em]">Our Promise</p>
                  <h2 className="mt-2 text-3xl md:text-5xl font-black font-cabinet tracking-tight leading-[0.95]">
                    The care loop.
                  </h2>
                </div>
                <p className="max-w-md text-xs md:text-sm font-medium leading-relaxed text-[#5a4030]/[0.60]">
                  The page holds still so the safety system can move sideways: private note, human pause, public shape, shared recognition.
                </p>
              </motion.div>
            </div>

            <div className="flex min-h-0 flex-1 items-center">
              <motion.div
                ref={promiseTrackRef}
                className="flex w-max gap-4 px-6 will-change-transform md:gap-7 md:px-[8vw]"
                style={{ x: promiseX }}
              >
                {[
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
                ].map((panel, idx) => (
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
                    <div className="relative flex items-center justify-center bg-[#fdf6eb] overflow-hidden h-full">
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
                        style={{ color: '#fff' }}
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
                ))}
              </motion.div>
            </div>

            <div className="flex-shrink-0 px-6 md:px-[8vw]">
              <div className="flex items-center justify-between gap-4 text-[10px] font-black uppercase tracking-[0.26em] text-[#7a5535]/[0.42]">
                <span>Hold scroll</span>
                <span>Care moves sideways</span>
                <span>Release after the last panel</span>
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
