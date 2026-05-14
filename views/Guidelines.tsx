import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ICONS, EASE_OUT_EXPO, EASE_OUT_EXPO_CSS } from '../constants.tsx';

// ─── Stagger container variants ───────────────────────────────────────────────
const cardContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: EASE_OUT_EXPO },
  },
};

// ─── AnimatedCard — with colored top accent band ──────────────────────────────
const AnimatedCard: React.FC<{
  title: string;
  desc: string;
  variant?: 'soft' | 'neutral';
  icon?: React.ReactNode;
}> = ({ title, desc, variant = 'neutral', icon }) => {
  return (
    <motion.div
      variants={cardItemVariants}
      whileHover={{ y: -5, transition: { type: 'spring', stiffness: 380, damping: 28 } }}
      className="relative group flex flex-col rounded-[1.5rem] border overflow-hidden cursor-default
        shadow-[0_2px_16px_rgba(30,58,52,0.07)] hover:shadow-[0_18px_50px_-14px_rgba(68,138,125,0.28)]
        hover:border-[#448a7d]/30 border-[#e8f3f1] transition-[border-color,box-shadow,transform] duration-300
        will-change-transform min-h-[200px] lg:min-h-[220px]
      "
      style={
        variant === 'soft'
          ? { background: 'linear-gradient(160deg, #f4faf9 0%, #ffffff 100%)' }
          : { background: '#ffffff' }
      }
    >
      {/* Colored top accent band */}
      <div className="h-1.5 w-full flex-shrink-0 bg-gradient-to-r from-[#448a7d] to-[#2d5a52]" />

      {/* Card body */}
      <div className="flex flex-col gap-3.5 p-6 md:p-7 flex-1">
        {icon && (
          <div className="w-11 h-11 rounded-2xl bg-[#e8f3f1] flex items-center justify-center text-[#448a7d] flex-shrink-0
            group-hover:bg-[#d4ede9] group-hover:scale-105 transition-all duration-300">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-black text-[#1e3a34] text-base leading-snug tracking-tight">{title}</h3>
          <p className="text-gray-500 text-sm font-light leading-relaxed mt-1.5">{desc}</p>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Inline SVGs for safety category icons ────────────────────────────────────
const SafetyIcon: React.FC<{ iconKey: string }> = ({ iconKey }) => {
  switch (iconKey) {
    case 'identifying':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="8" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M13 10h5M13 14h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'trauma':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 21s-7-5.1-7-9.5C5 8.4 8.2 7 12 9.5 15.8 7 19 8.4 19 11.5 19 15.9 12 21 12 21z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M12 10v3M12 15h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'crisis':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M8.5 14.5A5.5 5.5 0 0 0 3 20v1h18v-1a5.5 5.5 0 0 0-5.5-5.5h-7Z" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 6v2M12 10h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'medical':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 10v6M9 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 6V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'illegal':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M12 9v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="1" />
        </svg>
      );
    case 'spam':
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 8v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="16" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="1" />
        </svg>
      );
  }
};

// ─── Tone config ──────────────────────────────────────────────────────────────
type Tone = 'danger' | 'warning' | 'critical' | 'neutral' | 'muted';

const TONE_CONFIG: Record<Tone, {
  border: string;
  iconBg: string;
  iconText: string;
  badgeBg: string;
  badgeText: string;
  accentBar: string;
  cardBg: string;
}> = {
  danger: {
    border: 'border-red-100',
    iconBg: 'bg-red-50',
    iconText: 'text-red-500',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700',
    accentBar: '#ef4444',
    cardBg: 'bg-red-50/60',
  },
  critical: {
    border: 'border-red-100',
    iconBg: 'bg-red-50',
    iconText: 'text-red-600',
    badgeBg: 'bg-red-200',
    badgeText: 'text-red-800',
    accentBar: '#dc2626',
    cardBg: 'bg-red-100/50',
  },
  warning: {
    border: 'border-amber-100',
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-600',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    accentBar: '#f59e0b',
    cardBg: 'bg-amber-50/60',
  },
  neutral: {
    border: 'border-[#e8f3f1]',
    iconBg: 'bg-[#e8f3f1]',
    iconText: 'text-[#448a7d]',
    badgeBg: 'bg-[#e8f3f1]',
    badgeText: 'text-[#2d5a52]',
    accentBar: '#448a7d',
    cardBg: 'bg-[#e8f3f1]/60',
  },
  muted: {
    border: 'border-gray-100',
    iconBg: 'bg-gray-50',
    iconText: 'text-gray-400',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-600',
    accentBar: '#d1d5db',
    cardBg: 'bg-gray-50/60',
  },
};

// ─── SafetyItem ───────────────────────────────────────────────────────────────
const SafetyItem: React.FC<{ item: SafetyItemData; index: number }> = ({ item, index }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [open, setOpen] = React.useState(false);

  const tone = (item.tone as Tone) in TONE_CONFIG ? item.tone as Tone : 'muted';
  const tc = TONE_CONFIG[tone];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: EASE_OUT_EXPO, delay: index * 0.065 }}
    >
      <div
        className={`
          group relative flex flex-col rounded-[1.5rem] border
          shadow-[0_2px_12px_rgba(30,58,52,0.05)]
          hover:shadow-[0_12px_40px_-8px_rgba(30,58,52,0.14)]
          hover:-translate-y-0.5
          transition-all duration-300 overflow-hidden
          ${tc.border} ${tc.cardBg}
        `}
      >
        {/* Colored left accent bar — thicker, always visible at 0.7 */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[5px] rounded-r-full transition-all duration-300"
          style={{ backgroundColor: tc.accentBar, opacity: open ? 1 : 0.7 }}
        />

        {/* Card header — always visible */}
        <div className="flex items-start gap-4 p-5 md:p-6">
          {/* Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${tc.iconBg} ${tc.iconText}`}>
            <SafetyIcon iconKey={item.key} />
          </div>

          {/* Title + badge row */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-[#1e3a34] text-base leading-tight">{item.title}</h4>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase ${tc.badgeBg} ${tc.badgeText}`}
              >
                {item.badge}
              </span>
            </div>
            <p className="text-gray-600 mt-1.5 text-sm leading-relaxed font-light">{item.short}</p>
          </div>
        </div>

        {/* Expandable content — grid-rows trick for GPU-friendly height animation */}
        <div
          className="grid transition-all duration-300 overflow-hidden"
          style={{
            gridTemplateRows: open ? '1fr' : '0fr',
            transitionTimingFunction: EASE_OUT_EXPO_CSS,
          }}
          id={`safety-more-${item.key}`}
          role="region"
        >
          <div className="min-h-0">
            <p className="px-5 md:px-6 pb-4 text-sm text-gray-600 font-light leading-relaxed border-t border-black/[0.06] pt-3">
              {item.more}
            </p>
          </div>
        </div>

        {/* Expand / collapse button */}
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={`safety-more-${item.key}`}
          className={`flex items-center gap-1.5 px-5 md:px-6 pb-4 text-xs font-bold transition-colors duration-200 ${tc.iconText} hover:opacity-70 focus-visible:outline-none focus-visible:underline`}
        >
          {/* Chevron — Framer Motion rotation */}
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
          <span>{open ? 'Show less' : 'Learn more'}</span>
        </button>
      </div>
    </motion.div>
  );
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface SafetyItemData {
  key: string;
  title: string;
  badge: string;
  tone: string;
  short: string;
  more: string;
}

const SAFETY_ITEMS: SafetyItemData[] = [
  {
    key: 'identifying',
    title: 'Identifying Details',
    badge: 'High',
    tone: 'danger',
    short: 'Full names, specific addresses, emails, or phone numbers.',
    more: 'Sharing personally identifiable information can put people at direct risk. We remove contact info and precise locations to preserve safety.',
  },
  {
    key: 'trauma',
    title: 'Trauma Dumping',
    badge: 'Harmful',
    tone: 'warning',
    short: 'Graphic, sensitive descriptions of harmful events.',
    more: 'We encourage reflective, hopeful language. Graphic detail can retraumatize readers; moderators may redact or request edits.',
  },
  {
    key: 'crisis',
    title: 'Crisis Content',
    badge: 'Critical',
    tone: 'critical',
    short: 'Mentions of immediate self-harm, plans, or danger to self/others.',
    more: 'If a post indicates imminent danger we may flag it for immediate review and share resources. We prioritise safety while respecting privacy.',
  },
  {
    key: 'medical',
    title: 'Medical or Legal Advice',
    badge: 'Note',
    tone: 'neutral',
    short: 'Specific medical, legal, or diagnostic instructions.',
    more: 'Encourage seeking professional help. We avoid posts that provide prescriptive medical/legal steps which may be unsafe or inaccurate.',
  },
  {
    key: 'illegal',
    title: 'Illegal Activity',
    badge: 'Report',
    tone: 'danger',
    short: 'Admissions of intent to commit illegal acts or instructions to do so.',
    more: 'We remove content that encourages violence, illegal behaviour, or detailed instructions that could cause harm.',
  },
  {
    key: 'spam',
    title: 'Spam or Ads',
    badge: 'Low',
    tone: 'muted',
    short: 'Promoting brands, paid services, or unrelated web links.',
    more: 'This space is for peer support and personal reflection — overt promotion is removed to keep the community trustworthy.',
  },
];

// ─── Section eyebrow label ────────────────────────────────────────────────────
const Eyebrow: React.FC<{ children: React.ReactNode; light?: boolean }> = ({ children, light = false }) => (
  <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.28em] ${light ? 'text-[#448a7d]' : 'text-[#448a7d]'}`}>
    {children}
  </span>
);

// ─── Best Practices icon ──────────────────────────────────────────────────────
const BestPracticesIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-[#448a7d]">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

// ─── Checklist icon ───────────────────────────────────────────────────────────
const ChecklistIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-[#448a7d]">
    <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9 7h6M9 11h6M9 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 7l-2 2 1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Crisis icon ──────────────────────────────────────────────────────────────
const CrisisIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M12 9v4" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="17" r="0.5" fill="rgba(255,255,255,0.9)" stroke="rgba(255,255,255,0.9)" strokeWidth="1" />
  </svg>
);

const HERO_PARTICLES = [
  { cx: '12%', cy: '22%', delay: 0, dur: 5 },
  { cx: '85%', cy: '15%', delay: 1.2, dur: 7 },
  { cx: '65%', cy: '70%', delay: 2, dur: 6 },
  { cx: '30%', cy: '80%', delay: 0.5, dur: 8 },
  { cx: '90%', cy: '55%', delay: 3, dur: 5.5 },
];

// ─── Hero background ──────────────────────────────────────────────────────────
const HeroBackground: React.FC<{ prefersReduced: boolean }> = React.memo(({ prefersReduced }) => (
  <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
    {/* Unsplash photo */}
    <img
      src="https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=2000"
      alt=""
      className="absolute inset-0 w-full h-full object-cover opacity-40"
    />

    {/* Strong dark overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a34]/75 via-[#1e3a34]/50 to-[#448a7d]/25" />

    {/* Grain texture */}
    <div
      className="absolute inset-0 opacity-[0.04]"
      style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />

    {/* Floating ambient particles */}
    {!prefersReduced && HERO_PARTICLES.map((p, i) => (
      <motion.div
        key={i}
        className="absolute w-1.5 h-1.5 rounded-full bg-white/25"
        style={{ left: p.cx, top: p.cy }}
        animate={{ y: [0, -12, 0], opacity: [0.25, 0.6, 0.25] }}
        transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
      />
    ))}

    {/* Large organic teal blob — top-left */}
    <motion.div
      className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20"
      style={{
        background: 'radial-gradient(ellipse at center, #448a7d 0%, transparent 68%)',
        filter: 'blur(64px)',
      }}
      animate={prefersReduced ? {} : { scale: [1, 1.12, 1] }}
      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
    />

    {/* Medium dark blob — bottom-right */}
    <motion.div
      className="absolute -bottom-24 -right-16 w-[360px] h-[360px] rounded-full opacity-15"
      style={{
        background: 'radial-gradient(ellipse at center, #1e3a34 0%, transparent 70%)',
        filter: 'blur(56px)',
      }}
      animate={prefersReduced ? {} : { scale: [1, 1.08, 1] }}
      transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
    />

    {/* SVG abstract rings — slowly rotating */}
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      animate={prefersReduced ? {} : { rotate: 360 }}
      transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
    >
      <svg className="opacity-[0.12]" width="900" height="500" viewBox="0 0 900 500" fill="none">
        <ellipse cx="450" cy="250" rx="380" ry="190" stroke="white" strokeWidth="1.5" />
        <ellipse cx="450" cy="250" rx="290" ry="140" stroke="white" strokeWidth="1" />
        <ellipse cx="450" cy="250" rx="180" ry="86" stroke="white" strokeWidth="0.8" />
      </svg>
    </motion.div>

    {/* Diagonal line accents — top-right */}
    <svg className="absolute top-0 right-0 opacity-[0.08]" width="340" height="240" viewBox="0 0 340 240" fill="none">
      {[0, 24, 48, 72, 96].map(offset => (
        <line key={offset} x1={340 - offset} y1="0" x2="0" y2={240 - offset * 2} stroke="white" strokeWidth="1" />
      ))}
    </svg>
  </div>
));

// ─── Page component ───────────────────────────────────────────────────────────
const Guidelines: React.FC = () => {
  const prefersReduced = useReducedMotion() ?? false;
  const baseInitial = prefersReduced ? false : { opacity: 0, y: 28 };

  // ── Zone refs ────────────────────────────────────────────────────────────────
  const heroTextRef = useRef<HTMLDivElement>(null);
  const heroTextInView = useInView(heroTextRef, { once: true, margin: '-40px' });

  const introRef = useRef<HTMLDivElement>(null);
  const introInView = useInView(introRef, { once: true, margin: '-60px' });

  const guidingHeaderRef = useRef<HTMLDivElement>(null);
  const guidingHeaderInView = useInView(guidingHeaderRef, { once: true, margin: '-80px' });

  const cardGridRef = useRef<HTMLDivElement>(null);
  const cardGridInView = useInView(cardGridRef, { once: true, margin: '-80px' });

  const protectingHeaderRef = useRef<HTMLDivElement>(null);
  const protectingHeaderInView = useInView(protectingHeaderRef, { once: true, margin: '-80px' });

  const trustBandRef = useRef<HTMLDivElement>(null);
  const trustBandInView = useInView(trustBandRef, { once: true, margin: '-80px' });

  const quickRefRef = useRef<HTMLDivElement>(null);
  const quickRefInView = useInView(quickRefRef, { once: true, margin: '-80px' });

  return (
    <div className="min-h-screen">

      {/* ── ZONE HERO ──────────────────────────────────────────────────────── */}
      <div className="relative h-80 md:h-[28rem] lg:h-[36rem] flex items-center justify-center overflow-hidden">
        <HeroBackground prefersReduced={prefersReduced} />

        <motion.div
          ref={heroTextRef}
          className="relative text-center space-y-4 px-6 max-w-3xl z-10"
          initial={prefersReduced ? false : { opacity: 0, y: 20 }}
          animate={heroTextInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
        >
          <Eyebrow light>Community Standards</Eyebrow>
          <h1 className="font-cabinet text-5xl max-[400px]:text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight italic leading-[0.95] mt-2">
            Safe Sharing.
          </h1>
          <p className="text-white/70 max-w-xl mx-auto font-light text-base md:text-lg leading-relaxed mt-3">
            How we keep this space supportive, resilient, and safe for everyone.
          </p>
        </motion.div>

        {/* Scroll indicator */}
        {!prefersReduced && (
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 z-10"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-[9px] font-black uppercase tracking-[0.3em]">Scroll</span>
            <svg width="12" height="16" viewBox="0 0 12 16" fill="none" aria-hidden="true">
              <path d="M6 0v12M1 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        )}
      </div>

      {/* ── ZONE A — Intro strip ───────────────────────────────────────────── */}
      <section className="relative z-10 py-16 md:py-20 bg-white/82 backdrop-blur-[3px]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.p
            ref={introRef}
            initial={prefersReduced ? false : { opacity: 0, y: 18, filter: 'blur(4px)' }}
            animate={introInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
            transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
            className="text-lg md:text-xl text-gray-500 font-light leading-relaxed"
          >
            Every note on Starlings passes through human review before it reaches the map.
            Here's what we welcome — and what we protect each other from.
          </motion.p>
        </div>
      </section>

      {/* ── ZONE B — Our Guiding Light (mint tinted) ──────────────────────── */}
      <section className="relative z-10 py-16 md:py-24 bg-[#e8f3f1]/40 backdrop-blur-[2px]">
        <div className="max-w-7xl mx-auto px-6 max-[400px]:px-4">

          {/* Section header */}
          <motion.div
            ref={guidingHeaderRef}
            className="mb-10 md:mb-14"
            initial={baseInitial}
            animate={guidingHeaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          >
            <Eyebrow>What's welcome here</Eyebrow>
            <h2 className="font-cabinet text-4xl md:text-5xl lg:text-6xl font-black text-[#1e3a34] tracking-tight leading-[0.98] mt-3 max-w-xl">
              Our Guiding<br />Light.
            </h2>
          </motion.div>

          {/* 4-col card grid */}
          <motion.div
            ref={cardGridRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
            variants={cardContainerVariants}
            initial="hidden"
            animate={cardGridInView ? 'visible' : 'hidden'}
          >
            <AnimatedCard
              title="Hopeful Messages"
              desc="Supportive notes that remind peers they aren't alone."
              variant="soft"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                    stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              }
            />
            <AnimatedCard
              title="Coping Skills"
              desc="Healthy strategies that work for you."
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
                    stroke="currentColor" strokeWidth="1.5" />
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />
            <AnimatedCard
              title="Helpful Resources"
              desc="Support types like therapy or peer groups."
              variant="soft"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                    stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              }
            />
            <AnimatedCard
              title="Boundaries"
              desc="Setting healthy personal limits."
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />
          </motion.div>
        </div>
      </section>

      {/* ── ZONE C — Editorial divider ─────────────────────────────────────── */}
      <div className="relative z-10 bg-white/82 backdrop-blur-[3px] py-8 md:py-12" aria-hidden="true">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#448a7d]/25 to-transparent" />
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#448a7d]/60 whitespace-nowrap">
            Community Standards
          </span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#448a7d]/25 to-transparent" />
        </div>
      </div>

      {/* ── ZONE D — Protecting Each Other (white, 2-col grid) ────────────── */}
      <section className="relative z-10 py-16 md:py-24 bg-white/82 backdrop-blur-[3px]">
        <div className="max-w-7xl mx-auto px-6 max-[400px]:px-4">

          {/* Section header */}
          <motion.div
            ref={protectingHeaderRef}
            className="mb-10 md:mb-14"
            initial={baseInitial}
            animate={protectingHeaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ffe5e5] to-[#ffd9d4] flex items-center justify-center shadow-[0_4px_16px_-4px_rgba(239,68,68,0.2)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                    stroke="#ef4444" strokeWidth="1.6" strokeLinejoin="round" />
                  <path d="M12 9v4" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" />
                  <circle cx="12" cy="17" r="0.6" fill="#ef4444" stroke="#ef4444" strokeWidth="0.8" />
                </svg>
              </div>
              <Eyebrow>Content we remove</Eyebrow>
            </div>
            <h2 className="font-cabinet text-4xl md:text-5xl lg:text-6xl font-black text-[#1e3a34] tracking-tight leading-[0.98] mt-3 max-w-xl">
              Protecting<br />Each Other.
            </h2>
          </motion.div>

          {/* 2-col safety items grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
            {SAFETY_ITEMS.map((item, i) => (
              <SafetyItem key={item.key} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── ZONE E — Trust Band (dark full-width) ─────────────────────────── */}
      <section className="relative z-10 bg-[#1e3a34] py-16 md:py-24 overflow-hidden">
        {/* Dot matrix texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
          aria-hidden="true"
        />
        {/* Ambient orb */}
        <div
          className="absolute top-0 right-1/4 w-96 h-96 bg-[#448a7d]/20 rounded-full blur-[80px] pointer-events-none"
          aria-hidden="true"
        />

        <div ref={trustBandRef} className="relative z-10 max-w-7xl mx-auto px-6 max-[400px]:px-4">

          {/* Header row */}
          <motion.div
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16"
            initial={prefersReduced ? false : { opacity: 0, y: 32 }}
            animate={trustBandInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          >
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[#448a7d] mb-3 block">
                Moderation & Privacy
              </span>
              <h2 className="font-cabinet text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[0.98]">
                You're in<br />safe hands.
              </h2>
            </div>
            <p className="text-white/55 font-light leading-relaxed max-w-sm text-base">
              Every note is reviewed by a human moderator. We only map your note to the city level — never IP addresses or device data.
            </p>
          </motion.div>

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16">
            {[
              { value: '24/7', label: 'Human Monitoring' },
              { value: '100%', label: 'Reviewed Before Publishing' },
              { value: 'City', label: 'Level Location Only' },
              { value: '0', label: 'IP Addresses Stored' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={prefersReduced ? false : { opacity: 0, y: 24 }}
                animate={trustBandInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.65, ease: EASE_OUT_EXPO, delay: i * 0.08 }}
                className="p-5 md:p-6 rounded-[1.5rem] bg-white/[0.06] border border-white/[0.08]"
              >
                <p className="text-3xl md:text-4xl font-black text-white tabular-nums tracking-tight mb-1">
                  {stat.value}
                </p>
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/40 leading-tight">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Crisis CTA — horizontal */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 16 }}
            animate={trustBandInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, ease: EASE_OUT_EXPO, delay: 0.38 }}
            className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 p-5 md:p-6 rounded-[1.5rem] bg-[#e57c6e]/15 border border-[#e57c6e]/20"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CrisisIcon />
                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-white">In Crisis</h4>
              </div>
              <p className="text-sm font-light text-white/60 leading-relaxed">
                If you're in immediate danger, please reach out to professional services right away.
              </p>
            </div>
            <a
              href="https://www.starlings.ca/community-crisis-lines"
              className="flex-shrink-0 inline-flex items-center gap-2 py-3 px-6 bg-[#e57c6e] hover:bg-[#d46a5c] rounded-xl text-sm font-black text-white transition-colors duration-200 shadow-[0_8px_24px_-6px_rgba(229,124,110,0.45)]"
            >
              Find Crisis Lines
              <span>{ICONS.ArrowRight}</span>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── ZONE F — Quick Reference (3 equal columns) ────────────────────── */}
      <section className="relative z-10 py-16 md:py-24 bg-white/82 backdrop-blur-[3px]">
        <div ref={quickRefRef} className="max-w-7xl mx-auto px-6 max-[400px]:px-4">

          {/* Section header */}
          <motion.div
            className="mb-10 md:mb-14"
            initial={baseInitial}
            animate={quickRefInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          >
            <Eyebrow>Before You Post</Eyebrow>
            <h2 className="font-cabinet text-3xl md:text-4xl font-black text-[#1e3a34] tracking-tight leading-tight mt-3">
              Quick Reference
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card 1 — Best Practices */}
            <motion.div
              initial={baseInitial}
              animate={quickRefInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, ease: EASE_OUT_EXPO, delay: 0 }}
              className="p-6 md:p-7 rounded-[1.75rem] bg-gradient-to-br from-[#fef8f0] to-white border border-amber-100/60
                shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_-10px_rgba(30,58,52,0.12)]
                transition-all duration-300"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                  <BestPracticesIcon />
                </div>
                <h3 className="font-black text-[#1e3a34] text-base">Best Practices</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Be specific, not graphic',
                  'Focus on healing, not harm',
                  'Respect others\' experiences',
                  'No unsolicited advice',
                ].map((item, i) => (
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
              initial={baseInitial}
              animate={quickRefInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, ease: EASE_OUT_EXPO, delay: 0.1 }}
              className="p-6 md:p-7 rounded-[1.75rem] bg-gradient-to-br from-[#f0f4f9] to-white border border-gray-100/70
                shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_-10px_rgba(30,58,52,0.12)]
                transition-all duration-300"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-[#e8f3f1] flex items-center justify-center">
                  <ChecklistIcon />
                </div>
                <h3 className="font-black text-[#1e3a34] text-base">Quick Checklist</h3>
              </div>
              <ul className="space-y-3.5">
                {[
                  'No personal details',
                  'Safe for all ages',
                  'Not triggering or graphic',
                  'Respectful tone',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-4 h-4 rounded border-2 border-[#d4ede9] bg-white" />
                    <span className="text-sm text-gray-500 font-light">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Card 3 — How Moderation Works */}
            <motion.div
              initial={baseInitial}
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
                  {
                    num: '01',
                    title: 'You submit',
                    desc: 'Your note enters the queue anonymously — no account, no trace.',
                  },
                  {
                    num: '02',
                    title: 'We review',
                    desc: 'A human moderator checks within 48–72 hours.',
                  },
                  {
                    num: '03',
                    title: "It's live",
                    desc: 'Your note appears on the map for the community.',
                  },
                ].map((step, idx) => (
                  <React.Fragment key={step.num}>
                    <div className="flex items-start gap-3 py-3">
                      <span className="text-[11px] font-black text-[#448a7d] tabular-nums mt-0.5 flex-shrink-0 w-6">
                        {step.num}
                      </span>
                      <div>
                        <p className="text-sm font-black text-[#1e3a34]">{step.title}</p>
                        <p className="text-xs font-light text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                    {idx < 2 && (
                      <div className="ml-[22px] h-px bg-[#e8f3f1]" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default Guidelines;
