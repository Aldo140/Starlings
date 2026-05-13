import React, { useRef, useEffect, useState } from 'react';
import { ICONS } from '../constants.tsx';

// ─── Animation constants ──────────────────────────────────────────────────────
const EASE_OUT_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)';

// ─── RevealOnScroll ───────────────────────────────────────────────────────────
const RevealOnScroll: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: EASE_OUT_EXPO,
        transitionDuration: '700ms',
        transitionProperty: 'opacity, transform',
      }}
      className={visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
    >
      {children}
    </div>
  );
};

// ─── AnimatedCard ─────────────────────────────────────────────────────────────
const AnimatedCard: React.FC<{
  title: string;
  desc: string;
  delay?: number;
  variant?: 'soft' | 'neutral';
  icon?: React.ReactNode;
}> = ({ title, desc, delay = 0, variant = 'neutral', icon }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      entries => { entries.forEach(e => { if (e.isIntersecting) setVisible(true); }); },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: EASE_OUT_EXPO,
        transitionDuration: '600ms',
        transitionProperty: 'opacity, transform',
      }}
      className={visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
    >
      <div
        className={`
          relative group flex flex-col gap-3 p-6 md:p-7 rounded-[1.5rem]
          border transition-all duration-300
          ${hovered
            ? 'shadow-[0_12px_40px_-12px_rgba(68,138,125,0.18)] border-[#448a7d]/25 -translate-y-1'
            : 'shadow-[0_2px_12px_rgba(0,0,0,0.04)] border-gray-100/70'}
          ${variant === 'soft' ? 'bg-gradient-to-br from-[#f9fbfa] to-white' : 'bg-white'}
          overflow-hidden
        `}
      >
        {/* Teal accent bar that slides in from left on hover */}
        <div
          className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-[#448a7d] transition-all duration-300"
          style={{ opacity: hovered ? 1 : 0, transform: hovered ? 'scaleY(1)' : 'scaleY(0.4)', transformOrigin: 'top' }}
        />
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-[#e8f3f1] flex items-center justify-center text-[#448a7d] flex-shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-bold text-[#1e3a34] text-base leading-snug">{title}</h3>
          <p className="text-gray-500 text-sm font-light leading-relaxed mt-1">{desc}</p>
        </div>
      </div>
    </div>
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
}> = {
  danger: {
    border: 'border-red-100',
    iconBg: 'bg-red-50',
    iconText: 'text-red-500',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700',
    accentBar: '#ef4444',
  },
  critical: {
    border: 'border-red-100',
    iconBg: 'bg-red-50',
    iconText: 'text-red-600',
    badgeBg: 'bg-red-200',
    badgeText: 'text-red-800',
    accentBar: '#dc2626',
  },
  warning: {
    border: 'border-amber-100',
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-600',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    accentBar: '#f59e0b',
  },
  neutral: {
    border: 'border-[#e8f3f1]',
    iconBg: 'bg-[#e8f3f1]',
    iconText: 'text-[#448a7d]',
    badgeBg: 'bg-[#e8f3f1]',
    badgeText: 'text-[#2d5a52]',
    accentBar: '#448a7d',
  },
  muted: {
    border: 'border-gray-100',
    iconBg: 'bg-gray-50',
    iconText: 'text-gray-400',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-600',
    accentBar: '#d1d5db',
  },
};

// ─── SafetyItem ───────────────────────────────────────────────────────────────
const SafetyItem: React.FC<{ item: SafetyItemData; index: number }> = ({ item, index }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      entries => { entries.forEach(e => { if (e.isIntersecting) setVisible(true); }); },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const tone = (item.tone as Tone) in TONE_CONFIG ? item.tone as Tone : 'muted';
  const tc = TONE_CONFIG[tone];

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${index * 65}ms`,
        transitionTimingFunction: EASE_OUT_EXPO,
        transitionDuration: '600ms',
        transitionProperty: 'opacity, transform',
      }}
      className={visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}
    >
      <div
        className={`
          group relative flex flex-col rounded-[1.5rem] border bg-white
          shadow-[0_2px_12px_rgba(0,0,0,0.04)]
          hover:shadow-[0_10px_36px_-8px_rgba(0,0,0,0.1)]
          hover:-translate-y-0.5
          transition-all duration-300 overflow-hidden
          ${tc.border}
        `}
      >
        {/* Colored left accent bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full transition-all duration-300"
          style={{ backgroundColor: tc.accentBar, opacity: open ? 1 : 0.45 }}
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
            <p className="text-gray-500 mt-1.5 text-sm leading-relaxed font-light">{item.short}</p>
          </div>
        </div>

        {/* Expandable content — grid-rows trick for smooth height animation */}
        <div
          className="grid transition-all duration-300 overflow-hidden"
          style={{
            gridTemplateRows: open ? '1fr' : '0fr',
            transitionTimingFunction: EASE_OUT_EXPO,
          }}
          id={`safety-more-${item.key}`}
          role="region"
        >
          <div className="min-h-0">
            <p className="px-5 md:px-6 pb-4 text-sm text-gray-500 font-light leading-relaxed border-t border-gray-100/70 pt-3">
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
          {/* Chevron SVG */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="transition-transform duration-300"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{open ? 'Show less' : 'Learn more'}</span>
        </button>
      </div>
    </div>
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
const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-[#448a7d]">
    {children}
  </span>
);

// ─── StatCounter ──────────────────────────────────────────────────────────────
const StatCounter: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center gap-1 text-center px-2 py-3 rounded-2xl bg-[#f0f9f8]">
    <div className="text-2xl md:text-3xl font-black text-[#448a7d] leading-none tracking-tight">{value}</div>
    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-tight">{label}</div>
  </div>
);

// ─── Hero background — CSS-only abstract visual ───────────────────────────────
const HeroBackground: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
    {/* Unsplash photo */}
    <img
      src="https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=2000"
      alt=""
      className="absolute inset-0 w-full h-full object-cover opacity-20"
    />

    {/* Base gradient */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#e8f3f1]/60 via-[#f9fbfa]/40 to-[#f0f9f8]/60" />

    {/* Dot matrix texture */}
    <div
      className="absolute inset-0 opacity-40"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(68,138,125,0.18) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    />

    {/* Large organic teal blob — top-left */}
    <div
      className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-25"
      style={{
        background: 'radial-gradient(ellipse at center, #448a7d 0%, transparent 68%)',
        filter: 'blur(64px)',
      }}
    />

    {/* Medium warm blob — bottom-right */}
    <div
      className="absolute -bottom-24 -right-16 w-[360px] h-[360px] rounded-full opacity-15"
      style={{
        background: 'radial-gradient(ellipse at center, #1e3a34 0%, transparent 70%)',
        filter: 'blur(56px)',
      }}
    />

    {/* SVG abstract rings */}
    <svg
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.07]"
      width="900"
      height="500"
      viewBox="0 0 900 500"
      fill="none"
    >
      <ellipse cx="450" cy="250" rx="380" ry="190" stroke="#1e3a34" strokeWidth="1.5" />
      <ellipse cx="450" cy="250" rx="290" ry="140" stroke="#448a7d" strokeWidth="1" />
      <ellipse cx="450" cy="250" rx="180" ry="86" stroke="#1e3a34" strokeWidth="0.8" />
    </svg>

    {/* Diagonal line accents — top-right */}
    <svg
      className="absolute top-0 right-0 opacity-[0.06]"
      width="340"
      height="240"
      viewBox="0 0 340 240"
      fill="none"
    >
      {[0, 24, 48, 72, 96].map(offset => (
        <line
          key={offset}
          x1={340 - offset}
          y1="0"
          x2="0"
          y2={240 - offset * 2}
          stroke="#1e3a34"
          strokeWidth="1"
        />
      ))}
    </svg>

    {/* Bottom gradient fade to white */}
    <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-white to-transparent" />
  </div>
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

// ─── Crisis icon (replacing 🚨) ───────────────────────────────────────────────
const CrisisIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M12 9v4" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="17" r="0.5" fill="rgba(255,255,255,0.9)" stroke="rgba(255,255,255,0.9)" strokeWidth="1" />
  </svg>
);

// ─── Page component ───────────────────────────────────────────────────────────
const Guidelines: React.FC = () => {
  return (
    <div className="bg-white min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative h-64 md:h-80 lg:h-[26rem] flex items-center justify-center overflow-hidden">
        <HeroBackground />

        <div className="relative text-center space-y-4 px-6 max-w-3xl z-10">
          <Eyebrow>Community Standards</Eyebrow>
          <h1 className="text-4xl max-[400px]:text-3xl md:text-5xl lg:text-6xl font-black text-[#1e3a34] tracking-tight italic leading-[0.95] mt-2">
            Safe Sharing.
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto font-light text-base md:text-lg leading-relaxed mt-3">
            How we keep this space supportive, resilient, and safe for everyone.
          </p>
        </div>
      </div>

      {/* ── Main layout ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-14 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 md:gap-14">

          {/* ── Left: main content (2/3) ─────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-14 md:space-y-16">

            {/* Section 1 — Our Guiding Light */}
            <RevealOnScroll delay={0}>
              <section className="space-y-7">
                {/* Section header */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d1f2eb] to-[#e8f3f1] flex items-center justify-center text-[#448a7d] shadow-[0_4px_16px_-4px_rgba(68,138,125,0.25)] transition-all duration-300 hover:shadow-[0_8px_24px_-6px_rgba(68,138,125,0.35)] hover:scale-105">
                    <div className="scale-125">{ICONS.ShieldCheck}</div>
                  </div>
                  <div className="pt-1">
                    <Eyebrow>What's welcome here</Eyebrow>
                    <h2 className="text-2xl md:text-3xl font-black text-[#1e3a34] leading-tight mt-1">
                      Our Guiding Light
                    </h2>
                    <p className="text-gray-500 text-sm font-light mt-0.5">
                      Positive content that fuels our community
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
                  <AnimatedCard
                    delay={0}
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
                    delay={70}
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
                    delay={140}
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
                    delay={210}
                    title="Boundaries"
                    desc="Setting healthy personal limits."
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    }
                  />
                </div>
              </section>
            </RevealOnScroll>

            {/* Decorative divider */}
            <div className="flex items-center gap-5 py-2" aria-hidden="true">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#448a7d]/20 to-transparent" />
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#e8f3f1] border border-[#448a7d]/30" />
                <div className="w-2 h-2 rounded-full bg-[#448a7d]/40" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#e8f3f1] border border-[#448a7d]/30" />
              </div>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#448a7d]/20 to-transparent" />
            </div>

            {/* Section 2 — Protecting Each Other */}
            <RevealOnScroll delay={100}>
              <section className="space-y-7">
                {/* Section header */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ffe5e5] to-[#ffd9d4] flex items-center justify-center shadow-[0_4px_16px_-4px_rgba(239,68,68,0.2)] transition-all duration-300 hover:shadow-[0_8px_24px_-6px_rgba(239,68,68,0.28)] hover:scale-105">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                        stroke="#ef4444" strokeWidth="1.6" strokeLinejoin="round" />
                      <path d="M12 9v4" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" />
                      <circle cx="12" cy="17" r="0.6" fill="#ef4444" stroke="#ef4444" strokeWidth="0.8" />
                    </svg>
                  </div>
                  <div className="pt-1">
                    <Eyebrow>Content we remove</Eyebrow>
                    <h2 className="text-2xl md:text-3xl font-black text-[#1e3a34] leading-tight mt-1">
                      Protecting Each Other
                    </h2>
                    <p className="text-gray-500 text-sm font-light mt-0.5">
                      Content we remove or redact to keep everyone safe
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {SAFETY_ITEMS.map((item, i) => (
                    <SafetyItem key={item.key} item={item} index={i} />
                  ))}
                </div>
              </section>
            </RevealOnScroll>
          </div>

          {/* ── Right: sidebar (1/3) ─────────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-6">

            {/* Moderation card — sticky */}
            <RevealOnScroll delay={250}>
              <div className="p-6 md:p-7 rounded-[1.75rem] bg-gradient-to-br from-[#f0f9f8] via-[#f9fbfa] to-white border border-[#e8f3f1] shadow-[0_4px_24px_rgba(68,138,125,0.07)] lg:sticky lg:top-20">

                {/* Moderation header */}
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-[#e8f3f1] flex items-center justify-center text-[#448a7d]">
                    {ICONS.ShieldCheck}
                  </div>
                  <h3 className="text-lg font-black text-[#1e3a34]">Moderation</h3>
                </div>
                <p className="text-gray-500 text-sm font-light leading-relaxed">
                  Every note is reviewed by a human moderator at Starlings. We prioritize your anonymity and the collective safety of our community.
                </p>
                <p className="text-gray-500 text-sm font-light leading-relaxed mt-2">
                  Most reviews happen within 48–72 hours.
                </p>

                {/* Stats row */}
                <div className="mt-5 grid grid-cols-3 gap-2.5">
                  <StatCounter value="24/7" label="Monitoring" />
                  <StatCounter value="100%" label="Human Review" />
                  <StatCounter value="∞" label="Safe Space" />
                </div>

                {/* Divider */}
                <div className="my-5 h-px bg-gradient-to-r from-transparent via-[#448a7d]/15 to-transparent" />

                {/* Privacy header */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-[#e8f3f1] flex items-center justify-center text-[#448a7d]">
                    {ICONS.Info}
                  </div>
                  <h3 className="text-lg font-black text-[#1e3a34]">Privacy</h3>
                </div>
                <p className="text-gray-500 text-sm font-light leading-relaxed">
                  We only map your note to the city level. We never store IP addresses or device data.
                </p>

                {/* Crisis CTA */}
                <div className="mt-6 rounded-2xl bg-gradient-to-br from-[#1e3a34] to-[#0f2620] p-5 text-white relative overflow-hidden">
                  {/* Subtle radial highlight */}
                  <div
                    className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-[0.06] pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at top right, white 0%, transparent 70%)' }}
                    aria-hidden="true"
                  />

                  <div className="relative z-10 flex items-center gap-2 mb-2">
                    <CrisisIcon />
                    <h4 className="font-black text-xs uppercase tracking-[0.2em]">In Crisis</h4>
                  </div>
                  <p className="relative z-10 text-xs font-light leading-relaxed text-white/75 mb-4">
                    If you're in immediate danger, please reach out to professional services right away.
                  </p>
                  <a
                    href="https://www.starlings.ca/community-crisis-lines"
                    className="relative z-10 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-white/20 hover:bg-white/30 border border-white/20 hover:border-white/30 rounded-xl text-xs font-bold transition-all duration-200 w-full"
                  >
                    Find Crisis Lines
                    <span className="text-[#448a7d] group-hover:translate-x-0.5 transition-transform">
                      {ICONS.ArrowRight}
                    </span>
                  </a>
                </div>
              </div>
            </RevealOnScroll>

            {/* Best Practices card */}
            <RevealOnScroll delay={320}>
              <div className="p-6 md:p-7 rounded-[1.75rem] bg-gradient-to-br from-[#fef8f0] to-white border border-amber-100/60 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] transition-all duration-300">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                    <BestPracticesIcon />
                  </div>
                  <h3 className="font-black text-[#1e3a34] text-base">Best Practices</h3>
                </div>
                <ul className="space-y-2.5">
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
              </div>
            </RevealOnScroll>

            {/* Quick Checklist card */}
            <RevealOnScroll delay={390}>
              <div className="p-6 md:p-7 rounded-[1.75rem] bg-gradient-to-br from-[#f0f4f9] to-white border border-gray-100/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] transition-all duration-300">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-[#e8f3f1] flex items-center justify-center">
                    <ChecklistIcon />
                  </div>
                  <h3 className="font-black text-[#1e3a34] text-base">Quick Checklist</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    'No personal details',
                    'Safe for all ages',
                    'Not triggering or graphic',
                    'Respectful tone',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <label className="flex items-center gap-3 cursor-pointer group w-full">
                        <div className="relative flex-shrink-0">
                          <input
                            type="checkbox"
                            readOnly
                            className="sr-only peer"
                            tabIndex={-1}
                          />
                          <div className="w-4 h-4 rounded border-2 border-gray-200 bg-white peer-checked:bg-[#448a7d] peer-checked:border-[#448a7d] transition-colors duration-200" />
                        </div>
                        <span className="text-sm text-gray-500 font-light group-hover:text-gray-700 transition-colors duration-200">
                          {item}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealOnScroll>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Guidelines;
