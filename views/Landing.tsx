import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView, useScroll, useTransform, useSpring } from 'framer-motion';
import { BookOpen, CheckCircle2, MapPin, MessageCircleQuestion } from 'lucide-react';
import { apiService } from '../services/api.ts';
import { ICONS, EASE_OUT_EXPO } from '../constants.tsx';
import { QAItem } from '../types.ts';
import { QASkeleton, QAThreadCard } from '../components/QAThread.tsx';

/* ── Landing Page ───────────────────────────────────────────────────────── */

const BestPracticesIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-[#448a7d]">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const ChecklistIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-[#448a7d]">
    <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9 7h6M9 11h6M9 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 7l-2 2 1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Landing: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [isSubmittingQ, setIsSubmittingQ] = useState(false);
  const [qSuccess, setQSuccess] = useState(false);
  const [qError, setQError] = useState('');
  const [approvedQA, setApprovedQA] = useState<QAItem[]>([]);
  const [isLoadingQA, setIsLoadingQA] = useState(false);
  const [showAnsweredQA, setShowAnsweredQA] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);
  const gridInView = useInView(gridRef, { once: true, margin: '-80px' });

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, -40]);

  const qaRef = useRef<HTMLElement>(null);
  const qaInView = useInView(qaRef, { once: true, margin: '-60px' });

  const mobileCommunityRef = useRef<HTMLElement>(null);
  const { scrollYProgress: mobileCommunityProgress } = useScroll({ target: mobileCommunityRef, offset: ['start 68%', 'end 18%'] });
  const communityRow1X = useSpring(useTransform(mobileCommunityProgress, [0, 1], [28, -760]), { stiffness: 120, damping: 24, restDelta: 0.001 });
  const communityRow2X = useSpring(useTransform(mobileCommunityProgress, [0, 1], [-760, 28]), { stiffness: 120, damping: 24, restDelta: 0.001 });

  const quickRefRef = useRef<HTMLDivElement>(null);
  const quickRefInView = useInView(quickRefRef, { once: true, margin: '-80px' });

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

  const qaSteps = [
    { num: '01', label: 'Ask anonymously', desc: 'No account needed' },
    { num: '02', label: 'Human review', desc: 'Safe before posting' },
    { num: '03', label: 'Peer answers', desc: 'Real perspectives' },
  ];

  const mobileGalleryPhotos = [
    { src: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?auto=format&fit=crop&q=80&w=700', label: 'Hope' },
    { src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=700', label: 'Together' },
    { src: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&q=80&w=700', label: 'Resilience' },
    { src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=700', label: 'Community' },
    { src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=700', label: 'Growth' },
    { src: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=700', label: 'Support' },
  ];

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

  const questionSection = (
    <section ref={qaRef} id="ask-question" className="relative py-16 md:py-24 overflow-hidden">
      {/* Frosted-glass backdrop — birds visible but blurred behind the section */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(150deg, rgba(234,246,241,0.38) 0%, rgba(245,251,247,0.44) 52%, rgba(230,244,239,0.38) 100%)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      />

      {/* ── Atmospheric Background ─────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute bottom-[-14%] left-[-10%] hidden w-[48vw] h-[48vw] max-w-[560px] rounded-full blur-3xl md:block opacity-60"
          style={{ background: 'radial-gradient(circle, #b8ddd5 0%, #c8e8e0 55%, transparent 100%)' }}
        />
        <div
          className="absolute top-[-12%] right-[-8%] hidden w-[34vw] h-[34vw] max-w-[420px] rounded-full blur-3xl md:block opacity-45"
          style={{ background: 'radial-gradient(circle, #9ecfc3 0%, #b8e0d8 60%, transparent 100%)' }}
        />
        <div
          className="absolute top-[38%] right-[10%] hidden w-[16vw] h-[16vw] max-w-[190px] rounded-full blur-3xl md:block opacity-70"
          style={{ background: 'radial-gradient(circle, rgba(229,124,110,0.22) 0%, transparent 70%)' }}
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

        {/* ── Quiet starling silhouettes ── */}
        {([
          { x: '12%', y: '13%', w: 18, delay: 0 },
          { x: '32%', y: '7%', w: 23, delay: 0.12 },
          { x: '71%', y: '9%', w: 20, delay: 0.24 },
          { x: '84%', y: '19%', w: 12, delay: 0.34 },
          { x: '9%', y: '76%', w: 16, delay: 0.44 },
        ] as { x: string; y: string; w: number; delay: number }[]).map((b, i) => (
          <motion.div
            key={i}
            className="absolute hidden md:block"
            style={{ left: b.x, top: b.y }}
            initial={{ opacity: 0, y: 6 }}
            animate={qaInView ? { opacity: 0.14, y: 0 } : {}}
            transition={{ duration: 0.7, delay: b.delay, ease: EASE_OUT_EXPO }}
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
            fontSize: 'clamp(140px, 18vw, 240px)',
            color: 'rgba(68,138,125,0.045)',
            letterSpacing: '-0.05em',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={qaInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15, ease: EASE_OUT_EXPO }}
        >
          ?
        </motion.div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="container mx-auto px-6 max-[400px]:px-4 max-w-7xl relative z-10">

        {/* ── ROW 1: Editorial header — heading left, desc+steps right ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-12 items-end mb-8 lg:mb-10">

          {/* Giant heading — col 1–7 */}
          <div className="lg:col-span-7 space-y-4">
            {/* Eyebrow with mini starling glyph */}
            <motion.div
              initial={{ x: -14, opacity: 0 }}
              animate={qaInView ? { x: 0, opacity: 1 } : {}}
              transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-[#448a7d]/15 bg-white/55 px-3 py-2 text-[9px] font-black uppercase tracking-[0.28em] text-[#448a7d] shadow-[0_10px_24px_-22px_rgba(30,58,52,0.28)]">
                <svg width="22" height="9" viewBox="0 0 28 15" fill="none" aria-hidden="true">
                  <path d="M14 7.5 C11.5 5 8.5 3 5.5 3.5 C7.5 4.2 9.5 5.8 11 7.5 C9 7 7 6.6 5 7.2 C7.2 6.8 9.5 8 11.5 7.8 L14 8.5 L16.5 7.8 C18.5 8 20.8 6.8 23 7.2 C21 6.6 19 7 17 7.5 C18.5 5.8 20.5 4.2 22.5 3.5 C19.5 3 16.5 5 14 7.5Z" fill="#448a7d"/>
                </svg>
                Community Q&amp;A
              </span>
            </motion.div>

            <h2 className="font-black font-cabinet text-[#1e3a34] tracking-tight leading-[0.92]" style={{ fontSize: 'clamp(2.65rem, min(7vw, 8.4vh), 5rem)' }}>
              <motion.span
                className="block"
                initial={{ opacity: 0, y: 18 }}
                animate={qaInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.62, ease: EASE_OUT_EXPO }}
              >
                Ask what
              </motion.span>
              <motion.span
                className="block text-[#e57c6e] italic relative"
                initial={{ y: 24, opacity: 0 }}
                animate={qaInView ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 0.62, delay: 0.12, ease: EASE_OUT_EXPO }}
              >
                stays with you.
                <svg
                  className="absolute left-0 w-[88%] pointer-events-none"
                  style={{ bottom: '-7px' }}
                  height="10"
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
                    animate={qaInView ? { pathLength: 1, opacity: 0.42 } : {}}
                    transition={{ duration: 0.75, delay: 0.5, ease: EASE_OUT_EXPO }}
                  />
                </svg>
              </motion.span>
            </h2>
          </div>

          {/* Description + steps — col 8–12, bottom-aligned */}
          <div className="lg:col-span-5 space-y-5 lg:pb-1">
            <motion.p
              className="max-w-xl text-sm md:text-base text-[#1e3a34]/62 font-medium leading-relaxed"
              initial={{ opacity: 0, y: 18 }}
              animate={qaInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.24, ease: EASE_OUT_EXPO }}
            >
              Write anonymously. We review for safety, then answers can come from people who have lived something similar.
            </motion.p>

            {/* Steps — 01 → 02 → 03 */}
            <div className="grid grid-cols-3 gap-2">
              {qaSteps.map((step, idx) => (
                <motion.div
                  key={step.num}
                  className="rounded-2xl border border-[#448a7d]/12 bg-white/55 px-3 py-3 text-left shadow-[0_12px_26px_-22px_rgba(30,58,52,0.38)]"
                  initial={{ opacity: 0, y: 14 }}
                  animate={qaInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.42, delay: 0.34 + idx * 0.06, ease: EASE_OUT_EXPO }}
                >
                  <span className="mb-2 block text-[10px] font-black text-[#e57c6e] tabular-nums">{step.num}</span>
                  <span className="block text-[9px] font-black text-[#1e3a34] uppercase tracking-[0.1em] leading-tight">{step.label}</span>
                  <span className="mt-1 block text-[8.5px] font-medium text-[#1e3a34]/45 leading-tight">{step.desc}</span>
                </motion.div>
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
                src={`${import.meta.env.BASE_URL}images/asset-qna.webp`}
                alt=""
                width="1536"
                height="1024"
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
              width="1500"
              height="598"
              fetchPriority="high"
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

      {/* ── IMMERSIVE EDITORIAL COMMUNITY SECTION (mobile only) ── */}
      <section
        ref={mobileCommunityRef}
        className="lg:hidden relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #f5f2eb 0%, #f0ede6 58%, #ece8de 100%)' }}
      >
        <div className="w-full h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(68,138,125,0.18), transparent)' }} />

        {/* ── Editorial text header ── */}
        <div className="px-5 pt-7 pb-4">
          <motion.div
            className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#448a7d]/14 bg-white/45 px-3 py-2 shadow-[0_10px_24px_-22px_rgba(30,58,52,0.34)]"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.42, ease: EASE_OUT_EXPO }}
          >
            <div className="h-px w-4 bg-[#448a7d]" />
            <span className="w-[3px] h-[3px] rounded-full bg-[#448a7d]" />
            <span className="text-[8.5px] font-black uppercase tracking-[0.24em] text-[#448a7d]">Our Community</span>
          </motion.div>

          <motion.h2
            className="font-cabinet font-black text-[#1e3a34] tracking-tight leading-[0.96] max-w-[19rem]"
            style={{ fontSize: 'clamp(2.25rem, 10.4vw, 3.05rem)' }}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.58, delay: 0.04, ease: EASE_OUT_EXPO }}
          >
            Built by those who&apos;ve been <em>exactly here.</em>
          </motion.h2>
          <motion.p
            className="mt-2.5 max-w-[20rem] text-[12px] font-medium leading-relaxed text-[#1e3a34]/58"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.12, ease: EASE_OUT_EXPO }}
          >
            Stories, resources, and map pins shaped by lived experience.
          </motion.p>
        </div>

        {/* Scroll-driven mobile rows — vertical scroll moves the rows horizontally */}
        <div
          className="relative overflow-hidden pb-5"
          style={{ contain: 'layout paint', transform: 'translateZ(0)' }}
        >
          <div className="absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#f5f2eb] to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#f0ede6] to-transparent pointer-events-none" />

          {[
            {
              key: 'row-a',
              x: communityRow1X,
              items: [
                { kind: 'image' as const, photo: mobileGalleryPhotos[0] },
                { kind: 'note' as const, post: mapPostExamples[0] },
                { kind: 'image' as const, photo: mobileGalleryPhotos[1] },
                { kind: 'note' as const, post: mapPostExamples[1] },
                { kind: 'image' as const, photo: mobileGalleryPhotos[3] },
                { kind: 'note' as const, post: mapPostExamples[4] },
              ],
            },
            {
              key: 'row-b',
              x: communityRow2X,
              items: [
                { kind: 'note' as const, post: mapPostExamples[2] },
                { kind: 'image' as const, photo: mobileGalleryPhotos[2] },
                { kind: 'note' as const, post: mapPostExamples[3] },
                { kind: 'image' as const, photo: mobileGalleryPhotos[4] },
                { kind: 'note' as const, post: mapPostExamples[5] },
                { kind: 'image' as const, photo: mobileGalleryPhotos[5] },
              ],
            },
          ].map((row, rowIdx) => (
            <motion.div
              key={row.key}
              className={`flex w-max gap-3 px-4 ${rowIdx === 0 ? 'pb-3' : ''}`}
              style={{ x: row.x, willChange: 'transform', backfaceVisibility: 'hidden' }}
            >
              {row.items.map((item, idx) => {
                if (item.kind === 'image') {
                  return (
                    <figure
                      key={`${row.key}-image-${item.photo.label}`}
                      className="relative h-[clamp(142px,43vw,196px)] w-[60vw] max-w-[244px] shrink-0 overflow-hidden rounded-[1rem] bg-[#e7ded2] shadow-[0_12px_30px_-25px_rgba(30,58,52,0.38)]"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <img
                        src={item.photo.src}
                        alt={item.photo.label}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1e3a34]/55 via-transparent to-transparent" />
                      <figcaption className="absolute bottom-3 left-3 rounded-full bg-[#f4f1e8]/90 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-[#1e3a34] shadow-sm">
                        {item.photo.label}
                      </figcaption>
                    </figure>
                  );
                }

                const PostIcon = item.post.type === 'Resource'
                  ? BookOpen
                  : item.post.type === 'Answer'
                    ? MessageCircleQuestion
                    : MapPin;

                return (
                  <article
                    key={`${row.key}-note-${item.post.city}-${idx}`}
                    className="relative flex h-[clamp(142px,43vw,196px)] w-[60vw] max-w-[244px] shrink-0 flex-col justify-between overflow-hidden rounded-[1rem] border border-[#1e3a34]/10 bg-[#fffdf7] p-3.5 shadow-[0_18px_38px_-28px_rgba(30,58,52,0.48)]"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div
                      className="absolute inset-0 opacity-[0.08]"
                      style={{
                        backgroundImage: [
                          'linear-gradient(rgba(68,138,125,0.5) 1px, transparent 1px)',
                          'linear-gradient(90deg, rgba(68,138,125,0.5) 1px, transparent 1px)',
                        ].join(', '),
                        backgroundSize: '28px 28px',
                      }}
                    />
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#e57c6e] via-[#448a7d] to-[#1e3a34]/35" />
                    <div className="relative z-10">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1e3a34] text-[#fffaf0] shadow-[0_8px_18px_-12px_rgba(30,58,52,0.65)]">
                            <PostIcon size={14} strokeWidth={2.2} />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[7px] font-black uppercase tracking-[0.18em] text-[#448a7d]">
                              {item.post.type}
                            </span>
                            <span className="mt-0.5 block truncate text-[10px] font-black leading-none text-[#1e3a34]">
                              {item.post.city}
                            </span>
                          </span>
                        </div>
                        <span className="shrink-0 rounded-full border border-[#e57c6e]/18 bg-[#e57c6e]/8 px-2 py-1 text-[6.5px] font-black uppercase tracking-[0.12em] text-[#a85240]">
                          Map note
                        </span>
                      </div>
                      <p className="text-[10.5px] font-semibold leading-snug text-[#1e3a34]/82">
                        {item.post.text}
                      </p>
                    </div>
                    <div className="relative z-10 mt-2 flex items-center justify-between gap-2 border-t border-[#1e3a34]/8 pt-2">
                      <span className="min-w-0 truncate text-[7px] font-black uppercase tracking-[0.16em] text-[#a85240]">
                        {item.post.tag}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-[6.5px] font-black uppercase tracking-[0.14em] text-[#448a7d]/75">
                        <CheckCircle2 size={10} strokeWidth={2.4} />
                        Reviewed
                      </span>
                    </div>
                  </article>
                );
              })}
            </motion.div>
          ))}
        </div>

        {/* ── Illustration card — rounded panel, fills width with small margin ── */}
        <div
          className="relative mx-4 overflow-hidden"
          style={{
            height: 'clamp(226px, 64vw, 310px)',
            borderRadius: '1.25rem',
            background: '#f0ede6',
          }}
        >
          {/* Illustration — blends white bg into card */}
          <img
            src={`${import.meta.env.BASE_URL}images/asset3.webp`}
            alt="A diverse community of young people sitting together outdoors in Calgary"
            width="1537"
            height="1023"
            loading="lazy"
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
          <div className="absolute bottom-3 inset-x-3 flex gap-2">
            <div
              className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-[0.9rem]"
              style={{
                background: 'rgba(22,50,44,0.82)',
                border: '1px solid rgba(255,255,255,0.09)',
                boxShadow: '0 10px 28px -8px rgba(22,50,44,0.55)',
              }}
            >
              <span className="text-[#7ec5b8] flex-shrink-0 scale-[0.85]">{ICONS.ShieldCheck}</span>
              <div className="min-w-0">
                <div className="text-[14px] font-black font-cabinet text-white leading-none">100%</div>
                <div className="text-[7.5px] font-black uppercase tracking-[0.2em] text-white/45 mt-[2px]">Anonymous</div>
              </div>
            </div>

            <div
              className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-[0.9rem]"
              style={{
                background: 'rgba(200,106,90,0.88)',
                border: '1px solid rgba(255,255,255,0.13)',
                boxShadow: '0 10px 28px -8px rgba(200,100,85,0.5)',
              }}
            >
              <span className="text-white/75 flex-shrink-0 scale-[0.85]">{ICONS.Users}</span>
              <div className="min-w-0">
                <div className="text-[13px] font-black font-cabinet text-white leading-tight">Peer-Led</div>
                <div className="text-[7.5px] font-black uppercase tracking-[0.2em] text-white/50 mt-[2px]">By Experience</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Body copy + full-width CTA ── */}
        <div className="px-5 pt-4 pb-8">
          <p
            className="text-[12px] font-medium leading-relaxed mb-5"
            style={{ color: 'rgba(30,58,52,0.55)' }}
          >
            Every pin is proof. You&apos;re not the first to stand here — and you won&apos;t be the last to find a way through.
          </p>

          {/* Primary CTA — full-width coral button */}
          <Link
            to="/map"
            className="flex items-center justify-center gap-2.5 w-full py-[13px] rounded-full font-black text-[11px] uppercase tracking-[0.22em] text-white active:scale-[0.97] transition-transform duration-150"
            style={{
              background: 'linear-gradient(135deg, #e57c6e 0%, #d46a5c 100%)',
              boxShadow: '0 14px 30px -14px rgba(229,124,110,0.52)',
            }}
          >
            Explore the Map
            <span aria-hidden="true">{ICONS.ArrowRight}</span>
          </Link>
        </div>
      </section>
      {questionSection}

      {/* ── Resources Discovery Section ── */}
      <section className="relative overflow-hidden py-24 md:py-40">
        {/* Light wash — birds visible through */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(255,255,255,0.48)' }} />
        <div className="absolute inset-0 pointer-events-none opacity-35"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(68,138,125,0.10) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">

          {/* ── Centered hero text ── */}
          <div className="text-center mb-16 md:mb-24 max-w-3xl mx-auto">
            <motion.p
              className="text-[9px] font-black uppercase tracking-[0.45em] text-[#448a7d] mb-5"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
            >
              Support Resources
            </motion.p>
            <motion.h2
              className="font-cabinet font-black tracking-tight leading-[0.92] text-[#1e3a34] mb-6"
              style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)' }}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.72, delay: 0.08, ease: EASE_OUT_EXPO }}
            >
              Everything you need,{' '}
              <span className="text-[#e57c6e] italic">in one place.</span>
            </motion.h2>
            <motion.p
              className="text-[#1e3a34]/66 font-light leading-relaxed mb-10 mx-auto"
              style={{ fontSize: 'clamp(1rem, 1.8vw, 1.1rem)', maxWidth: '46ch' }}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.65, delay: 0.16, ease: EASE_OUT_EXPO }}
            >
              Vetted partners, crisis lines, peer resources, and community guides —
              organized for young people navigating family substance use.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.24, ease: EASE_OUT_EXPO }}
            >
              <Link
                to="/resources"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-black text-[11px] uppercase tracking-[0.22em] text-white transition-all active:scale-95 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #e57c6e 0%, #d46a5c 100%)', boxShadow: '0 14px 36px -10px rgba(229,124,110,0.58)' }}
              >
                Browse Resources
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </motion.div>
          </div>

          {/* ── Mobile: editorial category list ── */}
          <div className="md:hidden rounded-[1.75rem] overflow-hidden" style={{ background: 'rgba(255,255,255,0.76)', border: '1px solid rgba(30,58,52,0.07)' }}>
            {([
              { label: 'Care Partners',    desc: 'Vetted local organizations', cardBg: '#e8f3f1', color: '#1e3a34',
                icon: <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
              { label: 'Crisis Lines',     desc: '24/7 immediate support',     cardBg: '#fbd6d1', color: '#9f453d',
                icon: <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> },
              { label: 'Peer Resources',   desc: 'Community-shared tools',     cardBg: '#e8f3f1', color: '#2d5a52',
                icon: <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> },
              { label: 'Community Guides', desc: 'Step-by-step reading',       cardBg: '#f3f1e8', color: '#1e3a34',
                icon: <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
              { label: 'Youth Services',   desc: 'Support for young people',   cardBg: '#fbd6d1', color: '#9f453d',
                icon: <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> },
            ] as const).map((item, i, arr) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-24px' }}
                transition={{ duration: 0.45, delay: 0.05 * i, ease: EASE_OUT_EXPO }}
              >
                <Link
                  to="/resources"
                  className="flex items-center gap-3.5 px-5 py-[1.05rem] group active:bg-black/[0.025] transition-colors duration-150"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(30,58,52,0.06)' : 'none' }}
                >
                  <div
                    className="w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center"
                    style={{ background: item.cardBg, color: item.color }}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-cabinet font-bold text-[#1e3a34] leading-tight" style={{ fontSize: '1.05rem' }}>{item.label}</p>
                    <p className="text-[11px] font-medium text-[#1e3a34]/40 mt-0.5">{item.desc}</p>
                  </div>
                  <svg
                    className="w-4 h-4 flex-shrink-0 transition-all duration-200 group-hover:translate-x-0.5"
                    style={{ color: 'rgba(30,58,52,0.22)' }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* ── Desktop: card grid ── */}
          <div className="hidden md:grid md:grid-cols-5 gap-4">
            {([
              {
                label: 'Care Partners',
                desc: 'Vetted local organizations',
                color: '#1e3a34',
                cardBg: '#e8f3f1',
                iconBg: 'rgba(30,58,52,0.10)',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
              },
              {
                label: 'Crisis Lines',
                desc: '24/7 immediate support',
                color: '#9f453d',
                cardBg: '#fbd6d1',
                iconBg: 'rgba(159,69,61,0.14)',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                ),
              },
              {
                label: 'Peer Resources',
                desc: 'Community-shared tools',
                color: '#2d5a52',
                cardBg: '#e8f3f1',
                iconBg: 'rgba(68,138,125,0.16)',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
              },
              {
                label: 'Community Guides',
                desc: 'Step-by-step reading',
                color: '#1e3a34',
                cardBg: '#f3f1e8',
                iconBg: 'rgba(30,58,52,0.08)',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ),
              },
              {
                label: 'Youth Services',
                desc: 'Support for young people',
                color: '#9f453d',
                cardBg: '#fbd6d1',
                iconBg: 'rgba(159,69,61,0.14)',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                ),
              },
            ] as const).map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: 0.06 * i, ease: EASE_OUT_EXPO }}
              >
                <Link
                  to="/resources"
                  className="group flex flex-col h-full rounded-[1.75rem] p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_48px_-16px_rgba(30,58,52,0.18)]"
                  style={{ background: item.cardBg }}
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-200 group-hover:scale-110"
                    style={{ background: item.iconBg, color: item.color }}
                  >
                    {item.icon}
                  </div>
                  <p className="font-black text-[#1e3a34] text-[13px] leading-tight mb-1.5">{item.label}</p>
                  <p className="text-[11px] font-medium text-[#1e3a34]/68 leading-snug flex-1">{item.desc}</p>
                  <div className="mt-4 flex items-center gap-1.5" style={{ color: item.color }}>
                    <span className="text-[10px] font-black uppercase tracking-[0.18em]">View</span>
                    <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Before You Post / Quick Reference ── */}
      <section className="relative overflow-hidden py-20 md:py-36" style={{ background: '#1e3a34' }}>

        {/* Ambient dot grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(68,138,125,0.055) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        {/* Soft coral glow — bottom right */}
        <div className="absolute bottom-[-8rem] right-[-8rem] w-[36rem] h-[36rem] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(229,124,110,0.08) 0%, transparent 65%)' }} />
        {/* Soft teal glow — top left */}
        <div className="absolute top-[-8rem] left-[-8rem] w-[36rem] h-[36rem] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(68,138,125,0.14) 0%, transparent 65%)' }} />

        <div ref={quickRefRef} className="relative z-10 max-w-7xl mx-auto px-6 max-[400px]:px-4">

          {/* ── Editorial split header — heading left, context right ── */}
          <div className="grid md:grid-cols-2 gap-10 md:gap-20 items-end mb-16 md:mb-24">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={quickRefInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.72, ease: EASE_OUT_EXPO }}
            >
              <p className="text-[9px] font-black uppercase tracking-[0.45em] text-[#448a7d] mb-4">
                Before You Post
              </p>
              <h2
                className="font-cabinet font-black italic tracking-tight leading-[0.9] text-white"
                style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)' }}
              >
                Quick<br />Reference.
              </h2>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={quickRefInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.68, delay: 0.12, ease: EASE_OUT_EXPO }}
            >
              {/* Accent rule */}
              <div className="w-10 mb-5" style={{ height: '2px', background: 'linear-gradient(90deg, #e57c6e 0%, #448a7d 100%)' }} />
              <p className="text-[#c8e0da] font-normal leading-[1.75]" style={{ fontSize: 'clamp(0.92rem, 1.6vw, 1rem)' }}>
                The Support Map lets young people leave anonymous notes — a story, a resource, or a
                question from lived experience. A Starlings volunteer reviews each one, then places it
                as a pin on an interactive map of Alberta. Someone else navigating a home shaped by
                substance use might find exactly what they needed. Here's what to keep in mind
                before you add yours.
              </p>
            </motion.div>
          </div>

          {/* ── How It Works — featured numbered strip ── */}
          <motion.div
            className="mb-5 md:mb-6"
            initial={{ opacity: 0, y: 8 }}
            animate={quickRefInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.22, ease: EASE_OUT_EXPO }}
          >
            <div className="flex items-center gap-4">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#448a7d]/70">How It Works</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(68,138,125,0.22)' }} />
            </div>
          </motion.div>

          {/* Mobile: glass step cards with ghost background numbers */}
          <div className="md:hidden flex flex-col gap-3 mb-6">
            {([
              { num: '01', title: 'You write a note',     desc: 'A short story, a resource that helped, or a question — posted anonymously. No account, no email, no trace.' },
              { num: '02', title: 'A person reviews it',  desc: "A Starlings volunteer checks your note within 48–72 hours to make sure it's safe and supportive." },
              { num: '03', title: 'It lands on the map',  desc: 'Your note becomes a pin on the Alberta map — visible to anyone navigating the same experience.' },
            ] as const).map((step, i) => (
              <motion.div
                key={step.num}
                className="relative rounded-[1.5rem] p-5 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.07)' }}
                initial={{ opacity: 0, y: 22 }}
                animate={quickRefInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: 0.28 + i * 0.1, ease: EASE_OUT_EXPO }}
              >
                {/* Ghost number — large background watermark */}
                <span
                  className="absolute right-2 -top-2 font-cabinet font-black italic leading-none pointer-events-none select-none"
                  style={{ fontSize: '7.5rem', color: 'rgba(229,124,110,0.07)' }}
                  aria-hidden="true"
                >
                  {step.num}
                </span>
                <div className="relative z-10">
                  <span
                    className="font-cabinet font-black italic text-[#e57c6e] block mb-2 leading-none"
                    style={{ fontSize: '2.2rem' }}
                  >
                    {step.num}
                  </span>
                  <p className="font-black text-white text-[15px] leading-tight mb-1.5">{step.title}</p>
                  <p className="text-[#c8e0da] text-[13px] font-normal leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop: horizontal flex with connectors */}
          <div className="hidden md:flex md:items-start mb-5 md:mb-6">
            {([
              { num: '01', title: 'You write a note',     desc: 'A short story, a resource that helped, or a question — posted anonymously. No account, no email, no trace.' },
              { num: '02', title: 'A person reviews it',  desc: "A Starlings volunteer checks your note within 48–72 hours to make sure it's safe and supportive." },
              { num: '03', title: 'It lands on the map',  desc: 'Your note becomes a pin on the Alberta map — visible to anyone navigating the same experience.' },
            ] as const).map((step, i) => (
              <React.Fragment key={step.num}>
                <motion.div
                  className="flex-1"
                  initial={{ opacity: 0, y: 28 }}
                  animate={quickRefInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.62, delay: 0.28 + i * 0.1, ease: EASE_OUT_EXPO }}
                >
                  <span
                    className="font-cabinet font-black italic text-[#e57c6e] block mb-3 leading-none"
                    style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)' }}
                  >
                    {step.num}
                  </span>
                  <p className="font-black text-white text-base leading-tight mb-2">{step.title}</p>
                  <p className="text-[#c8e0da] text-sm font-normal leading-relaxed md:pr-8">{step.desc}</p>
                </motion.div>
                {i < 2 && (
                  <motion.div
                    className="flex-shrink-0 flex items-center"
                    style={{ width: '3.5rem', paddingTop: '1.4rem' }}
                    initial={{ opacity: 0 }}
                    animate={quickRefInView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.38 + i * 0.1, ease: EASE_OUT_EXPO }}
                    aria-hidden="true"
                  >
                    <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(229,124,110,0.18) 0%, rgba(229,124,110,0.45) 60%, rgba(229,124,110,0.18) 100%)' }} />
                    <svg className="flex-shrink-0 ml-1" width="5" height="9" viewBox="0 0 5 9" fill="none">
                      <path d="M1 1l3 3.5L1 8" stroke="#e57c6e" strokeOpacity="0.55" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* ── Guide cards — 2 col ── */}
          <motion.div
            className="mb-5 md:mb-6"
            initial={{ opacity: 0, y: 8 }}
            animate={quickRefInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.54, ease: EASE_OUT_EXPO }}
          >
            <div className="flex items-center gap-4">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#448a7d]/70">Guidelines</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(68,138,125,0.22)' }} />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Best Practices */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={quickRefInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.62, delay: 0.6, ease: EASE_OUT_EXPO }}
              className="rounded-[1.75rem] p-7 md:p-9"
              style={{ background: '#f3f1e8' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-[#1e3a34]/10 flex items-center justify-center">
                  <BestPracticesIcon />
                </div>
                <h3 className="font-black text-[#1e3a34] text-sm uppercase tracking-[0.16em]">Best Practices</h3>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {[
                  'Be specific, not graphic',
                  'Focus on healing, not harm',
                  'Respect others\' experiences',
                  'No unsolicited advice',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[#1e3a34]/78 font-medium leading-snug">
                    <span className="mt-1 flex-shrink-0 w-3.5 h-3.5 rounded-full bg-[#448a7d]/18 flex items-center justify-center">
                      <svg width="7" height="7" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                        <path d="M1.5 4l1.8 1.8L6.5 2" stroke="#448a7d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Quick Checklist */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={quickRefInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.62, delay: 0.68, ease: EASE_OUT_EXPO }}
              className="rounded-[1.75rem] p-7 md:p-9"
              style={{ background: '#e8f3f1' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-[#448a7d]/16 flex items-center justify-center">
                  <ChecklistIcon />
                </div>
                <h3 className="font-black text-[#1e3a34] text-sm uppercase tracking-[0.16em]">Quick Checklist</h3>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {[
                  'No personal details',
                  'Safe for all ages',
                  'Not triggering or graphic',
                  'Respectful tone',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <div className="flex-shrink-0 w-3.5 h-3.5 rounded border-[1.5px] border-[#448a7d]/40 bg-white/60" />
                    <span className="text-sm text-[#1e3a34]/78 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

          </div>
        </div>
      </section>

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
