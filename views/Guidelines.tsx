import React, { useRef, useEffect, useState } from 'react';
import { ICONS } from '../constants.tsx';

const RevealOnScroll: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      {children}
    </div>
  );
};

const AnimatedCard: React.FC<{ title: string; desc: string; delay?: number; variant?: 'soft' | 'neutral' }> = ({ title, desc, delay = 0, variant = 'neutral' }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setVisible(true); });
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        setTilt({ x: px * 6, y: py * -6 });
      }}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{ transform: `perspective(800px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)` }}
      className={`transform-gpu transition-all duration-500 will-change-transform ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${variant === 'soft' ? 'bg-gradient-to-br from-[#f9fbfa] to-white' : 'bg-white'} p-6 md:p-8 rounded-3xl border border-gray-100/50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-gray-200/80`}
    >
      <h3 className="font-bold text-[#1e3a34] mb-2 text-lg">{title}</h3>
      <p className="text-gray-600 text-sm font-light leading-relaxed">{desc}</p>
    </div>
  );
};

const SafetyItem: React.FC<{ item: any; index: number }> = ({ item, index }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setVisible(true); });
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const toneClasses: Record<string, string> = {
    danger: 'bg-red-50 text-red-600',
    warning: 'bg-amber-50 text-amber-600',
    critical: 'bg-[#ff6b6b] text-white',
    neutral: 'bg-teal-50 text-teal-700',
    muted: 'bg-gray-50 text-gray-600'
  };

  const getSafetyIcon = (key: string) => {
    switch (key) {
      case 'identifying':
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="4" width="20" height="16" rx="3" fill="#fff" opacity="0.04" />
            <path d="M7 11c1.657 0 3-1.567 3-3.5S8.657 4 7 4 4 5.567 4 7.5 5.343 11 7 11z" fill="#f97373" />
            <rect x="9" y="14" width="8" height="2.5" rx="1" fill="#ffdede" />
          </svg>
        );
      case 'trauma':
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21s-6-4.35-6-8.5S8.5 6 12 9c3.5-3 6 1.5 6 3.5S12 21 12 21z" fill="#ffb4a2" />
            <circle cx="12" cy="9" r="1.5" fill="#fff" opacity="0.9" />
          </svg>
        );
      case 'crisis':
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" fill="#fff" opacity="0.04" />
            <path d="M7 12h3l2-4v8l2-4h3" stroke="#ff6b6b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'medical':
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="18" height="16" rx="3" fill="#ecfeff" />
            <path d="M12 8v8M8 12h8" stroke="#06b6d4" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'illegal':
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2l10 18H2L12 2z" fill="#fff" opacity="0.04" />
            <path d="M12 9v4" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="12" cy="16" r="0.8" fill="#ef4444" />
          </svg>
        );
      case 'spam':
      default:
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 10v4h5l3 5V5L8 10H3z" fill="#fff" opacity="0.04" />
            <path d="M3 10v4h5l3 5V5L8 10H3z" stroke="#9ca3af" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M19 8v8" stroke="#9ca3af" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        );
    }
  };

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
    >
      <div className={`group flex flex-col p-6 md:p-7 rounded-3xl border border-gray-100/50 bg-white/[0.7] backdrop-blur-sm shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] transform-gpu transition-all duration-500 hover:-translate-y-1 hover:border-gray-200/80`}>
        <div className="flex-1">
          <div className="flex items-start gap-3 mb-1">
            <h4 className="font-bold text-[#1e3a34] text-lg leading-tight">{item.title}</h4>
            <span className={`ml-auto flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${item.tone === 'danger' ? 'bg-red-100 text-red-700' : item.tone === 'critical' ? 'bg-red-200 text-red-800' : item.tone === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{item.badge}</span>
          </div>
          <p className="text-gray-600 mt-1.5 text-sm leading-relaxed">{item.short}</p>
          {open && <p className="text-gray-600 mt-3 text-sm leading-relaxed transition-all duration-300">{item.more}</p>}
          <button onClick={() => setOpen(!open)} className="mt-3 text-sm font-semibold text-[#448a7d] hover:text-[#1e3a34] transition-colors inline-flex items-center gap-1">
            {open ? '↑ Show less' : '↓ Show more'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Guidelines: React.FC = () => {
  const StatCounter: React.FC<{ value: string; label: string }> = ({ value, label }) => (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-black text-[#448a7d] mb-1">{value}</div>
      <div className="text-xs md:text-sm text-gray-600 font-medium">{label}</div>
    </div>
  );

  return (
    <div className="bg-gradient-to-b from-white via-[#fbfdfc] to-white min-h-screen">
      {/* Header with Visual */}
      <div className="relative h-60 md:h-80 lg:h-96 flex items-center justify-center overflow-hidden">
        <img src="https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=2000" className="absolute inset-0 w-full h-full object-cover opacity-20 scale-105 transform-gpu animate-[zoom_18s_ease-in-out_infinite]" alt="Supportive Hands" />
        <div className="absolute -left-24 -top-24 w-72 h-72 bg-gradient-to-br from-[#e6fff8] to-[#e8f3f1] rounded-full opacity-60 blur-3xl mix-blend-multiply animate-[float_6s_ease-in-out_infinite]" />
        <div className="absolute right-[-64px] bottom-[-40px] w-48 h-48 bg-gradient-to-tr from-[#fff0f0] to-[#fbd6d1] rounded-full opacity-50 blur-2xl mix-blend-screen animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        <div className="relative text-center space-y-3 md:space-y-4 px-6 max-w-4xl">
          <h1 className="text-3xl max-[400px]:text-2xl md:text-5xl lg:text-6xl font-black text-[#1e3a34] tracking-tight italic leading-tight">Safe Sharing.</h1>
          <p className="text-gray-600 max-w-2xl mx-auto font-light text-base md:text-lg leading-relaxed">How we keep this space supportive, resilient, and safe for everyone.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          
          <div className="lg:col-span-2 space-y-10 md:space-y-12">
            {/* What's Allowed */}
            <RevealOnScroll delay={0}>
              <section className="space-y-6 relative">
                <div className="absolute -left-6 top-0 w-1 h-24 bg-gradient-to-b from-[#448a7d] via-[#448a7d] to-transparent opacity-30 rounded-full" />
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[#d1f2eb] to-[#e8f3f1] flex items-center justify-center text-[#448a7d] shadow-md transform-gpu hover:scale-110 transition-transform duration-300">
                    <div className="scale-125">{ICONS.ShieldCheck}</div>
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-[#1e3a34] leading-tight">Our Guiding Light</h2>
                    <p className="text-gray-600 text-sm mt-1">Positive content that fuels our community</p>
                  </div>
                </div>
              
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                  <AnimatedCard delay={0} title="Hopeful Messages" desc="Supportive notes that remind peers they aren't alone." variant="soft" />
                  <AnimatedCard delay={80} title="Coping Skills" desc="Healthy strategies that work for you." />
                  <AnimatedCard delay={160} title="Helpful Resources" desc="Support types like therapy or peer groups." variant="soft" />
                  <AnimatedCard delay={240} title="Boundaries" desc="Setting healthy personal limits." />
                </div>
              </section>
            </RevealOnScroll>

            {/* Decorative Divider */}
            <div className="flex items-center gap-4 py-4 opacity-40">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              <div className="w-2 h-2 rounded-full bg-[#448a7d]" />
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gray-300 to-transparent" />
            </div>

            {/* What's Not Allowed (Protecting Each Other) */}
            <RevealOnScroll delay={150}>
              <section className="space-y-6 relative">
                <div className="absolute -left-6 top-0 w-1 h-24 bg-gradient-to-b from-[#ef4444] via-[#ef4444] to-transparent opacity-30 rounded-full" />
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[#ffe5e5] to-[#ffd9d4] flex items-center justify-center text-[#ef4444] shadow-md transform-gpu hover:scale-110 transition-transform duration-300">
                    <div className="text-2xl">⚠️</div>
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-[#1e3a34] leading-tight">Protecting Each Other</h2>
                    <p className="text-gray-600 text-sm mt-1">Content we remove or redact to keep everyone safe</p>
                  </div>
                </div>

                {/* Safety grid */}
                <div className="mt-4 grid grid-cols-1 gap-4 md:gap-5">
                {[
                  {
                    key: 'identifying',
                    title: 'Identifying Details',
                    badge: 'High',
                    tone: 'danger',
                    short: 'Full names, specific addresses, emails, or phone numbers.',
                    more: 'Sharing personally identifiable information can put people at direct risk. We remove contact info and precise locations to preserve safety.'
                  },
                  {
                    key: 'trauma',
                    title: 'Trauma Dumping',
                    badge: 'Harmful',
                    tone: 'warning',
                    short: 'Graphic, sensitive descriptions of harmful events.',
                    more: 'We encourage reflective, hopeful language. Graphic detail can retraumatize readers; moderators may redact or request edits.'
                  },
                  {
                    key: 'crisis',
                    title: 'Crisis Content',
                    badge: 'Critical',
                    tone: 'critical',
                    short: 'Mentions of immediate self-harm, plans, or danger to self/others.',
                    more: 'If a post indicates imminent danger we may flag it for immediate review and share resources. We prioritise safety while respecting privacy.'
                  },
                  {
                    key: 'medical',
                    title: 'Medical or Legal Advice',
                    badge: 'Note',
                    tone: 'neutral',
                    short: 'Specific medical, legal, or diagnostic instructions.',
                    more: 'Encourage seeking professional help. We avoid posts that provide prescriptive medical/legal steps which may be unsafe or inaccurate.'
                  },
                  {
                    key: 'illegal',
                    title: 'Illegal Activity',
                    badge: 'Report',
                    tone: 'danger',
                    short: 'Admissions of intent to commit illegal acts or instructions to do so.',
                    more: 'We remove content that encourages violence, illegal behaviour, or detailed instructions that could cause harm.'
                  },
                  {
                    key: 'spam',
                    title: 'Spam or Ads',
                    badge: 'Low',
                    tone: 'muted',
                    short: 'Promoting brands, paid services, or unrelated web links.',
                    more: 'This space is for peer support and personal reflection — overt promotion is removed to keep the community trustworthy.'
                  }
                ].map((item, i) => (
                  <SafetyItem key={item.key} item={item} index={i} />
                ))}
                </div>
              </section>
            </RevealOnScroll>
          </div>

          {/* Process Sidebar */}
          <div className="lg:col-span-1 space-y-6 md:space-y-8">
            <RevealOnScroll delay={300}>
              <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#f0f9f8] via-[#f9fbfa] to-white border border-gray-100/50 shadow-[0_4px_24px_rgba(0,0,0,0.05)] lg:sticky lg:top-20">
                <div className="space-y-3">
                  <h3 className="text-xl md:text-2xl font-black text-[#1e3a34]">Moderation</h3>
                  <p className="text-gray-600 text-sm font-light leading-relaxed">
                    Every note is reviewed by a human moderator at Starlings. We prioritize your anonymity and the collective safety of our community.
                  </p>
                  <p className="text-gray-600 text-sm font-light leading-relaxed">
                    Most reviews happen within 48-72 hours.
                  </p>
                </div>

                <div className="my-6 grid grid-cols-3 gap-4 py-6 border-y border-gray-200/50">
                  <StatCounter value="24/7" label="Monitoring" />
                  <StatCounter value="100%" label="Human Review" />
                  <StatCounter value="∞" label="Safe Space" />
                </div>

                <div className="space-y-3 pt-4">
                  <h3 className="text-xl md:text-2xl font-black text-[#1e3a34]">Privacy</h3>
                  <p className="text-gray-600 text-sm font-light leading-relaxed">
                    We only map your note to the city level. We never store IP addresses or device data.
                  </p>
                </div>

                <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-gray-200/50 bg-gradient-to-br from-[#1e3a34] to-[#0f2620] rounded-2xl p-5 text-white space-y-4 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white to-transparent rounded-full blur-2xl" />
                  </div>
                  <div className="relative z-10 flex items-center gap-2">
                    <span className="text-xl">🚨</span>
                    <h4 className="font-bold text-sm uppercase tracking-wider">In Crisis</h4>
                  </div>
                  <p className="relative z-10 text-xs md:text-sm font-light leading-relaxed text-white/80">
                    If you're in immediate danger, please reach out to professional services right away.
                  </p>
                  <a 
                    href="https://starlings.ca/crisis" 
                    className="relative z-10 inline-flex items-center gap-2 py-2.5 px-4 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold transition-all duration-300 w-full justify-center backdrop-blur-sm"
                  >
                    Find Crisis Lines {ICONS.ArrowRight}
                  </a>
                </div>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={350}>
              <div className="p-6 md:p-7 rounded-3xl bg-gradient-to-br from-[#fef8f0] to-white border border-gray-100/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">✨</span>
                  <h3 className="font-black text-[#1e3a34] text-lg">Best Practices</h3>
                </div>
                <ul className="space-y-2.5 text-sm text-gray-600 font-light">
                  <li className="flex gap-2.5"><span className="text-[#448a7d] font-bold">→</span><span>Be specific, not graphic</span></li>
                  <li className="flex gap-2.5"><span className="text-[#448a7d] font-bold">→</span><span>Focus on healing, not harm</span></li>
                  <li className="flex gap-2.5"><span className="text-[#448a7d] font-bold">→</span><span>Respect others' experiences</span></li>
                  <li className="flex gap-2.5"><span className="text-[#448a7d] font-bold">→</span><span>No unsolicited advice</span></li>
                </ul>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={400}>
              <div className="p-6 md:p-7 rounded-3xl bg-gradient-to-br from-[#f0f4f9] to-white border border-gray-100/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">📋</span>
                  <h3 className="font-black text-[#1e3a34] text-lg">Quick Checklist</h3>
                </div>
                <ul className="space-y-2.5 text-sm text-gray-600 font-light">
                  <li className="flex gap-2.5"><input type="checkbox" className="mt-0.5 cursor-pointer" readOnly /><span>No personal details</span></li>
                  <li className="flex gap-2.5"><input type="checkbox" className="mt-0.5 cursor-pointer" readOnly /><span>Safe for all ages</span></li>
                  <li className="flex gap-2.5"><input type="checkbox" className="mt-0.5 cursor-pointer" readOnly /><span>Not triggering/graphic</span></li>
                  <li className="flex gap-2.5"><input type="checkbox" className="mt-0.5 cursor-pointer" readOnly /><span>Respectful tone</span></li>
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
