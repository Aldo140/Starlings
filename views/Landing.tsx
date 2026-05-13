import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView, useScroll, useTransform, useSpring, useVelocity, useMotionValue } from 'framer-motion';
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
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#448a7d]/50 to-[#2d5a52]/70 flex-shrink-0 mt-0.5 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: cardDelay + 0.1, type: 'spring', stiffness: 400, damping: 22 }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize="7" fontWeight="900" fontFamily="Inter, sans-serif" fill="rgba(255,255,255,0.75)">Q</text>
            </svg>
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#448a7d]/70">Anonymous</p>
              {item.timestamp && (
                <motion.span
                  className="text-[8px] font-medium text-white/35 tracking-wide flex-shrink-0"
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
      className="flex items-center justify-center w-full h-full p-3 md:p-8"
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
              d="M7,0 C4,-1 0,-4 -4,-5 C-7,-3 -7,0 -5,0 C-7,0 -7,3 -4,5 C0,4 4,1 7,0 Z"
              fill="#448a7d"
              opacity={0.3 + (i % 4) * 0.12}
              transform={`translate(${cx},${cy}) rotate(${rotate}) scale(${0.7 + (i % 3) * 0.2})`}
            />
          ))}
        </svg>
      )}
    </motion.div>
  );
};

/* ── Gallery Image Card ─────────────────────────────────────────────────── */

const GalleryImage: React.FC<{ src: string; label: string; h: string; delay: number; inView: boolean; flat?: boolean }> = ({ src, label, h, delay, inView, flat }) => {
  const ease = [0.16, 1, 0.3, 1] as const;
  // Per-card mouse-tracking 3D tilt (desktop)
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-8, 8]), { stiffness: 260, damping: 26 });
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [8, -8]), { stiffness: 260, damping: 26 });
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - left) / width);
    mouseY.set((e.clientY - top) / height);
  };
  const onMouseLeave = () => { mouseX.set(0.5); mouseY.set(0.5); };

  if (flat) {
    // Flat illustration treatment — clean white card, object-contain, no dark overlay
    return (
      <div style={{ perspective: '900px' }}>
        <motion.div
          className={`relative ${h} overflow-hidden rounded-[2rem] bg-white group cursor-pointer shadow-[0_24px_60px_-16px_rgba(30,58,52,0.18)] border border-[#e8f3f1]`}
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
          initial={{ clipPath: 'inset(100% 0% 0% 0%)', opacity: 0 }}
          animate={inView ? { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 } : {}}
          transition={{ duration: 0.95, delay, ease }}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
        >
          {/* Soft mint tint on the white — grounds it in the brand palette */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#e8f3f1]/30 to-white/0 pointer-events-none z-10" />
          <motion.img
            src={src}
            loading="lazy"
            className="w-full h-full object-contain p-3"
            alt={label}
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.65, ease }}
          />
          {/* Subtle bottom fade */}
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-white/80 to-transparent pointer-events-none z-10" />
          <motion.div
            className="absolute bottom-4 left-4 z-20"
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: delay + 0.48, ease }}
          >
            <span className="inline-block px-3.5 py-2 bg-[#e8f3f1]/90 backdrop-blur-md border border-[#448a7d]/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#1e3a34] shadow-sm">
              {label}
            </span>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ perspective: '900px' }}>
      <motion.div
        className={`relative ${h} overflow-hidden rounded-[2rem] shadow-[0_32px_80px_-20px_rgba(30,58,52,0.45)] group cursor-pointer`}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        initial={{ clipPath: 'inset(100% 0% 0% 0%)', opacity: 0 }}
        animate={inView ? { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 } : {}}
        transition={{ duration: 0.95, delay, ease }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <motion.img
          src={src}
          loading="lazy"
          className="w-full h-full object-cover"
          alt={label}
          whileHover={{ scale: 1.09 }}
          transition={{ duration: 0.65, ease }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1e3a34]/70 via-[#1e3a34]/10 to-transparent opacity-40 group-hover:opacity-85 transition-opacity duration-500" />
        <motion.div
          className="absolute bottom-4 left-4"
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: delay + 0.48, ease }}
        >
          <span className="inline-block px-3.5 py-2 bg-white/95 backdrop-blur-md border border-white/40 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#1e3a34] shadow-sm">
            {label}
          </span>
        </motion.div>
      </motion.div>
    </div>
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

  const galleryRef = useRef<HTMLElement>(null);
  const galleryInView = useInView(galleryRef, { once: true, margin: '-80px' });
  const { scrollYProgress: galleryScrollProgress } = useScroll({ target: galleryRef, offset: ['start start', 'end end'] });
  // Desktop: col A fast, col B slow. Both climb up — speed contrast = depth.
  const col1YRawDesk = useTransform(galleryScrollProgress, [0, 1], [160, -700]);
  const col2YRawDesk = useTransform(galleryScrollProgress, [0, 1], [80, -500]);
  // Mobile: single full-width filmstrip — steady parallax climb
  const col1YRawMob = useTransform(galleryScrollProgress, [0, 1], [120, -520]);
  const col1YDesk = useSpring(col1YRawDesk, { stiffness: 72, damping: 17, restDelta: 0.001 });
  const col2YDesk = useSpring(col2YRawDesk, { stiffness: 72, damping: 17, restDelta: 0.001 });
  const col1YMob = useSpring(col1YRawMob, { stiffness: 72, damping: 17, restDelta: 0.001 });
  // Velocity-driven skew — columns lean in opposite directions with scroll momentum
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const skewRawA = useTransform(scrollVelocity, [-3000, 0, 3000], [-2.2, 0, 2.2]);
  const skewRawB = useTransform(scrollVelocity, [-3000, 0, 3000], [2.2, 0, -2.2]);
  const skewA = useSpring(skewRawA, { stiffness: 32, damping: 18 });
  const skewB = useSpring(skewRawB, { stiffness: 32, damping: 18 });
  // Scale breath — columns compress slightly at start/end, open in the middle
  const scaleA = useTransform(galleryScrollProgress, [0, 0.45, 1], [0.96, 1.0, 0.97]);
  const scaleB = useTransform(galleryScrollProgress, [0, 0.55, 1], [1.0, 0.97, 1.0]);

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
    <section ref={qaRef} id="ask-question" className="relative bg-[#1e3a34] py-20 md:py-32 overflow-hidden">

      {/* ── Atmospheric Background ─────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute rounded-full bg-white blur-3xl"
          style={{ width: '45vw', height: '70px', top: '22%', left: '8%', rotate: '-14deg' }}
          animate={{ x: [0, 60, 0], y: [0, -18, 0], opacity: [0.035, 0.07, 0.035] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute rounded-full bg-white blur-2xl"
          style={{ width: '28vw', height: '50px', top: '52%', left: '52%', rotate: '-6deg' }}
          animate={{ x: [0, -35, 0], y: [0, 22, 0], opacity: [0.025, 0.055, 0.025] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
        />
        <motion.div
          className="absolute rounded-full bg-white blur-3xl"
          style={{ width: '32vw', height: '55px', top: '68%', left: '25%', rotate: '8deg' }}
          animate={{ x: [0, 40, 0], y: [0, -12, 0], opacity: [0.02, 0.045, 0.02] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        />
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
              className="space-y-2"
              initial={{ opacity: 0, y: 16 }}
              animate={qaInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.52, ease }}
            >
              {[
                { num: '01', label: 'Ask anonymously', desc: 'No account needed' },
                { num: '02', label: 'We review it', desc: "Safe before it's seen" },
                { num: '03', label: 'Community answers', desc: 'Real perspectives shared' },
              ].map((step, idx) => (
                <motion.div
                  key={step.num}
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: -12 }}
                  animate={qaInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.58 + idx * 0.1, ease }}
                >
                  <span className="text-[11px] font-black text-[#448a7d] tabular-nums w-6 shrink-0">{step.num}</span>
                  <span className="text-sm font-bold text-white/80">{step.label}</span>
                  <span className="text-xs text-white/30 font-medium">{step.desc}</span>
                </motion.div>
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
                  {/* Corner decoration — refined teal wash with speech bubble SVG */}
                  <div className="absolute top-0 right-0 w-44 h-44 pointer-events-none overflow-hidden rounded-[3rem]">
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
                          className="w-full p-6 md:p-8 bg-[#f8faf9] border border-[#e8f3f1] focus:border-[#448a7d]/40 rounded-[1.5rem] min-h-[160px] md:min-h-[200px] text-lg md:text-xl font-medium text-[#1e3a34] transition-all shadow-[inset_0_2px_8px_rgba(30,58,52,0.04)] focus:outline-none focus:bg-white focus:shadow-[inset_0_2px_8px_rgba(30,58,52,0.03),0_0_0_3px_rgba(68,138,125,0.10)] placeholder-gray-400/70 resize-none selection:bg-[#448a7d] selection:text-white"
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
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)', backgroundSize: '200% 100%', animation: 'none' }} />
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
        </div>

        {/* Answered questions toggle + reveal */}
        <div id="answered-questions" className="mt-10 md:mt-14">

          {/* Toggle button — always visible */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={qaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5, ease }}
            className="flex items-center justify-between mb-6 pb-5 border-b border-white/[0.08]"
          >
            <div>
              <p className="text-white font-black text-lg md:text-xl">Answered by the community</p>
              <p className="text-white/40 text-sm font-medium mt-0.5">Questions answered by peers who've been there</p>
            </div>
            <motion.button
              type="button"
              onClick={showAnsweredQA ? () => setShowAnsweredQA(false) : openAnsweredQA}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white font-black text-xs uppercase tracking-widest transition-colors shrink-0 ml-4"
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
          </motion.div>

          {/* Expandable content */}
          <AnimatePresence mode="wait">
            {showAnsweredQA && (
              <motion.div
                key="qa-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
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
                  <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.04] p-10 text-center">
                    <p className="text-white/50 font-medium">No answered questions yet — yours could be the first.</p>
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

      {/* Visual Support Gallery — pinned scroll, viewport locked while images swim */}
      <section
        ref={galleryRef}
        className="relative z-10"
        style={{ height: 'calc(100vh + 900px)' }}
      >
        <div className="sticky top-0 h-screen overflow-hidden bg-[#f8f6f1]/70 backdrop-blur-[3px]">

          {/* Ambient orb — teal */}
          <motion.div
            className="absolute top-1/2 left-1/4 w-[60vw] h-[60vw] max-w-[500px] bg-[#448a7d]/[0.07] rounded-full blur-3xl -translate-y-1/2 pointer-events-none"
            animate={{ scale: [1, 1.12, 1], x: [0, 40, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Ambient orb — coral */}
          <motion.div
            className="absolute bottom-[-4rem] right-1/4 w-[40vw] h-[40vw] max-w-[320px] bg-[#e57c6e]/[0.05] rounded-full blur-3xl pointer-events-none"
            animate={{ scale: [1, 1.18, 1], x: [0, -25, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* ── DESKTOP: left text panel + right image pool ── */}
          <div className="hidden lg:flex h-full relative z-10">

            {/* LEFT: text anchored, always visible */}
            <div
              className="w-[44%] xl:w-[42%] h-full flex flex-col justify-center px-12 xl:px-16 2xl:px-20 pt-14 flex-shrink-0 relative"
              style={{ paddingBottom: 'min(300px, max(160px, calc(100vh - 460px)))' }}
            >

              {/* Eyebrow */}
              <motion.div
                className="flex items-center gap-2 mb-6"
                initial={{ opacity: 0, x: -20 }}
                animate={galleryInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.55, ease }}
              >
                <motion.div className="h-px bg-[#448a7d]"
                  initial={{ width: 0 }} animate={galleryInView ? { width: 28 } : {}}
                  transition={{ duration: 0.6, delay: 0.1, ease }}
                />
                <span className="w-1 h-1 rounded-full bg-[#448a7d] flex-shrink-0" />
                <span className="text-[9px] font-black uppercase tracking-[0.28em] text-[#448a7d]">About Starlings</span>
              </motion.div>

              {/* Heading */}
              <h2 className="font-cabinet text-[2.6rem] xl:text-5xl 2xl:text-[3.6rem] font-black text-[#1e3a34] tracking-tight leading-[0.95] mb-6">
                {[
                  { text: 'A canvas for', italic: false, delay: 0.1 },
                  { text: 'collective healing.', italic: true, delay: 0.2 },
                ].map((line) => (
                  <span key={line.text} className="block overflow-hidden leading-[1.06]">
                    <motion.span
                      className={`block ${line.italic ? 'italic' : ''}`}
                      initial={{ y: '112%' }}
                      animate={galleryInView ? { y: '0%' } : {}}
                      transition={{ duration: 0.72, delay: line.delay, ease }}
                    >{line.text}</motion.span>
                  </span>
                ))}
              </h2>

              {/* Body copy */}
              <motion.p
                className="text-sm xl:text-base text-gray-500 font-light leading-relaxed mb-8 max-w-[340px]"
                initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
                animate={galleryInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
                transition={{ duration: 0.75, delay: 0.38, ease }}
              >
                You aren't alone or defined by the struggles in your home. Here we gather the everyday strategies that help us move forward — with hope, together.
              </motion.p>

              {/* Stat cards — side by side */}
              <div className="flex gap-2.5 mb-6">
                <motion.div
                  className="p-4 xl:p-5 bg-[#1e3a34] rounded-[1.35rem] overflow-hidden relative flex-1"
                  initial={{ opacity: 0, y: 22, scale: 0.93 }}
                  animate={galleryInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                  transition={{ duration: 0.55, delay: 0.5, ease }}
                  whileHover={{ y: -3, transition: { type: 'spring', stiffness: 380, damping: 28 } }}
                >
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
                  <div className="absolute -right-5 -top-5 w-20 h-20 rounded-full border border-white/[0.08] pointer-events-none" />
                  <motion.p className="text-3xl xl:text-4xl font-black text-white tabular-nums tracking-tight mb-0.5 relative z-10"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={galleryInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.45, delay: 0.62, type: 'spring', stiffness: 280, damping: 18 }}
                  >100%</motion.p>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-white/45 leading-tight relative z-10">Anonymous</p>
                </motion.div>

                <motion.div
                  className="p-4 xl:p-5 bg-[#e57c6e] rounded-[1.35rem] overflow-hidden relative flex-1"
                  initial={{ opacity: 0, y: 22, scale: 0.93 }}
                  animate={galleryInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                  transition={{ duration: 0.55, delay: 0.62, ease }}
                  whileHover={{ y: -3, transition: { type: 'spring', stiffness: 380, damping: 28 } }}
                >
                  <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
                  <div className="absolute -left-4 -bottom-4 w-16 h-16 rounded-full bg-white/[0.08] pointer-events-none" />
                  <motion.p className="text-3xl xl:text-4xl font-black text-white tracking-tight mb-0.5 relative z-10"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={galleryInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.45, delay: 0.76, type: 'spring', stiffness: 280, damping: 18 }}
                  >Peer-Led</motion.p>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-white/55 leading-tight relative z-10">By Experience</p>
                </motion.div>
              </div>

              {/* Scroll hint — compact */}
              <motion.div className="flex items-center gap-2"
                initial={{ opacity: 0 }} animate={galleryInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.85 }}
              >
                <motion.div
                  className="w-3.5 h-6 rounded-full border border-[#448a7d]/40 flex items-start justify-center pt-1"
                  animate={{ opacity: [0.35, 1, 0.35] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <motion.div className="w-0.5 h-1 rounded-full bg-[#448a7d]"
                    animate={{ y: [0, 7, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </motion.div>
                <span className="text-[8px] font-black uppercase tracking-[0.22em] text-[#448a7d]/55">Scroll to explore</span>
              </motion.div>

              {/* Community illustration — absolute bottom, fills reserved pb space */}
              <motion.div
                className="absolute bottom-0 left-0 w-full pointer-events-none"
                style={{ height: 'min(280px, max(150px, calc(100vh - 470px)))' }}
                initial={{ opacity: 0, y: 28 }}
                animate={galleryInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 1.0, delay: 0.6, ease }}
              >
                <motion.img
                  src="/images/community-illustration.png"
                  alt="A diverse community of people supporting each other"
                  className="w-full h-full object-contain"
                  style={{ objectPosition: 'center bottom' }}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
                />
              </motion.div>

            </div>

            {/* RIGHT: image swimming pool — clips via parent overflow-hidden */}
            <div className="flex-1 relative overflow-hidden">
              {/* Top vignette */}
              <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#f8f6f1] to-transparent z-20 pointer-events-none" />
              {/* Bottom vignette */}
              <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#f8f6f1] to-transparent z-20 pointer-events-none" />

              <div className="absolute inset-0 grid grid-cols-2 gap-3 p-3">
                {/* Col A — fast lane */}
                <motion.div style={{ y: col1YDesk, skewY: skewA, scale: scaleA }} className="flex flex-col gap-3 origin-top">
                  {[
                    { src: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?auto=format&fit=crop&q=80&w=700', label: 'Hope', h: 'h-[30rem]' },
                    { src: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=700', label: 'Self Care', h: 'h-[18rem]' },
                    { src: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&q=80&w=700', label: 'Resilience', h: 'h-[34rem]' },
                    { src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=700', label: 'Growth', h: 'h-[22rem]' },
                    { src: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=700', label: 'Healing', h: 'h-[26rem]' },
                  ].map((img, i) => <GalleryImage key={img.label} {...img} delay={i * 0.07} inView={galleryInView} />)}
                </motion.div>
                {/* Col B — slow lane, starts higher than col A */}
                <motion.div style={{ y: col2YDesk, skewY: skewB, scale: scaleB }} className="flex flex-col gap-3 -mt-52 origin-top">
                  {[
                    { src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=700', label: 'Together', h: 'h-[26rem]' },
                    { src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=700', label: 'Community', h: 'h-[32rem]' },
                    { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=700', label: 'Peace', h: 'h-[20rem]' },
                    { src: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=700', label: 'Support', h: 'h-[28rem]' },
                    { src: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=700', label: 'Reflection', h: 'h-[24rem]' },
                  ].map((img, i) => <GalleryImage key={img.label} {...img} delay={i * 0.07 + 0.1} inView={galleryInView} />)}
                </motion.div>
              </div>
            </div>
          </div>

          {/* ── MOBILE / TABLET: full-width image pool + text overlay ── */}
          <div className="flex lg:hidden h-full relative z-10">
            <div className="flex-1 relative overflow-hidden">
              {/* Top vignette */}
              <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-[#f8f6f1]/90 to-transparent z-20 pointer-events-none" />
              {/* Bottom vignette */}
              <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-[#f8f6f1] via-[#f8f6f1]/80 to-transparent z-20 pointer-events-none" />

              {/* Single full-width filmstrip — much cleaner on mobile */}
              <div className="absolute inset-0 px-2">
                <motion.div
                  style={{ y: col1YMob, skewY: skewA, scale: scaleA }}
                  className="flex flex-col gap-2 origin-top"
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

              {/* Mobile text overlay — bottom of viewport */}
              <div className="absolute bottom-0 inset-x-0 z-30 px-5 pb-6 pt-2">
                <motion.div className="flex items-center gap-2 mb-3"
                  initial={{ opacity: 0, x: -12 }}
                  animate={galleryInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, ease }}
                >
                  <div className="h-px w-6 bg-[#448a7d]" />
                  <span className="w-1 h-1 rounded-full bg-[#448a7d]" />
                  <span className="text-[9px] font-black uppercase tracking-[0.28em] text-[#448a7d]">About Starlings</span>
                </motion.div>
                <h2 className="font-cabinet text-3xl font-black text-[#1e3a34] tracking-tight leading-[0.97] mb-2">
                  {[
                    { text: 'A canvas for', italic: false, delay: 0.1 },
                    { text: 'collective healing.', italic: true, delay: 0.2 },
                  ].map((line) => (
                    <span key={line.text} className="block overflow-hidden leading-[1.1]">
                      <motion.span className={`block ${line.italic ? 'italic' : ''}`}
                        initial={{ y: '110%' }}
                        animate={galleryInView ? { y: '0%' } : {}}
                        transition={{ duration: 0.65, delay: line.delay, ease }}
                      >{line.text}</motion.span>
                    </span>
                  ))}
                </h2>

                <motion.div className="flex items-center gap-1.5"
                  initial={{ opacity: 0 }}
                  animate={galleryInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <motion.div
                    className="w-3 h-5 rounded-full border border-[#448a7d]/50 flex items-start justify-center pt-0.5"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <motion.div className="w-0.5 h-1 rounded-full bg-[#448a7d]"
                      animate={{ y: [0, 6, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </motion.div>
                  <span className="text-[8px] font-black uppercase tracking-[0.22em] text-[#448a7d]/60">Scroll to explore</span>
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

      {/* ── MOBILE ONLY: community illustration reveal after gallery unlocks ── */}
      <div className="lg:hidden bg-[#f8f6f1] px-6 pt-10 pb-12 flex flex-col items-center text-center">
        <motion.div
          className="flex items-center gap-2 mb-4"
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease }}
        >
          <div className="h-px w-5 bg-[#448a7d]" />
          <span className="w-1 h-1 rounded-full bg-[#448a7d]" />
          <span className="text-[9px] font-black uppercase tracking-[0.28em] text-[#448a7d]">Our Community</span>
        </motion.div>

        <motion.div
          className="relative w-full max-w-xs pointer-events-none"
          style={{ height: '240px' }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.85, delay: 0.1, ease }}
        >
          <motion.img
            src="/images/community-illustration.png"
            alt="A diverse community of people supporting each other"
            className="w-full h-full object-contain"
            style={{ objectPosition: 'center center' }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
          />
        </motion.div>

        <motion.p
          className="text-[11px] font-medium text-gray-500 leading-relaxed max-w-[260px] mt-2"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, delay: 0.25, ease }}
        >
          A peer-led space for youth navigating family substance use — anonymous, safe, and built by people who get it.
        </motion.p>
      </div>

      <div className="h-16 md:h-24 bg-gradient-to-b from-[#f8f6f1] to-[#f3f1e8] pointer-events-none" />

      {/* Horizontal Promise Journey */}
      <section
        ref={promiseRef}
        className="relative z-10 text-[#1e3a34]"
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
                transition={{ duration: 0.7, ease }}
              >
                <div>
                  <p className="text-[#448a7d] font-black text-[9px] md:text-[10px] uppercase tracking-[0.5em]">Our Promise</p>
                  <h2 className="mt-2 text-3xl md:text-5xl font-black font-cabinet tracking-tight leading-[0.95]">
                    The care loop.
                  </h2>
                </div>
                <p className="hidden md:block max-w-md text-sm font-medium leading-relaxed text-[#5a4030]/[0.60]">
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
                      h-[clamp(360px,52dvh,520px)] w-[88vw] max-w-[940px]
                      grid-cols-1 grid-rows-[5fr_7fr]
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
                      <div className="relative z-10 flex flex-col justify-between h-full gap-4">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.42em] text-white/50 mb-2 md:mb-4">
                            {panel.eyebrow}
                          </p>
                          <h3 className="text-[1.35rem] md:text-[2.1rem] font-black font-cabinet leading-[0.96] tracking-tight text-white">
                            {panel.title}
                          </h3>
                          <p className="mt-2 text-[12px] md:text-[14px] text-white/60 font-medium leading-relaxed line-clamp-3 md:line-clamp-none">
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
